# Metr0niks mechanics lab

Oct 28, 2026 · @kr0 asked for it · built by Claude

`prototypes/mechanics-lab.html` tests one mechanic at a time: each weapon, part swaps, drop pods, scrap, collapses and each enemy. It is not a new prototype. It loads the voxel prototype (`prototype.html`, prototype 1) in a frame and drives it through the prototype's test hooks, so the renderer, input, HUD and every rule are the real game's, and every number comes from `simulations/sim.js` (GDD-D32, GDD-D46).

Hypothesis: checking each mechanic in isolation, with what sim.js says next to what actually happens, catches feel and tuning problems faster than playing full waves.

## How to open it

From a local web server in `games/metr0niks/` (for example `python3 -m http.server`), open `prototypes/mechanics-lab.html`. A published copy is linked in INDEX.md. Keyboard and mouse only.

## What it does

- Stops the waves, the wave-clear extraction and the random pods by holding `sim.run` each tick, before `sim.step()`, unless Real waves is on. Nothing in sim.js changes.
- 23 tests in five groups: Weapons (minigun, shotgun, plasma, rail, pile-bunker timing, bunker-buster, mag-winch, mortar, flash-vent), Parts (legs and weight, reactor and power), Pickups (drop pods, pod race, scrap and magnet), World (pillar collapse, loader charge, Bounty sniper) and Blueprints (Arc caster chain, Redline vent armor cost, Breach charges on a pillar, Seismic hammer, Grav-skids and Overdrive core, call-ins). Keys 1 to 9, `[` and `]`; in the call-ins test, keys 1 and 2 pressed in the game call in instead. The spawn row adds Scrap cache and Strike beacon pods, and No Q cooldown also refills Breach charges.
- Loadout: any part in any slot, swapped mid-test with `sim.applyBuild`; the prototype relabels its HUD through a new `__m.hud()` hook. The `__m.level()` test hook now also sets the level the HUD shows. These are the only changes to `prototype.html`.
- Measured: DPS over the last 3 s and per burst, damage per target with distance, time from cold to lockout, ring grades, armor taken, speed, shots, kills.
- Expected: the same figures worked out from `MetroSim.T` and `deriveStats` for the fitted build.
- Levels: pick any level from 1 to 50 or press Next level. Zones open and enemies scale as in the game (`T.level`), and lab-spawned bots scale too. With waves off a new zone's gate falls at once. Real waves turns the level's five waves, pods and drop-in back on; clearing wave 5 moves the lab up a level, and a death (with Can't die off) restarts the level.
- Range switches: can't die (armor stops at 1), endless dummies, cold guns, instant ATB, no Q cooldown; spawn dummies, live bots, loaders, a sniper, pods and scrap.
- Dummies are bots whose AI state the sim does not know, so they stand still and never shoot; dummy loaders are held in their recover state. Each test starts from a fresh level-1 city.
- The lab drops the sim's run-over event, so it never banks scrap or writes the campaign save.

## Found while building it

Fixed Oct 28, 2026 (kr0: sync with the GDD): guns fired slower than `T` says because the sim reset a gun's cooldown to `1/rate` after each shot and only fires on a 60 Hz tick (minigun 10 a second, plasma 12). The sim now carries the tick's leftover time into the next shot, so the minigun fires 11 a second and the plasma cutter 14, as the GDD says. Measured over 10 s of held fire: minigun 11, plasma 14.1, shotgun 1.9, rail 1.0 a second.

## Garage lab

`prototypes/garage-lab.html` (Oct 28, 2026, kr0 asked to see how parts look on the mech, with every icon) loads the same prototype into its own garage. Every part is unlocked, and the frame's writes to the campaign save are blocked. The side panel has a sheet of all 27 part icons by slot (the six phase 6 blueprints included), drawn by the prototype's `drawIcon`. Click a part to preview it on the turntable mech, press Fit (or double-click) to equip it, and use Starter build, Random build or Test drive. The art style switch redraws the icons and the mech. It adds two garage test hooks to `prototype.html`, `__m.garage.icon()` and `__m.garage.ownAll()`. Below 1320 px wide the garage frame is drawn at 1320 px and scaled to fit.

## Units lab

`prototypes/unit-lab.html` (Oct 28, 2026, kr0 asked to see every enemy, its behaviours and animations) drives the same prototype with waves off. You pick the patrol bot, heavy loader or Bounty sniper, then trigger one behaviour at a time by setting the sim's own state. The bot can drop in, patrol, engage and fire, go for a pod, freeze, take a hit and be destroyed. The loader can drop in, haul its route, tell and charge, engage and freeze. The sniper can perch, aim and fire, jump, be knocked off its roof, and freeze.

- Enemy AI is off by default, so units stand idle until you trigger something. Turn it on to let the game's AI run.
- Time runs at pause, 0.1×, 0.25×, 0.5× or 1×, with single-frame and ten-frame stepping, for watching animations.
- A live table shows each unit's state, armor, distance and timers.
- Each unit's numbers come from `T` and scale with the chosen level.
- Wave 1 to 5 buttons drop that wave's real mix with live AI.
- The units lab needs no change to `prototype.html` beyond the hooks above.
