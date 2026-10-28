# Metr0niks level design: Overpass Sector 4 (five sectors)

Updated Oct 28, 2026 · @kr0 · Ink prototype's version: [level-design-ink.md](level-design-ink.md) · Concepts: [research/level-concepts/](research/level-concepts/README.md) · Concept page: https://claude.ai/artifact/X8y8t7nd96zwL1BeCetdzC

On Oct 28 kr0 said the voxel prototype's zones all look very similar and asked for a full map with a breakdown by section. kr0 picked concept **A + B landmarks**: each zone is its own district, with one landmark that falls under the same support rule as the deck. The map is built in `simulations/sim.js` (`MAP`), so the voxel prototype plays it. `node simulations/map-check.js` checks it. Later on Oct 28 kr0 asked to grow the map to five sectors and give the last one room for a big boss fight. That adds the Glass Quarter and the Terminus Yard arena, where the deck ends. kr0 also said to focus on voxel and keep it as it is (GDD-D46), so the map stays voxel data in `sim.js`. Then kr0 asked for bigger sectors so two people can play comfortably, so every sector was scaled up 1.5× with the same layout and landmarks.

## What stays the same

The map is 8 m high with an indestructible perimeter, as before. For two players it is now 48 m across (was 32) and 216 m long (was 144 before the scale-up, 80 at the start). Heights did not change: the deck is still at 5 m, buildings are still 2 to 7 m and the landmarks still stand at the same height. The deck is 8 m wide (y 20–27), on fourteen pillars every 12 m from x = 5 to 161, and ends at x = 167 over the arena's entrance. One zone opens per level, so levels 2 to 5 each open on a drop-in shot. Player 1 drops in at (23.5, 17.5) and player 2 beside them at (26, 17.5). Waves, enemies and every number in `T` are unchanged.

**Room for two.** `map-check.js` counts how much of each zone's street sits inside a clear 4 × 4 m square, enough for two mechs side by side. Before the scale-up it was 45% in the Underpass, 79% in the Freight Yard and 63% in Smelter Row and the Glass Quarter. Now it is 80%, 92%, 79%, 79% and 96% in the Terminus Yard, and the check fails if any zone drops below 75%. Alleys and canyons are each about a metre wider. Because waves didn't change, the same number of enemies is now spread over about 2.25 times the floor, so fights in a solo run will feel sparser. That is a tuning question for the GDD (wave sizes, or spawns that follow the players).

## The map at a glance

| | Underpass (x 0–47) | Freight Yard (x 48–83) | Smelter Row (x 84–119) | Glass Quarter (x 120–167) | Terminus Yard (x 168–215) |
| --- | --- | --- | --- | --- | --- |
| District | Shanty market | Container yard | Furnace canyons | Financial district | The arena |
| Opens at | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
| Landmark | Water tower over the plaza | Gantry crane over the south yard | Slag gallery over the north street | Neon billboard over the plaza | Open sky: no deck, a 27 m clear floor |
| Hazard prop (GDD-D41) | Deck spans | Container stacks, gantry crane | Slag vats | Deck spans, billboard | Container stacks |
| Buildings | 24 shacks, 2 to 5 m (one 5 m tenement) | 4 (an 18 m warehouse, three sheds) | 10 halls, 2 to 7 m (four of 5 m or more), 3 chimneys | 15 glass towers, 3 to 7 m (ten of 5 m or more) | 4 pylons of 6 m, 2 bunkers of 3 m |
| Cover | 10 stalls and barriers, 7 awnings, 1 container | 13 container stacks (25 boxes, 2 or 3 high), 3 barriers | 3 barriers, 7 slag vats | 7 planters and barriers | 4 barriers, 4 short container stacks, 4 scrap heaps, all at the rim |
| Street cells | 1774 | 1422 | 1150 | 1582 | 1985 |
| Sniper roof cells | 263 | 78 | 233 | 318 | 84 |
| Room for two (4 × 4 m) | 80% | 92% | 79% | 79% | 96% |
| Colour | Brick, ochre, slate; cyan windows | Concrete and tin, bright containers; sodium-yellow windows; pale concrete pad | Iron and soot; orange furnace windows; scorched ground | Blue glass, steel and white stone; pink neon windows; cool ground | Hazard ochre and scrap grey; a painted ring on the floor |
| Plays like | Close range, a corner every few metres | Long sightlines, open ground, charge lanes | Vertical, with the sniper above you in narrow canyons | A tall grid, with perches on every corner | An open finale, circling in the middle and taking cover at the edge |

Screenshots (Blockout unless named): [Underpass, water tower](../../art/metr0niks/screenshots/level-01-underpass-water-tower.jpg), [Underpass, tenements](../../art/metr0niks/screenshots/level-02-underpass-tenements.jpg), [Freight Yard, stacks](../../art/metr0niks/screenshots/level-03-freight-yard-stacks.jpg), [Freight Yard, crane](../../art/metr0niks/screenshots/level-04-freight-yard-crane.jpg), [Smelter Row, gallery](../../art/metr0niks/screenshots/level-05-smelter-row-gallery.jpg), [Smelter Row, canyons (Cinematic)](../../art/metr0niks/screenshots/level-06-smelter-row-canyons-cinematic.jpg), [Glass Quarter, billboard](../../art/metr0niks/screenshots/level-07-glass-quarter-billboard.jpg), [Glass Quarter, towers](../../art/metr0niks/screenshots/level-08-glass-quarter-towers.jpg), [Terminus Yard, arena](../../art/metr0niks/screenshots/level-09-terminus-yard-arena.jpg), [Terminus Yard, rim](../../art/metr0niks/screenshots/level-10-terminus-yard-rim.jpg).

## Sections

Zones 1 to 4 each have three sections: the north street (y 1–19), under the deck (y 20–27) and the south street (y 28–46). Coordinates are in metres: x along the map, y across it.

### Underpass (level 1): shanty market

**U1. Market lanes and the water tower plaza (north).** Shacks of 2 to 4 m sit on 3 m alleys at both ends (x 3–13 and x 32–47), with canvas awnings at 2 m strung between their walls. The middle (x 14–30) is an open plaza with the water tower: four steel legs at (18, 6), (25, 6), (18, 13) and (25, 13) carry an 8 × 8 m tank at 4 to 7 m. You drop in at the plaza's south edge, so the tower is the first thing you see.
- *Purpose:* the first fight, in the only open ground north of the deck. Stalls at (15, 5), (27, 5) and (15, 14) give the plaza some cover.
- *Collapse hook:* shoot out all four legs and the tank falls on the plaza, dealing collapse damage to everything under its 8 × 8 m footprint. It teaches "the city is a weapon" before you need the deck.
- *Sniper:* the 4 m shack at (38, 2) and the 3 m shacks at the alley ends.

**U2. Stall row (under the deck).** Market stalls (1 m barriers) stand between pillars 5, 17, 29 and 41, and the rest of the strip is open.
- *Purpose:* where you learn the pillars. Pillars 17 and 29 sit either side of the plaza, so dropping that span covers the drop-in point.
- *Spawns and pods:* the open cells here are the main landing ground for bots and pods.

**U3. Tenements (south).** Two rows of shacks, 2 to 5 m, on 3 m alleys, with awnings between them. The 4 m block at (24, 30) and the 5 m tenement at (30, 38) are the tallest roofs in the zone.
- *Purpose:* alley fighting and ambushes, where loaders bog down plowing stalls and corners.
- *Sniper:* the wave-3 boss's best perches in level 1 are (30, 38) and (24, 30).

### Freight Yard (level 2): container yard

**F1. Warehouse apron (north).** An 18 × 6 m warehouse (4 m tall, sodium-lit windows) and three sheds line the north wall. In front, rows of container stacks at y 12–15 leave a 4 m apron (y 8–11) and a 4 m lane (y 16–19).
- *Purpose:* long east-west sightlines. The dash matters here.
- *Collapse hook:* shoot or plow out the bottom box of a stack and the boxes above fall. The 3-high stack at (62, 12) is the biggest.
- *Sniper:* the warehouse roof, the only big roof in the zone, so the sniper is easy to find here.

**F2. Loading apron (under the deck).** Open concrete with three barriers. Pillars 53, 65 and 77 hold the zone's spans.
- *Purpose:* a breather between the two yards, and where loaders get their longest charges.

**F3. Gantry yard (south).** A gantry crane covers x 56–79, y 30–44. Its four legs stand at the frame corners, the frame is at 6 m, and a trolley beam runs north-south at x 66–67. A 4 × 3 m container hangs from the hook at (66–69, 36–38), 2 m up, over the lane between four stacks of 2 or 3. Single boxes and a shed fill the edges.
- *Purpose:* the zone's set piece. Loaders charge down the lanes under the crane.
- *Collapse hook:* shoot out all four legs and the frame falls across the yard with its hanging container. Stacks under the frame fall when their bottom boxes go.

### Smelter Row (level 3): furnace canyons

**S1. Smelter hall and slag gallery (north).** A 31 m smelter hall (6 m, furnace-lit) fills the north wall. In front of it, an iron gallery (x 89–112, y 9–13, at 3 m) on three steel legs at x 90, 99 and 108 carries four slag vats. You walk under it. Two sheds and two 8 m chimneys sit at the street's south edge, and a street vat stands at the junction at (102, 17).
- *Purpose:* the zone's set piece, a roof over the street that can come down on bots following you under it.
- *Collapse hook:* shoot out all three legs and the gallery falls with its vats onto the street.
- *Sniper:* the hall roof, the highest long roof on the map.

**S2. Slag run (under the deck).** Open street with three barriers. Pillars 89, 101 and 113 hold the zone's spans.
- *Purpose:* the only open ground in the zone, a refuge from the canyons that the deck can fall on.

**S3. Furnace canyons (south).** Seven halls of 3 to 7 m (the 7 m hall at (96, 30) is the tallest roof on the map) along 3 to 4 m canyons, with an 8 m chimney at (105, 33) and street vats at (93, 36) and (110, 36) where the canyons cross.
- *Purpose:* vertical fights against the sniper and the wave-5 boss. These halls make the biggest collapses on the map.
- *Collapse hook:* shoot out a vat's leg frame and the vat drops onto the street. A chimney falls when its base breaks.

### Glass Quarter (level 4): financial district

**G1. Billboard plaza (north).** Four glass towers of 6 to 7 m line the north wall, with two 4 m blocks in front. Between them, a plaza (x 132–152, y 9–19) sits under a neon billboard: a 12 × 3 m sign at 4 to 7 m on two steel legs at (138, 14) and (146, 14). Planters at (134, 11), (149, 17) and (141, 18).
- *Purpose:* a second, harder plaza that mirrors the Underpass's. It has more roofs around it and a smaller footprint above it.
- *Collapse hook:* shoot out both legs and the sign falls on the plaza.
- *Sniper:* every tower corner. This zone has the most perches on the map.

**G2. Boulevard (under the deck).** Four barriers. Pillars 125, 137, 149 and 161 hold the zone's spans. The span on pillar 161 is the last one, and its end hangs over the arena shutter.
- *Purpose:* the fastest way through the zone. Dropping the span between 149 and 161 blocks the road to the arena.

**G3. Tower grid (south).** Two rows of towers of 3 to 7 m on a grid of 3 to 4 m streets, with five north-south cross streets.
- *Purpose:* corner fighting with glass that shatters. The tallest towers, (140, 30) at 7 m and (153, 41) at 5 m, give the sniper a view down every cross street.

### Terminus Yard (level 5): the arena

The deck ends at x = 167, so the last zone has open sky. It is 46 × 46 m of open yard, built for a big boss fight.

**T1. The floor (middle).** The clear floor is at least 24 × 24 m (`map-check.js` measures 27 m), with a dashed ring of radius 12 m painted around (192, 24). Nothing stands inside the ring.
- *Purpose:* room to circle, dash and kite something large without a wall in the way. The GDD's Warden (PR #13: four legs, a 6 × 6 m body 5 m up, entering from the far end) fits with room for two mechs to circle under it.

**T2. The rim (edges).** Four 6 m pylons stand in the corners and two 3 m bunkers sit mid-wall north and south. Four short container stacks sit at (176, 14), (206, 14), (176, 33) and (206, 33), with barriers outside them and scrap heaps at the east and west edges and mid-wall.
- *Purpose:* cover to break line of sight and catch your breath, always at the edge so the middle stays open. The stacks fall when their bottom box goes.
- *Sniper:* the pylons and bunkers.

**The big boss is in the GDD, not the prototype.** PR #13 proposes the Warden as level 5's wave-5 boss. `sim.js` doesn't have it yet, so the wave-5 sniper still fights from the rim.

## Pacing by level band

- **Level 1 (Underpass only):** the plaza, the tower and the first two pillars. The first collapse a new player sees should be the tower, which is small, close and safe.
- **Level 2 (Freight Yard opens):** the shutter falls onto open ground and long lanes, the opposite of the market. The first loader waves meet charge lanes and container stacks.
- **Level 3 (Smelter Row opens):** tall roofs and narrow canyons, where the boss gets its best perches.
- **Level 4 (Glass Quarter opens):** the tallest skyline and the most perches. The sniper is at its strongest here.
- **Level 5 (Terminus Yard opens):** the open arena past the end of the deck, and the whole sector is open. In the GDD (PR #13) the campaign is five levels, one per zone, with the Warden at the end.

## What the prototype does and what the GDD still needs

The map uses the existing support rule: anything no longer connected to the ground falls as a collapse, with the 0.9 s warning and the usual landing damage. So container stacks, the tower, the crane frame, the gallery, the street vats and the chimneys all fall without new rules. The GDD fun pass proposes richer prop behaviour (GDD-D41, not yet accepted). If kr0 accepts it, the prototype also needs:

1. **Slag spill:** vats fall as collapses today. The proposed spill, a 4 × 4 m pool for 8 s where a vat lands (25 damage a second to enemies, 10 to mechs, 15 heat a second), is not built. The crane hook rule was dropped from GDD-D41: the frame and its container fall together, as built.
2. **Tuning:** steel legs have 20 health per voxel and break on their first lost voxel, so the tower takes four quick hits. A tuning pass should decide whether that is too easy.

New materials in `sim.js`: steel, lamp, furnace and neon windows, canvas, tank, iron and slag. `MAP.overpass.x1` sets where the deck ends, `MAP.rubble` places scrap heaps, and `zones[k].arena` paints the arena ring. The loader plows the new windows and the awnings as it does the old windows. The three art styles have hues for every district, and each zone tints its street.

**GDD Map section:** rewritten from this document after the fun pass (#13) merged (GDD-D56): the map size, the deck, the drop-in points, the district table, one zone per level and the water tower as a hazard prop.
