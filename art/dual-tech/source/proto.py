import sys, random, math
sys.path.insert(0, "/tmp/claude-0/dt")
from px import C, font, text
from PIL import Image, ImageDraw

OUT = "/mnt/project-files/art/dual-tech/prototype/"
W, H = 1600, 900
SH = "#141a45"


def canvas(gy=640, stars=True, seed=1):
    im = Image.new("RGBA", (W, H), C["sky0"])
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, int(gy * .32)], fill="#262f6e")
    d.rectangle([0, int(gy * .32), W, gy], fill=C["sky3"])
    d.rectangle([0, gy, W, H], fill=C["ground"])
    rnd = random.Random(seed)
    if stars:
        for _ in range(14):
            x, y = rnd.randrange(W), rnd.randrange(int(gy * .9))
            d.rectangle([x, y, x + 5, y + 5], fill="#b08a3a")
    for _ in range(6):
        x, y = rnd.randrange(W), rnd.randrange(gy + 40, H - 20)
        d.rectangle([x, y, x + 50, y + 14], fill=C["brick"])
    return im, d


def R(d, x, y, w, h, c):
    d.rectangle([x, y, x + w, y + h], fill=C.get(c, c))


# Each figure is drawn with feet at (cx, gy) and a size factor f (1 = prototype size)
def brick(d, cx, gy, f=1):
    R(d, cx - 40 * f, gy - 4 * f, 70 * f, 12 * f, SH)
    R(d, cx - 24 * f, gy - 62 * f, 46 * f, 56 * f, "B")
    R(d, cx - 14 * f, gy - 86 * f, 28 * f, 26 * f, "S")
    R(d, cx - 14 * f, gy - 90 * f, 28 * f, 8 * f, "K")
    R(d, cx + 22 * f, gy - 70 * f, 20 * f, 62 * f, "s")


def vex(d, cx, gy, f=1):
    R(d, cx - 28 * f, gy - 4 * f, 56 * f, 12 * f, SH)
    R(d, cx - 16 * f, gy - 52 * f, 30 * f, 48 * f, "R")
    R(d, cx - 18 * f, gy - 76 * f, 26 * f, 24 * f, "S")
    R(d, cx - 18 * f, gy - 86 * f, 34 * f, 10 * f, "K")
    R(d, cx + 14 * f, gy - 44 * f, 44 * f, 8 * f, "K")
    R(d, cx + 58 * f, gy - 48 * f, 12 * f, 12 * f, "Y")


def lumen(d, cx, gy, f=1, orb=True):
    R(d, cx - 26 * f, gy - 4 * f, 52 * f, 10 * f, SH)
    R(d, cx - 14 * f, gy - 34 * f, 28 * f, 32 * f, "G")
    R(d, cx - 12 * f, gy - 56 * f, 24 * f, 22 * f, "S")
    if orb:
        d.ellipse([cx + 20 * f, gy - 64 * f, cx + 40 * f, gy - 44 * f], fill=C["Y"])


def golem(d, cx, gy, f=1, hot=False):
    R(d, cx - 90 * f, gy - 8 * f, 175 * f, 16 * f, SH)
    R(d, cx - 58 * f, gy - 126 * f, 114 * f, 126 * f, "P")
    R(d, cx - 90 * f, gy - 110 * f, 34 * f, 82 * f, "p")
    R(d, cx + 54 * f, gy - 110 * f, 34 * f, 82 * f, "p")
    R(d, cx - 40 * f, gy - 166 * f, 80 * f, 46 * f, "p")
    R(d, cx - 26 * f, gy - 150 * f, 16 * f, 12 * f, "R" if hot else "Y")
    R(d, cx + 8 * f, gy - 150 * f, 16 * f, 12 * f, "R" if hot else "Y")
    R(d, cx - 32 * f, gy - 90 * f, 64 * f, 20 * f, "O" if hot else "p")
    if hot:
        R(d, cx - 22 * f, gy - 84 * f, 44 * f, 8 * f, "Y")
        rnd = random.Random(int(cx))
        for _ in range(16):
            x, y = cx + rnd.randint(-110, 110) * f, gy - rnd.randint(20, 200) * f
            R(d, x, y, 6 * f, 6 * f, rnd.choice(["O", "Y"]))


def rat(d, cx, gy, f=1, flip=False):
    s = -1 if flip else 1
    R(d, cx - 30 * f, gy - 4 * f, 60 * f, 8 * f, SH)
    R(d, cx - 24 * f, gy - 26 * f, 40 * f, 22 * f, "rat")
    x0 = cx + 16 * f if s > 0 else cx - 40 * f
    R(d, x0, gy - 22 * f, 22 * f, 16 * f, "ratd")
    R(d, x0 + (14 if s > 0 else 2) * f, gy - 18 * f, 5 * f, 5 * f, "R")
    R(d, cx - 18 * f, gy - 24 * f, 12 * f, 8 * f, "rust")
    tx = cx - 44 * f if s > 0 else cx + 16 * f
    R(d, tx, gy - 12 * f, 20 * f, 4 * f, "pink")


def warden(d, cx, gy, f=1):
    R(d, cx - 50 * f, gy - 4 * f, 100 * f, 12 * f, SH)
    R(d, cx - 36 * f, gy - 120 * f, 60 * f, 116 * f, "monk")
    R(d, cx - 26 * f, gy - 150 * f, 40 * f, 36 * f, "monk")
    R(d, cx - 18 * f, gy - 140 * f, 24 * f, 18 * f, "K")
    R(d, cx - 14 * f, gy - 134 * f, 5 * f, 4 * f, "Y"); R(d, cx - 1 * f, gy - 134 * f, 5 * f, 4 * f, "Y")
    R(d, cx - 74 * f, gy - 96 * f, 46 * f, 50 * f, "bronze")
    R(d, cx - 82 * f, gy - 50 * f, 62 * f, 10 * f, "bronzed")


def beetle(d, cx, gy, f=1):
    R(d, cx - 80 * f, gy - 4 * f, 160 * f, 12 * f, SH)
    R(d, cx - 60 * f, gy - 64 * f, 120 * f, 50 * f, "teal")
    for x in (-24, 12):
        R(d, cx + x * f, gy - 64 * f, 6 * f, 50 * f, "teald")
    R(d, cx - 88 * f, gy - 48 * f, 30 * f, 30 * f, "teald")
    R(d, cx - 80 * f, gy - 40 * f, 6 * f, 6 * f, "Y")
    R(d, cx - 98 * f, gy - 56 * f, 14 * f, 8 * f, "g")
    for x in (-50, -14, 22, 50):
        R(d, cx + x * f, gy - 14 * f, 8 * f, 12 * f, "K")


def drone(d, cx, cy, f=1):
    R(d, cx - 28 * f, cy - 14 * f, 56 * f, 26 * f, "s")
    R(d, cx - 28 * f, cy + 8 * f, 56 * f, 6 * f, "g")
    R(d, cx - 8 * f, cy - 6 * f, 16 * f, 8 * f, "R")


def win(im, box, title=None):
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = box
    g = Image.new("RGBA", (x1 - x0, y1 - y0))
    gd = ImageDraw.Draw(g)
    for y in range(y1 - y0):
        t = y / max(1, y1 - y0)
        c = tuple(int(a + (b - a) * t) for a, b in zip((0x22, 0x36, 0xa2), (0x14, 0x1f, 0x6b)))
        gd.line([0, y, x1 - x0, y], fill=c)
    m = Image.new("L", g.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, g.width - 1, g.height - 1], 14, fill=255)
    im.paste(g, (x0, y0), m)
    d.rounded_rectangle(box, 14, outline=C["L"], width=4)
    if title:
        text(im, (x0 + 26, y0 + 34), title, 26, C["W"], "lm")


def lab(im, xy, t, sz=28, c="#f4f2ff"):
    text(im, xy, t, sz, c, "mm")


def heroes():
    im, d = canvas(gy=560)
    for cx, n, role, col, fn in ((300, "BRICK", "Tank · hold and charge", "B", brick), (800, "VEX", "Damage · reflex sweep", "R", vex), (1300, "LUMEN", "Support · pulse rhythm", "G", lumen)):
        fn(d, cx - 10, 520, 3)
        lab(im, (cx, 600), n, 52, C[col])
        lab(im, (cx, 656), role, 26, C["L"])
    win(im, [160, 720, 1440, 860])
    d = ImageDraw.Draw(im)
    # three timing widgets
    R(d, 220, 776, 300, 26, C["K"]); R(d, 220, 776, 190, 26, "B"); R(d, 420, 776, 46, 26, "Y"); R(d, 432, 776, 22, 26, "G")
    R(d, 680, 776, 260, 26, C["K"]); R(d, 830, 776, 50, 26, "Y"); R(d, 845, 776, 20, 26, "G"); R(d, 760, 768, 8, 42, "W")
    d.line([1140, 789, 1390, 789], fill=C["sky4"], width=6)
    d.ellipse([1130, 770, 1168, 808], outline=C["W"], width=5)
    for x in (1230, 1300, 1370):
        d.ellipse([x, 778, x + 22, 800], fill=C["G"])
    return im


def enemies():
    im, d = canvas()
    for cx, gy, fl in ((150, 610, False), (250, 650, True), (180, 700, False)):
        rat(d, cx, gy, 1.6, fl)
    warden(d, 600, 640, 2.2)
    beetle(d, 1000, 640, 2.0)
    drone(d, 1330, 300, 2); drone(d, 1460, 420, 2)
    d.line([1350, 320, 1440, 400], fill=C["G"], width=6)
    for cx, n in ((210, "Rust rats"), (560, "Bell warden"), (980, "Plated beetle"), (1400, "Twin drones")):
        lab(im, (cx, 790), n, 38)
    return im


def boss():
    im, d = canvas(gy=700)
    golem(d, 440, 700, 2.6)
    golem(d, 1170, 700, 2.6, hot=True)
    lab(im, (440, 90), "Scrap golem", 50); lab(im, (440, 790), "700 HP · slam 16-26", 30, C["L"])
    lab(im, (1170, 90), "Overheat", 50, C["O"]); lab(im, (1170, 790), "Below 50% HP · faster bar · x1.35", 30, C["L"])
    return im


def world():
    im, d = canvas(gy=640, seed=4)
    # flat block scenery for the five stops
    for x, w_, h_ in ((40, 160, 70), (150, 120, 120), (250, 90, 50)):
        R(d, x, 640 - h_, w_, h_, "n")
    for i in range(10):
        R(d, 60 + i * 26, 600 - (i % 3) * 18, 14, 14, "rust")
    R(d, 470, 300, 70, 340, "monkd"); R(d, 455, 270, 100, 34, "monk"); R(d, 485, 330, 40, 40, "bronze")
    R(d, 740, 470, 110, 170, "teald"); R(d, 920, 450, 120, 190, "teald"); R(d, 850, 600, 70, 40, "K")
    R(d, 1110, 470, 14, 170, "gd"); R(d, 1230, 470, 14, 170, "gd"); R(d, 1100, 460, 154, 12, "s")
    drone(d, 1150, 380, 1); drone(d, 1210, 330, 1)
    R(d, 1320, 380, 260, 260, "sky1"); R(d, 1500, 250, 44, 130, "sky1")
    R(d, 1390, 480, 120, 160, "O"); R(d, 1410, 500, 80, 140, "Y"); R(d, 1420, 520, 60, 120, "p")
    R(d, 1430, 535, 12, 10, "R"); R(d, 1458, 535, 12, 10, "R")
    # party on the path
    lumen(d, 600, 760, .8); brick(d, 660, 760, .8); vex(d, 730, 760, .8)
    d.line([0, 790, 1600, 790], fill=C["edge"], width=4)
    for cx, t in ((170, "1 Scrapyard"), (505, "2 Bell tower"), (890, "3 Beetle canyon"), (1175, "4 Drone field"), (1450, "5 The forge")):
        lab(im, (cx, 850), t, 30, C["Y"] if t.startswith("5") else C["L"])
    return im


def items():
    im, d = canvas(stars=False)
    text(im, (800, 90), "Pick an upgrade", 56, C["Y"], "mm")
    cards = [("Steady grip", "Brick", "Charge fills 20% slower", "B", brick), ("Resonance", "Lumen", "Perfect beats give +2 Sync", "G", lumen), ("Quick sync", "Shared", "Dual techs cost 40 Sync", "Y", None)]
    for i, (n, who, l1, col, fn) in enumerate(cards):
        x0 = 150 + i * 450
        win(im, [x0, 160, x0 + 400, 640])
        d = ImageDraw.Draw(im)
        if fn:
            fn(d, x0 + 190, 420, 2.4)
        else:
            d.polygon([(x0 + 200, 240), (x0 + 280, 330), (x0 + 200, 420), (x0 + 120, 330)], fill=C["Y"])
        lab(im, (x0 + 200, 490), n, 40, C[col]); lab(im, (x0 + 200, 535), who, 24, C["L"]); lab(im, (x0 + 200, 590), l1, 22, C["W"])
    d = ImageDraw.Draw(im)
    for i, (t, col) in enumerate((("Perfect", "G"), ("Good", "Y"), ("Miss", "R"))):
        x = 470 + i * 240
        d.rounded_rectangle([x, 720, x + 200, 790], 12, fill=C["sky0"], outline=C[col], width=4)
        lab(im, (x + 100, 755), t, 30, C[col])
    R(d, 250, 715, 34, 80, "s"); d.ellipse([340, 735, 380, 775], fill=C["Y"])
    R(d, 1210, 748, 90, 14, "K"); R(d, 1300, 744, 20, 20, "Y")
    return im


def battle():
    im, d = canvas(gy=470)
    d.rounded_rectangle([20, 20, 1580, 540], 16, outline=C["L"], width=4)
    lumen(d, 200, 440, 1.6); brick(d, 360, 420, 1.6); vex(d, 600, 380, 1.6)
    golem(d, 1260, 440, 1.6)
    for x, y, t in ((190, 330, "LUMEN"), (360, 270, "BRICK"), (590, 225, "VEX"), (1260, 100, "SCRAP GOLEM")):
        lab(im, (x, y), t, 28)
    R(d, 1140, 125, 240, 12, "R"); R(d, 1140, 145, 240, 8, "K"); R(d, 1140, 145, 70, 8, "Y")
    win(im, [20, 570, 620, 880])
    for i, (n, col, hp, tb) in enumerate((("Brick", "B", 132, .8), ("Vex", "R", 74, 1.0), ("Lumen", "G", 100, .45))):
        y = 620 + i * 60
        if i == 1:
            d.rounded_rectangle([34, y - 26, 606, y + 26], 6, fill="#3a4aa8"); R(d, 34, y - 26, 6, 52, "Y")
        text(im, (60, y), n, 28, C["W"], "lm")
        R(d, 190, y - 14, 330, 10, "K"); R(d, 190, y - 14, 330 * hp / 140, 10, col)
        R(d, 190, y + 2, 330, 8, "K"); R(d, 190, y + 2, 330 * tb, 8, "W" if tb >= 1 else "Y")
        text(im, (590, y), str(hp), 26, C["W"], "rm")
    text(im, (60, 810), "Sync", 26, C["W"], "lm"); R(d, 160, 802, 380, 14, "K"); R(d, 160, 802, 380 * .62, 14, "Y"); text(im, (590, 810), "62", 26, C["W"], "rm")
    win(im, [640, 570, 1100, 880], "Vex's turn")
    for i, (t, sub) in enumerate((("Railshot", "One fast sweep"), ("Flurry", "Three sweeps"), ("Ricochet slam", "With Brick · 50 sync"), ("Prism shot", "With Lumen · 50 sync"))):
        y = 640 + i * 58
        text(im, (670, y), str(i + 1), 26, C["Y"], "lm"); text(im, (710, y - 8), t, 28, C["W"] if i != 2 else C["Y"], "lm")
        text(im, (710, y + 18), sub, 18, C["L"], "lm")
    win(im, [1120, 570, 1580, 880])
    text(im, (1146, 610), "Stop the marker in the zone", 22, C["W"], "lm")
    R(d, 1146, 650, 410, 120, "#0b0f2c")
    R(d, 1170, 690, 360, 40, "#232a66"); R(d, 1390, 690, 70, 40, "Y"); R(d, 1410, 690, 30, 40, "G"); R(d, 1320, 676, 8, 68, "W")
    d.rounded_rectangle([1146, 790, 1556, 856], 10, fill=C["Y"]); text(im, (1351, 823), "Hit  Space", 30, C["K"], "mm")
    return im


def dualtech():
    im, d = canvas(gy=640, seed=8)
    lumen(d, 220, 640, 2); brick(d, 420, 640, 2); vex(d, 680, 600, 2)
    golem(d, 1280, 650, 2.4)
    d.ellipse([300, 400, 560, 660], outline=C["B"], width=6)
    d.line([820, 495, 1280, 420], fill=C["Y"], width=14)
    d.line([820, 495, 1280, 420], fill=C["moon"], width=4)
    rnd = random.Random(3)
    for _ in range(24):
        x, y = 1280 + rnd.randint(-80, 80), 420 + rnd.randint(-80, 80)
        R(d, x, y, 10, 10, rnd.choice(["O", "Y"]))
    win(im, [460, 60, 1140, 170])
    text(im, (800, 115), "Ricochet slam!", 60, C["Y"], "mm")
    text(im, (800, 215), "Perfect + Perfect", 34, C["G"], "mm")
    text(im, (1480, 150), "270", 72, C["W"], "mm")
    return im


if __name__ == "__main__":
    for f in (heroes, enemies, boss, world, items, battle, dualtech):
        f().convert("RGB").save(OUT + f.__name__ + ".png")
        print("ok", f.__name__)
