# Metr0niks item lab (ink prototype)

Oct 28, 2026 · @kr0 asked for it · built by Claude

`prototypes/item-lab.html` shows every garage part on Tim-o, drawn in the ink style of prototype 2 (`prototype-ink.html`). kr0 asked for "an item lab artifact where I can see the different items and also equip them on tim0 and see how they look." It is a look-and-fit check, not a new prototype: the parts, prices, stat changes and rules all come from `simulations/sim.js` (`MetroSim.PARTS` and `deriveStats`), so it can't drift from the game (GDD-D32).

Hypothesis: seeing each part on the mech, with what it does and what it costs, shows which parts read clearly at game size and which need another drawing pass before the ink renderer is built out (GDD-D46).

## How to open it

From a local web server at the repo root (for example `python3 -m http.server`), open `games/metr0niks/prototypes/item-lab.html`. The published copy is linked in INDEX.md. A build can be shared as a link: the page keeps it in the address (`#core=slag&armR=rail&...`).

## What it does

- Lists all 21 parts in sim.js by slot (core, arm-R, arm-L, shoulder, legs, reactor) with rarity, price, stat changes and the sim's description. Click a part to put it on Tim-o. Starter build, Random build and Copy build link.
- Draws Tim-o as the same cut-out puppet as the ink prototype: v2.1 parts, two-bone IK legs, arms that follow the mouse inside the game's clamp. Walk (the floor scrolls in step with the build's top speed), Face left, Zoom, three backgrounds (the ink garage, paper, night) and a Joints overlay that marks every pivot.
- Shows what each part does, using the sim's rates, ranges and heat where they fit on screen: minigun stream, shotgun's six-pellet spread, plasma torch, rail beam, pile-bunker thrust, bunker-buster shell and recoil, mag-winch cable at 8 m, twin mortar shells, flash-vent frost blast, salvage-magnet pull, jump-jet dash (treads refuse it). A heat bar fills at each gun's heat per shot and locks the guns for the sim's 3 s.
- Stats from `deriveStats` for the fitted build against the starter build: armor, top speed, power, heat multiplier, cooling, weight, plus switches such as no dash, shove immune and self-repair.

## The art

17 parts were new. They were drawn by Scenario (GPT Image 2.5 Sunburst, about 20 credits) as five parts sheets that use parts sheet v2.1 and the four-view turnaround as references, so they match the v2.1 puppet's camera, scale and line. The arms were fitted by matching each arm's shoulder pad to the v2.1 minigun arm; the rest were jointed by hand. Sheets, atlas and joints: `art/metr0niks/characters/tim-o/items/`. Prompts: `art/metr0niks/prompts/tim-o-items-v1.txt`. Builder: `art/metr0niks/source/timo_items_atlas.py`.

## Known limits

- Like the v2.1 puppet, every part is drawn from one side and mirrored, so there is no back view.
- Shoulder modules clip on behind the top of the torso; the GDD doesn't say where they sit, so that spot is a guess.
- Effects are drawn in code to show what a part does. They aren't the final effects.
- The six blueprint parts (GDD fun pass) and call-in pods aren't in sim.js yet, so they aren't in the lab.
- The parts have not been through an animation review, and nothing here is in `prototype-ink.html` yet.
