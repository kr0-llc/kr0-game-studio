# Metr0niks TDD

Oct 20, 2026 · @kr0

## Goals and constraints

Build for one developer: fake the expensive parts, make everything data-driven, and run every mode online from the start.

- **Team:** solo developer.
- **Mode:** all play is online. Single-player Excursion and Gauntlet come first; multiplayer later. Mechs are tied to the player's account.
- **Platform:** PC, keyboard and mouse only for now.
- **Performance target:** not set yet; playtesters use high-end PCs.
- **Destruction:** looks like voxels, but uses pre-split chunks rather than a full per-voxel physics simulation.

## Engine and tools

The engine choice is deferred. Godot 4 with Jolt physics and Unity are the two options; prior experience matters more than the engine.

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

A mech is a frame with six slot sockets; its stats are recalculated from its parts whenever a part is added or a region is disabled.

- **Part data:** id, slot, mass, armor voxels, heat per use, power draw, fire mode (real time or ATB), and the weapon or ability it grants.
- **Part instance:** a voxel mesh attached to its socket. Hits lower the mech's health and damage one of three regions: left weapon, right weapon or legs.
- **Derived stats:** speed, turn rate and torso tracking scale down with total mass; heat headroom and drain come from the reactor and heatsinks.
- **Region disabling:** when a region's damage passes its threshold, disable it: a weapon stops firing and its mass is removed, disabled legs apply a movement penalty, and stats are recalculated in the same frame.
- **Legs:** set the locomotion ability (dash, jump-jet or anchor) and the traction and turn curves.

## Combat systems

Each heavy weapon owns a small state machine; light weapons and heat run every physics tick.

- **ATB timer:** per heavy weapon, states Charging → Ready → Ring → Charging. Fill rate = base rate × power × pod multiplier (Overclock = 2).
- **Timing ring:** on press, the ring shrinks from its start radius to 0 over its duration (start at 1.0 s). On release, score the distance to the target ring: Perfect, Good or Miss. The ring closing counts as a Miss.
- **Input:** press and hold the weapon's button to start the ring and release to lock it; movement and aiming are never blocked.
- **Heat:** one value per mech, 0–100. Shots and abilities add heat; it drains each tick. At 100, lock weapons and thrusters for 3 s and spawn a steam damage zone.
- **Projectiles:** light weapons use hitscan or fast raycasts; heavy shells and mortar rounds are physical projectiles so they can arc and hit structures.
- **Damage:** a hit on a mech lowers its health and damages the region it strikes; a hit on a building removes voxels from the chunk. Perfect hits use a larger removal radius, which is what coring through walls means in practice.

## Camera and rendering

One orthographic camera at a fixed 45° isometric angle, following the player's mech.

- **Zoom:** orthographic size is set from the build's mass at drop-in and stays fixed for the match. Low health adds a color shift and an edge-darkening vignette.
- **Cutaway:** each frame, find chunks between the camera and the mech and render them with a clip plane or dithered fade. Show a cross-section cap so cut walls read as solid.
- **Torso elevation:** aim height comes from the cursor's hit point on geometry, not from a screen-space angle.
- **Collapse warning:** project a shadow decal under each falling cluster.
- **Look:** flat-shaded voxels, one directional light, and emissive heat glow on vents and barrels.

## AI

Enemy mechs use a simple state machine plus one scoring check for drop pods. They use the same mech model as the player, so damage regions and heat apply to them too.

| State | Enters when | Does |
| --- | --- | --- |
| Patrol | No target in sight | Walks a route of map waypoints |
| Engage | Player in sight range | Closes to its weapon range and fires; heavy weapons use a random timing result weighted by difficulty |
| Seek pod | A pod is closer than the player, or own armor below 50% | Paths to the pod; drops back to Engage if the pod is taken |
| Retreat | Overheated or lost its main weapon | Breaks line of sight until it can fight again |

**Supports:** enemies shoot a support on purpose when the player stands under the structure it holds up.

- **Boss:** a scripted variant with its own states (for example, rooftop jumps for the sniper boss).
- **Navigation:** navmesh with local rebakes after collapses (see Voxel destruction).
- **Waves:** a data file lists each wave's enemy types and counts; an excursion is 5 waves, and a flag on each mode turns off scrap loss and repair costs for Gauntlet.

## Save data

Mech data lives on a server, tied to the player's account; nothing mid-match is saved.

- **Saved:** banked scrap, owned parts and their tiers, stat upgrades, the equipped build and durability damage.
- **Not saved:** match scrap, pod effects and match damage. Dying or leaving early discards them.
- **Gauntlet:** results never change saved data.
- **Write points:** on extract, death and leaving the garage, the client sends the result to the server, which validates it.
- **Versioning:** a version number on the data, with a small migration step when the format changes.

## Technical risks

Destruction performance is the biggest risk; prototype it before anything else.

| Risk | What could go wrong | Spike to de-risk it |
| --- | --- | --- |
| Collapse performance | A big collapse drops the frame rate | Collapse one overpass section with 300 debris pieces and measure |
| Online backend | Accounts and saves need a server from day one | Pick a backend service and load the same mech on two machines |
| Physics stability | Falling clusters jitter, explode or tunnel through floors | Stress test stacked clusters and fast impacts |
| Readability | Players can't tell what's about to fall | Playtest the shadow warning with someone new |
| Timing ring while moving | Hold-and-release feels awkward while driving | Test with keyboard and mouse at several ring speeds |
| AI on changing terrain | Enemies get stuck after collapses | Local navmesh rebake after a collapse, timed |
| Region disabling feel | Speed changes after losing a weapon feel random | Show the weight change on the HUD when a region is disabled |
