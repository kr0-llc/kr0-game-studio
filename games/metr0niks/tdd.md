# Metr0niks TDD

Updated Oct 28, 2026 · @kr0 · Earlier versions: [Oct 20](superseded/tdd-2026-10-20.md), [Oct 26](superseded/tdd-2026-10-26.md), [Oct 27](superseded/tdd-2026-10-27.md)

This TDD matches the [GDD](gdd.md): one mode, Excursion, built the way the prototype builds it (`prototype.html`, `sim.js`) plus kr0's decisions up to the Oct 28 fun pass (GDD-D35 to GDD-D55, [GDD decision history](gdd-decisions.md)). Architecture choices that are not yet kr0's decisions are in the [TDD decision history](tdd-decisions.md) as Proposed. What the prototype still has to change is in [prototype changes](prototypes/prototype-changes.md), and the build order for the fun pass is the [implementation plan](decisions/2026-10-28-fun-pass-implementation-plan.md). Most of the fun pass isn't built yet; where this TDD describes it, it says "(to build)".

## Goals and constraints

Build for one developer: fake the expensive parts and make everything data-driven. Single-player runs in the browser; co-op runs through an online room.

- **Team:** solo developer.
- **Mode:** Excursion, single-player or two-player co-op, is the only mode. Single-player runs entirely in the browser; co-op runs on a room server.
- **Platform:** PC, keyboard and mouse only. No touch controls.
- **Performance target:** not set yet; playtesters use high-end PCs.
- **Destruction:** looks like voxels, but uses pre-split chunks rather than a full per-voxel physics simulation.
- **Look:** voxels first; rendering stays swappable, so a later renderer can replace the look without touching the rules (GDD-D46). Until then the voxel prototype is the only build being developed; the ink prototype is paused.

## Engine and tools

The engine choice is deferred. Godot 4 with Jolt physics and Unity are the two options; prior experience matters more than the engine. The prototype is not on either: it is plain JavaScript, with the rules in `sim.js` (runs in the browser and in Node) and a canvas renderer in `prototype.html`.

| Need | Option | Why |
| --- | --- | --- |
| Engine (option 1, not chosen) | Godot 4 (Jolt physics) | Free, fast to iterate, stable rigid bodies for falling chunks |
| Engine (option 2, not chosen) | Unity | More voxel and destruction assets on its store |
| Voxel art | MagicaVoxel | Free; models for mech parts and building chunks |
| Data | JSON or engine resource files | Parts, pods, enemies and waves tuned without code changes |
| Version control | Git with LFS | Voxel models and textures are binary |

## Architecture

&#91;embedded content: architecture · garage, match manager and match systems\]

The garage and the match manager never run at the same time. The match manager runs the match systems. On extract or death it hands the result back to the garage, which writes the save.

- **Rules and views:** every rule lives in `sim.js`. The prototype is a view: it draws sim state, plays sounds from sim events and sends input. Presentation effects (hit-stop, stamps, camera punch) never pause or change the sim, so a new renderer can replace the voxel look later (GDD-D46).
- **Between matches:** the garage reads the campaign save and the climb plan (see Simulation and netcode) to show the next level, sell parts and call-ins, repair and upgrade. It never runs the sim.

## Simulation and netcode

The rules are a headless, deterministic simulation with no renderer, as [simulation and tuning](../../studio/simulation-and-tuning.md) requires. Views are clients of it.

- **Fixed step:** 1/60 s ticks, never the frame clock. Randomness comes from one seeded stream owned by the simulation. `sim.js` has no DOM, no timers and no browser globals.
- **One tuning table:** every number the rules use is a key in `T`. A run can take overrides: `create({tune})` merges them over a copy of `T` used for that run only, so sector conditions and sweep variants never change the shared default (TDD-D11, to build).
- **Co-op (prototype):** a room server runs the whole simulation. Mech 0 and mech 1 are the two players; the server sends snapshots at 20 per second with voxel diffs, each client sends its input every tick and predicts only its own movement, and a silent partner's keys are released after 0.5 s. A local two-tab transport exists for testing. The server code is not in this repo.
- **Authority:** in a co-op room the server decides firing, heat, ATB, damage, kill credit, contracts and pod ties. The "same frame" pod rule is "same server tick" online. Overtime and call-ins arrive as input bits like every other action.
- **Input:** a bitmask per tick (WASD, Space, Q today). The fun pass adds F (Overtime), Enter or R (extract now) and 1 and 2 (call-ins at the aim point) (to build).
- **Leaving a room:** a guest who leaves or drops is destroyed (`dropPlayer`) and the other mech fights on. A host who leaves ends the room for both (GDD-D52, to build): the guest's match ends with their match scrap lost, and the host's in-match mark makes it a death on the host's next load.
- **Levels:** each excursion is one campaign level, 1 to 5, one zone per level (GDD-D47); a level decides which zones are open and scales enemies. Each level's sim seed comes from the climb seed (`levelSeed`). A death, or leaving mid-match, resets the level to 1 and is saved at once. Extracting level 5 ends the campaign with a victory screen. Co-op runs the host's campaign: its level, seed and zones (GDD-D31). The prototype still caps at level 50 (`T.level.max`) until phase 2 of the plan.
- **Seed per climb (GDD-D49, to build):** a new campaign, a death and a victory restart pick a new random climb seed outside the sim, unless the player typed one at level 1 for that climb.
- **Climb plan (TDD-D10, to build):** `Campaign.plan(campaign)` works out, from the climb seed alone and its own seeded stream, each level's sector condition, contract and wave-3 and wave-5 bosses: no repeats in a climb, mild conditions only on level 1, the sniper on level 1 wave 3, the Warden on level 5 wave 5, and no contract that can't be done there. The garage shows the next level from it before any sim exists; the sim takes the level's entry as `create({plan})`. It is never saved; loading recomputes it.
- **Match flow (to build):** after wave 5 the run enters a 6 s `choose` state: Overtime builds a sixth wave, extract banks the scrap. Contracts are checks over the match stats; sector conditions are tuning overrides plus a few flags (Blackout's sight cut, Sniper's nest, Pod rain, Loose pillars).
- **Co-op revive:** when a wave below the last clears, the sim revives a downed mech if the survivor's wallet covers `T.coop.revivePrice` scaled by level, at `T.coop.reviveArmor` (GDD-D24). Damage-taken totals carry across the revive, and every mech's total goes in the extract event for wear. Calling Overtime runs the check after wave 5 too.
- **Match stats (TDD-D13, to build):** the sim keeps `stats[mech][wave]`, every GDD-D50 counter, sends a wave's stats in a wave-clear event and the whole record in the run-over event. The runner writes the same record, so the player and the sweep see the same numbers.
- **Checks:** `map-check.js` checks the map. To build (TDD-D17): `run.js`, a headless runner with a scripted player that writes a metrics record per run and replays one run per batch to compare state hashes, and `rules-check.js`, short scripted scenarios that assert a rule each. The [mechanics lab](prototypes/mechanics-lab.md) and its garage and unit labs test one mechanic at a time in the real prototype.

## Voxel destruction

Buildings are pre-split into chunks linked by a support graph. When supports break, whatever is no longer connected to the ground falls as a rigid body.

1. **Author:** each building is a set of chunks (about 4×4×4 voxels each), modeled in MagicaVoxel. Chunks that carry load (pillars, beams) are tagged as supports.
2. **Graph:** at load, build a graph where each chunk links to the chunks it touches. Ground-level chunks are anchors.
3. **Damage:** weapons remove voxels from a chunk. Below a threshold the chunk breaks into debris and leaves the graph.
4. **Collapse check:** after a break, flood-fill from the anchors. Anything not reached is a loose cluster.
5. **Fall:** each loose cluster becomes one rigid body. Show a ground shadow under it before it lands.
6. **Impact:** on landing, damage whatever is under it. Landing voxels at street level may stay as rubble; the rest breaks into debris, and a piece of more than 6 voxels scatters 2 to 4 scrap cubes.

- **Rendering:** each chunk is one greedy-meshed mesh; rebuild only the chunks that changed.
- **Budget:** cap live debris pieces (start at 300) and fade the oldest first.
- **Navigation:** a walk grid rebuilt when voxels change; enemies and pods follow flow fields over it (the prototype's approach). A navmesh is not used.
- **Map:** Overpass Sector 4 is 216 × 48 × 8 cells in five zones, built as voxel data in `MAP` ([level design](level-design.md)). The hazard props (container stacks, gantry crane, slag vats, billboard, water tower) are structures under the same support rule as the deck.
- **Credit for collapses (to build):** when a chunk breaks, the falling cluster records the mech whose hit broke it, or nobody when an enemy's charge, blast or the Juggernaut broke it. Landing damage goes through the hit path with that source, so collapse kills get kill credit and the demolition bonus (GDD-D41, GDD-D48).
- **Collapse damage (to build):** to enemies, `T.collapse.botDmg` scaled with enemy health by level; to mechs, 40 at any level.
- **Slag spill (to build):** a slag vat that lands leaves a 4 × 4 m pool entity for 8 s that damages and heats whatever stands in it.

## Mech model

A mech is a frame with six slot sockets; its stats are recalculated from its parts whenever a part is added or changed.

- **Part data:** id, slot, rarity (common, rare or epic), cost, stat changes (power, armor, speed, weight, heat), and the hook for what it grants (weapon, ability, passive). The prototype has 21 parts in `PARTS`; the six blueprint parts add a `zone` field and show in the garage once the save's highest extracted level reaches that zone (GDD-D42, to build).
- **Base stats:** power 100, armor 100, speed 100, weight 60, heat 100; starter parts bring weight to 100.
- **Derived stats:** speed multiplier is `1 / (1 + 0.004 × (weight − 100))`; turn rate and torso tracking scale the same way; heat headroom and drain come from the reactor and heatsinks.
- **Health:** one armor pool. Hits lower it; at 0 the mech is destroyed.
- **Durability (to build):** each owned part instance carries a durability value. On extract, each fitted non-starter part gains wear of `0.10 × damage taken ÷ max armor` (capped at 1; none on a death). `deriveStats` multiplies every helpful stat change of a worn part by `1 − wear` and leaves costly changes and hooks alone. Starter parts never wear. Repair price is `ceil(price × wear × rate)` with rate 0.25, 0.5 and 0.75 for common, rare and epic. Armor refills every level. The prototype instead carries one armor value between levels and repairs 3 armor per scrap (see prototype changes).
- **Weapon upgrades (to build):** each owned weapon instance (Arm-R, Arm-L and the two shoulder actives) carries an upgrade level from 0 to 2 (`T.upgrade`, GDD-D23). Its damage to enemies is multiplied by `1 + 0.10 × level` after power; voxel damage, heat and rates are unchanged. Wear and repair price ignore the level.
- **Legs:** set the dash (vectored jump-jets and strider legs dash; siege treads don't; Grav-skids hold two) and the traction and turn curves.
- **Part hooks for the blueprints (to build):** Arc caster (a chain bolt), Redline vent (a Q state, see Combat systems), Seismic hammer (an ATB ground slam), Breach charges (placed charge entities, Q again sets them off), Overdrive core (a passive that reads armor share), Grav-skids (two dash charges, wider slide, half slag). Twelve weapons take upgrade levels.

## Combat systems

Each heavy weapon owns a small state machine; light weapons and heat run every physics tick.

- **ATB timer:** per heavy weapon, states Charging → Ready → Ring → Charging. Fill rate = base rate × power × pod multiplier (Overclock = 2) × 1.25 at a ×4 combo (to build).
- **Timing ring:** on press, a ring timer starts; the ring reaches its target at `T.ring.duration` (1.0 s). On release, grade the time from the target: Perfect within ± 0.086 s, Good within ± 0.31 s, else Miss. Still held at 1.31 s fires a Miss. `sim.js` stores the windows as shares of the 72 px start radius shrinking to a 30 px target (`T.ring`), which reduce to those times; the pixel sizes are presentation only.
- **Input:** press and hold the weapon's button to start the ring and release to lock it; movement and aiming are never blocked.
- **Heat:** one value per mech, 0–100. Shots and abilities add heat; it drains each tick. At 100, lock light guns, dashes and the mortar for 3 s. Every timing result adds the same heat. An overheat during a ring cancels it as a Miss and adds no heat. The Cryo flash-vent sets heat to 0 and ends the lockout.
- **Overclock:** multiplies every ATB fill for 15 s; a running ring is unaffected.
- **Projectiles:** every light shot, shell and mortar round is a moving object stepped each tick; shells and mortar rounds arc and blast a 3×3×3 voxel volume.
- **Damage:** a hit on a mech lowers its single armor pool; a hit on a building removes voxels from the chunk. A Perfect pile-bunker hit uses a wider strip and cores two voxels deep (GDD-D28); other heavy weapons carve the same hole at any grade.
- **Hit path (TDD-D9, to build):** every hit on an enemy goes through one function, `hitEnemy(source, target, base, info)`, which applies the GDD-D48 order (shield, power, upgrade, grade, stagger, armor resistance, one rounding), and every hit on a mech through `hitMech`, which applies the level scale and the Elite bonus. Today 13 call sites call `damage()` directly. `info` names the source kind (light, heavy, shoulder, collapse, hazard, pod, enemy) for stats and credit.
- **Kill credit (to build):** each enemy keeps the last mech that hit it and the tick; a kill counts for that mech within `T.credit.window` (3 s). Enemy-made events credit nobody.
- **Scrap on a kill (to build):** one function applies the GDD's combine rule: level scale, ×2 for a Perfect pile-bunker kill, ×1.5 in Overtime, ×1.5 for an Elite, then the combo and demolition percentages added, rounded once.
- **Combo and stagger (to build):** a per-mech combo from ×1 to ×4 (`T.combo`), and a per-enemy stagger timer (`T.stagger`) that stops movement, fire, charges and jumps and adds 50% damage taken.
- **Redline (to build):** a mech state from the Redline vent's Q: no lockout, heat cap 130, armor cost on net heat above 100 (counted as damage taken for wear), and a longer lockout if it ends above 100.
- **Multi-kills (to build):** a per-mech count of credited kills within 1.5 s; an event at 2, 3, 4 and 5 or more.

## Camera and rendering

One camera at a fixed 2:1 dimetric angle (20 px by 10 px per cell, 22 px per height unit), following the player's mech with an 18% lean toward the aim point.

- **Zoom:** set from the window size (between 0.9 and 2.4), never from the build. Low health adds an edge-darkening vignette, drawn under the collapse shadows and pod markers.
- **Cutaway:** voxels in front of the mech inside an ellipse around it draw at 16% opacity.
- **Aim height:** the aim point is the first solid wall face under the cursor (up to about 2 m), or an enemy under the cursor within 34 px, which is how the rooftop sniper is targeted.
- **Collapse warning:** project a shadow decal under each falling cluster, above the vignette and the cutaway. A cluster creaks for `T.collapse.warn` (0.9 s) before it falls.
- **Zone drop-in:** the shutter-and-camera shot runs on the simulation clock for 5.5 s. Input is locked and mechs take no damage during it.
- **Look:** flat-shaded voxels, one directional light, and emissive heat glow on vents and barrels.

## AI

Enemies use a simple state machine plus one scoring check for drop pods. Today they are patrol bots, heavy loaders and the sniper boss, each with its own data (`T.bot`, `T.loader`, `T.boss`). The fun pass adds a zone enemy per zone, Elites, two more bosses and the Warden (to build).

| State | Enters when | Does |
| --- | --- | --- |
| Patrol | No target in sight | Wanders between random street cells |
| Engage | A mech in sight range, or the bot was hurt | Closes to its weapon range, fires an orb every 1.25 s, strafes and backs off when close; gives up after 3 s unseen |
| Seek pod | A pod is closer than the nearest mech, or own health below 50% | Paths to the pod at 1.1× speed; drops back if the pod is taken |

Heavy loaders patrol, hunt on sight and charge (tell 0.5 s, charge up to 1 s at 5 m/s). The boss perches on roof edges, fires after a 0.6 s tell and jumps between perches. Only patrol bots seek pods. Today enemies don't aim at supports and only the loader's charge damages the map; the Wrecker, Scuttler blasts and the Juggernaut will (GDD-D40, GDD-D51).

- **Boss:** a scripted variant with its own states (for example, rooftop jumps for the sniper boss). Which boss comes on waves 3 and 5 comes from the climb plan (GDD-D51, to build); on wave 5 it is the harder variant: 1.5× health, attacks 30% faster (the sniper fires every 1.5 s and drops 18 scrap).
- **Zone enemies (to build):** a `T.zoneThreats` table lists each zone's enemy and the wave slots it replaces; `beginWave` applies it for every open zone and a zone enemy prefers spawn cells in its zone (GDD-D40). The Scuttler runs in, flashes and blasts; the Bulwark is a loader with a front shield arc checked first in the hit path; the Wrecker keeps its distance and plants a charge entity on a support chunk; an Elite is a bot or loader the seed picks, with scaled health, damage and scrap.
- **Sniper pair and Juggernaut (to build):** two linked snipers that keep 8 m apart and alternate fire; a boss loader whose long charge breaks building and pillar chunks through the normal break path.
- **The Warden (TDD-D14, to build):** linked entities in the enemy list: a body aloft at 5 m, three rider platforms, three rider snipers that use the normal sniper rules, and four legs. The body takes half damage while any rider is up; broken legs stagger and slow it, and four bring it down as a collapse. Barrage, belly Scuttler drops and the stomp run on their own timers. Collision uses the legs and the stomp radius only.
- **Level scaling:** per level above 1, enemy count +25%, hp +15%, damage +15% and scrap +10% (`T.level`).
- **Navigation:** flow fields over the walk grid, refreshed when voxels change (see Voxel destruction).
- **Waves:** a data file lists each wave's enemy types and counts (`T.waves`); an excursion is 5 waves, plus Overtime (wave 4 and a loader) when called.

## Save data

The save is one campaign code, base64url JSON, kept in the browser (`localStorage`, key `metr0niks.campaign`) and copyable from the garage. In a co-op room the room plays the host's campaign; the guest's save receives only the guest's banked scrap and wear, and its own level and seed stay as they were (GDD-D31).

- **Saved today (v1):** banked scrap, owned parts, the equipped build, armor, the campaign level and the seed.
- **Save v2 (TDD-D12, to build):** adds per-part wear, per-weapon upgrade levels (0 to 2), the highest level ever extracted (it decides blueprints, GDD-D42), lifetime records (highest level, best combo, spans dropped, contracts completed, Overtimes cleared), whether the climb's seed was typed, the two call-in slots, and an in-match mark (a save still marked on load counts as a death, TDD-D8). Armor is no longer carried: every level starts at full armor.
- **Not saved:** match scrap, pod effects, match damage, the match stats and the climb plan (recomputed from the seed). Dying or leaving early discards the match, resets the campaign level to 1 on a new climb seed and loses carried call-ins; parts, upgrades, blueprints, records and banked scrap stay.
- **Validation:** decoding rejects unknown part ids, negative or oversized scrap, wear outside 0 to 1, upgrade levels outside 0 to 2 or on parts that aren't owned weapons, a level outside 1 to 5, a highest level below 0 or above 5, call-ins that aren't call-in types, and more than two players.
- **Migration:** a v1 code loads as v2 with no wear, no upgrades, the highest level set to its current level (capped at 5), empty records and empty call-in slots.
- **Write points:** on extract, on death, when a match starts (the in-match mark), and on every purchase, repair and upgrade.
- **Versioning:** a version number (`v`) on the data, with a small migration step when the format changes.

## Audio

The sim emits events for the moments the GDD's Audio section lists; the client plays music and effects from them, with music and effects volumes saved on the device. Repeated sounds are pooled and pitch-varied; warning sounds are mixed above music. Tools and middleware wait on the engine choice.

- **New events (to build):** combo step and break, grade, stagger, Redline start and end, multi-kill, contract progress and completion, the Overtime prompt and call, crushed count per collapse, wave clear with stats, zone enemy actions (Scuttler flash, Bulwark block and bash, Wrecker plant), and the Warden's leg breaks. The cockpit voice is a client-side rule over these events (one line per 3 s, warnings first).

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
| The Warden | A multi-part walker is new to the sim and is the finale | Build it last, in the unit lab first, each behaviour switchable |
| Determinism drift | The fun pass adds many random draws and entities | The runner's replay hash check on every batch |
| Snapshot size | Charges, pools, riders and stats add to co-op snapshots | Compact arrays; measure snapshot size in the two-tab test |
| Wave density | The map is 2.25× the old floor with the same waves | Sweep wave counts in solo and co-op before fixing level-1 counts |
