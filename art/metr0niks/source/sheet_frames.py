#!/usr/bin/env python3
"""Cut a sprite sheet into frames, key a white background, line the feet up
and measure each frame, so drift and height changes show as numbers.

    python3 sheet_frames.py sheet.png outdir --cols 4 --rows 2 [--key-white]

Writes frame-01.png ... (transparent, all the same canvas, feet on one point),
strip.png, loop.gif and metrics.json. Frames are lined up on the body's
centre (top 40% of the character) and the lowest pixel (the ground). Drift is
how far those move inside the sheet's cells; height is top to ground.
"""
import argparse
import json
import os

from PIL import Image


def key_white(im, lo=232):
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= lo and max(r, g, b) - m < 18:
                px[x, y] = (r, g, b, 0)
    return im


def alpha_box(im, thr=40):
    a = im.split()[3].point(lambda v: 255 if v > thr else 0)
    return a, a.getbbox()


def anchor_point(mask, box):
    """x: centre of the body (top 40% of the character), so swapping feet
    doesn't make the body jump sideways; y: the lowest pixel (the ground)."""
    x0, y0, x1, y1 = box
    band = int((y1 - y0) * 0.4)
    xs = [x for y in range(y0, y0 + band, 2) for x in range(x0, x1, 2) if mask.getpixel((x, y))]
    return (sum(xs) / len(xs), y1) if xs else ((x0 + x1) / 2, y1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("out")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--rows", type=int, default=2)
    ap.add_argument("--key-white", action="store_true")
    ap.add_argument("--key-lo", type=int, default=232, help="lightest channel at or above this is keyed")
    ap.add_argument("--inset", type=int, default=0, help="pixels cut from each cell edge (grid lines)")
    ap.add_argument("--fps", type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    sheet = Image.open(a.sheet)
    sheet = key_white(sheet, a.key_lo) if a.key_white else sheet.convert("RGBA")
    cw, ch = sheet.width // a.cols, sheet.height // a.rows
    cells, rows = [], []
    for i in range(a.cols * a.rows):
        cx, cy = (i % a.cols) * cw, (i // a.cols) * ch
        n = a.inset
        cell = sheet.crop((cx + n, cy + n, cx + cw - n, cy + ch - n))
        mask, box = alpha_box(cell)
        fx, fy = anchor_point(mask, box)
        cells.append((cell, box, fx, fy))
        rows.append({"frame": i + 1, "box_in_cell": box, "height": box[3] - box[1],
                     "width": box[2] - box[0], "anchor_in_cell": [round(fx, 1), fy]})
    # line every frame up on frame 1's foot point, on one shared canvas
    pad = 16
    left = max(c[2] - c[1][0] for c in cells) + pad
    right = max(c[1][2] - c[2] for c in cells) + pad
    up = max(c[3] - c[1][1] for c in cells) + pad
    W, H = int(left + right), int(up + pad)
    frames = []
    for (cell, box, fx, fy), r in zip(cells, rows):
        f = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        f.alpha_composite(cell.crop(box), (int(round(left - (fx - box[0]))), int(up - (fy - box[1]))))
        f.save(os.path.join(a.out, f"frame-{r['frame']:02d}.png"))
        frames.append(f)
    strip = Image.new("RGBA", (W * len(frames), H), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * W, 0))
    strip.save(os.path.join(a.out, "strip.png"))
    bg = [Image.alpha_composite(Image.new("RGBA", (W, H), (236, 230, 214, 255)), f).convert("P", palette=Image.ADAPTIVE) for f in frames]
    bg[0].save(os.path.join(a.out, "loop.gif"), save_all=True, append_images=bg[1:], duration=1000 // a.fps, loop=0, disposal=2)
    hs = [r["height"] for r in rows]
    fxs = [r["anchor_in_cell"][0] for r in rows]
    fys = [r["anchor_in_cell"][1] for r in rows]
    summary = {
        "frames": len(rows), "canvas": [W, H],
        "height_min": min(hs), "height_max": max(hs), "height_spread_pct": round(100 * (max(hs) - min(hs)) / max(hs), 1),
        "body_x_drift_px": round(max(fxs) - min(fxs), 1), "ground_y_drift_px": max(fys) - min(fys),
        "rows": rows,
    }
    json.dump(summary, open(os.path.join(a.out, "metrics.json"), "w"), indent=1)
    print(json.dumps({k: v for k, v in summary.items() if k != "rows"}))


if __name__ == "__main__":
    main()
