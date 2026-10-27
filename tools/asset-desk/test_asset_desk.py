"""Tests for kr0 Asset Desk. Run: python -m unittest test_asset_desk"""

import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import asset_desk as ad

PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
)


def png_with_text(key, text):
    chunk = key.encode() + b"\x00" + text.encode()
    return PNG_1PX[:33] + len(chunk).to_bytes(4, "big") + b"tEXt" + chunk + b"\0\0\0\0" + PNG_1PX[33:]


class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.cat = ad.Catalog(Path(self.tmp.name) / "_catalog")

    def tearDown(self):
        self.tmp.cleanup()

    def test_person_edits_survive_rescan(self):
        self.cat.upsert_source("file:a:x.png", {"source": "file", "path": "metr0niks/x.png"}, {"origin": "unknown"})
        self.cat.update("file:a:x.png", {"provenance": {"origin": "human", "creator": "Ana"}})
        self.cat.upsert_source("file:a:x.png", {"source": "file", "path": "metr0niks/x.png"}, {"origin": "synthetic"})
        rec = self.cat.assets["file:a:x.png"]
        self.assertEqual(rec["provenance"]["origin"], "human")
        self.assertEqual(rec["game"], "metr0niks")

    def test_grade_tags_and_history(self):
        self.cat.upsert_source("scn:1", {"source": "scenario"}, {})
        self.cat.update("scn:1", {"grade": "up", "tags": ["Hero Mech", "hero-mech", " ink "]})
        rec = self.cat.assets["scn:1"]
        self.assertEqual(rec["tags"], ["hero-mech", "ink"])
        self.assertEqual(rec["grade"], "up")
        with self.assertRaises(ValueError):
            self.cat.update("scn:1", {"grade": "meh"})
        with self.assertRaises(ValueError):
            self.cat.update("scn:1", {"provenance": {"origin": "robot"}})
        events = [json.loads(l) for l in self.cat.log.read_text().splitlines()]
        self.assertEqual(len(events), 1)
        self.assertIn("grade", events[0]["data"])
        # Reloads from disk.
        self.assertEqual(ad.Catalog(self.cat.dir).assets["scn:1"]["tags"], ["hero-mech", "ink"])

    def test_suggestions_use_vocab_cooccurrence_and_folder(self):
        for i, tags in enumerate([["mech", "ink"], ["mech", "ink"], ["mech", "garage"]]):
            self.cat.upsert_source("f%d" % i, {"source": "file", "path": "metr0niks/ink/m%d.png" % i, "folder": "metr0niks/ink"}, {})
            self.cat.update("f%d" % i, {"tags": tags})
        self.cat.upsert_source("new", {"source": "file", "path": "metr0niks/ink/garage-door.png", "folder": "metr0niks/ink"}, {})
        self.cat.update("new", {"tags": ["mech"]})
        tags = [s["tag"] for s in ad.suggest_tags(self.cat, "new")]
        self.assertIn("ink", tags[:3])
        self.assertIn("garage", tags)
        self.assertIn("metr0niks", tags)
        self.assertNotIn("mech", tags)


class SniffTests(unittest.TestCase):
    def test_png_prompt_and_c2pa(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "a.png"
            p.write_bytes(png_with_text("parameters", "a robot, ink style"))
            found = ad.sniff_file(p)
            self.assertEqual(found["origin"], "synthetic")
            self.assertIn("robot", found["prompt"])
            q = Path(tmp) / "b.jpg"
            q.write_bytes(b"\xff\xd8...jumb....jumdc2pa...Anthropic...trainedAlgorithmicMedia")
            found = ad.sniff_file(q)
            self.assertTrue(found["c2pa"])
            self.assertEqual(found["c2paSigner"], "Anthropic")
            self.assertEqual(found["origin"], "synthetic")


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        root = Path(cls.tmp.name) / "art"
        (root / "dual-tech").mkdir(parents=True)
        (root / "dual-tech" / "hero.png").write_bytes(PNG_1PX)
        (Path(cls.tmp.name) / "secret.txt").write_text("no")
        args = ad.argparse.Namespace(root=["drive=%s" % root], catalog=None, scenario_project="p",
                                     no_scenario=True, who="tester")
        cls.app = ad.App(args)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), ad.make_handler(cls.app))
        cls.base = "http://127.0.0.1:%d" % cls.server.server_port
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.tmp.cleanup()

    def call(self, path, body=None, headers=None):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, headers=headers or {})
        if data is not None:
            req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())

    def test_scan_grade_and_serve(self):
        self.call("/api/scan", {})
        assets = self.call("/api/assets")["assets"]
        self.assertEqual([a["id"] for a in assets], ["file:drive:dual-tech/hero.png"])
        self.assertEqual(assets[0]["game"], "dual-tech")
        rec = self.call("/api/asset", {"id": assets[0]["id"], "patch": {"grade": "down"}})["asset"]
        self.assertEqual(rec["gradedBy"], "tester")
        with urllib.request.urlopen(self.base + "/api/file?root=drive&path=dual-tech/hero.png") as resp:
            self.assertEqual(resp.read(), PNG_1PX)

    def test_path_traversal_and_cross_site_refused(self):
        with self.assertRaises(urllib.error.HTTPError) as err:
            urllib.request.urlopen(self.base + "/api/file?root=drive&path=../secret.txt")
        self.assertEqual(err.exception.code, 404)
        with self.assertRaises(urllib.error.HTTPError) as err:
            self.call("/api/scan", {}, {"Origin": "https://evil.example"})
        self.assertEqual(err.exception.code, 403)
        with self.assertRaises(urllib.error.HTTPError) as err:
            self.call("/api/assets", None, {"Host": "evil.example"})
        self.assertEqual(err.exception.code, 403)


if __name__ == "__main__":
    unittest.main()
