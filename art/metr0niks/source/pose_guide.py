#!/usr/bin/env python3
"""Draw a pose guide sheet for a frame-by-frame sprite run.

The guide is a reference image for the image model: one cell per frame, a
fixed ground footprint, a height line, and a blue stick rig showing the leg,
body and arm pose of that frame. The model draws the character over it, so
timing, height and foot placement come from here instead of from the prompt.

    python3 pose_guide.py run-iso guide.png

Poses are in ground units: s = distance along the facing direction,
h = lift above the ground. The camera is the Metr0niks game view: high
three-quarter, the mech facing the lower right.
"""
import math
import sys

from PIL import Image, ImageDraw

W, H = 1536, 1024
COLS, ROWS = 4, 2
CW, CH = W // COLS, H // ROWS
FWD = (0.80, 0.42)           # facing direction on screen (lower right)
THIGH = SHIN = 72
HIP_Y = 292                  # hip height in the cell at rest
GROUND_Y = 420               # ground point under the hips
TOP_Y = 92                   # height line: top of the reactor pack at rest
NEAR, FAR = (40, 110, 230), (140, 185, 240)   # near (right) leg and arm darker
GUIDE = (150, 200, 245)

L = 70  # half stride
# (near foot s, h), (far foot s, h), body bob (+ is down)
RUN = [
    ((+L, 0), (-L, 12), 0),         # 1 near contact
    ((+0.4 * L, 0), (-0.6 * L, 38), 10),   # 2 near down
    ((0, 0), (0.1 * L, 58), 0),     # 3 near passing, far knee up
    ((-0.5 * L, 6), (+0.6 * L, 42), -12),  # 4 near push-off, body up
    ((-L, 12), (+L, 0), 0),         # 5 far contact
    ((-0.6 * L, 38), (+0.4 * L, 0), 10),   # 6 far down
    ((0.1 * L, 58), (0, 0), 0),     # 7 far passing, near knee up
    ((+0.6 * L, 42), (-0.5 * L, 6), -12),  # 8 far push-off, body up
]
SETS = {"run-iso": RUN}


def ground(cx, s, h, side):
    # side offset: near leg sits a little toward the camera (down-left of the far leg)
    off = (-14, 10) if side == "near" else (14, -10)
    return (cx + s * FWD[0] + off[0], GROUND_Y + s * FWD[1] + off[1] - h)


def knee(hip, foot):
    dx, dy = foot[0] - hip[0], foot[1] - hip[1]
    d = min(math.hypot(dx, dy), THIGH + SHIN - 1)
    mx, my = hip[0] + dx / 2, hip[1] + dy / 2
    k = math.sqrt(max(THIGH ** 2 - (d / 2) ** 2, 0))
    px, py = -dy / (d or 1), dx / (d or 1)
    # bend the knee toward the facing direction
    if px * FWD[0] + py * FWD[1] < 0:
        px, py = -px, -py
    return (mx + px * k, my + py * k)


def draw_cell(d, ox, oy, pose):
    near, far, bob = pose
    cx = ox + CW // 2 - 10
    o = lambda p: (p[0], p[1] + oy)
    # ground footprint and height line
    d.ellipse([cx - 120, oy + GROUND_Y - 34, cx + 120, oy + GROUND_Y + 50], outline=GUIDE, width=2)
    for x in range(ox + 20, ox + CW - 20, 16):
        d.line([(x, oy + TOP_Y), (x + 8, oy + TOP_Y)], fill=GUIDE, width=2)
    hip = (cx, HIP_Y + bob)
    # far leg, far arm and pack first so near parts draw on top
    for side, (s, h), col in (("far", far, FAR), ("near", near, NEAR)):
        hp = (hip[0] + (12 if side == "far" else -12), hip[1] + (-6 if side == "far" else 6))
        ft = ground(cx, s, h, side)
        kn = knee(hp, ft)
        d.line([o(hp), o(kn), o(ft)], fill=col, width=10, joint="curve")
        d.ellipse([o(kn)[0] - 9, o(kn)[1] - 9, o(kn)[0] + 9, o(kn)[1] + 9], fill=col)
        d.ellipse([o(ft)[0] - 16, o(ft)[1] - 7, o(ft)[0] + 22, o(ft)[1] + 9], fill=col)
    body = (hip[0] + 4, hip[1] - 100)
    # reactor pack behind the upper left: a block with two cylinders rising to the height line
    d.rounded_rectangle([body[0] - 96, oy + body[1] - 70, body[0] - 10, oy + body[1] + 30], 18, outline=FAR, width=4)
    for cx2 in (body[0] - 84, body[0] - 46):
        d.rounded_rectangle([cx2, oy + TOP_Y + bob, cx2 + 30, oy + body[1] - 40], 14, outline=FAR, width=4)
    d.rounded_rectangle([hip[0] - 34, oy + hip[1] - 26, hip[0] + 38, oy + hip[1] + 12], 12, outline=NEAR, width=4)
    d.ellipse([body[0] - 80, oy + body[1] - 80, body[0] + 80, oy + body[1] + 80], outline=NEAR, width=5)
    # arms point forward (lower right), level, both guns aimed
    for side, col, sh in (("far", FAR, (body[0] + 52, body[1] - 40)), ("near", NEAR, (body[0] - 62, body[1] + 4))):
        tip = (sh[0] + 120 * FWD[0], sh[1] + 120 * FWD[1])
        d.line([o(sh), o(tip)], fill=col, width=16)
    # lens: a ring on the front of the torso, facing the lower right
    lx, ly = body[0] + 38, body[1] + 6
    d.ellipse([lx - 14, oy + ly - 14, lx + 14, oy + ly + 14], outline=NEAR, width=4)


def main():
    name, out = sys.argv[1], sys.argv[2]
    poses = SETS[name]
    im = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(im)
    for i, pose in enumerate(poses):
        ox, oy = (i % COLS) * CW, (i // COLS) * CH
        draw_cell(d, ox, oy, pose)
    for c in range(1, COLS):
        d.line([(c * CW, 0), (c * CW, H)], fill=GUIDE, width=2)
    for r in range(1, ROWS):
        d.line([(0, r * CH), (W, r * CH)], fill=GUIDE, width=2)
    im.save(out)


if __name__ == "__main__":
    main()
