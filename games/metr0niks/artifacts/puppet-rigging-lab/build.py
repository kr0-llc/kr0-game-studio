"""Build the Puppet Rigging Lab page: crop the puppet parts into one small atlas and inline it into template.html.

Run from anywhere: python3 games/metr0niks/artifacts/puppet-rigging-lab/build.py  (needs Pillow). Writes puppet-rigging-lab.html next to this script,
which is what gets published as the claude.ai artifact. Rig data (pivot, joints, rest angle) comes from the same
files the game reads, so the bench always opens on the current rig.
"""
import base64, io, json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "..", "..", "..")
SPR = os.path.join(ROOT, "art", "metr0niks", "ink-proto", "sprites")
PUP = os.path.join(ROOT, "art", "metr0niks", "characters", "tim-o", "puppet")

def load_js(path):
    s = open(path).read()
    return json.loads(s[s.index("{"):s.rindex("}") + 1])

SOURCES = [
    (os.path.join(PUP, "arms-v3-1"), ["p_upF", "p_foreF", "p_upB", "p_foreB"]),
    ("timo_v21", ["p_torso", "p_thigh", "p_shin", "p_armR", "p_armL", "p_pack"]),
    ("atlas", ["b_torso", "b_thigh", "b_shin", "b_arm", "l_hull", "l_leg", "l_claw", "j_body", "j_leg", "j_leg2"]),
]

def main():
    crops = []
    for name, parts in SOURCES:
        base = name if os.path.isabs(name) else os.path.join(SPR, name)
        meta, im = load_js(base + ".js"), Image.open(base + ".webp").convert("RGBA")
        for n in parts:
            s = meta["sprites"][n]
            crops.append((n, im.crop((s["x"], s["y"], s["x"] + s["w"], s["y"] + s["h"])), s, meta["store"]))
    crops.sort(key=lambda c: -c[1].height)
    W, x, y, rowh, pos = 1024, 0, 0, 0, {}
    for n, c, _, _ in crops:
        if x + c.width + 2 > W: x, y, rowh = 0, y + rowh + 2, 0
        pos[n] = (x, y); x += c.width + 2; rowh = max(rowh, c.height)
    atlas, out = Image.new("RGBA", (W, y + rowh)), {}
    for n, c, s, store in crops:
        atlas.paste(c, pos[n])
        out[n] = {"x": pos[n][0], "y": pos[n][1], "w": c.width, "h": c.height, "store": store,
                  "pivot": s["pivot"], "joints": s["joints"], "rot": s.get("rot", 0)}
    b = io.BytesIO(); atlas.save(b, "WEBP", quality=92, method=6)
    data = json.dumps({"img": "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode(), "sprites": out})
    page = open(os.path.join(HERE, "template.html")).read().replace("/*ATLAS*/", data)
    open(os.path.join(HERE, "puppet-rigging-lab.html"), "w").write(page)
    print("wrote puppet-rigging-lab.html", len(page), "bytes")

if __name__ == "__main__":
    main()
