# Metr0niks TDD

Updated Oct 25, 2026 · @kr0 · Earlier version: [Oct 20](superseded/tdd-2026-10-20.md)

This TDD matches the [GDD](gdd.md): one mode, Excursion, built the way the prototype builds it (`prototype.html`, `sim.js`) plus kr0's decisions of Oct 25 ([GDD decision history](gdd-decisions.md)). Architecture choices that are not yet kr0's decisions are in the [TDD decision history](tdd-decisions.md) as Proposed. What the prototype still has to change is in [prototype changes](prototype-changes.md).

## Goals and constraints

Build for one developer: fake the expensive parts and make everything data-driven. Single-player runs in the browser; co-op runs through an online room.

- **Team:** solo developer.
- **Mode:** Excursion, single-player or two-player co-op, is the only mode. Single-player runs entirely in the browser; co-op runs on a room server.
- **Platform:** PC, keyboard and mouse only. No touch controls.
- **Performance target:** not set yet; playtesters use high-end PCs.
- **Destruction:** looks like voxels, but uses pre-split chunks rather than a full per-voxel physics simulation.

## Engine and tools

The engine choice is deferred. Godot 4 with Jolt physics and Unity are the two options; prior experience matters more than the engine. The prototype is not on either: it is plain JavaScript, with the rules in `sim.js` (runs in the browser and in Node) and a canvas renderer in `prototype.html`.

| Need | Choice | Why |
| --- | --- | --- |
| Engine | Godot 4 (Jolt physics) | Free, fast to iterate, stable rigid bodies for falling chunks |
| Alternative | Unity | More voxel and destruction assets on its store |
| Voxel art | MagicaVoxel | Free; models for mech parts and building chunks |
| Data | JSON or engine resource files | Parts, pods, enemies and waves tuned without code changes |
| Version control | Git with LFS | Voxel models and textures are binary |

## Architecture

&#91;embedded content: architecture · garage, match manager and match systems\]

The garage and the match manager never run at the same time. The match manager runs the match systems. On extract or death it hands the result back to the garage, which writes the save.

## Simulation and netcode

The rules are a headless, deterministic simulation with no renderer, as [simulation and tuning](../../studio/simulation-and-tuning.md) requires. Views are clients of it.

- **Fixed step:** 1/60 s ticks, never the frame clock. Randomness comes from one seeded stream owned by the simulation. `sim.js` has no DOM, no timers and no browser globals.
- **One tuning table:** every number the rules use is a key in `T`.
- **Co-op (prototype):** a room server runs the whole simulation. Mech 0 and mech 1 are the two players; the server sends snapshots at 20 per second with voxel diffs, each client sends its input every tick and predicts only its own movement, and a silent partner's keys are released after 0.5 s. A local two-tab transport exists for testing. The server code is not in this repo.
- **Authority:** in a co-op room the server decides firing, heat, ATB, damage and pod ties. The "same frame" pod rule is "same server tick" online.
- **Leaving a room:** a partner who leaves or drops is destroyed (`dropPlayer`) and the other mech fights on; the room closes when the excursion ends.
- **Levels:** each excursion is one campaign level (1 to 50) with its own deterministic seed; a level decides which zones are open and scales enemies. A death resets the level to 1. Co-op runs at the lower of the two players' levels.
- **Checks still to build:** a headless runner, a metrics record per run and a replay hash check (see the [tuning history](tuning-history.md)).

## Voxel destruction

Buildings are pre-split into chunks linked by a support graph. When supports break, whatever is no longer connected to the ground falls as a rigid body.

1. **Author:** each building is a set of chunks (about 4×4×4 voxels each), modeled in MagicaVoxel. Chunks that carry load (pillars, beams) are tagged as supports.
2. **Graph:** at load, build a graph where each chunk links to the chunks it touches. Ground-level chunks are anchors.
3. **Damage:** weapons remove voxels from a chunk. Below a threshold the chunk breaks into debris and leaves the graph.
4. **Collapse check:** after a break, flood-fill from the anchors. Anything not reached is a loose cluster.
5. **Fall:** each loose cluster becomes one rigid body. Show a ground shadow under it before it lands.
6. **Impact:** on landing, damage whatever is under it, then break the cluster into debris and scrap cubes.

- **Rendering:** each chunk is one greedy-meshed mesh; rebuild only the chunks that changed.
- **Budget:** cap live debris pieces (start at 300) and fade the oldest first.
- **Navigation:** a walk grid rebuilt when voxels change; enemies and pods follow flow fields over it (the prototype's approach). A navmesh is not used.

## Mech model

A mech is a frame with six slot sockets; its stats are recalculated from its parts whenever a part is added or changed.

- **Part data:** id, slot, rarity (common, rare or epic), cost, stat changes (power, armor, speed, weight, heat), and the hook for what it grants (weapon, ability, passive). The prototype has 21 parts in `PARTS`.
- **Base stats:** power 100, armor 100, speed 100, weight 60, heat 100; starter parts bring weight to 100.
- **Derived stats:** speed multiplier is `1 / (1 + 0.004 × (weight − 100))`; turn rate and torso tracking scale the same way; heat headroom and drain come from the reactor and heatsinks.
- **Health:** one armor pool. Hits lower it; at 0 the mech is destroyed.
- **Durability (to build):** each owned part instance carries a durability value. On extract, each fitted non-starter part gains wear of `0.10 × damage taken ÷ max armor` (capped at 1; none on a death). `deriveStats` multiplies every helpful stat change of a worn part by `1 − wear` and leaves costly changes and hooks alone. Starter parts never wear. Repair price is `ceil(price × wear × rate)` with rate 0.25, 0.5 and 0.75 for common, rare and epic. Armor refills every level. The prototype instead carries one armor value between levels and repairs 3 armor per scrap (see prototype changes).
- **Legs:** set the dash (vectored jump-jets and strider legs dash; siege treads don't) and the traction and turn curves.

## Combat systems

Each heavy weapon owns a small state machine; light weapons and heat run every physics tick.

- **ATB timer:** per heavy weapon, states Charging → Ready → Ring → Charging. Fill rate = base rate × power × pod multiplier (Overclock = 2).
- **Timing ring:** on press, the ring shrinks from its start radius to 0 over its duration (start at 1.0 s). On release, score the distance to the target ring: Perfect, Good or Miss. The ring closing counts as a Miss.
- **Input:** press and hold the weapon's button to start the ring and release to lock it; movement and aiming are never blocked.
- **Heat:** one value per mech, 0–100. Shots and abilities add heat; it drains each tick. At 100, lock light guns, dashes and the mortar for 3 s. Every timing result adds the same heat. An overheat during a ring cancels it as a Miss and adds no heat. The Cryo flash-vent sets heat to 0 and ends the lockout.
- **Overclock:** multiplies every ATB fill for 15 s; a running ring is unaffected.
- **Projectiles:** every light shot, shell and mortar round is a moving object stepped each tick; shells and mortar rounds arc and blast a 3×3×3 voxel volume.
- **Damage:** a hit on a mech lowers its single armor pool; a hit on a building removes voxels from the chunk. Perfect hits use a larger removal radius, which is what coring through walls means in practice.

## Camera and rendering

One camera at a fixed 2:1 dimetric angle (20 px by 10 px per cell, 22 px per height unit), following the player's mech with an 18% lean toward the aim point.

- **Zoom:** set from the window size (between 0.9 and 2.4), never from the build. Low health adds an edge-darkening vignette, drawn under the collapse shadows and pod markers.
- **Cutaway:** voxels in front of the mech inside an ellipse around it draw at 16% opacity.
- **Aim height:** the aim point is the first solid wall face under the cursor (up to about 2 m), or an enemy under the cursor within 34 px, which is how the rooftop sniper is targeted.
- **Collapse warning:** project a shadow decal under each falling cluster, above the vignette and the cutaway. A cluster creaks for `T.collapse.warn` (0.9 s) before it falls; 
- **Zone drop-in:** the shutter-and-camera shot runs on the simulation clock for 5.5 s. Input is locked and mechs take no damage during it.
- **Look:** flat-shaded voxels, one directional light, and emissive heat glow on vents and barrels.

## AI

Enemies use a simple state machine plus one scoring check for drop pods. They are patrol bots, heavy loaders and one boss, each with its own data (`T.bot`, `T.loader`, `T.boss`).

| State | Enters when | Does |
| --- | --- | --- |
| Patrol | No target in sight | Wanders between random street cells |
| Engage | A mech in sight range, or the bot was hurt | Closes to its weapon range, fires an orb every 1.25 s, strafes and backs off when close; gives up after 3 s unseen |
| Seek pod | A pod is closer than the nearest mech, or own health below 50% | Paths to the pod at 1.1× speed; drops back if the pod is taken |

Heavy loaders patrol, hunt on sight and charge (tell 0.5 s, charge up to 1 s at 5 m/s). The boss perches on roof edges, fires after a 0.6 s tell and jumps between perches. Only patrol bots seek pods. Enemies don't aim at supports; only the loader's charge damages the map.

- **Boss:** a scripted variant with its own states (for example, rooftop jumps for the sniper boss). Waves 3 and 5 use the same boss; on wave 5 it has 1.5× health, fires every 1.5 s and drops 18 scrap (not yet built).
- **Level scaling:** per level above 1, enemy count +25%, hp +15%, damage +15% and scrap +10% (`T.level`).
- **Navigation:** flow fields over the walk grid, refreshed when voxels change (see Voxel destruction).
- **Waves:** a data file lists each wave's enemy types and counts (`T.waves`); an excursion is 5 waves.

## Save data

The save is one campaign code, base64url JSON, kept in the browser (`localStorage`, key `metr0niks.campaign`) and copyable from the garage. In a co-op room the room's campaign replaces each client's.

- **Saved:** banked scrap, owned parts, the equipped build, per-part wear, the campaign level and the seed.
- **Not saved:** match scrap, pod effects and match damage. Dying or leaving early discards them, and a death resets the campaign level to 1 (parts and banked scrap stay).
- **Validation:** decoding rejects unknown part ids, negative or oversized scrap, wear outside 0 to 1, a level outside 1 to 50 and more than two players.
- **Write points:** on extract, on death and on leaving the garage.
- **Versioning:** a version number (`v`) on the data, with a small migration step when the format changes.

## Technical risks

Destruction performance is the biggest risk; prototype it before anything else.

| Risk | What could go wrong | Spike to de-risk it |
| --- | --- | --- |
| Collapse performance | A big collapse drops the frame rate | Collapse one overpass section with 300 debris pieces and measure |
| Co-op sync | Voxel diffs and falling clusters drift between clients | Run two clients through a full excursion and compare state hashes |
| Physics stability | Falling clusters jitter, explode or tunnel through floors | Stress test stacked clusters and fast impacts |
| Readability | Players can't tell what's about to fall | Playtest the shadow warning with someone new |
| Timing ring while moving | Hold-and-release feels awkward while driving | Test with keyboard and mouse at several ring speeds |
| AI on changing terrain | Enemies and pods get stuck behind rubble | Refresh the flow field after a collapse and time it |
| Durability tuning | Per-part durability plus all-or-nothing scrap makes a losing streak hard to climb out of | Sweep share of damage and repair cost, as the tuning history plans |
