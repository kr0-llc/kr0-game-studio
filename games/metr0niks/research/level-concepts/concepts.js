/* Metr0niks level concepts (Oct 28, 2026): three ways to make the three zones of Overpass Sector 4 look and play
   differently. Same grid as sim.js (80 x 32 x 8, one cell = 1 m), same overpass, pillars, zone edges and gates.
   Each item is a box: [kind, x, y, w, d, h, z0, colour]. Kinds:
     bld  building (walls, roof on top, windows on the faces)    con  container (stackable, plowable)
     bar  barrier (1 m, plowable)                                awn  awning or canopy (overhead, walk under it)
     leg  support leg or column (holds what sits on it)          spn  span carried by legs (crane beam, gallery, tank)
     vat  slag vat (proposed hazard prop)                        rub  rubble (blocks walking, can be shot away)
     chm  chimney                                                dec  ground paint (rails, hazard stripes), no height
   Loaded by levels.html and by check.js (walkability and perch checks). */
(function (root) {
  var W = 80, D = 32, H = 8;
  var ZONES = [{ name: "Underpass", x0: 0, x1: 31 }, { name: "Freight Yard", x0: 32, x1: 55 }, { name: "Smelter Row", x0: 56, x1: 79 }];
  var OVER = { y0: 13, y1: 18, z: 5, pillarsX: [3, 11, 19, 27, 35, 43, 51, 59, 67, 75] };

  /* palettes per district */
  var P = {
    brick: [150, 92, 64], ochre: [172, 150, 116], slate: [96, 108, 124], rust: [140, 70, 56], adobe: [120, 104, 88], moss: [112, 122, 112],
    shed: [128, 126, 120], tin: [104, 116, 108], cOr: [196, 92, 40], cBl: [46, 106, 140], cGr: [92, 128, 64], cRd: [150, 54, 40], cYe: [204, 164, 48],
    iron: [70, 66, 64], soot: [88, 76, 68], oxide: [118, 66, 50], ash: [104, 100, 96],
    canvasR: [196, 84, 60], canvasT: [52, 140, 136], canvasY: [214, 170, 70], steel: [214, 170, 52], slag: [255, 120, 40], rail: [92, 84, 76]
  };
  var CON = [P.cOr, P.cBl, P.cGr, P.cRd, P.cYe];

  function b(x, y, w, d, h, c) { return ["bld", x, y, w, d, h, 0, c] }
  function bar(x, y, w, d) { return ["bar", x, y, w, d, 1, 0, null] }
  function con(x, y, w, d, stack, k) { var a = []; for (var s = 0; s < stack; s++) a.push(["con", x, y, w, d, 2, s * 2, CON[(k + s * 2) % CON.length]]); return a }
  function awn(x, y, w, d, z, c) { return ["awn", x, y, w, d, 1, z, c] }
  function leg(x, y, w, d, h) { return ["leg", x, y, w, d, h, 0, P.steel] }
  function spn(x, y, w, d, h, z, c) { return ["spn", x, y, w, d, h, z, c || P.steel] }
  function vat(x, y) { return ["vat", x, y, 2, 2, 2, 0, P.slag] }
  function rub(x, y, w, d, h) { return ["rub", x, y, w, d, h || 1, 0, null] }
  function chm(x, y, h) { return ["chm", x, y, 1, 1, h, 0, P.iron] }
  function dec(x, y, w, d, c) { return ["dec", x, y, w, d, 0, 0, c] }
  function flat(a) { var o = []; a.forEach(function (i) { if (Array.isArray(i[0])) o.push.apply(o, i); else o.push(i) }); return o }

  /* ---------------- Concept A: Three districts ---------------- */
  var A = {
    id: "A", name: "Three districts",
    pitch: "Each zone is a different neighbourhood with its own building shapes, height, colour and street width, so you always know where you are and each zone favours a different enemy.",
    zones: [
      { name: "Underpass", sub: "Shanty market", hues: [P.brick, P.ochre, P.slate, P.rust], win: [63, 214, 232],
        items: flat([
          /* north: shacks packed along 2 m alleys, awnings strung across them */
          b(2, 1, 3, 3, 2, P.brick), b(7, 1, 2, 3, 3, P.ochre), b(11, 1, 3, 2, 2, P.slate), b(16, 1, 2, 3, 3, P.rust), b(20, 1, 3, 3, 2, P.ochre), b(25, 1, 2, 2, 4, P.brick), b(29, 1, 2, 3, 2, P.slate),
          b(2, 6, 2, 2, 3, P.rust), b(6, 6, 3, 2, 2, P.slate), b(11, 5, 2, 3, 4, P.brick), b(15, 6, 3, 2, 2, P.ochre), b(20, 6, 2, 3, 3, P.slate), b(24, 5, 3, 3, 2, P.rust), b(29, 6, 2, 2, 3, P.ochre),
          awn(5, 2, 2, 2, 2, P.canvasR), awn(14, 2, 2, 2, 2, P.canvasT), awn(23, 2, 2, 2, 2, P.canvasY), awn(9, 6, 2, 2, 2, P.canvasT), awn(18, 6, 2, 2, 2, P.canvasR), awn(27, 6, 2, 2, 2, P.canvasY),
          /* market under the deck: stalls (barriers) and canopies between the pillars */
          bar(6, 14, 1, 1), bar(8, 17, 1, 1), bar(14, 14, 2, 1), bar(16, 17, 1, 1), bar(22, 14, 1, 1), bar(24, 17, 2, 1), bar(29, 14, 1, 1),
          awn(6, 13, 3, 2, 2, P.canvasR), awn(14, 17, 3, 2, 2, P.canvasY), awn(22, 13, 3, 2, 2, P.canvasT),
          /* south: same shacks, one taller tenement as a sniper perch */
          b(2, 20, 3, 3, 2, P.ochre), b(7, 20, 2, 2, 3, P.slate), b(11, 21, 3, 2, 2, P.rust), b(16, 20, 3, 3, 4, P.brick), b(21, 21, 2, 2, 2, P.ochre), b(25, 20, 3, 2, 3, P.slate), b(29, 21, 2, 2, 2, P.rust),
          b(2, 26, 2, 3, 3, P.slate), b(6, 25, 3, 3, 2, P.brick), b(11, 26, 2, 3, 3, P.ochre), b(15, 26, 3, 2, 2, P.slate), b(20, 25, 3, 3, 5, P.rust), b(25, 26, 2, 3, 2, P.brick), b(28, 25, 3, 3, 3, P.ochre),
          awn(9, 21, 2, 2, 2, P.canvasY), awn(19, 21, 2, 2, 2, P.canvasT), awn(4, 24, 2, 2, 2, P.canvasR), awn(23, 24, 2, 2, 2, P.canvasY),
          con(13, 10, 2, 1, 1, 0), con(4, 29, 2, 1, 1, 1)
        ]) },
      { name: "Freight Yard", sub: "Container yard", hues: [P.shed, P.tin], win: [240, 190, 90],
        items: flat([
          /* north: one long warehouse and a weigh shed, wide yard in front */
          b(34, 1, 12, 4, 4, P.tin), b(48, 1, 4, 3, 2, P.shed), b(53, 2, 2, 2, 3, P.shed),
          /* container stacks in rows with 3 m lanes: loader country */
          con(35, 8, 4, 1, 2, 0), con(41, 8, 4, 1, 1, 1), con(47, 8, 4, 1, 2, 2), con(52, 9, 2, 1, 1, 3),
          con(35, 10, 2, 1, 1, 4), con(45, 10, 2, 1, 1, 0),
          /* under the deck: open apron, a few barriers */
          bar(38, 14, 1, 2), bar(47, 17, 2, 1), bar(54, 14, 1, 2),
          /* south: gantry crane over two container rows and a rail line */
          dec(33, 25, 23, 1, P.rail), dec(33, 27, 23, 1, P.rail),
          leg(38, 20, 1, 1, 6), leg(38, 29, 1, 1, 6), leg(49, 20, 1, 1, 6), leg(49, 29, 1, 1, 6),
          spn(38, 20, 12, 1, 1, 6), spn(38, 29, 12, 1, 1, 6), spn(43, 21, 2, 8, 1, 6, P.steel),
          con(40, 21, 3, 1, 2, 1), con(45, 21, 3, 1, 2, 3), con(40, 23, 3, 1, 1, 2), con(45, 23, 3, 1, 2, 4),
          con(34, 21, 2, 1, 1, 0), con(52, 22, 1, 2, 2, 2), con(34, 29, 3, 1, 1, 3), con(51, 29, 3, 1, 1, 1),
          b(53, 25, 2, 3, 2, P.shed)
        ]) },
      { name: "Smelter Row", sub: "Furnace canyons", hues: [P.iron, P.soot, P.oxide], win: [255, 140, 60],
        items: flat([
          /* tall halls packed close: 3 m canyons, high roofs for the sniper */
          b(57, 1, 6, 5, 6, P.soot), b(65, 1, 5, 4, 7, P.iron), b(72, 1, 6, 5, 5, P.oxide),
          b(57, 8, 4, 3, 4, P.iron), b(64, 8, 3, 3, 3, P.oxide), b(70, 8, 4, 3, 5, P.soot), b(76, 8, 2, 3, 3, P.iron),
          chm(63, 2, 8), chm(71, 3, 8),
          vat(62, 11), vat(68, 11),
          bar(62, 14, 1, 2), bar(71, 17, 2, 1), bar(78, 13, 1, 1),
          b(57, 20, 5, 4, 5, P.oxide), b(64, 20, 6, 4, 7, P.soot), b(72, 20, 6, 3, 4, P.iron),
          b(57, 26, 4, 4, 3, P.iron), b(63, 27, 5, 3, 4, P.oxide), b(70, 26, 3, 4, 6, P.soot), b(75, 26, 3, 4, 3, P.oxide),
          chm(70, 22, 8), vat(62, 24), vat(73, 24)
        ]) }
    ]
  };

  /* ---------------- Concept B: One landmark per zone ---------------- */
  var B = {
    id: "B", name: "Landmark set pieces",
    pitch: "Each zone is built around one big destructible set piece that you can bring down on the enemy. The streets around it stay simple, so the landmark is what you remember.",
    zones: [
      { name: "Underpass", sub: "The water tower plaza", hues: [P.brick, P.ochre, P.slate, P.adobe], win: [63, 214, 232],
        items: flat([
          /* plaza north of the deck, a water tower on four legs in the middle */
          leg(12, 4, 1, 1, 4), leg(16, 4, 1, 1, 4), leg(12, 8, 1, 1, 4), leg(16, 8, 1, 1, 4),
          spn(12, 4, 5, 5, 3, 4, P.slate),
          b(2, 1, 4, 3, 3, P.brick), b(7, 1, 3, 2, 2, P.ochre), b(20, 1, 4, 3, 4, P.adobe), b(25, 1, 3, 3, 2, P.brick), b(29, 1, 2, 4, 3, P.slate),
          b(2, 7, 3, 3, 2, P.ochre), b(6, 8, 3, 3, 3, P.slate), b(21, 7, 3, 3, 2, P.brick), b(26, 8, 4, 3, 3, P.ochre),
          bar(10, 10, 1, 1), bar(18, 10, 1, 1), bar(11, 2, 2, 1), bar(17, 2, 1, 1),
          bar(6, 14, 1, 2), bar(15, 17, 2, 1), bar(23, 14, 1, 2), bar(29, 12, 1, 1),
          b(2, 21, 3, 4, 3, P.adobe), b(7, 22, 4, 3, 4, P.brick), b(14, 21, 4, 3, 2, P.slate), b(20, 23, 5, 3, 4, P.ochre), b(27, 21, 3, 4, 3, P.brick),
          b(2, 27, 4, 3, 2, P.slate), b(13, 27, 5, 3, 3, P.adobe), b(22, 28, 4, 2, 2, P.brick), b(28, 27, 2, 3, 2, P.ochre),
          con(9, 28, 2, 1, 1, 0), con(19, 20, 2, 1, 1, 1)
        ]) },
      { name: "Freight Yard", sub: "The gantry crane", hues: [P.shed, P.tin], win: [240, 190, 90],
        items: flat([
          /* one huge crane spans the whole yard north to south, straddling the deck: two leg pairs, beams at 6 to 7 m */
          leg(39, 2, 1, 1, 6), leg(49, 2, 1, 1, 6), leg(39, 28, 1, 1, 6), leg(49, 28, 1, 1, 6),
          spn(39, 2, 11, 1, 1, 6), spn(39, 28, 11, 1, 1, 6), spn(39, 3, 1, 25, 1, 7), spn(49, 3, 1, 25, 1, 7),
          spn(43, 6, 3, 2, 1, 6, P.cYe), con(43, 6, 3, 2, 1, 4),
          /* stacks under it, 1 to 3 high */
          con(41, 4, 2, 1, 3, 0), con(46, 4, 2, 1, 2, 1), con(41, 9, 3, 1, 2, 2), con(46, 9, 2, 1, 3, 3),
          con(41, 21, 2, 1, 3, 4), con(46, 21, 2, 1, 2, 0), con(41, 25, 3, 1, 2, 1), con(46, 25, 2, 1, 3, 2),
          b(33, 2, 4, 3, 3, P.tin), b(33, 8, 3, 3, 2, P.shed), b(52, 2, 3, 4, 4, P.tin), b(52, 9, 3, 2, 2, P.shed),
          b(33, 21, 4, 3, 3, P.shed), b(33, 27, 4, 3, 2, P.tin), b(52, 21, 3, 3, 3, P.tin), b(52, 27, 3, 3, 2, P.shed),
          bar(38, 14, 1, 2), bar(47, 17, 2, 1), bar(54, 14, 1, 2),
          dec(33, 18, 23, 1, P.rail)
        ]) },
      { name: "Smelter Row", sub: "The slag gallery", hues: [P.iron, P.soot, P.oxide], win: [255, 140, 60],
        items: flat([
          /* a smelter hall north, a gallery on columns over the street carrying four slag vats */
          b(57, 1, 21, 4, 6, P.soot),
          leg(59, 6, 1, 1, 3), leg(64, 6, 1, 1, 3), leg(69, 6, 1, 1, 3), leg(74, 6, 1, 1, 3),
          spn(59, 6, 16, 3, 1, 3, P.iron),
          vat(60, 6), vat(65, 7), vat(70, 6), vat(73, 7),
          chm(58, 9, 7), chm(77, 9, 7),
          b(61, 10, 3, 2, 2, P.oxide), b(71, 10, 3, 2, 2, P.oxide),
          bar(62, 14, 1, 2), bar(71, 17, 2, 1), bar(78, 13, 1, 1),
          b(57, 20, 4, 4, 4, P.oxide), b(63, 21, 5, 3, 5, P.iron), b(70, 20, 4, 4, 3, P.soot), b(76, 21, 2, 4, 4, P.oxide),
          b(57, 26, 4, 4, 2, P.iron), b(63, 27, 5, 3, 3, P.soot), b(70, 26, 4, 4, 5, P.oxide), b(76, 27, 2, 3, 2, P.iron)
        ]) }
    ]
  };

  /* ---------------- Concept C: A different street shape per zone ---------------- */
  var C = {
    id: "C", name: "Three street shapes",
    pitch: "Each zone changes how you move: a loop you circle in the Underpass, long lanes in the Freight Yard, and an open arena at the end of Smelter Row where the deck has already fallen.",
    zones: [
      { name: "Underpass", sub: "The loop", hues: [P.brick, P.ochre, P.slate, P.adobe], win: [63, 214, 232],
        items: flat([
          /* one big block (the old station) in the north half; the street rings it and the deck */
          b(8, 4, 5, 6, 3, P.adobe), b(13, 4, 6, 6, 5, P.ochre), b(19, 4, 4, 6, 3, P.adobe),
          b(2, 1, 3, 2, 2, P.brick), b(26, 1, 4, 2, 3, P.slate), b(2, 5, 3, 4, 3, P.slate), b(26, 5, 4, 4, 2, P.brick),
          bar(6, 2, 1, 1), bar(15, 2, 2, 1), bar(24, 2, 1, 1), bar(6, 11, 1, 1), bar(24, 11, 1, 1),
          bar(8, 14, 1, 2), bar(15, 17, 2, 1), bar(23, 14, 1, 2),
          /* south: a tighter grid of tenements, two cut-throughs */
          b(2, 20, 4, 4, 3, P.ochre), b(8, 20, 5, 4, 4, P.brick), b(15, 20, 4, 4, 2, P.slate), b(21, 20, 4, 4, 5, P.adobe), b(27, 20, 3, 4, 3, P.brick),
          b(2, 26, 5, 4, 2, P.slate), b(9, 26, 4, 4, 3, P.adobe), b(15, 26, 6, 4, 2, P.ochre), b(23, 26, 7, 4, 3, P.slate),
          con(13, 11, 2, 1, 1, 0)
        ]) },
      { name: "Freight Yard", sub: "The lanes", hues: [P.shed, P.tin], win: [240, 190, 90],
        items: flat([
          /* container walls cut the yard into three long lanes; 2 m gaps let you switch lanes; loaders plow new gaps */
          con(33, 9, 4, 1, 2, 0), con(39, 9, 5, 1, 2, 1), con(46, 9, 4, 1, 1, 2), con(52, 9, 3, 1, 2, 3),
          con(33, 22, 3, 1, 2, 4), con(38, 22, 5, 1, 1, 0), con(45, 22, 4, 1, 2, 1), con(51, 22, 4, 1, 2, 2),
          b(34, 1, 6, 3, 3, P.tin), b(42, 1, 3, 3, 2, P.shed), b(47, 1, 8, 3, 4, P.tin),
          b(34, 28, 8, 3, 3, P.shed), b(44, 28, 4, 3, 2, P.tin), b(50, 28, 5, 3, 4, P.shed),
          /* gantry crane over the north lane */
          leg(40, 4, 1, 1, 6), leg(40, 8, 1, 1, 6), leg(48, 4, 1, 1, 6), leg(48, 8, 1, 1, 6),
          spn(40, 4, 9, 1, 1, 6), spn(40, 8, 9, 1, 1, 6), spn(44, 5, 2, 3, 1, 6, P.cYe),
          bar(38, 14, 1, 2), bar(47, 17, 2, 1), bar(54, 14, 1, 2),
          dec(33, 25, 23, 1, P.rail)
        ]) },
      { name: "Smelter Row", sub: "The pour floor", hues: [P.iron, P.soot, P.oxide], win: [255, 140, 60],
        items: flat([
          /* canyons at the west end funnel into an open floor; the last deck span lies in pieces */
          b(57, 1, 5, 6, 6, P.soot), b(57, 8, 4, 4, 4, P.iron), b(57, 20, 4, 4, 4, P.oxide), b(57, 25, 5, 6, 6, P.iron),
          b(64, 1, 4, 3, 5, P.oxide), b(64, 27, 4, 4, 4, P.soot),
          /* the smelter: tallest roof on the map, the wave-5 boss perch */
          b(71, 2, 6, 5, 7, P.soot), chm(70, 3, 8), chm(77, 6, 8),
          vat(66, 9), vat(74, 9), vat(66, 21), vat(74, 22),
          rub(68, 13, 3, 2, 2), rub(72, 16, 2, 3, 1), rub(77, 13, 2, 2, 2), rub(65, 18, 2, 1, 1),
          b(72, 27, 6, 4, 3, P.iron), bar(62, 14, 1, 2)
        ]) }
    ],
    brokenSpans: [9]   /* deck span index 9 (x 68 to 75) starts the match already fallen */
  };

  var LEVELS = { W: W, D: D, H: H, ZONES: ZONES, OVER: OVER, concepts: [A, B, C], palette: P };
  if (typeof module !== "undefined") module.exports = LEVELS; else root.LEVELS = LEVELS;
})(this);
