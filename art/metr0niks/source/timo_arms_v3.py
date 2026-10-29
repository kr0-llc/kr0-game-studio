"""Slice Tim-o's v3 arm parts sheet (upper arms and forearms split at the elbow) into a small atlas.

Run: python3 art/metr0niks/source/timo_arms_v3.py   (needs Pillow, numpy, scipy).
Reads art/metr0niks/characters/tim-o/parts/arms-v3.webp (preview of Scenario asset_HT543m3cfVqbpSupixTzhozZ)
and writes art/metr0niks/characters/tim-o/puppet/arms-v3.webp and arms-v3.js (window.TIMO_ARMS3, same format
as timo_v21.js: store scale, box, pivot and joints as shares of the box).
Pivots and joints are first guesses; kr0 corrects them in the Puppet Rigging Lab.
"""
import json, os, numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
TIMO = os.path.join(HERE, "..", "characters", "tim-o")
STORE = 1.5
SCALE = .25   # sheet px -> store px; matches the v2.1 arm housing size

# reading order on the sheet: front upper arm, minigun forearm, back upper arm, pile-bunker forearm
SPEC = [("p_upF", (.36, .30), {"elbow": (.864, .60)}),
        ("p_foreF", (.115, .333), {"muzzle": (.993, .516)}),
        ("p_upB", (.22, .30), {"elbow": (.864, .46)}),
        ("p_foreB", (.11, .333), {"tip": (.992, .598)})]

def main():
    a = np.array(Image.open(os.path.join(TIMO, "parts", "arms-v3.webp")).convert("RGBA"))
    m = a[:, :, 3] > 40
    lab, _ = ndimage.label(ndimage.binary_dilation(m, iterations=4))
    objs = [(s, i) for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 3000]
    objs.sort(key=lambda t: (round(t[0][0].start / 300), t[0][1].start))
    assert len(objs) == len(SPEC), len(objs)
    parts = []
    for (s, i), (name, pivot, joints) in zip(objs, SPEC):
        c = a[s].copy()
        c[:, :, 3] = np.where((lab[s] == i + 1) & (c[:, :, 3] > 40), c[:, :, 3], 0)
        c[c[:, :, 3] == 0, :3] = 0   # the sheet's transparent pixels carry a dark glow; drop it
        im = Image.fromarray(c)
        parts.append((name, im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS), pivot, joints))
    W, x, pos = sum(p[1].width + 2 for p in parts), 0, {}
    H = max(p[1].height for p in parts)
    atlas, meta = Image.new("RGBA", (W, H)), {"store": STORE, "sprites": {}}
    for name, im, pivot, joints in parts:
        atlas.paste(im, (x, 0))
        meta["sprites"][name] = {"x": x, "y": 0, "w": im.width, "h": im.height, "pivot": list(pivot), "joints": {k: list(v) for k, v in joints.items()}, "rot": 0}
        x += im.width + 2
    out = os.path.join(TIMO, "puppet")
    atlas.save(os.path.join(out, "arms-v3.webp"), quality=92, method=6)
    open(os.path.join(out, "arms-v3.js"), "w").write("window.TIMO_ARMS3=" + json.dumps(meta) + ";\n")
    print("wrote arms-v3 atlas", atlas.size)

if __name__ == "__main__":
    main()
