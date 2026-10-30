"""Overlay a rig's rest render on Tim-o's hero frame, so the rest pose can be checked against the drawing it came from.

Run: python3 tools/rig-harness/overlay-hero.py [out-dir, default tools/rig-harness/out/v4-rigged]   (needs Pillow)
Reads <out>/report.json and <out>/rest-0.png from render.js and puppet/exploded-v1.js (its "hero" block from timo_reassemble.py:
the torso's registered box and the canvas scale), scales the hero frame to the render and aligns it on the torso's eye joint.
Writes <out>/rest-vs-hero.png: hero | rest render | both (hero under the render at 60%).
"""
import json, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "tools", "rig-harness", "out", "v4-rigged")
TIMO = os.path.join(ROOT, "art", "metr0niks", "characters", "tim-o")
r = json.load(open(os.path.join(out, "report.json")))
f = [x for x in r["frames"] if x["mode"] == "rest"][0]
T = {p["tag"]: p for p in f["parts"]}
t = open(os.path.join(TIMO, "puppet", "exploded-v1.js")).read(); m = json.loads(t[t.index("{"):t.rindex("}") + 1]); h = m["hero"]
s = r["zoom"] * r["R"]["scale"] * h["rigPxPerHeroPx"]          # canvas px per hero px
tp, eye = h["pos"]["p4_torso"], m["sprites"]["p4_torso"]["joints"]["eye"]
hx, hy = tp[0] + eye[0] * tp[2], tp[1] + eye[1] * tp[3]
ex, ey = T["p4_torso"]["joints"]["eye"]
hero = Image.open(os.path.join(TIMO, "parts", "hero-v1.webp")).convert("RGBA")
hs = hero.resize((round(hero.width * s), round(hero.height * s)), Image.LANCZOS)
rest = Image.open(os.path.join(out, "rest-0.png")).convert("RGBA")
p1 = Image.new("RGBA", rest.size, (255, 255, 255, 255)); p1.alpha_composite(hs, (round(ex - hx * s), round(ey - hy * s)))
p3 = p1.copy(); r2 = rest.copy(); r2.putalpha(r2.getchannel("A").point(lambda v: int(v * .6))); p3.alpha_composite(r2)
o = Image.new("RGBA", (rest.width * 3, rest.height), (255, 255, 255, 255)); o.paste(p1, (0, 0)); o.paste(rest, (rest.width, 0)); o.paste(p3, (rest.width * 2, 0))
o.save(os.path.join(out, "rest-vs-hero.png"))
print("wrote", os.path.join(out, "rest-vs-hero.png"), "hero scale %.3f" % s)
