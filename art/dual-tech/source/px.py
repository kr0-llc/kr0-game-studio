"""Pixel sprite kit for the Dual Tech art board (pitch and prototype styles)."""
from PIL import Image, ImageDraw, ImageFont
import math, random

C = dict(
    K="#0a0e2a", B="#5aa2ff", b="#2f6fd0", lb="#91bcf3", S="#f1c9a0", s="#c9d6e6", g="#8a98b0", gd="#6a6b82",
    Y="#ffcf4a", R="#ff6b6b", r="#c23d4a", H="#2b2140", G="#4fe0a0", d="#22a374", P="#a274f0", p="#6d44b8",
    O="#ff8a3d", W="#f4f2ff", L="#dcd8ff", n="#3d4f7a", moon="#fff4cf",
    sky0="#10153a", sky1="#141a45", sky2="#181d4a", sky3="#1b2259", sky4="#212a66", sky5="#262f72",
    ground="#2c3a5e", brick="#22304f", edge="#3d4f7a",
    rust="#c86a3a", rat="#8a7a86", ratd="#5d5068", pink="#e59aa0",
    bronze="#c98a2e", bronzel="#f0b85a", bronzed="#7a4e1e", monk="#4b4c7a", monkd="#33345a",
    teal="#3a7c78", teald="#1d4f62", teall="#8fd0c8",
)
FONT = "/tmp/claude-0/dt/fonts/pixelify.ttf"
MONO = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf"


def font(sz, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, sz)


class Sprite:
    def __init__(s, w, h):
        s.w, s.h = w, h
        s.px = {}

    def rect(s, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                if 0 <= xx < s.w and 0 <= yy < s.h:
                    s.px[(xx, yy)] = C.get(c, c)
        return s

    def dot(s, x, y, c):
        return s.rect(x, y, 1, 1, c)

    def disc(s, cx, cy, r, c):
        for yy in range(s.h):
            for xx in range(s.w):
                if (xx + .5 - cx) ** 2 + (yy + .5 - cy) ** 2 <= r * r:
                    s.px[(xx, yy)] = C.get(c, c)
        return s

    def erase(s, x, y, w=1, h=1):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                s.px.pop((xx, yy), None)
        return s

    def outline(s, c="K"):
        add = {}
        for (x, y) in list(s.px):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                q = (x + dx, y + dy)
                if q not in s.px:
                    add[q] = C.get(c, c)
        # grow canvas by 1 on each side
        n = Sprite(s.w + 2, s.h + 2)
        for (x, y), v in s.px.items():
            n.px[(x + 1, y + 1)] = v
        for (x, y), v in add.items():
            n.px[(x + 1, y + 1)] = v
        return n

    def flip(s):
        n = Sprite(s.w, s.h)
        for (x, y), v in s.px.items():
            n.px[(s.w - 1 - x, y)] = v
        return n

    def img(s, k=1):
        im = Image.new("RGBA", (s.w, s.h), (0, 0, 0, 0))
        for (x, y), v in s.px.items():
            im.putpixel((x, y), Image.new("RGB", (1, 1), v).getpixel((0, 0)) + (255,))
        return im.resize((s.w * k, s.h * k), Image.NEAREST) if k != 1 else im


# ---------- heroes ----------
def brick():
    s = Sprite(24, 29)
    s.rect(6, 0, 9, 1, "B").rect(5, 1, 11, 5, "B").rect(6, 1, 2, 1, "lb").rect(5, 4, 1, 2, "b")
    s.rect(6, 6, 9, 5, "S").rect(5, 6, 11, 2, "K").rect(5, 8, 1, 2, "B")
    s.rect(4, 11, 12, 8, "B").rect(4, 15, 12, 1, "b").rect(4, 11, 2, 7, "b")
    s.rect(2, 12, 2, 5, "B").rect(2, 17, 2, 1, "S")
    s.rect(5, 19, 4, 6, "B").rect(11, 19, 4, 6, "B").rect(5, 22, 4, 1, "b").rect(11, 22, 4, 1, "b")
    s.rect(4, 25, 6, 3, "K").rect(5, 26, 3, 1, "g").rect(10, 25, 6, 3, "K").rect(11, 26, 3, 1, "g")
    s.rect(16, 7, 6, 14, "s").rect(16, 18, 6, 3, "g").rect(21, 8, 1, 10, "g")
    s.rect(18, 10, 2, 6, "Y").rect(17, 12, 4, 2, "Y")
    return s.outline()


def vex():
    s = Sprite(30, 29)
    s.rect(6, 0, 9, 2, "H").rect(5, 2, 11, 2, "H").rect(15, 2, 2, 1, "H")
    s.rect(6, 4, 10, 6, "S").rect(5, 4, 3, 3, "H").rect(12, 6, 2, 2, "K").rect(6, 9, 10, 1, "S")
    s.rect(6, 10, 10, 9, "R").rect(6, 11, 2, 6, "r").rect(9, 10, 4, 1, "W")
    s.rect(15, 12, 3, 3, "S").rect(17, 11, 10, 3, "g").rect(17, 11, 10, 1, "gd").rect(27, 11, 2, 2, "Y").rect(19, 14, 2, 2, "gd")
    s.rect(7, 19, 3, 6, "R").rect(12, 19, 3, 6, "R").rect(7, 22, 3, 3, "r").rect(12, 22, 3, 3, "r")
    s.rect(6, 25, 5, 3, "K").rect(7, 26, 3, 1, "g").rect(11, 25, 5, 3, "K").rect(12, 26, 3, 1, "g")
    return s.outline()


def lumen():
    s = Sprite(22, 23)
    s.rect(7, 0, 8, 1, "G").rect(5, 1, 12, 4, "G").rect(5, 4, 12, 1, "d")
    s.rect(7, 5, 8, 4, "S").rect(5, 5, 2, 5, "G").rect(15, 5, 2, 5, "G").rect(11, 6, 2, 2, "K")
    s.rect(4, 9, 14, 4, "G").rect(3, 13, 16, 4, "G").rect(2, 17, 18, 5, "G")
    s.rect(6, 11, 1, 10, "d").rect(15, 11, 1, 10, "d").rect(2, 21, 18, 1, "d").rect(10, 13, 2, 4, "Y")
    return s.outline()


def orb(glow=True):
    s = Sprite(11, 11)
    if glow:
        s.disc(5.5, 5.5, 5.5, "gd")
    s.disc(5.5, 5.5, 3.6, "Y").rect(4, 3, 2, 1, "moon")
    return s if glow else s.outline()


# ---------- enemies ----------
def rat():
    s = Sprite(22, 11)
    s.rect(4, 3, 11, 6, "rat").rect(3, 4, 1, 4, "rat").rect(15, 4, 3, 4, "rat").rect(18, 5, 2, 3, "rat").rect(20, 6, 1, 1, "pink")
    s.rect(14, 1, 3, 3, "ratd").rect(15, 2, 1, 1, "pink").rect(17, 5, 1, 1, "R")
    s.rect(6, 3, 4, 2, "rust").rect(10, 5, 3, 2, "rust").rect(4, 7, 11, 2, "ratd")
    s.rect(5, 9, 2, 2, "ratd").rect(12, 9, 2, 2, "ratd")
    s.rect(0, 6, 3, 1, "pink").rect(0, 5, 1, 1, "pink")
    return s.outline()


def warden():
    s = Sprite(30, 38)
    s.rect(9, 0, 8, 2, "monk").rect(7, 2, 12, 9, "monk").rect(9, 4, 8, 7, "K").rect(10, 6, 2, 1, "Y").rect(14, 6, 2, 1, "Y")
    s.rect(5, 11, 16, 6, "monk").rect(4, 17, 18, 10, "monk").rect(3, 27, 20, 9, "monk").rect(5, 13, 1, 22, "monkd").rect(20, 13, 1, 22, "monkd")
    s.rect(3, 35, 20, 1, "monkd")
    # chain and bell
    s.rect(20, 12, 4, 2, "monkd").rect(23, 13, 1, 5, "g")
    s.rect(20, 18, 8, 2, "bronze").rect(19, 20, 10, 6, "bronze").rect(17, 26, 14, 4, "bronze").rect(16, 29, 16, 2, "bronzed")
    s.rect(21, 20, 1, 8, "bronzel").rect(22, 31, 4, 2, "bronzed")
    return s.outline()


def beetle():
    s = Sprite(36, 20)
    s.rect(8, 2, 18, 2, "teal").rect(5, 4, 24, 4, "teal").rect(3, 8, 28, 6, "teal").rect(3, 13, 28, 1, "teald")
    for x in (10, 17, 24):
        s.rect(x, 3, 1, 11, "teald")
    s.rect(8, 4, 2, 1, "teall").rect(14, 4, 3, 1, "teall").rect(5, 8, 3, 1, "teall")
    s.rect(29, 7, 5, 6, "teald").rect(32, 8, 1, 1, "Y").rect(34, 5, 2, 3, "g").rect(33, 4, 2, 1, "g")
    for x in (6, 12, 19, 25):
        s.rect(x, 14, 2, 3, "K").rect(x - 1, 17, 2, 1, "K")
    return s.outline()


def drone():
    s = Sprite(16, 11)
    s.rect(4, 0, 8, 1, "s").rect(2, 1, 12, 6, "s").rect(2, 6, 12, 1, "g").rect(6, 3, 4, 2, "R").rect(7, 3, 1, 1, "W")
    s.rect(1, 3, 1, 3, "g").rect(14, 3, 1, 3, "g").rect(4, 7, 2, 2, "gd").rect(10, 7, 2, 2, "gd")
    return s.outline()


def golem(hot=False):
    s = Sprite(44, 46)
    body = "P"
    s.rect(12, 0, 20, 10, "p").rect(15, 3, 4, 2, "R" if hot else "Y").rect(25, 3, 4, 2, "R" if hot else "Y").rect(17, 6, 10, 2, "K")
    s.rect(9, 10, 26, 26, body).rect(9, 10, 26, 2, "p")
    s.rect(1, 12, 8, 18, "p").rect(35, 12, 8, 18, "p").rect(1, 28, 8, 3, "g").rect(35, 28, 8, 3, "g")
    s.rect(15, 18, 14, 6, "O" if hot else "g").rect(17, 20, 10, 2, "Y" if not hot else "moon")
    s.rect(12, 36, 8, 6, body).rect(24, 36, 8, 6, body).rect(11, 42, 10, 3, "g").rect(23, 42, 10, 3, "g")
    if hot:
        for (x, y) in ((12, 14), (30, 15), (20, 26), (27, 30), (14, 31), (32, 24)):
            s.rect(x, y, 2, 1, "O")
    return s.outline()


# ---------- scenery ----------
def night(cv, w, h, moon=True, mountains=True, ground_y=None, seed=3):
    rnd = random.Random(seed)
    d = ImageDraw.Draw(cv)
    bands = ["sky0", "sky1", "sky2", "sky3", "sky4", "sky5"]
    gy = ground_y or int(h * .74)
    for i, b in enumerate(bands):
        d.rectangle([0, int(gy * i / 6), w, int(gy * (i + 1) / 6)], fill=C[b])
    for _ in range(int(w * h / 260)):
        x, y = rnd.randrange(w), rnd.randrange(gy - 8)
        d.point((x, y), fill=rnd.choice([C["g"], C["L"], C["Y"], C["n"], C["s"]]))
    if moon:
        mx, my, r = int(w * .82), int(h * .14), max(6, h // 14)
        ox, oy = mx + r // 2, my - r // 5
        for yy in range(my - r, my + r + 1):
            for xx in range(mx - r, mx + r + 1):
                if (xx - mx) ** 2 + (yy - my) ** 2 <= r * r and (xx - ox) ** 2 + (yy - oy) ** 2 > r * r:
                    d.point((xx, yy), fill=C["moon"])
    if mountains:
        for col, base, amp, step in (("sky3", gy - h * .2, h * .18, 9), ("sky1", gy - h * .08, h * .12, 6)):
            pts = [(0, gy)]
            x = 0
            while x <= w:
                pts.append((x, base - rnd.random() * amp))
                x += rnd.randint(int(w / step * .6), int(w / step * 1.4))
            pts += [(w, base), (w, gy)]
            d.polygon(pts, fill=C[col])
    d.rectangle([0, gy, w, h], fill=C["ground"])
    d.line([0, gy, w, gy], fill=C["edge"])
    for _ in range(int(w / 6)):
        x, y = rnd.randrange(w), rnd.randrange(gy + 3, h)
        d.rectangle([x, y, x + rnd.randint(3, 8), y], fill=C["brick"])
    return gy


def shadow(cv, cx, y, w):
    d = ImageDraw.Draw(cv)
    d.rectangle([cx - w // 2, y - 1, cx + w // 2, y + 1], fill=C["brick"])


def put(cv, spr, x, y, k=1):
    im = spr.img(k)
    cv.alpha_composite(im, (int(x), int(y)))
    return im.size


def put_feet(cv, spr, cx, gy, k=1, sh=True):
    w, h = spr.w * k, spr.h * k
    if sh:
        shadow(cv, cx, gy, int(w * .8))
    put(cv, spr, cx - w // 2, gy - h, k)


def up(cv, k):
    return cv.resize((cv.width * k, cv.height * k), Image.NEAREST)


def text(im, xy, t, sz, fill, anchor="la", mono=False, shadow=None, spacing=0):
    d = ImageDraw.Draw(im)
    f = font(sz, mono)
    if shadow:
        d.text((xy[0] + sz // 10 + 1, xy[1] + sz // 10 + 1), t, font=f, fill=shadow, anchor=anchor)
    d.text(xy, t, font=f, fill=fill, anchor=anchor)


def window(im, box, fill="#2f6fd0", border="#dcd8ff", bw=6):
    d = ImageDraw.Draw(im)
    d.rectangle(box, fill=border)
    x0, y0, x1, y1 = box
    d.rectangle([x0 + bw, y0 + bw, x1 - bw, y1 - bw], fill=fill)


def mini(body, head="S", hat=None, extra=None):
    """Tiny 5x8 party figure for map views."""
    s = Sprite(7, 9)
    s.rect(2, 0, 3, 2, hat or body).rect(2, 2, 3, 2, head).rect(1, 4, 5, 3, body).rect(2, 7, 1, 2, "K").rect(4, 7, 1, 2, "K")
    if extra:
        extra(s)
    return s.outline()
