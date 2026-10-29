"""Slice Tim-o's v3 arm parts sheets (upper arms and forearms split at the elbow) into a small atlas.

Run: python3 art/metr0niks/source/timo_arms_v3.py [v3|v3-1]   (needs Pillow, numpy, scipy; default v3-1).
Reads art/metr0niks/characters/tim-o/parts/arms-<ver>.webp (v3: Scenario asset_HT543m3cfVqbpSupixTzhozZ; v3-1: asset_ynVDCnfkPX5K1cjvNPn5Tfo9,
shorter upper arms and the back shoulder pad as a cup) and writes art/metr0niks/characters/tim-o/puppet/arms-<ver>.webp and .js (window.TIMO_ARMS3, same format
as timo_v21.js: store scale, box, pivot and joints as shares of the box).
Pivots, joints and rest angles (rot) were fitted to the ball caps in the art by the round-1 rig review
(tools/rig-harness/proposals/expert-r1.md); kr0 corrects them in the Puppet Rigging Lab.
"""
import json, os, sys, numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
TIMO = os.path.join(HERE, "..", "characters", "tim-o")
STORE = 1.5
SCALE = .25   # sheet px -> store px; matches the v2.1 arm housing size

# reading order on the sheet: front upper arm, minigun forearm, back upper arm, pile-bunker forearm
SPECS = {
 "v3": [("p_upF", (.235, .542), {"elbow": (.834, .65)}, -.086),
        ("p_foreF", (.124, .385), {"muzzle": (.988, .508)}, -.05),
        ("p_upB", (.205, .295), {"elbow": (.835, .505)}, -.158),
        ("p_foreB", (.119, .385), {"tip": (.989, .592)}, -.085)],
 "v3-1": [("p_upF", (.275, .523), {"elbow": (.8, .598)}, -.077),
        ("p_foreF", (.124, .385), {"muzzle": (.988, .508)}, -.05),
        ("p_upB", (.325, .37), {"elbow": (.8, .537)}, -.175),
        ("p_foreB", (.119, .385), {"tip": (.989, .592)}, -.085)]}

def main():
    ver = sys.argv[1] if len(sys.argv) > 1 else "v3-1"
    SPEC = SPECS[ver]
    a = np.array(Image.open(os.path.join(TIMO, "parts", "arms-%s.webp" % ver)).convert("RGBA"))
    m = a[:, :, 3] > 40
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=4))
    objs = [(s, i) for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 3000]
    objs.sort(key=lambda t: (round(t[0][0].start / 300), t[0][1].start))
    assert len(objs) == len(SPEC), len(objs)
    parts = []
    for (s, i), (name, pivot, joints, rot) in zip(objs, SPEC):
        c = a[s].copy()
        c[:, :, 3] = np.where((lab[s] == i + 1) & (c[:, :, 3] > 40), c[:, :, 3], 0)
        c[c[:, :, 3] == 0, :3] = 0   # the sheet's transparent pixels carry a dark glow; drop it
        im = Image.fromarray(c)
        parts.append((name, im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS), pivot, joints, rot))
    W, x, pos = sum(p[1].width + 2 for p in parts), 0, {}
    H = max(p[1].height for p in parts)
    atlas, meta = Image.new("RGBA", (W, H)), {"store": STORE, "sprites": {}}
    for name, im, pivot, joints, rot in parts:
        atlas.paste(im, (x, 0))
        meta["sprites"][name] = {"x": x, "y": 0, "w": im.width, "h": im.height, "pivot": list(pivot), "joints": {k: list(v) for k, v in joints.items()}, "rot": rot}
        x += im.width + 2
    out = os.path.join(TIMO, "puppet")
    atlas.save(os.path.join(out, "arms-%s.webp" % ver), quality=92, method=6)
    open(os.path.join(out, "arms-%s.js" % ver), "w").write("window.TIMO_ARMS3=" + json.dumps(meta) + ";\n")
    print("wrote arms-%s atlas" % ver, atlas.size)

if __name__ == "__main__":
    main()
