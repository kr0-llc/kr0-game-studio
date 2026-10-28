# Metr0niks level design: Overpass Sector 4

Updated Oct 28, 2026 · @kr0 · Concepts: [research/level-concepts/](research/level-concepts/README.md) · Concept page: https://claude.ai/artifact/X8y8t7nd96zwL1BeCetdzC

On Oct 28 kr0 said the voxel prototype's zones all look very similar and asked for a full map with a breakdown by section. kr0 picked concept **A + B landmarks**: each zone is its own district, with one landmark that falls under the same support rule as the deck. The map is built in `simulations/sim.js` (`MAP`), so the voxel prototype plays it. `node simulations/map-check.js` checks it. kr0 also said to focus on voxel and keep it as it is (GDD-D46), so the map stays voxel data in `sim.js`.

## What stays the same

The grid is 80 × 32 × 8 m with an indestructible perimeter. The deck is at 5 m on the ten pillars at x = 3 to 75. The three zones, their shutters and their unlock order (level 1, 2, 3+) are unchanged, and so is the drop-in point (15.5, 11). Waves, enemies and every number in `T` are untouched.

## The map at a glance

| | Underpass (x 0–31) | Freight Yard (x 32–55) | Smelter Row (x 56–79) |
| --- | --- | --- | --- |
| District | Shanty market | Container yard | Furnace canyons |
| Opens at | Level 1 | Level 2 | Level 3 |
| Landmark | Water tower over the plaza | Gantry crane over the south yard | Slag gallery over the north street |
| Hazard prop (GDD-D41) | Deck spans | Container stacks, gantry crane | Slag vats |
| Buildings | 24 shacks, 2 to 5 m (one 5 m tenement) | 4 (a 12 m warehouse, three sheds) | 10 halls, 2 to 7 m (four of 5 m or more), 3 chimneys |
| Cover | 10 stalls and barriers, 7 awnings, 1 container | 13 container stacks (25 boxes, 2 or 3 high), 3 barriers | 3 barriers, 6 slag vats |
| Street cells | 743 cells | 591 cells | 442 cells |
| Sniper roof cells | 142 | 46 | 145 |
| Colour | Brick, ochre, slate; cyan windows | Concrete and tin, bright containers; sodium-yellow windows; pale concrete pad | Iron and soot; orange furnace windows; scorched ground |
| Plays like | Close range, a corner every few metres | Long sightlines, open ground, charge lanes | Vertical, with the sniper above you in narrow canyons |

Screenshots (Blockout unless named): [Underpass, water tower](../../art/metr0niks/screenshots/level-01-underpass-water-tower.jpg), [Underpass, tenements](../../art/metr0niks/screenshots/level-02-underpass-tenements.jpg), [Freight Yard, stacks](../../art/metr0niks/screenshots/level-03-freight-yard-stacks.jpg), [Freight Yard, crane](../../art/metr0niks/screenshots/level-04-freight-yard-crane.jpg), [Smelter Row, gallery](../../art/metr0niks/screenshots/level-05-smelter-row-gallery.jpg), [Smelter Row, canyons (Cinematic)](../../art/metr0niks/screenshots/level-06-smelter-row-canyons-cinematic.jpg).

## Sections

Each zone has three sections: the north street (y 1–12), under the deck (y 13–18) and the south street (y 19–30). Coordinates are in metres: x along the map, y across it.

### Underpass (level 1): shanty market

**U1. Market lanes and the water tower plaza (north).** Shacks of 2 to 4 m sit on 2 m alleys at both ends (x 2–9 and x 21–31), with canvas awnings at 2 m strung between their walls. The middle (x 9–20) is an open plaza with the water tower: four steel legs at (12, 4), (16, 4), (12, 8) and (16, 8) carry a 5 × 5 m tank at 4 to 7 m. You drop in at the plaza's south edge, so the tower is the first thing you see.
- *Purpose:* the first fight, in the only open ground north of the deck. Stalls at (10, 3), (18, 3) and (10, 9) give the plaza some cover.
- *Collapse hook:* shoot out all four legs and the tank falls on the plaza, dealing collapse damage to everything under its 5 × 5 m footprint. It teaches "the city is a weapon" before you need the deck.
- *Sniper:* the 4 m shack at (25, 1) and the 3 m shacks at the alley ends.

**U2. Stall row (under the deck).** Market stalls (1 m barriers) stand between pillars 3, 11, 19 and 27, and the rest of the strip is open.
- *Purpose:* where you learn the pillars. Pillars 11 and 19 sit either side of the plaza, so dropping that span covers the drop-in point.
- *Spawns and pods:* the open cells here are the main landing ground for bots and pods.

**U3. Tenements (south).** Two rows of shacks, 2 to 5 m, on 2 m alleys, with awnings between them. The 4 m block at (16, 20) and the 5 m tenement at (20, 25) are the tallest roofs in the zone.
- *Purpose:* alley fighting and ambushes, where loaders bog down plowing stalls and corners.
- *Sniper:* the wave-3 boss's best perches in level 1 are (20, 25) and (16, 20).

### Freight Yard (level 2): container yard

**F1. Warehouse apron (north).** A 12 × 4 m warehouse (4 m tall, sodium-lit windows) and three sheds line the north wall. In front, three rows of container stacks at y 8–10 leave a 3 m apron (y 5–7) and a 2 m lane (y 11–12).
- *Purpose:* long east-west sightlines. The dash matters here.
- *Collapse hook:* shoot or plow out the bottom box of a stack and the boxes above fall. The 3-high stack at (41, 8) is the biggest.
- *Sniper:* the warehouse roof, the only big roof in the zone, so the sniper is easy to find here.

**F2. Loading apron (under the deck).** Open concrete with three barriers. Pillars 35, 43 and 51 hold the zone's spans.
- *Purpose:* a breather between the two yards, and where loaders get their longest charges.

**F3. Gantry yard (south).** A gantry crane covers x 37–52, y 20–29. Its four legs stand at the frame corners, the frame is at 6 m, and a trolley beam runs north-south at x 44–45. A container hangs from the hook at (44–46, 24–25), 2 m up, over the lane between four stacks of 2 or 3. Single boxes and a shed fill the edges.
- *Purpose:* the zone's set piece. Loaders charge down the lanes under the crane.
- *Collapse hook:* shoot out all four legs and the frame falls across the yard with its hanging container. Stacks under the frame fall when their bottom boxes go.

### Smelter Row (level 3+): furnace canyons

**S1. Smelter hall and slag gallery (north).** A 21 m smelter hall (6 m, furnace-lit) fills the north wall. In front of it, an iron gallery (x 59–74, y 6–8, at 3 m) on three steel legs at x 60, 66 and 72 carries three slag vats. You walk under it. Two sheds and two 8 m chimneys sit at the street's south edge, and a street vat stands at the junction at (68, 11).
- *Purpose:* the zone's set piece, a roof over the street that can come down on bots following you under it.
- *Collapse hook:* shoot out all three legs and the gallery falls with its vats onto the street.
- *Sniper:* the hall roof, the highest long roof on the map.

**S2. Slag run (under the deck).** Open street with three barriers. Pillars 59, 67 and 75 hold the last spans.
- *Purpose:* the only open ground in the zone, a refuge from the canyons that the deck can fall on.

**S3. Furnace canyons (south).** Seven halls of 3 to 7 m (the 7 m hall at (64, 20) is the tallest roof on the map) along 3 m canyons, with an 8 m chimney at (70, 22) and street vats at (62, 24) and (73, 24) where the canyons cross.
- *Purpose:* vertical fights against the sniper and the wave-5 boss. These halls make the biggest collapses on the map.
- *Collapse hook:* shoot out a vat's leg frame and the vat drops onto the street. A chimney falls when its base breaks.

## Pacing by level band

- **Level 1 (Underpass only):** the plaza, the tower and the first two pillars. The first collapse a new player sees should be the tower, which is small, close and safe.
- **Level 2 (Freight Yard opens):** the shutter falls onto open ground and long lanes, the opposite of the market. The first loader waves meet charge lanes and container stacks.
- **Level 3 and up (Smelter Row opens):** tall roofs and narrow canyons, where the boss gets its best perches. The whole sector is open from here, so later levels are about which district a wave spreads into.

## What the prototype does and what the GDD still needs

The map uses the existing support rule: anything no longer connected to the ground falls as a collapse, with the 0.9 s warning and the usual landing damage. So container stacks, the tower, the crane frame, the gallery, the street vats and the chimneys all fall without new rules. The GDD fun pass proposes richer prop behaviour (GDD-D41, not yet accepted). If kr0 accepts it, the prototype also needs:

1. **Slag spill:** vats fall as collapses today. The proposed spill, a 4 × 4 m pool for 8 s where a vat lands (25 damage a second to enemies, 10 to mechs, 15 heat a second), is not built. The crane hook rule was dropped from GDD-D41: the frame and its container fall together, as built.
2. **Tuning:** steel legs have 20 health per voxel and break on their first lost voxel, so the tower takes four quick hits. A tuning pass should decide whether that is too easy.

New materials in `sim.js`: steel, lamp and furnace windows, canvas, tank, iron and slag. The loader plows the new windows and the awnings as it does the old windows. The three art styles have hues for every district, and each zone tints its street.

**GDD Map section:** the "47 buildings, 16 barriers and 14 containers" line and the Zone identity paragraph are out of date. Once the fun-pass PR (#13) merges, the Map section gets the district table and landmark list from this document.
