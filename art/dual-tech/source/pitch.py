import sys, random, math
sys.path.insert(0, "/tmp/claude-0/dt")
from px import *

OUT = "/mnt/project-files/art/dual-tech/pitch/"
W, H, K = 320, 180, 5


def base(**kw):
    cv = Image.new("RGBA", (W, H))
    gy = night(cv, W, H, **kw)
    return cv, gy


def banner(im, title, sub=None, fill="#2f6fd0", y=70, sz=56):
    f = font(sz, True)
    tw = ImageDraw.Draw(im).textlength(title, font=f)
    x0 = 800 - tw / 2 - 50
    window(im, [x0, y, 1600 - x0, y + sz + 46], fill=fill)
    text(im, (800, y + 23 + sz / 2), title, sz, C["Y"], "mm", mono=True)
    if sub:
        text(im, (800, y + sz + 90), sub, 26, C["G"], "mm", mono=True)


def label(im, cx, y, t, col="#f4f2ff", sz=26):
    text(im, (cx, y), t, sz, col, "mm", mono=True, shadow=C["K"])


# 1 heroes: three tinted cards like the pitch hero cards
def heroes():
    im = Image.new("RGBA", (W, H), C["sky3"])
    d = ImageDraw.Draw(im)
    cards = [("BRICK", "TANK", "HOLD AND CHARGE", "#213d83", brick(), "B"),
             ("VEX", "DAMAGE", "REFLEX SWEEP", "#552b54", vex(), "R"),
             ("LUMEN", "SUPPORT", "PULSE RHYTHM", "#1d4f62", lumen(), "G")]
    for i, (n, role, style, tint, spr, col) in enumerate(cards):
        x0 = 10 + i * 102
        d.rectangle([x0, 10, x0 + 96, 170], fill=C["L"])
        d.rectangle([x0 + 1, 11, x0 + 95, 169], fill=C["sky3"])
        d.rectangle([x0 + 1, 11, x0 + 95, 80], fill=tint)
        for j in range(9):
            d.point((x0 + 6 + (j * 37) % 86, 15 + (j * 23) % 60), fill=C["g"])
        d.rectangle([x0 + 14, 98, x0 + 82, 101], fill=C["brick"])
        put_feet(im, spr, x0 + 46, 99, 2, sh=False)
        if n == "LUMEN":
            put(im, orb(), x0 + 72, 66)
    im = up(im, K)
    d = ImageDraw.Draw(im)
    for i, (n, role, style, tint, spr, col) in enumerate(cards):
        x0 = (10 + i * 102) * K
        text(im, (x0 + 40, 560), n, 46, C[col], "lm", mono=True)
        text(im, (x0 + 440, 562), role, 22, C["L"], "rm", mono=True)
        text(im, (x0 + 40, 615), style, 24, C["L"], "lm", mono=True)
        bx, by = x0 + 40, 720
        if n == "BRICK":
            d.rectangle([bx, by, bx + 400, by + 40], outline=C["L"], width=4, fill=C["K"])
            d.rectangle([bx + 6, by + 10, bx + 250, by + 30], fill=C["B"])
            d.rectangle([bx + 270, by + 4, bx + 350, by + 36], fill=C["Y"]); d.rectangle([bx + 295, by + 4, bx + 325, by + 36], fill=C["G"])
            d.rectangle([bx + 255, by - 8, bx + 263, by + 48], fill=C["W"])
            d.rectangle([x0 + 210, 546, x0 + 238, 574], fill=C["B"])
        elif n == "VEX":
            d.rectangle([bx, by, bx + 400, by + 40], outline=C["L"], width=4, fill=C["K"])
            d.rectangle([bx + 230, by + 4, bx + 310, by + 36], fill=C["Y"]); d.rectangle([bx + 255, by + 4, bx + 285, by + 36], fill=C["G"])
            d.rectangle([bx + 160, by - 8, bx + 168, by + 48], fill=C["W"])
            for t in (110, 135): d.rectangle([bx + t, by + 18, bx + t + 16, by + 22], fill=C["R"])
            d.polygon([(x0 + 160, 542), (x0 + 178, 560), (x0 + 160, 578), (x0 + 142, 560)], fill=C["R"])
        else:
            d.line([bx, by + 20, bx + 400, by + 20], fill=C["sky4"], width=6)
            d.ellipse([bx, by - 4, bx + 48, by + 44], outline=C["W"], width=5)
            for t in (120, 220, 320): d.ellipse([bx + t, by + 6, bx + t + 28, by + 34], fill=C["G"])
            d.ellipse([x0 + 230, 546, x0 + 258, 574], fill=C["G"])
    return im


def enemies():
    cv, gy = base(moon=True)
    put_feet(cv, rat(), 34, gy + 6, 2); put_feet(cv, rat().flip(), 62, gy + 14, 2); put_feet(cv, rat(), 40, gy + 24, 2)
    put_feet(cv, warden().flip(), 118, gy + 14, 2)
    put_feet(cv, beetle().flip(), 196, gy + 14, 2)
    put(cv, drone(), 246, gy - 76, 2); put(cv, drone(), 274, gy - 44, 2)
    d = ImageDraw.Draw(cv); d.line([270, gy - 62, 292, gy - 34], fill=C["G"])
    shadow(cv, 264, gy + 6, 24); shadow(cv, 292, gy + 10, 24)
    im = up(cv, K)
    for cx, n in ((240, "RUST RATS"), (590, "BELL WARDEN"), (980, "PLATED BEETLE"), (1400, "TWIN DRONES")):
        label(im, cx, 862, n)
    return im


def boss():
    cv, gy = base(moon=False)
    put_feet(cv, golem(), 88, gy + 10, 2)
    put_feet(cv, golem(True), 236, gy + 10, 2)
    d = ImageDraw.Draw(cv)
    import random
    rnd = random.Random(5)
    for _ in range(40):
        x, y = 236 + rnd.randint(-50, 50), gy - rnd.randint(30, 100)
        d.point((x, y), fill=rnd.choice([C["O"], C["Y"], C["moon"]]))
    im = up(cv, K)
    label(im, 440, 120, "SCRAP GOLEM", sz=34); label(im, 1180, 120, "OVERHEAT", C["O"], 34)
    label(im, 440, 168, "700 HP", C["L"], 22); label(im, 1180, 168, "FASTER BAR · DAMAGE x1.35", C["L"], 22)
    return im


def world():
    cv = Image.new("RGBA", (W, H))
    gy = night(cv, W, H, ground_y=140, seed=9)
    d = ImageDraw.Draw(cv)
    # 1 scrapyard heaps with rusty cubes and a rat
    for x, w_, h_ in ((0, 46, 22), (26, 38, 30), (52, 26, 14)):
        d.polygon([(x, 140), (x + w_ / 2, 140 - h_), (x + w_, 140)], fill=C["n"])
    rnd = random.Random(1)
    for _ in range(26):
        x = rnd.randint(4, 72); y = rnd.randint(118, 138)
        d.rectangle([x, y, x + 2, y + 1], fill=rnd.choice([C["rust"], C["g"], C["gd"]]))
    put(cv, rat(), 50, 128)
    # 2 bell tower on a ridge
    d.polygon([(70, 140), (104, 100), (138, 140)], fill=C["sky2"])
    d.rectangle([97, 58, 111, 102], fill=C["monkd"]); d.polygon([(94, 58), (104, 42), (114, 58)], fill=C["monk"])
    d.rectangle([100, 64, 108, 74], fill=C["K"]); d.polygon([(101, 66), (107, 66), (109, 74), (99, 74)], fill=C["bronze"])
    d.point((103, 67), fill=C["bronzel"])
    # 3 canyon
    d.polygon([(140, 140), (146, 110), (158, 104), (170, 112), (172, 140)], fill=C["teald"])
    d.polygon([(184, 140), (186, 108), (198, 100), (210, 110), (214, 140)], fill=C["teald"])
    d.line([150, 112, 156, 108], fill=C["teal"]); d.line([190, 110, 198, 104], fill=C["teal"])
    put(cv, beetle(), 159, 126)
    # 4 drone field
    for x in (222, 246):
        d.rectangle([x, 106, x + 2, 140], fill=C["gd"]); d.rectangle([x - 2, 104, x + 4, 106], fill=C["s"]); d.point((x + 1, 103), fill=C["R"])
    d.line([224, 104, 248, 104], fill=C["G"])
    put(cv, drone(), 226, 84); put(cv, drone(), 240, 74)
    # 5 forge with golem silhouette in the doorway
    d.rectangle([262, 92, 320, 140], fill=C["sky1"]); d.polygon([(258, 92), (290, 76), (322, 92)], fill=C["sky1"])
    d.rectangle([300, 56, 310, 80], fill=C["sky1"])
    d.rectangle([272, 108, 300, 140], fill=C["O"]); d.rectangle([276, 112, 296, 140], fill=C["Y"])
    d.rectangle([280, 116, 292, 140], fill=C["p"]); d.rectangle([282, 119, 284, 120], fill=C["R"]); d.rectangle([288, 119, 290, 120], fill=C["R"])
    for i in range(8):
        d.rectangle([302 + (i % 2) * 4, 50 - i * 6, 307 + (i % 2) * 4, 53 - i * 6], fill=C["gd"] if i % 2 else C["g"])
    # winding path with the party
    for x in range(0, W, 5):
        y = 152 + int(4 * math.sin(x / 28))
        d.rectangle([x, y, x + 2, y], fill=C["edge"])
    put(cv, mini("G", hat="G"), 112, 142); put(cv, mini("B", hat="B"), 120, 141)
    put(cv, mini("R", hat="H"), 128, 141)
    im = up(cv, K)
    dd = ImageDraw.Draw(im)
    dd.rectangle([0, 820, 1600, 900], fill=C["sky0"])
    for i, (cx, t) in enumerate(((180, "1 SCRAPYARD"), (520, "2 BELL TOWER"), (880, "3 BEETLE CANYON"), (1180, "4 DRONE FIELD"), (1460, "5 THE FORGE"))):
        text(im, (cx, 860), t, 24, C["Y"] if i == 4 else C["L"], "mm", mono=True)
    return im


def items():
    cv, gy = base(mountains=True, seed=4)
    im = up(cv, K)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 1600, 900], fill=(10, 14, 42, 150))
    im2 = Image.new("RGBA", im.size); im2.paste(im)
    ov = Image.new("RGBA", im.size, (10, 14, 42, 150)); im = Image.alpha_composite(im, ov)
    banner(im, "PICK AN UPGRADE", None, y=40, sz=44)
    cards = [("STEADY GRIP", "BRICK", "Charge fills", "20% slower", "B", "#213d83", brick()),
             ("RESONANCE", "LUMEN", "Perfect beats", "+2 extra Sync", "G", "#1d4f62", lumen()),
             ("QUICK SYNC", "SHARED", "Dual techs", "cost 40 Sync", "Y", "#4a3a1a", None)]
    for i, (n, who, l1, l2, col, tint, spr) in enumerate(cards):
        x0 = 180 + i * 430
        y0 = 190
        window(im, [x0, y0, x0 + 380, y0 + 470], fill=C["sky3"], border=C[col], bw=6)
        ImageDraw.Draw(im).rectangle([x0 + 6, y0 + 6, x0 + 374, y0 + 230], fill=tint)
        if spr:
            put(im, spr, x0 + 190 - spr.w * 3, y0 + 220 - spr.h * 6, 6)
        else:
            g = Sprite(15, 15)
            for yy in range(15):
                hw = 7 - abs(7 - yy)
                g.rect(7 - hw, yy, hw * 2 + 1, 1, "Y")
            g.rect(5, 4, 2, 2, "moon")
            put(im, g.outline(), x0 + 190 - 17 * 4, y0 + 40, 8)
        text(im, (x0 + 190, y0 + 280), n, 34, C[col], "mm", mono=True)
        text(im, (x0 + 190, y0 + 322), who, 20, C["L"], "mm", mono=True)
        text(im, (x0 + 190, y0 + 380), l1, 24, C["W"], "mm", mono=True)
        text(im, (x0 + 190, y0 + 414), l2, 24, C["W"], "mm", mono=True)
    # grade badges
    for i, (t, col) in enumerate((("PERFECT", "G"), ("GOOD", "Y"), ("MISS", "R"))):
        x = 470 + i * 240
        window(im, [x, 720, x + 200, 790], fill=C["sky0"], border=C[col], bw=4)
        text(im, (x + 100, 756), t, 28, C[col], "mm", mono=True)
    # item icons flanking the grade badges
    shield = Sprite(8, 11).rect(0, 0, 8, 9, "s").rect(1, 9, 6, 1, "s").rect(2, 10, 4, 1, "g").rect(7, 0, 1, 9, "g").rect(3, 2, 2, 5, "Y").rect(2, 3, 4, 2, "Y").outline()
    rifle = Sprite(16, 5).rect(0, 1, 12, 2, "g").rect(0, 1, 12, 1, "gd").rect(12, 1, 2, 1, "Y").rect(3, 3, 2, 2, "gd").rect(0, 3, 2, 2, "r").outline()
    for spr, x, k in ((shield, 210, 6), (rifle, 1180, 5)):
        put(im, spr, x, 755 - spr.h * k // 2, k)
    put(im, orb(False), 330, 755 - 6 * 6, 6)
    return im


def battle():
    cv = Image.new("RGBA", (W, H))
    gy = night(cv, W, 112, ground_y=96, seed=11, moon=False)
    put_feet(cv, lumen(), 40, 100); put_feet(cv, brick(), 78, 96); put_feet(cv, vex(), 120, 92)
    put(cv, orb(), 54, 78)
    put_feet(cv, golem(), 258, 98)
    d = ImageDraw.Draw(cv)
    d.rectangle([0, 112, W, H], fill=C["sky0"])
    im = up(cv, K)
    d = ImageDraw.Draw(im)
    label(im, 1290, 60, "SCRAP GOLEM", sz=24)
    d.rectangle([1170, 84, 1410, 96], fill=C["K"]); d.rectangle([1172, 86, 1340, 94], fill=C["R"])
    d.rectangle([1170, 100, 1410, 108], fill=C["K"]); d.rectangle([1172, 102, 1250, 106], fill=C["Y"])
    # party panel
    window(im, [20, 580, 640, 880], fill="#213d83")
    for i, (n, col, hp, tb) in enumerate((("BRICK", "B", 132, .8), ("VEX", "R", 74, 1.0), ("LUMEN", "G", 100, .45))):
        y = 630 + i * 62
        text(im, (50, y), n, 26, C[col], "lm", mono=True)
        d.rectangle([180, y - 14, 520, y - 4], fill=C["K"]); d.rectangle([180, y - 14, 180 + 340 * hp / 140, y - 4], fill=C[col])
        d.rectangle([180, y + 2, 520, y + 10], fill=C["K"]); d.rectangle([180, y + 2, 180 + 340 * tb, y + 10], fill=C["W"] if tb >= 1 else C["Y"])
        text(im, (610, y), str(hp), 24, C["W"], "rm", mono=True)
    text(im, (50, 820), "SYNC", 24, C["Y"], "lm", mono=True)
    d.rectangle([180, 812, 610, 830], fill=C["K"]); d.rectangle([180, 812, 180 + 430 * .62, 830], fill=C["Y"])
    # command menu
    window(im, [660, 580, 1100, 880], fill="#213d83")
    text(im, (690, 618), "VEX", 26, C["R"], "lm", mono=True)
    for i, t in enumerate(("Railshot", "Flurry", "Ricochet slam", "Prism shot")):
        y = 670 + i * 50
        if i == 2:
            d.rectangle([680, y - 22, 1080, y + 22], fill=C["Y"])
        text(im, (700, y), f"{i + 1}  {t}", 26, C["K"] if i == 2 else C["W"], "lm", mono=True)
    # timing bar
    window(im, [1120, 580, 1580, 880], fill="#213d83")
    text(im, (1150, 618), "REFLEX SWEEP", 24, C["L"], "lm", mono=True)
    d.rectangle([1150, 680, 1550, 730], fill=C["K"], outline=C["L"], width=4)
    d.rectangle([1380, 684, 1470, 726], fill=C["Y"]); d.rectangle([1408, 684, 1442, 726], fill=C["G"])
    d.rectangle([1330, 668, 1340, 742], fill=C["W"])
    text(im, (1350, 800), "SPACE TO HIT", 26, C["Y"], "mm", mono=True)
    return im


def dualtech():
    cv, gy = base(seed=21)
    put_feet(cv, lumen(), 40, gy + 4); put(cv, orb(), 56, gy - 18)
    put_feet(cv, brick(), 84, gy + 2); put_feet(cv, vex(), 132, gy + 0)
    put_feet(cv, golem(), 262, gy + 8, 2)
    d = ImageDraw.Draw(cv)
    # shield ring
    for a in range(0, 360, 20):
        x = 86 + 24 * math.cos(math.radians(a)); y = gy - 16 + 24 * math.sin(math.radians(a))
        d.rectangle([x, y, x + 2, y + 1], fill=C["B"])
    # beam: from vex gun to brick shield then to golem
    sx, sy = 96, gy - 18
    vx, vy = 146, gy - 18
    d.line([vx + 4, vy - 2, 262, gy - 52], fill=C["Y"], width=3)
    d.line([vx + 4, vy - 2, 262, gy - 52], fill=C["moon"], width=1)
    import random
    rnd = random.Random(2)
    for _ in range(30):
        d.point((262 + rnd.randint(-14, 14), gy - 52 + rnd.randint(-14, 14)), fill=rnd.choice([C["O"], C["Y"]]))
    im = up(cv, K)
    banner(im, "RICOCHET SLAM!", "PERFECT + PERFECT", y=50, sz=54)
    text(im, (1480, 200), "270", 72, C["W"], "mm", mono=True, shadow=C["K"])
    return im


if __name__ == "__main__":
    for f in (heroes, enemies, boss, world, items, battle, dualtech):
        f().convert("RGB").save(OUT + f.__name__ + ".png")
        print("ok", f.__name__)
