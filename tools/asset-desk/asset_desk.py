#!/usr/bin/env python3
"""kr0 Asset Desk: a small local service for browsing, grading, tagging and
recording the provenance of studio art.

It reads art from one or more folders (the Drive for Desktop folder, the repo's
art/ folder) and from the Scenario assets library, and keeps grades, tags and
provenance in a catalog next to the art:

    <catalog dir>/catalog.json   current state of every asset
    <catalog dir>/events.jsonl   append-only history of every change

Python 3.9+ standard library only. Run `python asset_desk.py --help`.
"""

import argparse
import base64
import hashlib
import collections
import json
import mimetypes
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

VERSION = "0.1.0"
HERE = Path(__file__).resolve().parent
STATIC = HERE / "static"

GAMES = ["blackletter", "dropfront", "dual-tech", "metr0niks"]
ORIGINS = ["synthetic", "human", "hybrid", "unknown"]
MEDIA_EXT = {
    ".png": "image", ".jpg": "image", ".jpeg": "image", ".webp": "image",
    ".gif": "image", ".svg": "image", ".avif": "image",
    ".mp4": "video", ".webm": "video", ".mov": "video",
    ".mp3": "audio", ".wav": "audio", ".ogg": "audio", ".m4a": "audio",
}
SKIP_DIRS = {".git", "node_modules", "__pycache__", "_catalog", ".tmp.drivedownload", ".tmp.driveupload"}
PROVENANCE_FIELDS = [
    "origin", "creator", "tool", "model", "workflowId", "jobId", "parentIds",
    "prompt", "sourceUrl", "createdAt", "costCU", "license", "c2pa", "c2paSigner", "notes",
]
STOPWORDS = set(
    "a an and the of with in on at to for from by is are be this that it its as or "
    "into onto over under features featuring image picture photo shows showing "
    "front back side view left right center centre top bottom small large big "
    "png jpg jpeg webp mp4 img asset final v1 v2 v3 copy new old "
    # Caption filler Scenario's auto-captions use a lot.
    "against background plain white black various several central while holding "
    "standing stands forward down up sequence series grid panels frames single two "
    "three four six twelve each other one has have wearing appears set featured "
    "rounded round small large bulky slightly dark light".split()
)
TAG_RE = re.compile(r"[^a-z0-9\-]+")
C2PA_SIGNERS = [b"Anthropic", b"OpenAI", b"Google", b"Adobe", b"Figma", b"Microsoft", b"Scenario", b"Midjourney"]


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def norm_tag(tag):
    tag = TAG_RE.sub("-", str(tag).strip().lower()).strip("-")
    return re.sub(r"-{2,}", "-", tag)[:48]


def tokens(text):
    for word in re.split(r"[^a-z0-9]+", str(text).lower()):
        if len(word) > 2 and word not in STOPWORDS and not word.isdigit():
            yield word


def guess_game(text):
    low = str(text).lower().replace("_", "-")
    for game in GAMES:
        if game in low or game.replace("-", "") in low.replace("-", ""):
            return game
    if "metroniks" in low:
        return "metr0niks"
    return None


# --------------------------------------------------------------------------
# Catalog


class Catalog:
    """Grades, tags and provenance, saved as JSON plus an event log."""

    def __init__(self, directory):
        self.dir = Path(directory)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.path = self.dir / "catalog.json"
        self.log = self.dir / "events.jsonl"
        self.lock = threading.RLock()
        self.assets = {}
        if self.path.exists():
            data = json.loads(self.path.read_text(encoding="utf-8"))
            self.assets = data.get("assets", {})

    def save(self):
        with self.lock:
            tmp = self.path.with_suffix(".json.tmp")
            payload = {"version": 1, "savedAt": now_iso(), "assets": self.assets}
            tmp.write_text(json.dumps(payload, indent=1, ensure_ascii=False), encoding="utf-8")
            os.replace(tmp, self.path)

    def event(self, asset_id, kind, data, who="kr0"):
        line = {"at": now_iso(), "by": who, "asset": asset_id, "kind": kind, "data": data}
        with self.lock, self.log.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(line, ensure_ascii=False) + "\n")

    def upsert_source(self, asset_id, source_fields, auto_provenance):
        """Merge what a scan found. Never overwrites what a person entered."""
        with self.lock:
            rec = self.assets.get(asset_id)
            if rec is None:
                rec = {
                    "id": asset_id, "grade": None, "tags": [], "game": None,
                    "provenance": {}, "provenanceSetBy": {}, "addedAt": now_iso(),
                }
                self.assets[asset_id] = rec
            rec.update(source_fields)
            prov = rec.setdefault("provenance", {})
            set_by = rec.setdefault("provenanceSetBy", {})
            for key, value in auto_provenance.items():
                if value in (None, "", []):
                    continue
                if set_by.get(key) != "person":
                    prov[key] = value
                    set_by[key] = "auto"
            if not rec.get("game"):
                rec["game"] = guess_game(source_fields.get("path", "")) or guess_game(
                    " ".join(source_fields.get("collections", []))
                ) or guess_game(" ".join(source_fields.get("sourceTags", [])))
            return rec

    def update(self, asset_id, patch, who="kr0"):
        with self.lock:
            rec = self.assets.get(asset_id)
            if rec is None:
                raise KeyError(asset_id)
            changes = {}
            if "grade" in patch:
                grade = patch["grade"]
                if grade not in ("up", "down", None):
                    raise ValueError("grade must be up, down or null")
                if rec.get("grade") != grade:
                    changes["grade"] = [rec.get("grade"), grade]
                    rec["grade"] = grade
                    rec["gradedAt"] = now_iso()
                    rec["gradedBy"] = who
            if "tags" in patch:
                new = []
                for tag in patch["tags"]:
                    tag = norm_tag(tag)
                    if tag and tag not in new:
                        new.append(tag)
                if new != rec.get("tags", []):
                    changes["tags"] = [rec.get("tags", []), new]
                    rec["tags"] = new
            if "game" in patch:
                game = patch["game"] or None
                if game is not None and game not in GAMES:
                    raise ValueError("unknown game")
                if rec.get("game") != game:
                    changes["game"] = [rec.get("game"), game]
                    rec["game"] = game
            if "provenance" in patch:
                prov = rec.setdefault("provenance", {})
                set_by = rec.setdefault("provenanceSetBy", {})
                for key, value in patch["provenance"].items():
                    if key not in PROVENANCE_FIELDS:
                        continue
                    if key == "origin" and value not in ORIGINS:
                        raise ValueError("origin must be one of " + ", ".join(ORIGINS))
                    if prov.get(key) != value:
                        changes["provenance." + key] = [prov.get(key), value]
                        prov[key] = value
                        set_by[key] = "person"
            if changes:
                rec["updatedAt"] = now_iso()
                self.event(asset_id, "update", changes, who)
                self.save()
            return rec

    def tag_counts(self):
        counts = collections.Counter()
        for rec in self.assets.values():
            counts.update(rec.get("tags", []))
        return counts


# --------------------------------------------------------------------------
# File sources


def sniff_file(path, limit=2_000_000):
    """Read what a file says about itself: C2PA manifests and generator text chunks."""
    found = {}
    try:
        with open(path, "rb") as fh:
            head = fh.read(limit)
    except OSError:
        return found
    if b"jumdc2pa" in head:
        # A C2PA (Content Credentials) manifest. It's CBOR, so read the signer from
        # its readable strings rather than parsing it fully.
        found["c2pa"] = True
        start = head.find(b"jumdc2pa")
        manifest = head[start:start + 200_000]  # XMP outside the manifest also names Adobe
        signers = [name.decode() for name in C2PA_SIGNERS if name in manifest]
        if signers:
            found["c2paSigner"] = ", ".join(signers)
        # Files that passed through Claude's file store are stamped "Claude provided
        # this file": that is custody, not authorship, so it says nothing about origin.
        if b"compositeWithTrainedAlgorithmicMedia" in manifest:
            found["origin"] = "hybrid"
        elif b"trainedAlgorithmicMedia" in manifest:
            found["origin"] = "synthetic"
        elif b"digitalCapture" in manifest or b"humanEdits" in manifest:
            found["origin"] = "human"
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        for key in (b"parameters", b"prompt", b"Software", b"Description"):
            idx = head.find(b"tEXt" + key + b"\x00")
            if idx > 0:
                length = int.from_bytes(head[idx - 4:idx], "big")
                text = head[idx + 4 + len(key) + 1: idx + 4 + length].decode("latin-1", "replace")
                if key in (b"parameters", b"prompt"):
                    found.setdefault("prompt", text[:2000])
                    found.setdefault("origin", "synthetic")
                elif key == b"Software":
                    found.setdefault("tool", text[:120])
    return found


def scan_root(catalog, root, label):
    root = Path(root)
    if not root.is_dir():
        return {"root": str(root), "error": "not a folder"}
    seen = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".")]
        for name in filenames:
            ext = os.path.splitext(name)[1].lower()
            kind = MEDIA_EXT.get(ext)
            if not kind:
                continue
            full = Path(dirpath) / name
            rel = full.relative_to(root).as_posix()
            try:
                stat = full.stat()
            except OSError:
                continue
            asset_id = "file:%s:%s" % (label, rel)
            prior = catalog.assets.get(asset_id, {})
            auto = {}
            if prior.get("size") != stat.st_size or prior.get("mtime") != int(stat.st_mtime):
                auto = sniff_file(full) if kind == "image" else {}
            if not prior:
                auto.setdefault("origin", "unknown")
            auto.setdefault("createdAt", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(stat.st_mtime)))
            catalog.upsert_source(asset_id, {
                "source": "file", "root": label, "path": rel, "name": name,
                "kind": kind, "size": stat.st_size, "mtime": int(stat.st_mtime),
                "folder": Path(rel).parent.as_posix(),
                "drivePath": rel if label == "drive" else None,
                "retired": "/_retired/" in "/" + rel,
            }, auto)
            seen += 1
    return {"root": str(root), "label": label, "files": seen}


# --------------------------------------------------------------------------
# Scenario source


class Scenario:
    BASE = "https://api.cloud.scenario.com/v1"

    def __init__(self, project_id, key=None, secret=None):
        self.project_id = project_id
        self.auth = None
        if key and secret:
            self.auth = "Basic " + base64.b64encode(("%s:%s" % (key, secret)).encode()).decode()

    def request(self, method, path, params=None, body=None):
        params = dict(params or {})
        if self.project_id:
            params.setdefault("projectId", self.project_id)
        url = self.BASE + path + ("?" + urllib.parse.urlencode(params) if params else "")
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if self.auth:
            req.add_header("Authorization", self.auth)
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8") or "{}")

    def authors(self, who):
        """Readable names for the ids Scenario records as an asset's author. A
        project with one person is that person (--who); otherwise the email name."""
        out = {}
        for project in self.request("GET", "/projects", {}).get("projects", []):
            users = project.get("users", [])
            for user in users:
                name = who if len(users) == 1 else user.get("email", user["id"]).split("@")[0]
                out[user["id"]] = "%s (Scenario app)" % name
            for key in project.get("keys", []):
                out[key["id"]] = "agent via API key '%s'" % key.get("name", key["id"])
        return out

    def collections(self):
        out = {}
        token = None
        while True:
            params = {"pageSize": 100}
            if token:
                params["paginationToken"] = token
            data = self.request("GET", "/collections", params)
            for col in data.get("collections", []):
                out[col["id"]] = col.get("name", col["id"])
            token = data.get("nextPaginationToken")
            if not token:
                return out

    def assets(self, max_pages=50):
        token = None
        for _ in range(max_pages):
            params = {"pageSize": 100}
            if token:
                params["paginationToken"] = token
            data = self.request("GET", "/assets", params)
            for asset in data.get("assets", []):
                yield asset
            token = data.get("nextPaginationToken")
            if not token:
                return

    def add_tags(self, asset_id, add, remove):
        # Scenario's tag endpoint takes the tags to add and to delete.
        return self.request("PUT", "/assets/%s/tags" % asset_id, body={"add": add, "delete": remove})


def short_caption(asset):
    caption = (asset.get("description") or asset.get("automaticCaptioning") or "").strip()
    return caption if len(caption) <= 60 else caption[:57].rsplit(" ", 1)[0] + "…"


def sync_scenario(catalog, scenario, who="kr0"):
    names = scenario.collections()
    try:
        authors = scenario.authors(who)
    except urllib.error.URLError:
        authors = {}
    texts = {}
    media = []
    for asset in scenario.assets():
        if asset.get("kind") == "text":
            preview = (asset.get("metadata") or {}).get("preview")
            if preview:
                texts[asset["id"]] = preview
        elif asset.get("kind") in ("image", "video", "audio", "3d"):
            media.append(asset)
    for asset in media:
        meta = asset.get("metadata") or {}
        prompt = meta.get("prompt")
        if isinstance(prompt, str) and prompt.startswith("asset_"):
            prompt = texts.get(prompt, prompt)
        source = asset.get("source") or meta.get("type") or ""
        uploaded = source.startswith("upload")
        parents = [p for p in (meta.get("parentId"), meta.get("rootParentId")) if p]
        parents += [p for p in meta.get("referenceImages") or [] if p not in parents]
        auto = {
            "origin": "unknown" if uploaded else "synthetic",
            "tool": "Scenario" + ("" if uploaded else " (%s)" % source),
            "model": meta.get("modelId"),
            "jobId": meta.get("parentJobId"),
            "parentIds": parents,
            "prompt": prompt,
            "createdAt": asset.get("createdAt"),
            "creator": authors.get(asset.get("authorId"), asset.get("authorId")),
            "sourceUrl": "https://app.scenario.com/images/%s" % asset["id"],
        }
        catalog.upsert_source("scn:" + asset["id"], {
            "source": "scenario", "scenarioId": asset["id"], "name": asset.get("name") or short_caption(asset) or asset["id"],
            "kind": asset.get("kind"), "url": asset.get("url"), "mime": asset.get("mimeType"),
            "width": meta.get("width"), "height": meta.get("height"), "size": meta.get("size"),
            "caption": asset.get("description") or asset.get("automaticCaptioning") or "",
            "sourceTags": [norm_tag(t) for t in asset.get("tags", [])],
            "collections": [names.get(c, c) for c in asset.get("collectionIds", [])],
            "scenarioSource": source, "parentId": meta.get("parentId"),
            "rootParentId": meta.get("rootParentId"),
            "folder": "scenario/" + (names.get((asset.get("collectionIds") or [""])[0]) or "unsorted"),
            "urlFetchedAt": now_iso(),
        }, auto)
    catalog.save()
    return {"scenario": len(media), "prompts": len(texts)}


# --------------------------------------------------------------------------
# Tag suggestions


_caption_cache = {}


def caption_frequency(catalog):
    """How many assets' captions use each word, recomputed when the catalog grows."""
    key = len(catalog.assets)
    if _caption_cache.get("key") != key:
        freq = collections.Counter()
        for rec in catalog.assets.values():
            freq.update(set(tokens(rec.get("caption", ""))))
        _caption_cache.update(key=key, freq=freq)
    return _caption_cache["freq"]


def suggest_tags(catalog, asset_id, limit=12):
    rec = catalog.assets.get(asset_id)
    if rec is None:
        return []
    have = set(rec.get("tags", []))
    vocab = catalog.tag_counts()
    scores = collections.Counter()
    why = {}

    def add(tag, score, reason):
        tag = norm_tag(tag)
        if not tag or tag in have:
            return
        scores[tag] += score
        why.setdefault(tag, reason)

    # 1. Tags already on the asset in Scenario.
    for tag in rec.get("sourceTags", []):
        add(tag, 5, "Scenario tag")
    # 2. The game.
    if rec.get("game"):
        add(rec["game"], 4, "game")
    # 3. Words from the path, file name, collections and caption that are already tags.
    words = list(tokens(rec.get("path", ""))) + list(tokens(" ".join(rec.get("collections", []))))
    caption_words = list(tokens(rec.get("caption", "")))
    for word in words:
        if word in vocab:
            add(word, 3, "folder or file name")
    for word in caption_words:
        if word in vocab:
            add(word, 2, "Scenario caption")
    # 4. Tags that usually go with the tags it already has.
    if have:
        for other in catalog.assets.values():
            otags = set(other.get("tags", []))
            if otags & have:
                for tag in otags - have:
                    add(tag, 1.5 * len(otags & have), "often used together")
    # 5. Tags on siblings: same folder, same Scenario parent.
    for other in catalog.assets.values():
        if other["id"] == asset_id:
            continue
        sibling = (rec.get("folder") and other.get("folder") == rec.get("folder")) or (
            rec.get("rootParentId") and other.get("rootParentId") == rec.get("rootParentId"))
        if sibling:
            for tag in other.get("tags", []):
                add(tag, 1, "used on nearby assets")
    # 6. What it is: kind and how Scenario made it.
    if rec.get("kind") and rec["kind"] != "image":
        add(rec["kind"], 1, "media kind")
    # 7. New words: folder names, and caption words that recur across the
    # library (so they name a theme) without being everywhere.
    for word in words[-3:]:
        add(word, 0.8, "folder or file name")
    freq = caption_frequency(catalog)
    total = max(1, len(catalog.assets))
    for word in caption_words:
        if 3 <= freq.get(word, 0) <= total * 0.3:
            add(word, 0.4 + min(freq[word], 30) / 60, "recurring caption word")
    # Popular tags break ties.
    ranked = sorted(scores, key=lambda t: (-scores[t], -vocab.get(t, 0), t))
    return [{"tag": t, "score": round(scores[t], 2), "why": why[t], "uses": vocab.get(t, 0)}
            for t in ranked[:limit]]


# --------------------------------------------------------------------------
# Export


def sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_sha256(app, rec):
    """Hash a file asset once per version. Done on demand, not on scan, because
    reading a streamed Drive file downloads it."""
    if rec.get("source") != "file":
        return rec.get("sha256")
    stamp = [rec.get("size"), rec.get("mtime")]
    if rec.get("sha256") and rec.get("sha256Of") == stamp:
        return rec["sha256"]
    target = app.file_path(rec.get("root"), rec.get("path", ""))
    if target is None:
        return rec.get("sha256")
    rec["sha256"] = sha256_file(target)
    rec["sha256Of"] = stamp
    return rec["sha256"]


def repo_preview(catalog, rec):
    """The repo's web-size copy of a Drive master: same path under art/, any image type."""
    if rec.get("root") == "repo":
        return "art/" + rec["path"]
    stem = os.path.splitext(rec.get("path") or "")[0]
    for other in catalog.assets.values():
        if other.get("root") == "repo" and os.path.splitext(other.get("path", ""))[0] == stem:
            return "art/" + other["path"]
    return None


def manifest_lines(app, game):
    """art/<game>/manifest.jsonl: one line per approved (thumbs up), unretired
    asset of the game. The format is set in studio/asset-management.md, which
    also says an asset of unknown origin can't ship: those are held back."""
    lines, held = [], []
    for rec in sorted(app.catalog.assets.values(), key=lambda r: r["id"]):
        if rec.get("game") != game or rec.get("grade") != "up" or rec.get("retired"):
            continue
        if rec.get("root") == "repo" and any(
                o.get("root") == "drive" and repo_preview(app.catalog, o) == "art/" + rec["path"]
                for o in app.catalog.assets.values()):
            continue  # the Drive master's line already covers this preview
        if (rec.get("provenance") or {}).get("origin", "unknown") == "unknown":
            held.append(rec["id"])
            continue
        lines.append({
            "id": rec["id"], "source": rec.get("source"), "scenarioId": rec.get("scenarioId"),
            "drivePath": rec.get("drivePath"), "sha256": ensure_sha256(app, rec),
            "previewPath": repo_preview(app.catalog, rec) if rec.get("source") == "file" else None,
            "game": game, "grade": rec["grade"], "gradedAt": rec.get("gradedAt"),
            "gradedBy": rec.get("gradedBy"), "tags": rec.get("tags", []),
            "provenance": rec.get("provenance", {}),
        })
    app.catalog.save()
    text = "".join(json.dumps(line, ensure_ascii=False, sort_keys=True) + "\n" for line in lines)
    return text, len(lines), held


def export_manifest(catalog, game=None, graded_only=False):
    rows = []
    for rec in sorted(catalog.assets.values(), key=lambda r: r["id"]):
        if game and rec.get("game") != game:
            continue
        if graded_only and rec.get("grade") is None:
            continue
        rows.append({
            "id": rec["id"], "source": rec.get("source"), "path": rec.get("path"),
            "root": rec.get("root"), "scenarioId": rec.get("scenarioId"), "game": rec.get("game"),
            "drivePath": rec.get("drivePath"), "sha256": rec.get("sha256"),
            "grade": rec.get("grade"), "tags": rec.get("tags", []), "provenance": rec.get("provenance", {}),
        })
    return {"version": 1, "exportedAt": now_iso(), "game": game, "assets": rows}


# --------------------------------------------------------------------------
# HTTP


class App:
    def __init__(self, args):
        self.roots = {}
        for spec in args.root:
            label, _, path = spec.partition("=") if "=" in spec else (Path(spec).name or "root", "", spec)
            self.roots[norm_tag(label) or "root"] = Path(path).expanduser().resolve()
        catalog_dir = args.catalog or (next(iter(self.roots.values())) / "_catalog" if self.roots else HERE / "_catalog")
        self.catalog = Catalog(catalog_dir)
        key = os.environ.get("SCENARIO_API_KEY")
        secret = os.environ.get("SCENARIO_API_SECRET")
        self.scenario = Scenario(args.scenario_project, key, secret) if not args.no_scenario else None
        self.who = args.who

    def file_path(self, root_label, rel):
        root = self.roots.get(root_label)
        if root is None:
            return None
        target = (root / rel).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            return None
        return target if target.is_file() else None


def make_handler(app):
    class Handler(BaseHTTPRequestHandler):
        server_version = "kr0-asset-desk/" + VERSION

        def log_message(self, fmt, *a):
            sys.stderr.write("%s %s\n" % (time.strftime("%H:%M:%S"), fmt % a))

        def _local_only(self):
            host = (self.headers.get("Host") or "").split(":")[0]
            if host not in ("127.0.0.1", "localhost", "[::1]"):
                self.send_error(403, "local requests only")
                return False
            origin = self.headers.get("Origin")
            if origin and urllib.parse.urlparse(origin).hostname not in ("127.0.0.1", "localhost", "::1"):
                self.send_error(403, "cross-site request refused")
                return False
            return True

        def _json(self, obj, status=200):
            body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        def _file(self, path, cache=True):
            ctype = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
            size = path.stat().st_size
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(size))
            self.send_header("X-Content-Type-Options", "nosniff")
            if ctype == "image/svg+xml":
                self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'")
            self.send_header("Cache-Control", "max-age=3600" if cache else "no-store")
            self.end_headers()
            with open(path, "rb") as fh:
                while True:
                    chunk = fh.read(1 << 16)
                    if not chunk:
                        break
                    self.wfile.write(chunk)

        def _body(self):
            length = int(self.headers.get("Content-Length") or 0)
            if length > 1_000_000:
                raise ValueError("request too large")
            if "application/json" not in (self.headers.get("Content-Type") or ""):
                raise ValueError("expected application/json")
            return json.loads(self.rfile.read(length) or b"{}")

        def do_GET(self):
            if not self._local_only():
                return
            url = urllib.parse.urlparse(self.path)
            q = urllib.parse.parse_qs(url.query)
            route = url.path
            try:
                if route in ("/", "/index.html"):
                    return self._file(STATIC / "index.html", cache=False)
                if route.startswith("/static/"):
                    target = (STATIC / route[len("/static/"):]).resolve()
                    if target.is_file() and STATIC in target.parents:
                        return self._file(target, cache=False)
                    return self.send_error(404)
                if route == "/api/config":
                    return self._json({
                        "version": VERSION, "games": GAMES, "origins": ORIGINS,
                        "roots": {k: str(v) for k, v in app.roots.items()},
                        "catalog": str(app.catalog.dir), "scenario": bool(app.scenario),
                        "scenarioAuth": bool(app.scenario and app.scenario.auth), "who": app.who,
                    })
                if route == "/api/assets":
                    return self._json({"assets": list(app.catalog.assets.values())})
                if route == "/api/tags":
                    return self._json({"tags": app.catalog.tag_counts().most_common()})
                if route == "/api/suggest":
                    return self._json({"suggestions": suggest_tags(app.catalog, q.get("id", [""])[0])})
                if route == "/api/file":
                    target = app.file_path(q.get("root", [""])[0], q.get("path", [""])[0])
                    if target is None:
                        return self.send_error(404)
                    return self._file(target)
                if route == "/api/export":
                    game = q.get("game", [None])[0]
                    return self._json(export_manifest(app.catalog, game, q.get("graded", ["0"])[0] == "1"))
                if route == "/api/manifest":
                    game = q.get("game", [""])[0]
                    if game not in GAMES:
                        return self._json({"error": "pick a game"}, 400)
                    text, _, _ = manifest_lines(app, game)
                    body = text.encode("utf-8")
                    self.send_response(200)
                    self.send_header("Content-Type", "application/x-ndjson; charset=utf-8")
                    self.send_header("Content-Disposition", 'attachment; filename="manifest-%s.jsonl"' % game)
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
                if route == "/api/history":
                    asset = q.get("id", [""])[0]
                    lines = []
                    if app.catalog.log.exists():
                        with app.catalog.log.open(encoding="utf-8") as fh:
                            for line in fh:
                                ev = json.loads(line)
                                if ev.get("asset") == asset:
                                    lines.append(ev)
                    return self._json({"events": lines[-50:]})
                return self.send_error(404)
            except BrokenPipeError:
                pass
            except Exception as exc:  # report, don't crash the server
                return self._json({"error": str(exc)}, 500)

        def do_POST(self):
            if not self._local_only():
                return
            route = urllib.parse.urlparse(self.path).path
            try:
                body = self._body()
                if route == "/api/scan":
                    results = [scan_root(app.catalog, path, label) for label, path in app.roots.items()]
                    app.catalog.save()
                    return self._json({"results": results})
                if route == "/api/sync/scenario":
                    if not app.scenario:
                        return self._json({"error": "Scenario is turned off"}, 400)
                    return self._json(sync_scenario(app.catalog, app.scenario, app.who))
                if route == "/api/asset":
                    rec = app.catalog.update(body["id"], body.get("patch", {}), app.who)
                    if rec.get("grade") == "up" and rec.get("source") == "file":
                        ensure_sha256(app, rec)
                        app.catalog.save()
                    return self._json({"asset": rec})
                if route == "/api/bulk":
                    out = []
                    for asset_id in body.get("ids", [])[:2000]:
                        rec = app.catalog.assets.get(asset_id)
                        if rec is None:
                            continue
                        patch = dict(body.get("patch", {}))
                        tags = list(rec.get("tags", []))
                        for tag in body.get("addTags", []):
                            if norm_tag(tag) not in tags:
                                tags.append(tag)
                        drop = {norm_tag(t) for t in body.get("removeTags", [])}
                        if body.get("addTags") or drop:
                            patch["tags"] = [t for t in tags if norm_tag(t) not in drop]
                        out.append(app.catalog.update(asset_id, patch, app.who)["id"])
                    return self._json({"updated": out})
                if route == "/api/manifest/write":
                    game = body.get("game")
                    repo = app.roots.get("repo")
                    if game not in GAMES or repo is None:
                        return self._json({"error": "needs a game and a folder labelled repo (the repo's art/)"}, 400)
                    text, count, held = manifest_lines(app, game)
                    target = repo / game / "manifest.jsonl"
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_text(text, encoding="utf-8")
                    app.catalog.event(game, "write-manifest", {"path": str(target), "assets": count}, app.who)
                    return self._json({"path": str(target), "assets": count, "heldUnknownOrigin": held})
                if route == "/api/push-tags":
                    rec = app.catalog.assets.get(body.get("id", ""))
                    if not rec or rec.get("source") != "scenario" or not app.scenario:
                        return self._json({"error": "not a Scenario asset"}, 400)
                    local = set(rec.get("tags", []))
                    if rec.get("grade"):
                        local.add("kr0-" + rec["grade"])
                    remote = set(rec.get("sourceTags", []))
                    result = app.scenario.add_tags(rec["scenarioId"], sorted(local - remote), [])
                    rec["sourceTags"] = sorted(remote | local)
                    app.catalog.event(rec["id"], "push-tags", sorted(local - remote), app.who)
                    app.catalog.save()
                    return self._json({"pushed": sorted(local - remote), "result": result})
                return self.send_error(404)
            except urllib.error.HTTPError as exc:
                return self._json({"error": "Scenario said %s: %s" % (exc.code, exc.read()[:300].decode("utf-8", "replace"))}, 502)
            except (KeyError, ValueError) as exc:
                return self._json({"error": str(exc)}, 400)
            except Exception as exc:
                return self._json({"error": str(exc)}, 500)

    return Handler


def main(argv=None):
    parser = argparse.ArgumentParser(description="kr0 Asset Desk: grade, tag and trace studio art.")
    parser.add_argument("--root", action="append", default=[],
                        help='Art folder to browse, as label=path (repeatable), e.g. drive="G:\\My Drive\\kr0 Studio Art"')
    parser.add_argument("--catalog", help="Folder for catalog.json and events.jsonl (default: <first root>/_catalog)")
    parser.add_argument("--scenario-project", default="proj_T9sfQEQPZ2s4yoHgggBe1fAE")
    parser.add_argument("--no-scenario", action="store_true", help="Don't read the Scenario library")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--who", default="kr0", help="Name recorded on every grade and edit")
    parser.add_argument("--scan", action="store_true", help="Scan the folders on start")
    args = parser.parse_args(argv)
    app = App(args)
    if args.scan:
        for label, path in app.roots.items():
            print(scan_root(app.catalog, path, label))
        app.catalog.save()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(app))
    print("kr0 Asset Desk %s on http://127.0.0.1:%d  (catalog: %s)" % (VERSION, args.port, app.catalog.dir))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
