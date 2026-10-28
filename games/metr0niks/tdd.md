# Metr0niks TDD

Updated Oct 28, 2026 · @kr0 · Earlier versions: [Oct 20](superseded/tdd-2026-10-20.md), [Oct 26](superseded/tdd-2026-10-26.md), [Oct 27](superseded/tdd-2026-10-27.md)

This TDD says how every system in the [GDD](gdd.md) is built: one mode, Excursion, as kr0 has decided it up to Oct 28, 2026 (GDD-D1 to GDD-D55, [GDD decision history](gdd-decisions.md)). It describes the build that exists, the voxel prototype (`prototypes/prototype.html`) running the rules in `simulations/sim.js`, and how the approved fun pass goes into it. Architecture choices that are not yet kr0's are in the [TDD decision history](tdd-decisions.md) as Proposed. Where something isn't built yet, this TDD says "(to build)"; the order is in the [implementation plan](decisions/2026-10-28-fun-pass-implementation-plan.md), and the line-level list is in [prototype changes](prototypes/prototype-changes.md). Rules and numbers are the GDD's; when the two disagree, the GDD wins and this file is fixed.

## Goals and constraints

Build for one developer: fake the expensive parts and make everything data-driven.

- **Team:** solo developer, with AI agents writing code and docs on branches.
- **Mode:** Excursion, single-player or two-player co-op, is the only mode. Single-player runs entirely in the browser; co-op runs on a room server.
- **Platform:** PC, keyboard and mouse only. No touch controls (GDD-D29).
- **Performance target:** 60 fps at 1080p on a mid-range PC during a level-5 co-op Warden fight (TDD-D19).
- **Destruction:** looks like voxels, but uses chunks and a support graph rather than per-voxel physics.
- **Look:** voxels first. The rules never depend on how the game is drawn, so a later renderer with shaders, textures and animated models can replace the look without changing a rule (GDD-D46).
- **Determinism:** the same seed, tuning and inputs give the same match, in the browser, on the room server and in Node.

## Builds and tools

This version ships as plain JavaScript in the browser (TDD-D18), with the rules in `sim.js`, which also runs in Node. An engine is only for a later port.

| Build | File | Uses the rules how | State |
| --- | --- | --- | --- |
| Voxel prototype (prototype 1) | `prototypes/prototype.html` | Runs `sim.js` for everything; draws it on a canvas in three art styles (Blockout, Cinematic, Ink) | The build being developed (GDD-D46) |
| Ink prototype (prototype 2) | `prototypes/prototype-ink.html`, `prototypes/ink-zones.js` | Reads the numbers in `MetroSim.T` and `MAP.zones`, but has its own 2D rules | Look study; follows the same GDD (GDD-D32), but gaps (pods, parts, co-op) are open |
| Mechanics lab, garage lab, unit lab | `prototypes/mechanics-lab.html` and siblings | Drive the voxel prototype in a frame through test hooks | Test pages, not builds |
| Ink enemy lab | `prototypes/ink-enemy-lab.html` | The ink prototype's enemies one at a time | Test page |
| Map check | `simulations/map-check.js` | Node: checks `MAP` (zones, room for two, landmarks) | Built |
| Runner, pilot and rules check | `simulations/run.js`, `simulations/pilot.js`, `simulations/rules-check.js` | Node: whole excursions with scripted pilots; one-rule scenarios | Built Oct 28 (TDD-D17) |

| Need | Option | Why |
| --- | --- | --- |
| Engine (deferred) | Godot 4 (Jolt physics) or Unity, if the game leaves the browser | Prior experience matters more than the engine; until then the browser build is the game |
| Rules | `sim.js`, plain JavaScript, no dependencies | Same file in the browser, the room server and Node sweeps (TDD-D2) |
| Voxel art | MagicaVoxel | Free; models for mech parts and building chunks when the renderer moves past flat-shaded cells |
| Data | `T`, `PARTS`, `MAP` and the tables below, in `sim.js` | Every number in one place, overridable per run (TDD-D11) |
| Version control | Git with LFS | Voxel models, textures and audio are binary |

## Architecture

&#91;embedded content: architecture · garage, match manager and match systems\]

The garage and the match manager never run at the same time. The match manager runs the match systems. On extract or death it hands the result back to the garage, which writes the save.

- **Rules and views:** every rule lives in `sim.js`. A view draws sim state, plays sounds from sim events and sends input; it adds no rules. Presentation effects (hit-stop, stamps, camera punch, text) never pause or change the sim (TDD-D16).
- **Campaign layer:** `MetroSim.Campaign` owns the save (encode, decode, validate, migrate), advancing a level, the climb seed and the climb plan. The garage and title screens call it; it never runs a match.
- **Match layer:** `MetroSim.create(opts)` builds one excursion: the map, the open zones, the mechs from their builds, and the level's plan entry. The view calls `setInput` and `step()` at 60 Hz and reads state and events.
- **Co-op layer:** one side runs the sim and sends snapshots; the other sends input. Online, the room server runs the sim and both players are clients; in the local two-tab test, the host's tab runs it.

## Simulation

The rules are a headless, deterministic simulation with no renderer, as [simulation and tuning](../../studio/simulation-and-tuning.md) requires.

- **Fixed step:** 1/60 s ticks, never the frame clock. `sim.js` has no DOM, no timers and no browser globals.
- **Randomness:** one seeded stream per match, owned by the sim. Random draws in the view (particles, pitch variation) never feed back into rules. The climb plan has its own stream (TDD-D10).
- **One tuning table:** every number the rules use is a key in `T`. `create({tune})` merges overrides over a per-match copy, so sector conditions and sweep variants never change `MetroSim.T` (TDD-D11, built). `sim.tuneHash()` names the tuning a run used.
- **Entities:** players, enemies, shots, pods, scrap cubes, clusters (falling pieces) and debris are plain objects in arrays the sim mutates in place. The fun pass adds charges (Wrecker and Breach charges), slag pools and the Warden's linked parts (to build).
- **Input:** one record per mech per tick: a key bitmask (W 1, A 2, S 4, D 8, Space 16, Q 32), the aim point, and the two mouse buttons. The fun pass adds F 64 (Overtime), Enter or R 128 (extract now), 1 256 and 2 512 (call-ins, aimed at the aim point) (TDD-D15, built Oct 28).
- **Events:** everything a view needs that isn't state is an event (see Events).
- **Checks:** the replay hash check, the rules check and the map check run headless (see Testing).

## Match flow

A match is one excursion at one campaign level.

- **States:** `drop` (the drop-in shot; input locked, no damage, no spawns), `play`, then `choose` after wave 5, `overtime` (both built Oct 28), and the end states `extracted`, `dead` and `victory` (built Oct 28).
- **Waves:** `T.waves` holds the five waves (3 bots; 4 bots and a loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, a loader and the boss). `beginWave(n)` builds a queue: the boss first, then loaders and Bulwarks, then Wreckers, then bots, then Scuttler packs, released one every `T.wave.stagger` (0.8 s). Bot and loader counts scale with the level. A wave clears when its queue is empty and no enemy is left; the next starts after a 3 s breather.
- **Zone threats (built Oct 28):** `T.zoneThreats` lists, per zone, the enemy it brings, the slots it replaces and in which waves (Freight Yard: a Scuttler pack for 2 bots in waves 2, 4 and 5; Smelter Row: a Bulwark for 1 loader in waves 4 and 5; Glass Quarter: a Wrecker for 1 bot in waves 2 and 4; Terminus Yard: one bot or loader per wave becomes an Elite). `beginWave` applies every open zone's row, then the sector condition's changes.
- **Spawns:** a bot or loader lands on an open street cell more than 10 m from every living mech when one exists; a zone enemy prefers cells inside its zone (`MAP.zones` bounds). Sealed zones never spawn anything.
- **Choose and Overtime (GDD-D37, built Oct 28):** when wave 5 clears, the match enters `choose` for 6 s. F (host only in co-op) starts Overtime; Enter or R, or the timer, extracts. Overtime runs the revive check, then builds wave 4 plus one loader through the zone threats table, with no boss; while it runs, every kill's scrap is multiplied by `T.overtime.drops` (1.5). Clearing it extracts. A death in Overtime is a normal death.
- **Extract:** cubes still on the floor go to the nearest living mech, each mech's wallet is reported in the run-over event, and the campaign layer banks it. Leaving mid-match is a death (the in-match mark, TDD-D8).
- **Victory (built Oct 28):** extracting level 5 reports `victory`; the campaign layer starts a new climb at level 1 on a new seed, keeping parts, upgrades, blueprints, records and banked scrap.
- **Contracts (GDD-D38, built Oct 28):** a table of ten, each with an id, a check and a progress value read from the match stats and events (Crush: most kills from one collapse ≥ 3; Bring it down: spans dropped ≥ 2; Eviction: sniper knocked off a perch ≥ 2; Full combo: best combo = 4; Clean sweep: every pod taken, at least 5; Untouchable: wave 3 armor lost < 20%; Close shave: extract below 15% armor; Blitz: waves 1 and 2 cleared within 75 s; Wrecking crew: 400 voxels; Repo man: 2 kills of pod-carrying enemies). The level's contract comes from the climb plan. On completion the sim adds `T.contract.scrap` (15) × the level's scrap scale to each living mech's match scrap and emits an event; failing costs nothing. Contract kills follow kill credit.
- **Sector conditions (GDD-D39, built Oct 28):** a table of nine, each a tuning override plus at most one flag:

| Condition | Override | Flag the sim or view reads |
| --- | --- | --- |
| Brittle city | `chunk.breakAt` for 12% voxels lost | — |
| Reinforced | `chunk.breakAt` for 30% lost; collapse scrap ×2 | — |
| Loose pillars | — | at build, each pillar's lowest chunk loses 15% of its voxels |
| Heat wave | heat drain −30% | — |
| Cold front | heat drain +30%; one pod per wave | — |
| Scrap storm | scrap +30%; one more bot per wave | — |
| Blackout | enemy sight −30% | the view draws night, lit within 12 m of each mech, by muzzle flashes, blasts and slag |
| Pod rain | two pods per wave | patrol bots seek pods at any health |
| Sniper's nest | — | each boss wave adds a Bounty sniper (a fourth rider with the Warden) |

## Campaign and climb plan

- **Levels:** 1 to 5 (`T.level.max`, GDD-D47), one zone opened per level. Per level above 1: enemy counts +25% (rounded), health +15%, damage +15%, scrap +10% (`T.level`). The prototype still caps at 50 until phase 2.
- **Seeds (GDD-D49, built Oct 28):** the campaign holds a climb seed. A new campaign, a death and a victory restart draw a new one in the campaign layer (outside the sim, so the sim stays deterministic); a seed typed at level 1 (1 to 2,147,483,000) is used for that climb only. Each level's match seed comes from the climb seed and the level (`levelSeed`).
- **Climb plan (TDD-D10, built Oct 28; the Warden and Juggernaut entries are placeholders until phase 7):** `Campaign.plan(campaign)` derives, from the climb seed on its own stream, for each level: the sector condition (level 1 from Reinforced, Heat wave, Cold front, Scrap storm or Pod rain), the contract, and the wave-3 and wave-5 bosses. It draws bosses first so the contract filter can drop contracts that can't be done (Eviction without a sniper, Crush and Bring it down without a span in the open zones, Clean sweep under Cold front). No condition or contract repeats in a climb. Level 1 wave 3 is always the Bounty sniper and level 5 wave 5 always the Warden. The garage shows the next level from the plan before any match exists. The plan is recomputed on load and never saved.
- **Co-op campaign (GDD-D31):** the room plays the host's campaign: level, climb seed, plan and open zones. On extract the host's campaign advances; each player banks their own scrap and wear into their own save. A host leaving ends the room (GDD-D52).

## Kill credit and damage

- **Hit path (TDD-D9, built Oct 28):** every hit on an enemy goes through `hitEnemy(enemy, base, src, x, y, z)` and every hit on a mech through `hitMech(mech, base, src, x, y, z)`; nothing else calls `damage()` except the debug hooks. `src` is `{by, kind, grade, pow, w, resist}`: the mech index (or −1 for nobody, or none to mean the last mech that hit within the credit window), the source kind (light, heavy, shoulder, collapse, hazard, pod, enemy), the ring grade, power at the moment of firing, the weapon id and the armor resistance. Shots carry their `src` and unscaled `base`. A Bulwark's shield plugs in as `enemy.blocks(src, x, y)`, and upgrades as `player.upMul(weapon)`.
- **Damage to an enemy:** worked out in the GDD-D48 order, rounded once: a Bulwark's front shield blocks the whole hit (checked by the angle between the hit's direction and the shield's facing, 60°); base damage; × power ÷ 100 for player weapons and shoulder actives only; × the upgrade level (1.0, 1.1, 1.2); × the timing grade (2, 1, 0.5) for heavy weapons; × 1.5 if staggered; × armor resistance (0.5 for the minigun and shotgun on loaders and a Bulwark's body, and the Arc caster on loaders). Collapse, hazard and pod-strike damage scales with the level instead.
- **Damage to a mech:** the enemy's base × (1 + 0.15 × (level − 1)) × 1.25 for an Elite, rounded. Power, upgrades and grades don't apply. Collapses deal 40 at any level.
- **Kill credit:** every enemy keeps `{by, at}`: the last mech that damaged it and the tick. A kill belongs to that mech if `at` is within `T.credit.window` (3 s). Clusters, slag pools and pod strikes carry the mech that caused them; those an enemy caused (a Wrecker charge, a Scuttler blast, the Juggernaut's charge, an enemy-taken Strike beacon) carry nobody. Credited-to-nobody kills still get the demolition bonus but count for no combo, contract or stat.
- **Scrap for a kill:** one `killScrap(enemy, credit)`: base cubes × the level scale × 2 for a Perfect pile-bunker kill × 1.5 in Overtime × 1.5 for an Elite × (1 + combo % + demolition %), rounded once. Cubes are physical: whoever picks them up keeps them.

## Mech model

A mech is a frame with six slots (Core, Arm-R, Arm-L, Shoulder, Legs, Reactor); its stats are derived from its parts whenever one changes.

- **Part data:** `PARTS` entries hold id, slot, rarity (common, rare or epic), price, stat changes (power, armor, speed, weight, heat) and a hook naming what the part grants (a weapon, a Q active, a passive, a dash type). 21 parts today; the six blueprint parts add a `zone` field (to build).
- **Base and derived stats:** power 100, armor 100, speed 100, weight 60, heat 100; starter parts bring weight to 100. Speed, acceleration and turning scale by `1 / (1 + 0.004 × (weight − 100))`; heat gain and drain come from the heat stat (GDD Combat).
- **Health:** one armor pool. At 0 the mech is destroyed. Every level starts at full armor (built Oct 28; carried armor is gone).
- **Durability (GDD-D18, built Oct 28):** each owned part carries wear 0 to 1. On extract, each fitted non-starter part gains `0.10 × damage taken ÷ max armor`; damage counts when taken, even if healed. `deriveStats` scales every helpful stat change of a worn part by `1 − wear`. Repair restores it for `ceil(price × wear × rate)` (0.25, 0.5, 0.75 by rarity); the Repair button repairs fitted parts in slot order and skips one the scrap can't cover (GDD-D28).
- **Weapon upgrades (GDD-D23, built Oct 28):** each owned weapon carries a level 0 to 2 (`T.upgrade`); damage to enemies × `1 + 0.10 × level` after power, through `player.upMul(weapon)` in `hitEnemy`. Nine weapons today, twelve with the blueprints.
- **Blueprint unlock (GDD-D42, to build):** the garage lists a blueprint part once the save's highest extracted level reaches its zone's level (2 to 5). A death or restart never removes one.

| Blueprint part (built Oct 28) | Hook | Notes for the build |
| --- | --- | --- |
| Arc caster (Arm-R) | Light gun firing a bolt that chains to 2 more enemies within 4 m | Chain targets picked nearest-first; no voxel damage |
| Redline vent (Shoulder) | Q active: Redline for 5 s | See Combat systems |
| Seismic hammer (Arm-L) | ATB ground slam, radius 3 m (4 m on a Perfect) | A Perfect staggers all hit, topples container stacks within 4 m and knocks a sniper off a perch within 10 m |
| Breach charges (Shoulder) | Q places a sticky charge entity up to 10 m (2 held, 8 s each); Q again detonates all | Removes voxels within 2 m through the normal voxel path, so supports and collapses follow |
| Overdrive core (Core) | Passive: below 35% armor, power +30 and drain +50% | Re-derived each tick from armor share |
| Grav-skids (Legs) | Two dash charges (1.6 s each), wider slide, half slag damage and heat, 1.5× shove | Rubble still blocks it |

## Combat systems

Each heavy weapon owns a small state machine; light weapons, shoulder actives and heat run every tick.

- **ATB:** Charging → Ready → Ring → Charging. Fill time is 6 s ÷ (power ÷ 100) ÷ 2 under Overclock ÷ 1.25 at a ×4 combo.
- **Timing ring:** press starts it; it reaches its target at 1.0 s. Release grades the distance from the target: Perfect within ± 0.086 s, Good within ± 0.31 s, else Miss; still held at 1.31 s fires a Miss. `T.ring` stores the windows as shares of the 72 px ring shrinking to 30 px; the pixels are presentation only.
- **Heat:** one value per mech, 0 to 100. Shots, heavy hits, the mortar and dashes add heat; it drains each tick. At 100 the mech locks out for 3 s (light guns, dashes and the mortar; a running ring is cancelled with no damage and no heat). The Cryo flash-vent sets heat to 0 and ends a lockout.
- **Redline (GDD-D36, built Oct 28):** a mech state started by the Redline vent's Q, also during a lockout (ending it). For 5 s nothing locks and heat can reach 130; every point of net heat gain above 100 costs 0.5 armor through `hitMech` (it counts for wear and Untouchable, not for the Nanite core). If it ends above 100, the mech locks out for 3 s plus 1 s per 10 heat above 100. 14 s recharge.
- **Combo (GDD-D35, built Oct 28):** per mech, ×1 to ×4 (`T.combo`). A Perfect raises it, a Good holds it, a Miss, a closed or cancelled ring, or 12 s without a heavy shot drops it to ×1. Credited kills at ×2, ×3, ×4 add 10%, 20%, 30% scrap; ×4 speeds ATB by 25%.
- **Stagger (GDD-D35, built Oct 28):** a Perfect sets a 1.0 s timer on every enemy it hits; a new Perfect restarts it. A staggered enemy can't move, fire, charge or jump, loses any tell, and takes ×1.5 damage. Scuttlers die to any Perfect; the Warden is staggered only by leg breaks.
- **Multi-kills (GDD-D53, built Oct 28):** per mech, credited kills within 1.5 s of the last (or in one event) raise a count; events at 2, 3, 4 and 5 or more.
- **Projectiles:** every light shot, shell and mortar round is an object stepped each tick; shells and mortar rounds arc and blast a 3×3×3 voxel volume.
- **Overclock:** doubles every ATB fill for 15 s; a running ring is unaffected.

## Pods and call-ins

- **Wave pods:** each wave drops one pod, and a second at 40%, at a random time 1.5 to 6 s in, on an open cell at least 4 m from every living mech, after a 3 s marker. Types by `T.pods.odds`: Field repair 50%, Overclock 20%, Scrap cache 15%, Strike beacon 15% (to build; today Field repair and Overclock at 50% each). Sector conditions change the count.
- **Taking a pod:** a living mech within 0.7 m takes it, the nearest first, and a mech wins a same-tick tie. Patrol bots seek pods (closer than the nearest mech, or below 50% health); loaders take one only by walking over it; bosses, Scuttlers and the Warden never do.
- **Scrap cache (built Oct 28):** 8 cubes × the level scale burst out around the taker. An enemy that takes it is marked and drops the cubes with its own.
- **Strike beacon (built Oct 28):** 1.5 s after a mech takes it, four shells land at 3, 6, 9 and 12 m toward its aim point: 40 damage within 2 m (scaled like collapse damage), a 3×3×3 hole, no damage to mechs, credited to that mech. An enemy that takes it aims the line from itself at the nearest mech, with a 2 s ground warning: 20 to mechs, 40 to enemies, credited to nobody.
- **Call-ins (GDD-D54, sim built Oct 28; garage shop to build):** two slots per player in the save, bought in the garage at Field repair 40, Overclock 30, Strike beacon 50, × the next level's scrap scale, rounded. Keys 1 and 2 spawn that pod at the aim point (up to 14 m) with the usual marker and countdown; enemies can still take it. Unused call-ins stay in their slot after extract; carried ones are lost on a death. In co-op each player has their own.

## Economy and garage

- **Wallets:** each mech keeps the cubes it picked up (`player.scrap`); the HUD shows the team total. Extract banks each wallet into its owner's save; a death loses them.
- **Scrap sources:** enemy cubes (bot 3 to 5, loader 8 to 10, sniper 12 or 18, Scuttler 1, Bulwark 10 to 12, Wrecker 6 to 8, Juggernaut 20, Warden 60), collapse landings (2 to 4, not scaled), Scrap cache pods and contracts, combined as in Kill credit and damage.
- **Sinks:** parts (one-off), weapon upgrades (two per weapon), repairs, revives (from the survivor's match scrap) and call-ins.
- **Garage:** buy, fit, upgrade, repair; the next level preview from the climb plan (zones and their enemies, condition, contract); the call-in shop and slots; "New" on newly unlocked blueprints; the campaign code; the seed box at level 1. In co-op both players shop, then both press Drop in.

## Voxel destruction

The map is a voxel grid grouped into 4×4×4 chunks linked by a support graph. When supports break, whatever is no longer held up falls as one piece.

1. **Map:** `MAP` builds Overpass Sector 4: 216 × 48 × 8 cells in five zones (Underpass, Freight Yard, Smelter Row, Glass Quarter, Terminus Yard), an 8 m deck on fourteen pillars ending at x 167, and a landmark per zone ([level design](level-design.md)). Sealed zones are walled by indestructible shutters until their level's drop-in.
2. **Structures:** each building, pillar, container stack, crane, vat, billboard and the water tower is a structure; load-carrying ones are supports.
3. **Damage:** hits remove voxels (half the hit's damage goes into the voxel). A chunk breaks into debris once it has lost more than its break share (20%, changed by conditions).
4. **Collapse check:** after a break, flood-fill from the anchors; anything not reached becomes a cluster that creaks for 0.9 s, shows its footprint, then falls.
5. **Impact:** a landing cluster damages everything under its footprint: enemies take `T.collapse.botDmg` (80) × the level's health scale, mechs 40. Street-level voxels may stay as rubble; a piece of more than 6 voxels scatters 2 to 4 cubes.
6. **Credit (built Oct 28):** the cluster records the mech whose hit broke the chunk that started it (or nobody), and landing damage goes through `hitEnemy` as a collapse, so kills get credit and the demolition bonus (+15%); the most kills from one cluster is in the stats. Each landed piece that kills sends one CRUSHED event (`cr`), and a deck span sends SPAN DOWN (`sd`) when it lands. A container is one box (`T.hazard.wholeBox`): breaking any chunk of it destroys the whole box and drops what it carries.

- **Slag spill (built Oct 28, `T.slag`):** a slag vat that lands becomes a 4 × 4 m pool (`sim.pools`, snapshot `sl`) for 8 s: 25 damage a second × the level's health scale to enemies, 10 to mechs and 15 heat a second to mechs standing in it, halved for Grav-skids (`p.skids`). Credit goes to the mech that broke the vat's support; a pool sends its CRUSHED event when it cools. Props brought down count in the stats (`props`).
- **Navigation:** a walk grid rebuilt when voxels change; enemies and pods follow flow fields over it (TDD-D6). The Warden ignores the grid and walks its arena.
- **Budget:** cap live debris pieces (start at 300) and fade the oldest first.
- **Rendering:** the voxel prototype draws cells per frame from the world arrays; a later renderer greedy-meshes each chunk and rebuilds only changed chunks.

## AI

Enemies are state machines with their own data blocks in `T`. All take level scaling; all hits on them use the hit path.

| Enemy | Data | Behaviour to build or keep |
| --- | --- | --- |
| Patrol bot | `T.bot` | Built: patrol, engage (orb every 1.25 s, strafe, give up after 3 s unseen), seek pod |
| Heavy loader | `T.loader` | Built: patrol, hunt, 0.5 s tell, charge up to 1 s that plows barriers, windows and containers |
| Bounty sniper | `T.boss` | Built: perches, 0.6 s tell, jumps every 6 to 9 s, falls when its voxel goes. Wave-5 variant: 1.5× health, fires every 1.5 s, 18 cubes (to build) |
| Scuttler (Freight Yard) | `T.scuttler` | Built Oct 28: Packs of 4 land together, run at the nearest mech, flash 0.4 s within 1.2 m, blast 10 within 1.5 m to everyone and a 1-voxel hole; shot down or knocked into an enemy, it blasts. Its blast is credited to nobody |
| Bulwark (Smelter Row) | `T.bulwark` | Built Oct 28: A loader with a front shield (60°) and a 1.2 rad/s turn; bash at 3 m (15 damage, 2 m shove, 2 s cooldown). A Perfect from the front breaks the shield for 5 s and staggers; from behind it staggers |
| Wrecker (Glass Quarter) | `T.wrecker` | Built Oct 28: Keeps over 8 m from every mech, walks to the support chunk nearest a mech that is at least 8 m from every mech, plants for 2.5 s (damage restarts it). The charge is an entity (20 health, 4 s fuse) that breaks its chunk; killed mid-plant, it drops a 2 s charge |
| Elite (Terminus Yard) | `T.elite` | Built Oct 28: A flag on one bot or loader per wave, picked by the match seed: double health, ×1.25 damage, ×1.5 scrap, a Field repair or Overclock pod on death |
| Sniper pair (boss) | `T.boss` × 2 | Two snipers at two thirds health and 9 cubes each, perching at least 8 m apart and firing in turn |
| Juggernaut (boss) | `T.juggernaut` | A loader at 450 health, 1.8 m/s; charge up to 2 s that breaks buildings and pillar chunks (collapses credited to nobody). A Perfect stagger stops the charge |
| The Warden (level 5 boss) | `T.warden` | See below |

- **The Warden (TDD-D14, to build):** linked entities sharing a parent id: a body aloft at 5 m (1,500 health, 0.8 m/s, 60 cubes), three platforms (150 health each) carrying three Bounty snipers that use the normal sniper rules, and four legs (300 health each). While any rider is up, the body takes half damage. A broken platform drops its rider with fall damage. A broken leg staggers it 2 s and slows it 25%; four broken legs bring the body down as a collapse (400 to itself, no more walking or stomping, +50% damage taken). Timers: a barrage every 8 s (four shells toward a mech, 2 s ground warning); below 50% health a Scuttler pack every 15 s and a stomp (0.8 s tell, 25 within 3 m). It walks in from the arena's far end during the drop-in, never takes pods, and collides only through its legs and stomp radius. When the body dies, every linked part goes with it.
- **Boss placement:** a sniper arrives on a roof edge 8 to 16 m from a random living mech, preferring line of sight; the Juggernaut lands like a loader.
- **Navigation:** flow fields over the walk grid, refreshed when voxels change.

## Co-op and netcode

- **Topology (TDD-D1):** online, the room server runs the whole sim (`server/metr0niks.js`, in the private `kr0/blackletter-chronos` repo) and both players are clients; in the local two-tab test, the host's tab runs it. Mech 0 is the host and mech 1 the guest. Clients send input every tick and predict only their own movement; the sim's side sends snapshots at 20 per second with voxel diffs, rendered 100 ms behind. A silent player's keys are released after 0.5 s.
- **Authority:** the side running the sim decides firing, heat, ATB, damage, kill credit, combo, contracts, pods and ties ("same frame" means "same sim tick").
- **What's per player:** wallet, combo, multi-kill count, call-ins, stats, wear and the save. What's shared: the map, enemies, pods, the contract (each living mech gets its reward) and the host's campaign.
- **Snapshots (built Oct 28 except the Warden):** add charges, slag pools, Warden parts, stagger and shield state, combo and Redline per mech, the contract's progress, and the `choose` timer, as compact arrays. Stats travel in wave-clear and run-over events, not every snapshot.
- **Leaving:** a guest who leaves is destroyed (`dropPlayer`) and the host fights on. A host who leaves ends the room for both (GDD-D52, built Oct 28): the guest's match ends with match scrap lost; the host's in-match mark turns it into a death on the host's next load.
- **Revive (GDD-D24):** at the end of waves 1 to 4 (and wave 5 if Overtime is called), the sim revives a downed mech if the survivor's wallet covers 40 × the level's scrap scale, at 30% armor. Damage taken carries across for wear.

## Match stats and reports

- **Record (TDD-D13, built Oct 28; props and call-in and Redline counters fill in with their phases):** the sim keeps `stats[mech][wave]` with every GDD-D50 counter: kills by enemy type and source; damage dealt to enemies and voxels destroyed; damage taken by source; Perfects, Goods, Misses, best combo; spans dropped, props brought down, most kills from one collapse; multi-kills by size; pods taken, stolen and stolen back; scrap picked up by source and spent on call-ins; overheats and Redline seconds; seconds to clear the wave.
- **Delivery:** a wave-clear event carries that wave's record; the run-over event carries the whole record. The runner writes the same record as its metrics record.
- **Reports:** the view builds the wave report strip (in the breather) and the excursion report (scrap count-up, contract, condition, per-wave chart, highlights) from the record. Lifetime records (highest level, best combo, spans dropped, contracts completed, Overtimes cleared) are updated by the campaign layer and saved.

## Save data

The save is one campaign code, base64url JSON, kept in `localStorage` (`metr0niks.campaign`) and copyable from the garage. In co-op the guest's save receives only the guest's banked scrap, wear and records; its level and seed stay as they were (GDD-D31).

- **v1 today:** banked scrap, owned parts, the equipped build, armor, level and seed.
- **v2 (TDD-D12, built Oct 28; the call-in shop comes with phase 6):** adds per-part wear, per-weapon upgrade levels (0 to 2), the highest level ever extracted, lifetime records, whether the climb seed was typed, two call-in slots and the in-match mark (TDD-D8); drops carried armor.
- **Not saved:** match scrap, pod effects, match damage, the match stats and the climb plan.
- **Validation:** decoding rejects unknown part ids, negative or oversized scrap, wear outside 0 to 1, upgrade levels outside 0 to 2 or on non-weapons or unowned parts, a level or highest level outside 1 to 5, unknown call-in types, a seed outside 1 to 2,147,483,000 and more than two players.
- **Migration:** v1 loads as v2 with no wear, no upgrades, the highest level set to its level (capped at 5), empty records and empty call-in slots.
- **Write points:** extract, death, match start (the in-match mark), every purchase, repair and upgrade.

## Camera, HUD and screens

One camera at a fixed 2:1 dimetric angle (20 px by 10 px per cell, 22 px per height unit), following the player's mech with an 18% lean toward the aim point. All of this is view code.

- **Zoom:** from the window size (0.9 to 2.4), never from the build. Low armor adds a red vignette under collapse shadows and pod markers.
- **Cutaway:** voxels in front of the mech inside an ellipse draw at 16% opacity.
- **Aim height:** the first solid wall face under the cursor up to about 2 m, or an enemy under the cursor within 34 px (how the rooftop sniper and Warden riders are targeted).
- **Drop-in:** the shutter shot runs on the sim clock for 5.5 s; input locked, no damage.
- **HUD:** armor, heat (and lockout or Redline), dash, ATB state, shoulder cooldown, Overclock, level, wave, enemies left or countdown, match scrap, kills, boss bar (the Warden's with rider and leg pips, to build); the combo beside the heat bar and on the cursor ring at ×2 or more; contract progress; the condition icon; two call-in slots; the wave report strip; the 6 s Extract or Overtime prompt.
- **Screens:** title (continue, new campaign, settings, co-op, records), garage, pause (single-player), extracted, campaign over, victory, settings (art style, music and effects volume, saved on the device).
- **Blackout (built Oct 28):** a night pass in each art style: darkness everywhere except within 12 m of each mech, muzzle flashes, blasts and slag.

## Feel and audio

- **Feel (TDD-D16, to build):** hit-stop freezes the impact effect for 60 ms, flashes the enemy white and punches the camera 4%, never the sim; grade stamps; SPAN DOWN and CRUSHED ×N; multi-kill text (DOUBLE, TRIPLE, QUADRUPLE KILL, DEVASTATING); screen shake from the GDD's list.
- **Audio:** the view plays music and effects from sim events and match state; volumes are saved on the device; repeated sounds are pooled and pitch-varied; warnings mix above music. Music cues: title and garage, combat loop, boss layer, Warden theme, breather, Overtime layer, extract, campaign over, victory. The cockpit voice is a view rule over events: ten lines, at most one per 3 s, warnings first.

## Events

The sim's events are arrays (`drainEvents()`). Built today: toast `t`, floating number `f`, sparks `s`, smoke `m`, shake `k`, pod landed `p`, cluster created `c`, run over `o` (its detail carries `stats`), zone opened `z`, and since phase 1 combo `cb` (mech, value, broken), stagger `sg` (position), multi-kill `mk` (mech, count), kill `x` (enemy type, credited mech or −1, source kind, cubes) and wave clear `w` (wave, each mech's stats). To build (one code each, listed in the `sim.js` header when added):

| Event | Carries |
| --- | --- |
| Grade | mech, Perfect, Good or Miss, position |
| Combo | mech, new value, broken or not |
| Stagger | enemy id, position |
| Redline | mech, start or end, lockout seconds |
| Multi-kill | mech, count |
| Crushed | cluster id, kills, position |
| Span down | span id |
| Contract | progress, done |
| Choose and Overtime | prompt start, Overtime called |
| Wave clear | wave, stats for the wave |
| Enemy actions | Scuttler flash, Bulwark block, bash and shield break, Wrecker plant and blast, Warden barrage, leg break, rider down, stomp tell |
| Call-in | mech, slot, pod type, position |
| Victory | level, stats |

## Tuning data

Every number above is a key in `T`; the GDD's numbers are starting values for the sweep ([tuning history](tuning-history.md)). Still to build: `juggernaut` and `warden`. Built so far: `overtime`, `contract`, `revive`, `cond`, `match`, the `contracts` and `conditions` rules, `redline`, `arc`, `seismic`, `breach`, `overdrive`, `skids`, `callin`, `cache`, `strike`, `pods.odds`, the six blueprint parts in `PARTS`, `combo`, `stagger`, `credit`, `demolition`, `multiKill`, `level.max` 5, `collapse` level scaling, `slag`, `zoneThreats`, `scuttler`, `bulwark`, `wrecker`, `charge` and `elite`. Per-run overrides (TDD-D11) let a sweep change any of them without editing the file.

## Testing

- **Runner (TDD-D17, built):** `simulations/run.js` plays whole excursions in Node from a campaign, seeds and an override file, with a scripted pilot (`pilot.js`, one or two) that fights, takes pods and releases the ring at a set accuracy; it writes one metrics record per run to `tuning-runs/` and replays one run per batch to compare state hashes.
- **Rules check (built):** `simulations/rules-check.js` runs short scripted scenarios, one rule each (damage order steps, credit window, combo, stagger, each contract, each condition, save migration, plan determinism).
- **Map check:** `simulations/map-check.js` (built).
- **Labs:** the mechanics, garage and unit labs get a test for each new mechanic, enemy and part.
- **Co-op:** a two-tab run through a full excursion comparing state hashes and measuring snapshot size.

## Technical risks

| Risk | What could go wrong | Spike to de-risk it |
| --- | --- | --- |
| Collapse performance | A big collapse on the 216 × 48 map drops the frame rate | Drop a span with 300 debris pieces in the Terminus Yard fight and measure |
| Co-op sync | Voxel diffs, clusters and new entities drift between host and guest | Two-tab full excursion with state hashes |
| The Warden | A multi-part walker is new to the sim and is the finale | Build it last, in the unit lab first, each behaviour switchable |
| Determinism drift | Many new random draws and entities | The replay hash check on every runner batch |
| Snapshot size | Charges, pools, riders and stats grow snapshots | Compact arrays; measure in the two-tab test |
| Readability | Players can't tell what's about to fall, or what a Wrecker is planting | Playtest the warnings with someone new |
| Timing ring while moving | Hold-and-release feels awkward while driving | Test at several ring speeds |
| AI on changing terrain | Enemies get stuck behind rubble | Refresh flow fields after a collapse and time it |
| Wave density | The map is 2.25× the old floor with the same waves | Sweep wave counts in solo and co-op before fixing level-1 counts |
| Durability and economy tuning | Wear plus trimmed income makes a losing streak hard to climb out of | The economy sweep in the tuning history |
| Two prototypes | The ink prototype drifts from the rules because it reimplements them | Move it onto `sim.js` (TDD-D20) |

## Decided Oct 28 (kr0)

kr0 answered the TDD's open questions on Oct 28 with "continue", taking the suggested answers (TDD-D18 to TDD-D21):

- **Engine (TDD-D18):** browser JavaScript is the shipping technology for this version. Godot 4 and Unity stay options for a later port only.
- **Performance target (TDD-D19):** 60 fps at 1080p on a mid-range PC during a level-5 co-op Warden fight. The collapse performance spike measures against it.
- **Ink prototype (TDD-D20):** it should move to running `sim.js` itself, as the renderer swap GDD-D46 describes, instead of reimplementing rules. Until then it reads `T` and its gaps are listed in its brief.
- **Room server (TDD-D21):** the room server code moves into this repo next to `sim.js`, so snapshot changes ship with the rules. It lives in the private `kr0/blackletter-chronos` repo, which this repo's agents can't read yet; kr0 adds that repo to a session, or copies `server/metr0niks.js` in.
