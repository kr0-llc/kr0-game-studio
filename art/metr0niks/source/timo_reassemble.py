"""Put Tim-o's exploded pieces back onto the hero frame and derive the rig from where they land.

Run: python3 art/metr0niks/source/timo_reassemble.py [v1]   (needs Pillow, numpy, scipy; default v1; run AFTER timo_exploded.py).
Every piece on parts/exploded-<ver>.webp is a cut of parts/hero-<ver>.webp that was only slid apart (same drawing, size and
angle), so each piece registers back onto the hero frame by translation alone, at one scale for the whole sheet. This script
  1. segments the sheet with timo_exploded.segment (same labels and names as the slicer),
  2. measures the sheet-to-hero scale by matching the torso at a range of scales (masked normalized cross-correlation on RGB+alpha),
  3. registers every piece at that scale (masked NCC again, peak = translation), and flags a piece as unreliable when its
     NCC peak is weak or barely above the runner-up, in which case the seeded values from the slicer are kept for it,
  4. derives the rig from the registered positions: the child's pivot stays the centre of its cap ball (seeded by the slicer);
     the parent's joint becomes that same point expressed in the parent's box, i.e. where the child's pivot lands when both
     pieces sit on the hero frame; the rest angles (rot) turn each bone horizontal (arms) or vertical (shins) exactly as the
     slicer does, and a "hero" block records the rest aim and elbow bend per arm and the foot offsets per leg that make the
     rig's rest pose reproduce the hero frame (the lab reads them as RIGS.timo4 constants restAim/restBend/legRest),
  5. writes puppet/exploded-<ver>.js (joints and rot updated, "hero" block added) and parts/reassembled-<ver>.png: the pieces
     pasted at their registered positions over a faint hero frame with the derived pivots (red) and joints (blue) drawn on.
"""
import json, os, sys, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.signal import fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from timo_exploded import segment, blobs, TIMO   # noqa: E402

PAD = 160            # hero frame padding so a piece may hang over the edge
SCALES = np.arange(.60, .90, .01)   # sheet px -> hero px candidates (1024/1536 = .667 nominal; the edit grew the mech)
WINDOW = 110                        # hero px: how far a child may sit from where its parent's seeded joint puts its cap
NCC_MIN, PEAK_RATIO = .30, 1.08     # a registration is trusted when its peak is above NCC_MIN and PEAK_RATIO times the runner-up
PARENT = {"p4_thighF": ("p4_torso", "hipF"), "p4_thighB": ("p4_torso", "hipB"), "p4_shinF": ("p4_thighF", "knee"), "p4_shinB": ("p4_thighB", "knee"),
          "p4_upF": ("p4_torso", "armF"), "p4_upB": ("p4_torso", "armB"), "p4_foreF": ("p4_upF", "elbow"), "p4_foreB": ("p4_upB", "elbow"), "p4_pack": ("p4_torso", "pack")}
ORDER = ["p4_pack", "p4_upB", "p4_foreB", "p4_thighB", "p4_shinB", "p4_thighF", "p4_shinF", "p4_torso", "p4_upF", "p4_foreF"]   # paste order for the check image

def prep(rgba, sigma=1.0):
    """float channels for matching: RGB (transparent = black) plus a luminance edge channel weighted up, since the line art is what
    pins a piece down; alpha is not a channel because it is flat inside the hero and would reward any placement inside the figure"""
    f = rgba.astype(np.float32) / 255.
    rgb = f[:, :, :3] * f[:, :, 3:4]
    lum = ndimage.gaussian_filter(rgb.mean(axis=2), sigma)
    edge = np.hypot(ndimage.sobel(lum, 0), ndimage.sobel(lum, 1))
    rgb = np.stack([ndimage.gaussian_filter(rgb[:, :, k], sigma) for k in range(3)], axis=2)
    return np.concatenate([rgb, 2.0 * edge[:, :, None]], axis=2)

def masked_ncc(F, T, M):
    """Masked normalized cross-correlation (Padfield) of template T (h,w,c) with mask M (h,w) over image F (H,W,c), 'full' mode.
    Returns the NCC map indexed by the template's top-left offset: map[y + h - 1, x + w - 1] is the score at offset (x, y)."""
    Mf = M.astype(np.float64); F = F.astype(np.float64); T = T.astype(np.float64)
    N = fftconvolve(np.ones(F.shape[:2], np.float64), Mf[::-1, ::-1], mode="full")
    num, sf, sf2 = 0, 0, 0
    st, st2 = 0.0, 0.0
    for k in range(F.shape[2]):
        f, t = F[:, :, k], T[:, :, k] * Mf
        num = num + fftconvolve(f, t[::-1, ::-1], mode="full")
        sf = sf + fftconvolve(f, Mf[::-1, ::-1], mode="full")
        sf2 = sf2 + fftconvolve(f * f, Mf[::-1, ::-1], mode="full")
        st += t.sum(); st2 += (t * t).sum()
    C = F.shape[2]
    Nc = np.maximum(N * C, 1)
    vart = max(st2 - st * st / (Mf.sum() * C), 1e-6)
    varf = np.maximum(sf2 - sf * sf / Nc, .05 * vart)   # a window with far less variance than the piece is flat background, not a match
    ncc = (num - sf * st / Nc) / np.sqrt(varf * vart)
    ncc[N < .5 * Mf.sum()] = -1    # the template must lie mostly inside the padded frame
    return ncc

def register(Fh, piece, s, ds=1, window=None):
    """register one piece (RGBA crop, mask) on the padded hero channels Fh (downsampled by ds) at scale s. window = ((x, y), r):
    only offsets within r hero px of the expected top-left (x, y) are considered (a child must put its cap near its parent's socket).
    Returns (x, y) hero px of the crop's top-left, peak, runner-up (best score more than 12 px from the peak), (w, h) in hero px"""
    crop, mask = piece
    W0, H0 = round(crop.shape[1] * s), round(crop.shape[0] * s)
    w, h = max(2, round(W0 / ds)), max(2, round(H0 / ds))
    im = np.array(Image.fromarray(crop).resize((w, h), Image.LANCZOS))
    T, M = prep(im), np.array(Image.fromarray((mask * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)) > 127
    ncc = masked_ncc(Fh, T, M)
    if window:
        (ex, ey), r = window
        cy, cx = (ey + PAD) / ds + h - 1, (ex + PAD) / ds + w - 1
        yy, xx = np.mgrid[:ncc.shape[0], :ncc.shape[1]]
        ncc[(yy - cy) ** 2 + (xx - cx) ** 2 > (r / ds) ** 2] = -1
    iy, ix = np.unravel_index(np.argmax(ncc), ncc.shape)
    peak = float(ncc[iy, ix])
    k = round(12 / ds)
    far = ncc.copy(); far[max(0, iy - k):iy + k + 1, max(0, ix - k):ix + k + 1] = -1
    runner = float(far.max())
    return (int((ix - (w - 1)) * ds - PAD), int((iy - (h - 1)) * ds - PAD)), peak, runner, (W0, H0)

def main():
    ver = sys.argv[1] if len(sys.argv) > 1 else "v1"
    sheet = np.array(Image.open(os.path.join(TIMO, "parts", "exploded-%s.webp" % ver)).convert("RGBA"))
    hero = np.array(Image.open(os.path.join(TIMO, "parts", "hero-%s.webp" % ver)).convert("RGBA"))
    hero[hero[:, :, 3] == 0, :3] = 0
    jsp = os.path.join(TIMO, "puppet", "exploded-%s.js" % ver)
    txt = open(jsp).read(); meta = json.loads(txt[txt.index("{"):txt.rindex("}") + 1])
    pieces, _ = segment(sheet)
    crops = {}
    for nm, ((x0, y0, x1, y1), full) in pieces.items():
        c = sheet[y0:y1, x0:x1].copy(); m = full[y0:y1, x0:x1]
        c[:, :, 3] = np.where(m, c[:, :, 3], 0); c[c[:, :, 3] == 0, :3] = 0
        crops[nm] = (c, m)
    Hp = np.pad(hero, ((PAD, PAD), (PAD, PAD), (0, 0)))
    Fh = prep(Hp)
    Fh2 = prep(np.array(Image.fromarray(Hp).resize((Hp.shape[1] // 2, Hp.shape[0] // 2), Image.LANCZOS)))

    # 1. the scale: match the torso at every candidate scale (half resolution), refine around the best at full resolution
    scores = [(register(Fh2, crops["p4_torso"], s, 2)[1], s) for s in SCALES]
    best = max(scores)[1]
    print("coarse scale scan (half res): " + " ".join("%.2f:%.3f" % (sc, v) for v, sc in scores))
    fine = [(register(Fh, crops["p4_torso"], s)[1], s) for s in np.arange(best - .01, best + .0101, .0025)]
    scale = float(max(fine)[1])
    print("scale sheet->hero %.4f (torso NCC %.3f; nominal 1024/1536 = %.3f)" % (scale, max(fine)[0], 1024 / 1536))

    # 2. register every piece at that scale, parents first: a child is searched within WINDOW hero px of where its parent's seeded
    #    joint puts its cap (the pieces were slid apart along their limbs, so the cap belongs in the socket); the torso and the pack
    #    are searched over the whole frame
    sp = meta["sprites"]
    reg, ok = {}, {}
    def expect(child, sc):
        parent, jn = PARENT[child]
        pr, j, pv = reg[parent], sp[parent]["joints"][jn], sp[child]["pivot"]
        w, h = round(crops[child][0].shape[1] * sc), round(crops[child][0].shape[0] * sc)
        return (round(pr["x"] + j[0] * pr["w"] - pv[0] * w), round(pr["y"] + j[1] * pr["h"] - pv[1] * h))
    def place(nm, sc, window=None):
        (x, y), peak, runner, (w, h) = register(Fh, crops[nm], sc, 1, window)
        ratio = peak / max(runner, 1e-6)
        ok[nm] = peak >= NCC_MIN and ratio >= PEAK_RATIO
        reg[nm] = dict(x=x, y=y, w=w, h=h, scale=round(float(sc), 4), ncc=round(peak, 3), runnerUp=round(runner, 3), ratio=round(ratio, 2), ok=bool(ok[nm]))
        print("  %-10s scale %.4f at (%4d,%4d) size %3dx%3d  NCC %.3f  runner-up %.3f  ratio %.2f  %s%s" % (nm, sc, x, y, w, h, peak, runner, ratio,
              "ok" if ok[nm] else "UNRELIABLE: seeded values kept", "" if window is None else "  (window %d px around %s)" % (window[1], window[0])))
    place("p4_torso", scale)
    # the edit did not keep one scale for every piece (v1: the torso grew to .855 of the sheet, the limbs stayed near .75), so each
    # child gets its own scale scan (half resolution, inside its window), refined at full resolution
    for child in ["p4_upF", "p4_upB", "p4_thighF", "p4_thighB", "p4_pack", "p4_foreF", "p4_foreB", "p4_shinF", "p4_shinB"]:
        coarse = [(register(Fh2, crops[child], sc, 2, (expect(child, sc), WINDOW))[1], sc) for sc in SCALES[::2]]
        b = max(coarse)[1]
        fine = [(register(Fh, crops[child], sc, 1, (expect(child, sc), WINDOW))[1], sc) for sc in np.arange(b - .02, b + .0201, .01)]
        sc = float(max(fine)[1])
        place(child, sc, (expect(child, sc), WINDOW))

    # 3. derive the rig. Shares are preserved by the uniform resize, so a share on the sheet crop is the same share in the atlas sprite.
    hero_pt = lambda nm, share: (reg[nm]["x"] + share[0] * reg[nm]["w"], reg[nm]["y"] + share[1] * reg[nm]["h"])   # share -> hero px
    share_of = lambda nm, p: [round((p[0] - reg[nm]["x"]) / reg[nm]["w"], 3), round((p[1] - reg[nm]["y"]) / reg[nm]["h"], 3)]
    derived, notes = {}, []
    for child, (parent, jn) in PARENT.items():
        if not (ok[child] and ok[parent]):
            notes.append("%s.%s kept seeded (%s unreliable)" % (parent, jn, child if not ok[child] else parent)); continue
        if child.startswith("p4_shin"):
            # the knee's ball is on the thigh (the slicer seeded it as the thigh's knee joint) and the shin only has the socket ring, so the
            # shin turns about the thigh's ball: its pivot becomes the ball centre expressed in the shin's box, the thigh's joint stays the ball
            b = hero_pt(parent, sp[parent]["joints"]["knee"]); old = sp[child]["pivot"]; new = share_of(child, b)
            op = hero_pt(child, old); notes.append("%s.pivot %s -> %s (the thigh's knee ball; the seeded socket ring was %.0f hero px below it)" % (child, old, new, float(np.hypot(op[0] - b[0], op[1] - b[1]))))
            sp[child]["pivot"] = new; derived["%s.pivot" % child] = new; continue
        p = hero_pt(child, sp[child]["pivot"])
        old = sp[parent]["joints"].get(jn)
        new = share_of(parent, p)
        if old:
            op = hero_pt(parent, old); d = float(np.hypot(op[0] - p[0], op[1] - p[1]))
            notes.append("%s.%s %s -> %s (seeded joint was %.0f hero px from the child's cap)" % (parent, jn, old, new, d))
        sp[parent]["joints"][jn] = new
        derived["%s.%s" % (parent, jn)] = new
    # rest angles: arms horizontal, shins vertical (the slicer's convention) from the registered bone directions, which are the hero's
    rig_px = meta["sheetScale"] / (meta["store"] * scale)       # rig px per hero px
    ang = lambda a, b: float(np.arctan2(b[1] - a[1], b[0] - a[0]))
    hero_block = dict(scale=round(scale, 4), rigPxPerHeroPx=round(rig_px, 5), pos={nm: [reg[nm]["x"], reg[nm]["y"], reg[nm]["w"], reg[nm]["h"]] for nm in ORDER},
                      pieceScale={nm: reg[nm]["scale"] for nm in ORDER},
                      ncc={nm: dict(peak=reg[nm]["ncc"], runnerUp=reg[nm]["runnerUp"], ok=reg[nm]["ok"]) for nm in ORDER}, restAim=[0, 0], restBend=[0, 0], legRest={})
    for i, (up, fo, tip) in enumerate([("p4_upF", "p4_foreF", "tip"), ("p4_upB", "p4_foreB", "muzzle")]):
        if not (ok[up] and ok[fo]): continue
        sh, el, tp = hero_pt(up, sp[up]["pivot"]), hero_pt(fo, sp[fo]["pivot"]), hero_pt(fo, sp[fo]["joints"][tip])
        a_up, a_fo = ang(sh, el), ang(el, tp)
        sp[up]["rot"] = round(-a_up, 3); sp[fo]["rot"] = round(-a_fo, 3)
        hero_block["restAim"][i] = round(a_fo, 3)            # the forearm's direction in the hero (rig aim at rest)
        hero_block["restBend"][i] = round(a_up - a_fo, 3)    # arm2: upper arm = aim + bend, forearm = aim
        notes.append("%s bone %.1f deg, %s bone %.1f deg below horizontal: restAim %.3f restBend %.3f" % (up, np.degrees(a_up), fo, np.degrees(a_fo), a_fo, a_up - a_fo))
    # the pieces' own scales, relative to the torso, become the rig's scale constants: one scale per arm (arm2 scales upper arm and forearm
    # together), legLen for the front leg, legScaleB for the back leg relative to it, packScale for the pack
    rel = lambda *nms: float(np.mean([reg[n]["scale"] for n in nms]) / reg["p4_torso"]["scale"])
    # legLen = the front thigh's scale; every other leg piece gets its own multiplier on top (the sheet drew the four pieces at four sizes)
    legLen = rel("p4_thighF")
    legk = {"hipF": legLen, "hipB": legLen}
    hero_block["consts"] = dict(armScale=[round(rel("p4_upF", "p4_foreF"), 3), round(rel("p4_upB", "p4_foreB"), 3)], legLen=round(legLen, 3),
                                legScales={n: round(rel(n) / legLen, 3) for n in ["p4_shinF", "p4_thighB", "p4_shinB"]}, packScale=round(rel("p4_pack"), 3), packDx=0)
    notes.append("piece scale / torso scale: " + " ".join("%s %.3f" % (n, reg[n]["scale"] / reg["p4_torso"]["scale"]) for n in ORDER if n != "p4_torso"))
    notes.append("rig constants from that: %s" % json.dumps(hero_block["consts"]))
    for side, th, sn in [("hipF", "p4_thighF", "p4_shinF"), ("hipB", "p4_thighB", "p4_shinB")]:
        if not (ok[th] and ok[sn] and ok["p4_torso"]): continue
        c, m = crops[sn]; ys, xs = np.nonzero(m); h = c.shape[0]
        rows = ys >= h - h * .12
        sole_sheet = (xs[rows].mean(), ys[rows].mean()); pv = sp[sn]["pivot"]
        sole = (reg[sn]["x"] + sole_sheet[0] * scale, reg[sn]["y"] + sole_sheet[1] * scale)
        kp = hero_pt(sn, pv)
        sp[sn]["rot"] = round(float(np.pi / 2 - ang(kp, sole)), 3)
        # legLens: l2 = shin height below the pivot * .94 along the bone; the foot target is that far down the shin bone
        l2 = reg[sn]["h"] * (1 - pv[1]) * .94
        u = np.array(sole) - np.array(kp); u = u / np.linalg.norm(u)
        foot = np.array(kp) + u * l2
        hip = np.array(hero_pt("p4_torso", sp["p4_torso"]["joints"][side]))
        knee = np.array(hero_pt(th, sp[th]["joints"]["knee"]))
        l1 = float(np.linalg.norm(knee - hip))
        # foot offset from the hip in torso rig px per unit legLen (the lab multiplies by R.legLen, so kr0's legLen scales the stance too)
        kleg = legk[side]
        hero_block["legRest"][side] = [round(float((foot[0] - hip[0]) * rig_px / kleg), 2), round(float((foot[1] - hip[1]) * rig_px / kleg), 2)]
        # which way the knee bends in the hero (left of the hip->foot line = the way the game's IK bends it)
        cross = float((foot[0] - hip[0]) * (knee[1] - hip[1]) - (foot[1] - hip[1]) * (knee[0] - hip[0]))
        # the game's IK bends the knee forward (right of the hip->foot line); kneeRest says which side the hero drew it on (-1 = behind)
        hero_block.setdefault("kneeRest", {})[side] = 1 if cross < 0 else -1
        notes.append("%s: hip->knee %.0f, knee->foot %.0f hero px, hip->foot %.0f (reach %.0f), knee %s of the hip-foot line by %.1f px, foot offset %s rig px" % (
            side, l1, l2, float(np.linalg.norm(foot - hip)), l1 + l2, "right" if cross < 0 else "left", abs(cross) / max(1, np.linalg.norm(foot - hip)), hero_block["legRest"][side]))
    hero_block["notes"] = notes
    meta["hero"] = hero_block
    open(jsp, "w").write("window.TIMO_RIG4=" + json.dumps(meta) + ";\n")
    for n in notes: print("  " + n)
    print("wrote", jsp)

    # 4. the check image, two panels: left = pieces at their registered positions over a 25% hero frame with the derived marks;
    #    right = the same pieces at 50% over the full hero frame, so a misregistered piece shows as doubled lines
    def panel(hero_alpha, piece_alpha, marks):
        base = Image.fromarray(hero.copy()); base.putalpha(Image.fromarray((hero[:, :, 3] * hero_alpha).astype(np.uint8)))
        bg = Image.new("RGBA", base.size, (255, 255, 255, 255)); bg.alpha_composite(base)
        for nm in ORDER:
            c, _ = crops[nm]; r = reg[nm]
            im = Image.fromarray(c).resize((r["w"], r["h"]), Image.LANCZOS)
            a = piece_alpha if ok[nm] else piece_alpha / 3
            if a < 1: im.putalpha(im.getchannel("A").point(lambda v: int(v * a)))
            layer = Image.new("RGBA", bg.size, (0, 0, 0, 0)); layer.paste(im, (r["x"], r["y"]), im); bg.alpha_composite(layer)
        dr = ImageDraw.Draw(bg)
        if marks:
            for nm in ORDER:
                r = reg[nm]; dr.rectangle([r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]], outline=(0, 0, 0, 70))
                px, py = hero_pt(nm, sp[nm]["pivot"]); dr.ellipse([px - 6, py - 6, px + 6, py + 6], outline=(220, 30, 30, 255), width=3)
                for j, sh in sp[nm]["joints"].items():
                    jx, jy = hero_pt(nm, sh); dr.ellipse([jx - 5, jy - 5, jx + 5, jy + 5], outline=(30, 90, 230, 255), width=2); dr.text((jx + 7, jy - 5), j, fill=(20, 20, 20, 255))
                dr.text((r["x"] + 3, r["y"] + 3), "%s x%.2f ncc %.2f%s" % (nm, r["scale"], r["ncc"], "" if ok[nm] else " ?"), fill=(0, 0, 0, 255))
        return bg
    left, right = panel(.25, 1.0, True), panel(1.0, .5, False)
    out = Image.new("RGBA", (left.width * 2 + 8, left.height), (255, 255, 255, 255)); out.paste(left, (0, 0)); out.paste(right, (left.width + 8, 0))
    dr = ImageDraw.Draw(out)
    dr.text((8, 8), "reassembled-%s: pieces at their registered positions and scales over a 25%% hero frame; red = pivot, blue = derived joint" % ver, fill=(0, 0, 0, 255))
    dr.text((left.width + 16, 8), "same pieces at 50%% over the full hero frame (doubled lines = misregistered); torso scale %.3f" % scale, fill=(0, 0, 0, 255))
    out.convert("RGB").save(os.path.join(TIMO, "parts", "reassembled-%s.png" % ver))
    print("wrote parts/reassembled-%s.png" % ver)

if __name__ == "__main__":
    main()
