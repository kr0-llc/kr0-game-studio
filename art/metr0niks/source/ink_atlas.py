"""Slice the Scenario sprite sheets in ../ink-proto/sheets into one atlas for games/metr0niks/prototypes/prototype-ink.html.

Each sheet has parts drawn apart on a transparent background; connected alpha regions become sprites.
Run: python3 build_atlas.py   (needs Pillow, numpy, scipy). Writes ../ink-proto/sprites/atlas.webp and atlas.json.
Anchors are shares of each sprite's box: the pivot the game rotates a part around, plus named joints.
"""
import json, os, numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = os.path.join(HERE, "..", "ink-proto", "sheets")
OUT = os.path.join(HERE, "..", "ink-proto", "sprites")
STORE = 1.5   # sprites are stored at 1.5x their on-screen size so zoom and HiDPI stay sharp

def parts(name, minarea=1500):
    a = np.array(Image.open(os.path.join(SHEETS, name + ".webp")).convert("RGBA"))
    lab, n = ndimage.label(ndimage.binary_dilation(a[:, :, 3] > 40, iterations=6))
    out = []
    for i, (ys, xs) in enumerate(ndimage.find_objects(lab)):
        if (lab[ys, xs] == i + 1).sum() < minarea: continue
        c = a[ys, xs].copy(); c[:, :, 3] = np.where(lab[ys, xs] == i + 1, c[:, :, 3], 0)
        out.append(((ys.start, xs.start), Image.fromarray(c)))
    out.sort(key=lambda t: (round(t[0][0] / 180), t[0][1]))   # reading order: rows, then left to right
    return [p for _, p in out]

# sheet -> (display scale, [(sprite name, pivot, joints)])
SPEC = {
  "player_parts": (.17, [("p_torso", (.5, .55), {"armF": (.82, .42), "armB": (.14, .45), "hipF": (.62, .86), "hipB": (.36, .86), "pack": (.3, .3), "eye": (.68, .3)}),
                         ("p_thigh", (.45, .12), {"knee": (.55, .85)}),
                         ("p_shin", (.55, .14), {}),
                         ("p_armR", (.12, .16), {"muzzle": (1, .62)}),
                         ("p_armL", (.12, .16), {"tip": (1, .74)}),
                         ("p_pack", (.5, .5), {"glow": (.5, .55)})]),
  "enemy_gunner": (.155, [("b_torso", (.5, .55), {"armF": (.85, .5), "hipF": (.62, .86), "hipB": (.38, .86)}),
                          ("b_thigh", (.4, .1), {"knee": (.5, .82)}),
                          ("b_shin", (.5, .14), {}),
                          ("b_arm", (.1, .22), {"muzzle": (1, .45)})]),
  "enemy_scuttler": (.2, [("j_body", (.5, .55), {"legA": (.3, .8), "legB": (.7, .8), "eye": (.7, .52)}),
                          ("j_leg", (.45, .08), {}),
                          ("j_leg2", (.4, .08), {})]),
  "enemy_brute": (.22, [("l_hull", (.5, .62), {"claw": (.85, .6), "legA": (.25, .85), "legB": (.75, .85), "mortar": (.5, .1)}),
                        ("l_leg", (.35, .1), {}),
                        ("l_claw", (.05, .45), {"tip": (1, .5)})]),
  "buildings": (.42, [(n, (.5, .9), {}) for n in ["adobe", "tower", "shack", "pillar", "stall", "rubble"]]),
  "props": (.25, [(n, (.5, .85), {}) for n in ["barrel", "crates", "sandbags", "cactus", "palm", "car", "cone", "tires", "scrappile", "gear", "canister", "sign"]]),
  "debris": (.12, [("d%d" % i, (.5, .5), {}) for i in range(20)]),
  "fx": (.3, [(n, (.5, .5), {}) for n in ["boom", "dust", "puff", "flash", "smokering", "spark"]]),
}
MINAREA = {"fx": 8000}

def main():
    sprites = []
    for sheet, (scale, names) in SPEC.items():
        ps = parts(sheet, MINAREA.get(sheet, 1500))
        assert len(ps) >= len(names), (sheet, len(ps))
        for (name, pivot, joints), im in zip(names, ps):
            w, h = max(1, round(im.width * scale * STORE)), max(1, round(im.height * scale * STORE))
            sprites.append((name, im.resize((w, h), Image.LANCZOS), pivot, joints))
    # shelf packing, tallest first
    sprites.sort(key=lambda s: -s[1].height)
    W, x, y, rowh, pos = 2048, 0, 0, 0, {}
    for name, im, pivot, joints in sprites:
        if x + im.width + 2 > W: x, y, rowh = 0, y + rowh + 2, 0
        pos[name] = (x, y); x += im.width + 2; rowh = max(rowh, im.height)
    H = y + rowh
    atlas = Image.new("RGBA", (W, H))
    meta = {"store": STORE, "sprites": {}}
    for name, im, pivot, joints in sprites:
        atlas.paste(im, pos[name])
        meta["sprites"][name] = {"x": pos[name][0], "y": pos[name][1], "w": im.width, "h": im.height, "pivot": pivot, "joints": joints}
    os.makedirs(OUT, exist_ok=True)
    atlas.save(os.path.join(OUT, "atlas.webp"), quality=90, method=6)
    # ground: a 512 tile made seamless by cross-fading with a half-offset copy
    g = Image.open(os.path.join(SHEETS, "ground.webp")).convert("RGB").resize((512, 512), Image.LANCZOS)
    a = np.array(g).astype(float); b = np.roll(np.roll(a, 256, 0), 256, 1)
    yy, xx = np.mgrid[0:512, 0:512]; d = np.maximum(abs(xx - 255.5), abs(yy - 255.5)) / 256
    m = np.clip((d - .55) / .4, 0, 1)[..., None]
    Image.fromarray((a * (1 - m) + b * m).astype(np.uint8)).save(os.path.join(OUT, "ground.webp"), quality=88)
    Image.open(os.path.join(SHEETS, "garage_bg.webp")).convert("RGB").resize((1280, 853), Image.LANCZOS).save(os.path.join(OUT, "garage.webp"), quality=86)
    json.dump(meta, open(os.path.join(OUT, "atlas.json"), "w"), separators=(",", ":"))
    with open(os.path.join(OUT, "atlas.js"), "w") as f:   # script form, so the prototype also runs from file://
        f.write("window.INK_ATLAS=" + json.dumps(meta, separators=(",", ":")) + ";\n")
    print("atlas", W, H, len(sprites), "sprites")

if __name__ == "__main__":
    main()
