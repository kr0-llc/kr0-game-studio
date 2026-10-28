# Metr0niks level concepts (Oct 28, 2026)

kr0 (Oct 28): the voxel prototype's stages all look very similar; make a full map with breakdowns by section, starting with a few concept designs. These are suggestions, not decisions: kr0 picks one (or a mix), then the full map and section breakdown follow.

**Problem.** In `simulations/sim.js` the Underpass, Freight Yard and Smelter Row use one recipe: rows of 2 to 5 m blocks north and south of the deck, six hues cycled by block index, a barrier and a container every few metres.

**Kept in every concept.** The 80 × 32 × 8 m grid, the deck at 5 m on the ten pillars, the three zones and their unlock order, the shutters, the drop-in point (15.5, 11). Props follow the GDD round running in parallel ("Make Metr0niks GDD more fun"): deck spans in the Underpass, container stacks and a gantry crane in the Freight Yard, slag vats in Smelter Row.

| Concept | Zones differ by | Build cost | GDD decision needed |
| --- | --- | --- | --- |
| A. Three districts | Building shape, height, street width, colour and window light per zone (shanty market, container yard, furnace canyons) | Map data only | No |
| B. Landmark set pieces | One destructible set piece per zone (water tower, wall-to-wall gantry crane, slag gallery) | A "span on legs" support rule in `sim.js` | Yes |
| C. Three street shapes | Movement: a loop, three lanes, an open pour floor where the last deck span has already fallen | Data plus one span starting fallen | Yes (deck no longer runs the full length) |

**Recommendation:** A as the base with one landmark from B per zone.

## Files

- `levels.html`: the concept page (isometric and plan views, per-zone cards, today's map for comparison). Loads `concepts.js` and `../../simulations/sim.js`.
- `concepts.js`: the layouts as box lists on the sim grid.
- `check.js`: `node check.js` checks bounds, overlaps with pillars, the deck and shutter lines, and that every street cell is reachable from the drop-in point.
