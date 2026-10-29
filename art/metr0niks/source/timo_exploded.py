"""Slice Tim-o's exploded-view parts sheet into a puppet atlas and seed every pivot from the ball caps in the art.

Run: python3 art/metr0niks/source/timo_exploded.py [v1]   (needs Pillow, numpy, scipy; default v1).
Reads art/metr0niks/characters/tim-o/parts/exploded-<ver>.webp, an exploded view of the hero frame hero-<ver>.webp
(the mech drawn once, assembled, in the game camera; then an edit slides the pieces apart and draws a sand ball cap
on every limb end and a sand socket on every body side). Because every piece is a cut of the same drawing, the parts
share one scale and camera, the shoulders match, and every joint has a cap and a socket drawn into the art.
Writes art/metr0niks/characters/tim-o/puppet/exploded-<ver>.webp and .js (window.TIMO_RIG4, same format as timo_v21.js)
plus parts/exploded-<ver>-marks.png, the sheet with the seeded pivots and joints drawn on it for review.

Pivots and joints are seeded from the sand (#e8d6b0) caps: the centre of a cap circle is the child's pivot, the centre of
the matching socket is the parent's joint. Rest angles (rot) turn each piece so its bone axis is horizontal (arms) or
vertical (shins) in rig space. kr0 corrects all of it in the Puppet Rigging Lab (rig "Tim-o v4").
"""
import json, os, sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
TIMO = os.path.join(HERE, "..", "characters", "tim-o")
STORE = 1.5
SAND = np.array([232, 214, 176])
# torso joints as shares of the torso box: shoulder sockets, hip sockets, where the pack sits, the lens
TORSO_JOINTS = {"v1": {"armB": [.091, .318], "armF": [.957, .275], "hipB": [.287, .897], "hipF": [.745, .918], "pack": [.2, .25], "eye": [.691, .328]}}

def blobs(rgba, mask, tol=38, min_area=250):
    """sand-coloured blobs inside mask: list of (cx, cy, radius, area, roundness)"""
    d = np.abs(rgba[:, :, :3].astype(int) - SAND).sum(axis=2)
    m = (d < tol) & mask & (rgba[:, :, 3] > 40)
    m = ndimage.binary_opening(m, iterations=2)
    lab, n = ndimage.label(m)
    out = []
    for i, s in enumerate(ndimage.find_objects(lab)):
        sel = lab[s] == i + 1
        a = sel.sum()
        if a < min_area: continue
        ys, xs = np.nonzero(sel)
        h, w = sel.shape
        r = (w + h) / 4
        out.append((xs.mean() + s[1].start, ys.mean() + s[0].start, r, a, a / (np.pi * r * r + 1e-9)))
    return out

def main():
    ver = sys.argv[1] if len(sys.argv) > 1 else "v1"
    a = np.array(Image.open(os.path.join(TIMO, "parts", "exploded-%s.webp" % ver)).convert("RGBA"))
    H, W = a.shape[:2]
    m = a[:, :, 3] > 40
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=1))
    objs = [(s, i) for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 4000]
    assert len(objs) == 10, "expected 10 pieces, got %d" % len(objs)
    # name the pieces by where they sit on the exploded sheet (the figure faces right: near side = right)
    cent = []
    for s, i in objs:
        ys, xs = np.nonzero(lab[s] == i + 1)
        cent.append((xs.mean() + s[1].start, ys.mean() + s[0].start, (s, i)))
    torso = max(cent, key=lambda c: (lab[c[2][0]] == c[2][1] + 1).sum())
    tx, ty = torso[0], torso[1]
    names = {}
    rest = [c for c in cent if c is not torso]
    names[id(torso)] = "p4_torso"
    pack = min(rest, key=lambda c: c[1]); names[id(pack)] = "p4_pack"; rest.remove(pack)
    legs = sorted([c for c in rest if c[1] > ty + 120 and abs(c[0] - tx) < W * .22], key=lambda c: (c[0] > tx, c[1]))
    assert len(legs) == 4, [c[:2] for c in legs]
    for c, nm in zip(legs, ["p4_thighB", "p4_shinB", "p4_thighF", "p4_shinF"]): names[id(c)] = nm; rest.remove(c)
    left = sorted([c for c in rest if c[0] < tx], key=lambda c: c[1]); right = sorted([c for c in rest if c[0] > tx], key=lambda c: c[1])
    assert len(left) == 2 and len(right) == 2
    names[id(left[0])] = "p4_upB"; names[id(left[1])] = "p4_foreB"; names[id(right[0])] = "p4_upF"; names[id(right[1])] = "p4_foreF"

    marks = Image.fromarray(a.copy()); dr = ImageDraw.Draw(marks)
    parts = {}
    for c in cent:
        nm, (s, i) = names[id(c)], c[2]
        sel = (lab[s] == i + 1) & (a[s][:, :, 3] > 40)
        ys, xs = np.nonzero(sel)
        y0, y1, x0, x1 = ys.min() + s[0].start, ys.max() + s[0].start + 1, xs.min() + s[1].start, xs.max() + s[1].start + 1
        full = np.zeros((H, W), bool); full[s] = sel
        crop = a[y0:y1, x0:x1].copy(); crop[:, :, 3] = np.where(full[y0:y1, x0:x1], crop[:, :, 3], 0); crop[crop[:, :, 3] == 0, :3] = 0
        w, h = x1 - x0, y1 - y0
        B = blobs(a, full)
        sh = lambda p: [round(float(p[0] - x0) / w, 3), round(float(p[1] - y0) / h, 3)]
        balls = sorted([b for b in B if b[4] > .55], key=lambda b: -b[3])   # filled discs: caps
        rings = sorted([b for b in B if b[4] <= .55], key=lambda b: -b[3])  # hollow: sockets
        pivot, joints, rot = None, {}, 0.0
        far = lambda p: max(zip(xs + s[1].start, ys + s[0].start), key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)
        if nm == "p4_torso":
            pivot = (x0 + w * .5, y0 + h * .55)
            # the socket rings are shaded, so the colour pick misses them: seeded by hand from the v1 sheet, kr0 refines in the lab
            joints.update(TORSO_JOINTS[ver])
        elif nm == "p4_pack":
            pivot = (x0 + w * .5, y0 + h * .5); joints["glow"] = [.5, .55]
        elif nm.startswith("p4_up"):
            bb = sorted(balls[:2], key=lambda b: (b[0] - tx) ** 2 + (b[1] - ty) ** 2)
            pivot, el = (bb[0][0], bb[0][1]), (bb[1][0], bb[1][1]); joints["elbow"] = sh(el)
            rot = -np.arctan2(el[1] - pivot[1], el[0] - pivot[0])
        elif nm.startswith("p4_fore"):
            b0 = balls[0]; pivot = (b0[0], b0[1]); tip = far(pivot)
            joints["muzzle" if nm == "p4_foreB" else "tip"] = sh(tip)
            rot = -np.arctan2(tip[1] - pivot[1], tip[0] - pivot[0])
        elif nm.startswith("p4_thigh"):
            bb = sorted(balls[:2], key=lambda b: b[1]); pivot = (bb[0][0], bb[0][1]); joints["knee"] = sh(bb[1])
        elif nm.startswith("p4_shin"):
            top = min(blobs(a, full, tol=90, min_area=150), key=lambda b: b[1]); pivot = (top[0], top[1])   # the knee socket ring at the top
            sole_rows = ys + s[0].start >= y1 - h * .12
            sole = ((xs + s[1].start)[sole_rows].mean(), (ys + s[0].start)[sole_rows].mean())
            rot = np.pi / 2 - np.arctan2(sole[1] - pivot[1], sole[0] - pivot[0])
        parts[nm] = dict(crop=Image.fromarray(crop), pivot=sh(pivot), joints=joints, rot=round(float(rot), 3))
        dr.rectangle([x0, y0, x1, y1], outline=(255, 255, 255, 120))
        dr.ellipse([pivot[0] - 9, pivot[1] - 9, pivot[0] + 9, pivot[1] + 9], outline=(255, 40, 40, 255), width=3)
        for j, p in joints.items():
            px, py = x0 + p[0] * w, y0 + p[1] * h
            dr.ellipse([px - 7, py - 7, px + 7, py + 7], outline=(40, 120, 255, 255), width=3); dr.text((px + 9, py - 6), j, fill=(255, 255, 255, 255))
        dr.text((x0 + 4, y0 + 4), nm, fill=(255, 255, 255, 255))
    marks.save(os.path.join(TIMO, "parts", "exploded-%s-marks.png" % ver))

    # scale: the torso lands at the v2.1 torso height (132 store px) so the lab's scale 1.15 still fits
    scale = 132 / parts["p4_torso"]["crop"].height
    order = ["p4_torso", "p4_thighF", "p4_shinF", "p4_thighB", "p4_shinB", "p4_upF", "p4_foreF", "p4_upB", "p4_foreB", "p4_pack"]
    ims = {nm: parts[nm]["crop"].resize((round(parts[nm]["crop"].width * scale), round(parts[nm]["crop"].height * scale)), Image.LANCZOS) for nm in order}
    Wt, Ht = sum(ims[nm].width + 2 for nm in order), max(im.height for im in ims.values())
    atlas, meta, x = Image.new("RGBA", (Wt, Ht)), {"store": STORE, "sheet": "exploded-%s" % ver, "sheetScale": round(scale, 4), "sprites": {}}, 0
    for nm in order:
        im, p = ims[nm], parts[nm]
        atlas.paste(im, (x, 0))
        meta["sprites"][nm] = {"x": x, "y": 0, "w": im.width, "h": im.height, "pivot": p["pivot"], "joints": p["joints"], "rot": p["rot"]}
        x += im.width + 2
    out = os.path.join(TIMO, "puppet")
    atlas.save(os.path.join(out, "exploded-%s.webp" % ver), quality=92, method=6)
    open(os.path.join(out, "exploded-%s.js" % ver), "w").write("window.TIMO_RIG4=" + json.dumps(meta) + ";\n")
    print("wrote exploded-%s atlas" % ver, atlas.size, "scale %.3f" % scale)
    for nm in order: print(" ", nm, meta["sprites"][nm])

if __name__ == "__main__":
    main()
