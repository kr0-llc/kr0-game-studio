# Metr0niks TDD

Updated Oct 25, 2026 · @kr0 · Previous version: [superseded/tdd-2026-10-20.md](superseded/tdd-2026-10-20.md)

This version applies kr0's decisions of Oct 25 ([GDD decision history](gdd-decisions.md)) and records what the prototype already does (`prototype.html`, `sim.js`). Architecture choices that are not yet kr0's decisions are in the [TDD decision history](tdd-decisions.md) as Proposed.

## Goals and constraints

Build for one developer: fake the expensive parts, make everything data-driven, and run every mode online from the start.

- **Team:** solo developer.
- **Mode:** all play is online. Excursion (single-player or two-player co-op) and Gauntlet come first; PvP later. Mechs are tied to the player's account.
- **Platform:** PC, keyboard and mouse only for now.
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
- **Authority:** the server decides firing, heat, ATB, damage and pod ties. The "same frame" pod rule is "same server tick" online.
- **Disconnects (to build):** a dropped player can rejoin within a window (length TBD) and their mech holds in place until they do. The server keeps the match state, including the destroyed-map state, so a rejoin gets a full snapshot. Today a dropped partner is destroyed.
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
- **Navigation:** rebake the AI navmesh only in the area a collapse touched.

## Mech model

A mech is a frame with six slot sockets; its stats are recalculated from its parts whenever a part is added or changed.

- **Part data:** id, slot, rarity (common, rare or epic), cost, stat changes (power, armor, speed, weight, heat), and the hook for what it grants (weapon, ability, passive). The prototype has 21 parts in `PARTS`.
- **Base stats:** power 100, armor 100, speed 100, weight 60, heat 100; starter parts bring weight to 100.
- **Derived stats:** speed multiplier is `1 / (1 + 0.004 × (weight − 100))`; turn rate and torso tracking scale the same way; heat headroom and drain come from the reactor and heatsinks.
- **Health:** one armor pool. Hits lower it; at 0 the mech is destroyed.
- **Durability (to build):** each owned part instance carries a durability value. After an excursion, a share of the damage taken (TBD%) becomes durability damage spread over the parts, which lowers that part's stat contribution until repaired. Starter parts repair free; repair cost for other parts rises with rarity. The prototype instead carries one armor value between levels (minimum 30% on extract) and repairs 3 armor per scrap.
- **Legs:** set the locomotion ability (dash, jump-jet or anchor) and the traction and turn curves.
- **Damage regions (deferred):** left weapon, right weapon and legs can be disabled in a later version, with the weight-cap and ram decisions that came with them. Nothing in the first version depends on regions.

## Combat systems

Each heavy weapon owns a small state machine; light weapons and heat run every physics tick.

- **ATB timer:** per heavy weapon, states Charging → Ready → Ring → Charging. Fill rate = base rate × power × pod multiplier (Overclock = 2).
- **Timing ring:** on press, the ring shrinks from its start radius to 0 over its duration (start at 1.0 s). On release, score the distance to the target ring: Perfect, Good or Miss. The ring closing counts as a Miss.
- **Input:** press and hold the weapon's button to start the ring and release to lock it; movement and aiming are never blocked.
- **Heat:** one value per mech, 0–100. Shots and abilities add heat; it drains each tick. At 100, lock weapons and thrusters for 3 s and spawn a steam damage zone. Every timing result adds the same heat. An overheat during a ring cancels it as a Miss and adds no heat. The Cryo flash-vent sets heat to 0 and ends the lockout.
- **Overclock:** multiplies every ATB fill for 15 s; a running ring is unaffected.
- **Projectiles:** light weapons use hitscan or fast raycasts; heavy shells and mortar rounds are physical projectiles so they can arc and hit structures.
- **Damage:** a hit on a mech lowers its health and damages the region it strikes; a hit on a building removes voxels from the chunk. Perfect hits use a larger removal radius, which is what coring through walls means in practice.

## Camera and rendering

One orthographic camera at a fixed 45° isometric angle, following the player's mech.

- **Zoom:** orthographic size is set from the build's mass at drop-in and stays fixed for the match. Low health adds a color shift and an edge-darkening vignette, drawn under the collapse shadows and pod markers.
- **Cutaway:** each frame, find chunks between the camera and the mech and render them with a clip plane or dithered fade. Show a cross-section cap so cut walls read as solid.
- **Torso elevation:** aim height comes from the cursor's hit point on geometry, not from a screen-space angle.
- **Collapse warning:** project a shadow decal under each falling cluster, above the vignette and the cutaway. A cluster creaks for `T.collapse.warn` (0.9 s) before it falls; treads have no dash, so the lead time has to allow a walk (proposed).
- **Zone drop-in:** the shutter-and-camera shot runs on the simulation clock for 5.5 s. Input is locked and mechs can't be damaged during it (proposed; the prototype doesn't lock input yet).
- **Look:** flat-shaded voxels, one directional light, and emissive heat glow on vents and barrels.

## AI

Enemies use a simple state machine plus one scoring check for drop pods. The prototype's enemies are bots, loaders and one boss with their own data (`T.bot`, `T.loader`, `T.boss`); a shared enemy-mech model comes with PvP.

| State | Enters when | Does |
| --- | --- | --- |
| Patrol | No target in sight | Walks a route of map waypoints |
| Engage | Player in sight range | Closes to its weapon range and fires; heavy weapons use a random timing result weighted by difficulty |
| Seek pod | A pod is closer than the player, or own armor below 50% | Paths to the pod; drops back to Engage if the pod is taken |
| Retreat | Overheated or lost its main weapon | Breaks line of sight until it can fight again |

**Supports:** enemies shoot a support on purpose when the player stands under the structure it holds up.

- **Boss:** a scripted variant with its own states (for example, rooftop jumps for the sniper boss). Waves 3 and 5 use the same boss; wave 5 gets a harder variant, not yet built.
- **Level scaling:** per level above 1, enemy count +25%, hp +15%, damage +15% and scrap +10% (`T.level`).
- **Navigation:** navmesh with local rebakes after collapses (see Voxel destruction).
- **Waves:** a data file lists each wave's enemy types and counts (`T.waves`); an excursion is 5 waves. A flag on each mode turns off scrap banking and durability for Gauntlet.

## Save data

Mech data lives on a server, tied to the player's account; nothing mid-match is saved. The prototype keeps the same fields in the browser (`localStorage`) and as a copyable campaign code; moving them to the server is part of the online backend work.

- **Saved:** banked scrap, owned parts and their tiers, the equipped build, per-part durability and the campaign level.
- **Not saved:** match scrap, pod effects and match damage. Dying or leaving early discards them, and a death resets the campaign level to 1 (parts and banked scrap stay).
- **Gauntlet:** its scrap never banks and its results never change saved data; it runs from level 1 and resets to it on a loss.
- **Write points:** on extract, death and leaving the garage, the client sends the result to the server, which validates it.
- **Versioning:** a version number on the data, with a small migration step when the format changes.

## Technical risks

Destruction performance is the biggest risk; prototype it before anything else.

| Risk | What could go wrong | Spike to de-risk it |
| --- | --- | --- |
| Collapse performance | A big collapse drops the frame rate | Collapse one overpass section with 300 debris pieces and measure |
| Online backend | Accounts and saves need a server from day one; single-player is not server-backed in the prototype | Pick a backend service and load the same mech on two machines |
| Rejoin | A dropped player can't resume; the server must hold match state, including the destroyed map | Drop a client mid-collapse and rejoin from a full snapshot |
| Co-op sync | Voxel diffs and falling clusters drift between clients | Run two clients through a full excursion and compare state hashes |
| Physics stability | Falling clusters jitter, explode or tunnel through floors | Stress test stacked clusters and fast impacts |
| Readability | Players can't tell what's about to fall | Playtest the shadow warning with someone new |
| Timing ring while moving | Hold-and-release feels awkward while driving | Test with keyboard and mouse at several ring speeds |
| AI on changing terrain | Enemies get stuck after collapses | Local navmesh rebake after a collapse, timed |
| Durability tuning | Per-part durability plus all-or-nothing scrap makes a losing streak hard to climb out of | Sweep share of damage and repair cost, as the tuning history plans |
