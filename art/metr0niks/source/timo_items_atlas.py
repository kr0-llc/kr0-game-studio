"""Slice Tim-o's item parts sheets into one puppet atlas for games/metr0niks/prototypes/item-lab.html.

Inputs: ../characters/tim-o/items/sheet-*.webp (Scenario, made on parts sheet v2.1) and
../characters/tim-o/parts/sheet-v2-1.webp (the base parts, re-cut here at the higher store size).
Writes ../characters/tim-o/items/atlas.webp and rig.js (window.TIMO_ITEMS, same format as puppet/rig-v2-1.js).
Run: python3 timo_items_atlas.py   (needs Pillow, numpy, scipy).

Scales are "sheet px -> atlas px at STORE 1.5", the store of puppet/rig-v2-1.js, so every item sits at the
v2.1 puppet's size. The arm scales and pivots came from fitting each arm's shoulder pad onto the v2.1 minigun
arm (alpha overlap 0.96 or better); the other pivots and joints were set by hand on a 10% grid.
"""
import json, os, re, numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
TIMO = os.path.join(HERE, "..", "characters", "tim-o")
ITEMS = os.path.join(TIMO, "items")
STORE = 3.0   # twice the v2.1 atlas, so the lab can zoom in and stay sharp

def parts(path, rowh):
    a = np.array(Image.open(path).convert("RGBA"))
    lab, n = ndimage.label(ndimage.binary_dilation(a[:, :, 3] > 90, iterations=6))
    al = np.clip((a[:, :, 3].astype(float) - 60) / 140, 0, 1) * 255   # drop the soft dark halo GPT Image adds
    out = []
    for i, (ys, xs) in enumerate(ndimage.find_objects(lab)):
        if (lab[ys, xs] == i + 1).sum() < 3000: continue
        c = a[ys, xs].copy(); c[:, :, 3] = np.where(lab[ys, xs] == i + 1, al[ys, xs], 0).astype(np.uint8)
        im = Image.fromarray(c); out.append(((ys.start, xs.start), im.crop(im.getbbox())))
    out.sort(key=lambda t: (round(t[0][0] / rowh), t[0][1]))
    return [p for _, p in out]

rig = json.loads(re.search(r"=(\{.*\});?\s*$", open(os.path.join(TIMO, "puppet", "rig-v2-1.js")).read(), re.S).group(1))
BASE = rig["sprites"]

# sheet -> [(sprite name, scale at store 1.5, pivot, joints, rot)]
TORSO = (BASE["p_torso"]["pivot"], BASE["p_torso"]["joints"])
PACK = (BASE["p_pack"]["pivot"], BASE["p_pack"]["joints"])
SPEC = {
  "arms": (250, [
    ("i_shotgun", .32, (.181, .278), {"muzzle": (.99, .62)}, -.27),
    ("i_plasma", .32, (.167, .285), {"muzzle": (.86, .80)}, -.27),
    ("i_rail", .31, (.152, .249), {"muzzle": (.99, .74)}, -.27),
    ("i_buster", .31, (.202, .263), {"tip": (.97, .68)}, -.27),
    ("i_winch", .30, (.16, .269), {"tip": (.87, .86)}, -.27)]),
  "mounts": (250, [
    ("i_cryo", .19, (.54, .90), {"fx": (.55, .25)}, 0),
    ("i_mortar", .19, (.48, .90), {"fx": (.78, .12)}, 0),
    ("i_vent", .19, (.45, .91), {"fx": (.62, .08)}, 0),
    ("i_magnet", .19, (.41, .91), {"fx": (.85, .45)}, 0)]),
  "cores": (400, [
    ("i_slag", .27, TORSO[0], TORSO[1], 0),
    ("i_composite", .27, TORSO[0], TORSO[1], 0),
    ("i_nanite", .27, TORSO[0], TORSO[1], 0)]),
  "packs": (400, [
    ("i_mk2", .256, PACK[0], PACK[1], 0),
    ("i_mk3", .256, (.5, .573), {"glow": (.5, .61)}, 0),   # 82 px of cylinders on top of the same body
    ("i_fusion", .256, PACK[0], PACK[1], 0)]),
  "legs": (400, [
    ("i_strider_thigh", .197, (.45, .105), {"knee": (.54, .90)}, 0),
    ("i_strider_shin", .179, (.41, .095), {}, 0),
    ("i_treads_thigh", .20, (.51, .10), {"knee": (.61, .92)}, 0),
    ("i_treads_shin", .219, (.43, .11), {}, 0)]),
}

sprites = {}
for sheet, (rowh, spec) in SPEC.items():
    got = parts(os.path.join(ITEMS, "sheet-" + sheet + ".webp"), rowh)
    assert len(got) == len(spec), (sheet, len(got))
    for im, (name, k, piv, joints, r) in zip(got, spec):
        s = k * STORE / 1.5
        sprites[name] = {"img": im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS),
                         "pivot": list(piv), "joints": {j: list(v) for j, v in joints.items()}, "rot": r}

# the v2.1 base parts, cut again from the full-size sheet at the atlas-v2-1 boxes scaled to STORE
base = parts(os.path.join(TIMO, "parts", "sheet-v2-1.webp"), 300)
order = ["p_torso", "p_thigh", "p_shin", "p_pack", "p_armR", "p_armL"]   # reading order on the sheet
for im, name in zip(base, order):
    b = BASE[name]; k = STORE / rig["store"]
    sprites[name] = {"img": im.resize((round(b["w"] * k), round(b["h"] * k)), Image.LANCZOS),
                     "pivot": b["pivot"], "joints": b["joints"], "rot": b["rot"]}

# shelf-pack into one atlas
W, x, y, rowh, pos = 1600, 0, 0, 0, {}
for name, sp in sorted(sprites.items(), key=lambda t: -t[1]["img"].height):
    w, h = sp["img"].size
    if x + w > W: x, y, rowh = 0, y + rowh + 2, 0
    pos[name] = (x, y); x += w + 2; rowh = max(rowh, h)
atlas = Image.new("RGBA", (W, y + rowh), (0, 0, 0, 0))
out = {"store": STORE, "sprites": {}}
for name, sp in sprites.items():
    atlas.paste(sp["img"], pos[name])
    w, h = sp["img"].size
    out["sprites"][name] = {"x": pos[name][0], "y": pos[name][1], "w": w, "h": h, "pivot": [round(v, 3) for v in sp["pivot"]],
                            "joints": {j: [round(a, 3) for a in v] for j, v in sp["joints"].items()}, "rot": sp["rot"]}
atlas.save(os.path.join(ITEMS, "atlas.webp"), quality=90, method=6)
with open(os.path.join(ITEMS, "rig.js"), "w") as f:
    f.write("/* Tim-o item parts on the v2.1 puppet. Built by art/metr0niks/source/timo_items_atlas.py; do not edit by hand. */\n")
    f.write("window.TIMO_ITEMS=" + json.dumps(out, separators=(",", ":")) + ";\n")
print(atlas.size, len(sprites), "sprites")
