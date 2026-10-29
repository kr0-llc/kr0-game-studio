# Metr0niks tuning history

Oct 25, 2026 · updated Oct 28, 2026 · @kr0 · kept by the systems-designer

Every changed number, why it changed, and the tokens each story spent. No tuning change has been logged yet. This file opens with the Simulation section the [studio standard](../../studio/simulation-and-tuning.md) requires and the baseline values the prototype ships with. Until the unset rows below are filled in, sweeps are exploratory and can't close a tuning story.

## Simulation

- **Runner:** `simulations/run.js` (built Oct 28, TDD-D17). `node simulations/run.js --runs 100 --level 1` plays whole excursions headless with scripted pilots and prints a summary; `--players 2` for co-op, `--climb` for level 1 up until a death, `--tune file.json` for a variant (a partial `T` merged over a copy for those runs only, TDD-D11), `--out` writes one JSON record per run to `games/metr0niks/tuning-runs/`. Run k of a batch uses seed `--seed + k × --stride` (stride 1 by default), so batches share paired seeds; the phase 9 sweep spread them with `--stride 7919`. About 0.3 s per excursion.
- **Determinism:** the simulation draws from one seeded stream, steps in fixed 1/60 s ticks and has no DOM, timers or browser globals. Every runner batch replays its first match from the recorded inputs and compares `sim.stateHash()` every 10 s and at the end; a mismatch fails the batch. `sim.tuneHash()` identifies the tuning a record was made with. `simulations/rules-check.js` asserts single rules.
- **Scenarios:** to be set by kr0. Likely: Excursion level 1 and level 3 (all zones open), single-player and two-player co-op, Overpass Sector 4.
- **Players:** `simulations/pilot.js`, a scripted pilot: it fights the nearest enemy from about 9 m while circle-strafing, closes in for the pile-bunker when the ATB bar is full (not into a charging loader or a crowd), takes Field repair below 60% armor and picks up scrap. Ring accuracy is set per batch: `perfect`, `mix` (70% Perfect, 25% Good, 5% Miss), `random` or `none`. It is a baseline, not a model of a skilled player: it never dashes, uses Q or plays the city. Pilot v2 (`MetroPilot.make({skill: "v2"})`, `run.js --pilot v2`, Oct 28) dashes out of telegraphed attacks, uses Q and call-ins (`--callins A,B`), flanks Bulwarks, shoots Warden riders first and drops spans on groups; see [Sweep with pilot v2](#sweep-with-pilot-v2-oct-28-2026). `--build slot=part` swaps a starter part. v1 stays the default.
- **Seeds:** TBD (kr0 to decide). Paired seeds are required by the standard.
- **Measures and targets:**

  | Measure | Target | Source of the target |
  | --- | --- | --- |
  | Excursion length | TBD | No target set |
  | Extract rate for a starter mech at level 1 | TBD | No target set |
  | Scrap per extract, by level | TBD | GDD Economy lists the sources; no target set |
  | Runs to afford each part tier | TBD | No target set |
  | Extracts to take one weapon to Mk III, by rarity | TBD | GDD-D23; no target set |
  | Wave time to kill at Mk I, Mk II and Mk III | TBD | GDD-D23; no target set |
  | Rejected inputs and errors | 0 | Standard |

- **Re-run when:** any key in `T` changes, a part's stat change or cost changes, the wave table changes, or the durability or repair rule changes.
- **Caps:** TBD. A run that exceeds the cap is counted and reported, not dropped.

**Baseline, Oct 28** (tuning `05842d1b`, the prototype's `T` before the fun pass; pilot accuracy `mix`; seeds 1 to 100). Not a tuning change; it shows where the scripted pilot stands before any fun pass rule is built. Records in `tuning-runs/2026-10-28-baseline-*.jsonl`.

| Scenario | Runs | Extracted | Mean length | Mean kills | Deaths by wave |
| --- | --- | --- | --- | --- | --- |
| Level 1, solo | 100 | 21% | 126 s | 20 | 2: 1, 3: 8, 4: 43, 5: 27 |
| Level 1, co-op | 50 | 100% | 109 s | 28 | none |
| Climb from level 1, solo | 50 | 9 of 50 reached level 2, none passed it | — | — | — |

**After phase 1, Oct 28** (tuning `757f3b12`: the baseline plus `T.combo`, `T.stagger`, `T.credit`, `T.multiKill`, `T.demolition`; same pilot and seeds). Records in `tuning-runs/2026-10-28-phase1-*.jsonl`, now with the GDD-D50 stats.

| Scenario | Runs | Extracted | Mean length | Mean kills | Reached ×4 combo | Deaths by wave |
| --- | --- | --- | --- | --- | --- | --- |
| Level 1, solo | 100 | 26% | 127 s | 20 | 61% | 2: 2, 3: 10, 4: 35, 5: 27 |
| Level 1, co-op | 50 | 100% | 110 s | 28 | 22% | none |

The patrol bots' orbs do the killing: with bot shots set to 0 damage, the solo pilot extracts 33 of 40 times. The solo/co-op gap is large; whether that's the pilot or the waves is a question for the wave-density sweep.

Questions that need sweeps:

- Whether 10% wear and the repair rates let a losing player recover.
- Co-op revive (GDD-D24): how often a survivor can afford the revive price by wave, by level. Needs the runner, a two-bot scenario and kr0's target.
- Weapon upgrades (GDD-D23): how many extracts it takes to take a weapon to Mk III, and how much each level shortens a wave. Planned variants: damage per level 0.05, 0.10 and 0.15, crossed with upgrade cost ×0.5, ×1 and ×2, on paired seeds at level 1 and level 3, single-player, the starter build and one rare build. Needs the runner and kr0's targets first.

- Fun pass (GDD-D35 to GDD-D55, Oct 28): every number in it is a starting value. Before kr0 fixes the values, the runner should answer: how often a bot-driven player reaches a ×4 combo (step 10%, decay 12 s); how much armor a Redline vent costs per use (5 s, cap 130, 0.5 armor per heat); the extract rate and scrap per run with and without Overtime at levels 1, 3 and 5 (×1.5 drops after the GDD-D54 trim); how much scrap call-ins absorb per climb, and whether the GDD-D55 trims (combo +10% a step, demolition +15%, Elites ×1.5, contract 15, Scrap cache 8) leave buying a part feeling earned; whether scaled collapse damage keeps a span drop lethal to bots at level 5; how long the Warden fight takes with and without leg breaks; how often a player sees a multi-kill; the scrap curve with every kill bonus stacked (combo, demolition, Elite, Overtime) against what there is to buy; whether each zone's enemy raises the death rate by a step rather than a cliff; and whether a 5-level climb is the right length. PR #12 scales the map 1.5× in both directions (216 × 48 m) so two mechs fit side by side, but leaves the waves as they are, so the same enemies spread over about 2.25× the floor. The sweep should check the wave counts on the larger map, in single-player and co-op, before the level-1 counts are fixed. The GDD-D50 stats record is the metrics record the runner needs. Needs the runner, a scripted player that uses the ring, and kr0's targets.

## Fun pass sweep (Oct 28, 2026)

Phase 9 of the [fun pass implementation plan](decisions/2026-10-28-fun-pass-implementation-plan.md). Measurement and proposals only: no value in `T`, no rule and no GDD or TDD number changed. kr0 sets the targets first, and each change kr0 picks gets a decision row.

**How it was run.** Branch `phase9-sweep` from `2452e07` (main after PR #35, phases 0 to 8 in). Seeds are spread: run k uses seed 1 + 7919 k (k = 0 to 99), which draws level-1 sector conditions evenly (Pod rain 39, Cold front 41, Reinforced 39, Scrap storm 41, Heat wave 40 in 200 seeds; consecutive seeds 1 to 200 give Cold front 100, Reinforced 60, Pod rain 40). `run.js` now takes `--stride` so a batch can be replayed the same way (`--seed 1 --stride 7919`). Every match plays its climb plan (condition, contract, bosses). 100 runs per batch unless noted, about 9,000 matches in all. The sweep used a throwaway harness in the scratch area that copies `run.js`'s match loop and also reads events and positions each tick (time to first contact, idle seconds, kills by combo step, CRUSHED kills, the killing blow), plus scripted labs through the sim's debug hooks. Records are in `tuning-runs/2026-10-28-phase9-*.jsonl`: `grid` (full records), `overtime`, `zonethreats`, `climbs`, `callins-redline`, `candidates` (trimmed records) and `warden-labs`. Each batch starts with a header line holding its config.

**The scripted pilot's limits bias almost every number below.** It never dashes, never uses Q or call-ins (unless a harness wrapper does it, noted per table), never plays the city on purpose, circle-strafes in front of whatever it fights and can't flank. Read every extract rate as a floor for a careless player, not as a target. The biggest effects: it can't get behind a Bulwark (so level 3 and up is a wall, below), it never drops a span on purpose (so collapse and multi-kill numbers are floors), and solo it trades orbs in the open until waves 4 and 5 wear it down.

### Per-level extract rates (the grid)

Starter build, no upgrades, every level played from full armor. Banked = scrap per mech per extract.

| Level | Solo mix | Solo perfect | Co-op mix | Co-op perfect | Banked: solo / co-op (mix) | Mean extract length: solo / co-op |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 13% | 14% | 96% | 97% | 186 / 104 | 163 s / 110 s |
| 2 | 4% | 1% | 73% | 75% | 228 / 122 | 257 s / 165 s |
| 3 | 0% | 0% | 0% | 0% | — | — |
| 4 | 0% | 0% | 0% | 0% | — | — |
| 5 | 0% | 0% | 0% | 0% | — | — |

Perfect timing barely moves the extract rate: the pilot only rings the pile-bunker when the bar is full and an enemy is in reach, and it dies to bot orbs. Level-1 solo is lower than the phase 1 figure (26% on seeds 1 to 100) because the spread seeds draw Scrap storm and Heat wave, and the hard wave-5 sniper and zone rules came in since.

Two proxy pilots give the higher levels a scale (not targets): "sturdy" (armor 300 through a run-only override) and "sturdy, no zone enemies" (armor 1000 and `zoneThreats: []`, 60 runs each).

| Proxy, mix | L1 solo / co-op | L3 solo / co-op | L4 solo / co-op | L5 solo / co-op |
| --- | --- | --- | --- | --- |
| Armor 300: extract rate | 88% / 100% | 0% / 3% | — | 0% / 0% |
| Armor 1000, no zone enemies: extract rate | — | 97% / 100% | 82% / 98% | 0% / 58% |
| Armor 1000, no zone enemies: banked per mech per extract | — | 374 / 186 | 435 / 220 | — / 301 |

Even at 1000 armor the solo pilot dies to the Warden every time, and the pair loses 42% of level-5 runs to it.

### Death rate per wave and the zone enemies

Deaths per wave = matches lost in that wave / matches that reached it (mix accuracy).

| Level | Solo | Co-op |
| --- | --- | --- |
| 1 | W2 3%, W3 9%, W4 45%, W5 73% | W4 2%, W5 2% |
| 2 | W2 3%, W3 38%, W4 70%, W5 76% | W4 2%, W5 24% |
| 3 | W2 31%, W3 74%, W4 100% | W3 11%, W4 100% |
| 4 | W2 40%, W3 90%, W4 100% | W3 19%, W4 100% |
| 5 | W1 7%, W2 66%, W3 97%, W4 100% | W2 1%, W3 48%, W4 100% |

The step each zone enemy adds, on paired seeds (`--tune` with `zoneThreats: []`, and with the table cut to the zones before the newest):

| Level (newest enemy) | Players | No zone enemies | Without the newest | Full table | Step from the newest |
| --- | --- | --- | --- | --- | --- |
| 2 (Scuttler packs) | Solo | 1% | 1% | 4% | +3 pts |
| 2 (Scuttler packs) | Co-op | 61% | 61% | 73% | +12 pts (packs replace 2 bots and die to any Perfect, so they make wave 4 easier) |
| 3 (Bulwark) | Co-op | 25% | 30% | 0% | −30 pts; wave-4 deaths 29% → 100% |
| 4 (Wrecker) | Co-op | 9% | 0% | 0% | masked by the Bulwark |
| 5 (Elites) | Co-op | 0% | 0% | 0% | masked |

The Bulwark is a cliff for this pilot, not a step: across 19 level-3 co-op wave 4s it killed the Bulwark twice. It fights from the front, so the shield takes the minigun. A run-only test with the Bulwark on wave 5 only (`zoneThreats` row 2 `waves: [5]`) cut level-3 co-op wave-4 deaths from 100% to 23%, but wave 5 still took everyone; `bulwark.arc` 45 and `bulwark.hp` 160 changed nothing (0% either way). A human who walks round it will see a smaller step. Without zone enemies the levels still climb steeply (co-op 61%, 25%, 9%, 0% at levels 2 to 5): the +25% count, +15% health and +15% damage per level and the bigger open floor stack up.

### Wave density on the 216 × 48 m map

Per wave, over waves that were cleared: wave length / seconds from the wave's start to the first enemy within 16 m (the pilot's gun range) of a mech / idle seconds per mech with no enemy within 16 m. Mix accuracy.

| Level (open floor) | Players | W1 | W2 | W3 | W4 | W5 | Idle share of wave time | Mean distance to the nearest enemy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 (48 m) | Solo | 14 / 1.6 / 4.0 | 32 / 1.7 / 4.4 | 23 / 0 / 3.6 | 48 / 2.0 / 5.4 | 40 / 0 / 6.4 | 16% | 10 m |
| 1 | Co-op | 10 / 1.5 / 3.9 | 20 / 1.8 / 5.3 | 15 / 0 / 4.1 | 29 / 1.9 / 4.9 | 24 / 0.1 / 3.2 | 22% | 12 m |
| 2 (84 m) | Solo | 24 / 2.7 / 9.3 | 37 / 2.5 / 9.9 | 41 / 0.1 / 13.4 | 72 / 2.1 / 12.1 | 62 / 0 / 12.0 | 30% | 13 m |
| 2 | Co-op | 18 / 2.6 / 9.9 | 24 / 2.4 / 9.7 | 26 / 0.2 / 9.6 | 46 / 2.4 / 9.3 | 37 / 0 / 9.7 | 33% | 15 m |
| 3 (120 m) | Solo | 33 / 3.3 / 14.0 | 72 / 2.9 / 17.2 | 57 / 1.3 / 15.1 | — | — | 31% | 15 m |
| 3 | Co-op | 25 / 3.2 / 14.8 | 45 / 2.9 / 16.4 | 42 / 0.8 / 15.6 | — | — | 42% | 18 m |
| 4 (156 m) | Solo | 40 / 4.5 / 19.9 | 98 / 4.0 / 27.0 | 91 / 3.9 / 21.4 | — | — | 36% | 18 m |
| 4 | Co-op | 32 / 4.4 / 21.3 | 62 / 3.7 / 25.6 | 56 / 1.1 / 22.5 | — | — | 47% | 22 m |
| 5 (216 m) | Solo | 59 / 6.1 / 31.4 | 132 / 3.3 / 40.3 | 137 / 4.8 / 38.7 | — | — | 43% | 23 m |
| 5 | Co-op | 47 / 5.9 / 32.3 | 83 / 3.2 / 35.3 | 88 / 4.8 / 31.0 | — | — | 48% | 25 m |

On level 1 the density is fine: first contact under 2 s, idle about one sixth of the wave. It falls off with every zone that opens, because enemies drop on any open street cell more than 10 m from every mech (`pickSpawn` and `pickZoneSpawn`), so on level 5 they land anywhere along 216 m. Co-op idles more per mech than solo, since two mechs share the same enemies. The 10 m in both pick functions is a literal, not a `T` key (the plan's ground rule says every number is a key).

### Combo (×4 reach) and multi-kills

| Level | Players | Runs reaching ×4: mix / perfect | Kills at ×1 / ×2 / ×3 / ×4 (mix) | Combo bonus on kill scrap (mix, est.) | Runs with a multi-kill (mix) | Multi-kills per run, mix: doubles / triples / quads / 5+ | One multi-kill per |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Solo | 47% / 89% | 46 / 29 / 16 / 9% | +9% | 81% | 1.5 / 0.2 / 0 / 0 | 12 kills |
| 1 | Co-op | 31% / 58% | 58 / 31 / 9 / 2% | +5% | 93% | 2.3 / 0.4 / 0 / 0 | 10 kills |
| 2 | Solo | 41% / 71% | 50 / 29 / 13 / 8% | +8% | 94% | 1.1 / 0.4 / 0.2 / 0 | 12 kills |
| 2 | Co-op | 58% / 86% | 59 / 28 / 8 / 5% | +6% | 100% | 2.9 / 0.7 / 0.2 / 0 | 10 kills |
| 3 | Solo | 58% / 83% | 49 / 27 / 13 / 10% | +9% | 90% | 1.2 / 0.3 / 0.1 / 0.1 | 11 kills |
| 3 | Co-op | 56% / 87% | 63 / 27 / 7 / 3% | +5% | 100% | 2.6 / 0.5 / 0.3 / 0.1 | 9 kills |
| 5 | Solo | 54% / 80% | 47 / 30 / 12 / 11% | +9% | 49% | 0.6 / 0.1 / 0 / 0 | 19 kills |
| 5 | Co-op | 73% / 93% | 64 / 22 / 8 / 5% | +5% | 85% | 1.5 / 0.2 / 0 / 0 | 17 kills |

The combo lives on the 12 s decay: the pilot's heavy shot comes about every 6 s at best, so a single missed chance drops it. In co-op the pilots share kills and get fewer heavy shots each, so co-op reaches ×4 less at level 1. The combo bonus adds 5 to 13% to kill scrap. Multi-kills are almost all doubles from the minigun; the pilot made 0.1 CRUSHED kills per run, so collapse multi-kills are missing from these numbers. A run-only test with `combo.decay` 16 raised level-1 ×4 reach from 47% to 74% solo and from 31% to 54% co-op, kills at ×4 from 9% to 21% (solo), and banked per extract by about 10% solo and 3% co-op; extract rates stayed the same (13% and 96 → 99%).

### Redline armor cost

Lab (calm enemies, starter with the Redline vent, minigun held for the 5 s unless noted):

| Start | Fire for the whole 5 s | Stop firing at 115 heat | Fire for the first 2.5 s |
| --- | --- | --- | --- |
| 0 heat | 0 armor, peak 94 | 0 | 0 |
| 50 heat | 32 armor, ends at 129, 5.9 s lockout | 26, 4.5 s lockout | 0 |
| 85 heat | 46 armor, 5.9 s lockout | 42, 4.7 s lockout | 28, no lockout |
| Locked out at 100 (clutch) | 52 armor, 5.9 s lockout | 49, 4.5 s lockout | 34, no lockout |

Without the vent, the same 5 s of fire from 50 heat locks the gun for 1.9 s, and from 85 heat for 3.0 s. In matches (solo, the harness presses Q when locked out or at 85+ heat with an enemy in 16 m, then keeps firing): about 28 to 29 armor per use, 2.5 to 2.9 uses per run, two thirds of all armor lost, and the Redline tick itself was the killing blow in 55 to 69% of runs; the extract rate fell from 1% to 0% at level 2. Stopping at 115 heat didn't help (27 to 29 armor per use) because the drain can't bring 115 back to 100 inside the 5 s. A run-only test with `redline.armor` 0.25 and `redline.per10` 0.5 halved the cost (15.6 armor per use) and cut Redline killing blows from 64% to 37% of runs. The pilot uses it badly (as a heat dump, not a burst on a staggered target), so these are the worst case, but the lab numbers hold for any player who fires through it.

### Extract rate and scrap with and without Overtime

Paired seeds, the host calls Overtime at the prompt (`--overtime`) versus extracts at once. Banked per mech; expected = mean over all runs, deaths counting 0.

| Level | Players | Accuracy | Reached the prompt | Extract rate: no OT / OT | OT cleared | Banked per extract: no OT / OT | Expected per run: no OT / OT |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Solo | mix | 13% | 13% / 5% | 38% | 186 / 281 | 24 / 14 |
| 1 | Solo | perfect | 14% | 14% / 3% | 21% | 199 / 284 | 28 / 9 |
| 1 | Co-op | mix | 96% | 96% / 83% | 88% | 104 / 153 | 100 / 127 |
| 1 | Co-op | perfect | 97% | 97% / 88% | 91% | 107 / 159 | 104 / 140 |
| 2 | Co-op | mix | 73% | 73% / 56% | 77% | 122 / 180 | 89 / 101 |
| 2 | Co-op | perfect | 75% | 75% / 49% | 67% | 125 / 186 | 94 / 91 |
| 3 | Co-op, proxy (armor 1000, no zone enemies) | mix | 100% | 100% / 100% | 100% | 186 / 281 | 186 / 281 |
| 4 | Solo, proxy | mix | 82% | 82% / 42% | 51% | 435 / 666 | 355 / 277 |
| 5 | Co-op, proxy | mix | 58% | 58% / 57% | 97% | 301 / 420 | 176 / 238 |

Levels 3 and 5 can't be measured with the real pilot (nobody reaches the prompt). Overtime adds about 50% to an extract's scrap for a team that clears it. For the solo pilot it is a trap at level 1 (it loses 40 to 70% of the expected scrap); for a pair it pays about +25% expected at level 1 and breaks even at level 2.

### Call-ins

Solo, mix, the harness carries two call-ins into every match and calls them itself (repair below 45% armor at its own feet; Strike beacon at a group of 3 within 4 m; Overclock while a boss is up). Paired with the grid (no call-ins).

| Level | Slots | Extract rate: none / with | Used per run | Price of the pair | Banked per extract (with) | Pair as share of one extract |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Repair + repair | 13% / 36% | 1.9 | 80 | 202 | 40% |
| 1 | Repair + strike | 13% / 29% | 1.5 | 90 | 196 | 46% |
| 1 | Overclock + overclock | 13% / 9% | 1.9 | 60 | 198 | 30% |
| 2 | Repair + repair | 4% / 10% | 2.0 | 88 | 226 | 39% |
| 2 | Repair + strike | 4% / 8% | 1.6 | 99 | 237 | 42% |
| 3 | Any pair | 0% / 0% | 1.4 to 2.0 | 72 to 108 | — | — |

Two Field repairs nearly triple the solo level-1 extract rate, but at 80 scrap they cost more than they return on average (expected banked per attempt 24 without, 0.36 × 202 − 80 ≈ −7 with), so a player buys them for the extract, not for profit. Overclock does nothing for this pilot (it doesn't press the heavy weapon more often). A co-op mech banks 104 at level 1, so the same pair costs it 77% of an extract. The pilot used almost every call-in it carried, so carried-over call-ins weren't measured.

### Collapse lethality

Span drop lab (pillars 17 and 29, four of one enemy under the span; the collapse does 80 × (1 + 0.15 × (level − 1)), the same scale as enemy health, so the result is the same at every level):

| Enemy | Health at level 5 | Collapse damage at level 5 | Killed | Killed if staggered (×1.5) |
| --- | --- | --- | --- | --- |
| Patrol bot | 96 | 128 | 4 of 4 | 4 of 4 |
| Scuttler | 29 | 128 | 4 of 4 | 4 of 4 |
| Wrecker | 144 | 128 | 0 of 4 (16 left) | 4 of 4 |
| Elite bot | 192 | 128 | 0 of 4 | 4 of 4 (exactly) |
| Loader | 256 | 128 | 0 of 4 | 0 of 4 |
| Bulwark (shield doesn't block a collapse) | 352 | 128 | 0 of 4 | 0 of 4 |
| Elite loader | 512 | 128 | 0 of 4 | 0 of 4 |

Levels 1 and 3 give the same kills. A span drop stays lethal to bots at level 5, as the GDD wants. A Wrecker (90 base health against 80 base collapse damage) always survives one with 10 × the level scale left. In matches the pilot dropped 0.1 spans per run and took 2 to 5 armor per run from collapses; collapses were the killing blow in 1 to 7% of solo deaths.

### Warden fight length

Scripted: level 5, waves 1 to 4 emptied by a run-only override, wave 5 is the Warden, 20 seeds each. With "refilled" the pilot's armor is topped up every tick so the fight runs to the end (the armor it would have lost is still counted). Fight length runs from the Warden's spawn, so it includes its walk-in (about 25 s at 0.8 m/s). Targeting is the pilot's nearest-enemy pick, the body and riders only, or legs first.

| Targeting | Mechs | Body killed | Fight length, median (range) | Legs broken | Brought down | Armor lost per mech per minute |
| --- | --- | --- | --- | --- | --- | --- |
| Nearest | 1 | 19 of 20 | 344 s (299 to 367) | 3.0 | 5 | 430 |
| Body and riders | 1 | 20 of 20 | 293 s (283 to 316) | 1.0 | 0 | 213 |
| Legs first | 1 | 20 of 20 | 270 s (247 to 295) | 4.0 | 20 | 551 |
| Nearest | 2 | 20 of 20 | 160 s (147 to 194) | 4.0 | 19 | 199 |
| Body and riders | 2 | 20 of 20 | 159 s (144 to 180) | 0.1 | 0 | 149 |
| Legs first | 2 | 20 of 20 | 136 s (123 to 144) | 4.0 | 20 | 217 |
| Nearest, normal armor | 1 | 0 | dies after 60 s | — | — | — |
| Nearest, normal armor | 2 | 0 | both die after 47 s | — | — | — |

Mix and perfect accuracy give the same lengths (the pilot rarely rings the pile-bunker on a leg). Breaking the legs shortens the fight by about 15% (co-op) to 25% (solo against the nearest pick) but costs more armor, since the pilot stands under the stomp. A run-only test with `warden.hp` 1000 and `warden.leg.hp` 200: co-op 122 s (nearest) and 107 s (legs first), solo 259 s; a normal-armor pair still dies after 53 s. The fight is long and the barrage plus riders out-damage a mech that doesn't dodge by a factor of four; the pilot can't dash out of a barrage line, so the damage rate is the pilot's limit more than the Warden's.

### The scrap curve against garage prices

What there is to buy: base parts 1,145, the six blueprints 445, every weapon to Mk III 1,395 (12 weapons); 2,985 in all. Call-ins 30 to 70 by type and level, revive 40 to 56. Per mech per extract (mix): solo 186 at level 1 and 228 at level 2; co-op 104 and 122; sturdy proxy co-op 186, 220 and 301 at levels 3, 4 and 5 (no zone enemies, so a little low: Elites ×1.5 and the zone enemies' cubes are missing). Where the cubes come from (co-op level 1 extracts): light gun kills 76%, contracts 12%, heavy kills 6 to 8%, pods (Scrap cache) 4%, collapse 1%. A Scrap cache is 8 cubes; Elite and demolition bonuses barely show because the pilot neither reaches level 5 nor drops spans.

| Purchase | Price | Co-op extracts at L1 (104) | Solo extracts at L1 (186) | Solo attempts at L1 (24 expected) |
| --- | --- | --- | --- | --- |
| Common part | 15 to 20 | 0.2 | 0.1 | 1 |
| Rare part | 25 to 90 (median about 50) | 0.5 | 0.3 | 2 |
| Epic part | 95 to 140 | 0.9 to 1.3 | 0.5 to 0.8 | 4 to 6 |
| Blueprint | 50 to 115 | 0.5 to 1.1 | 0.3 to 0.6 | 2 to 5 |
| Common weapon to Mk III | 60 | 0.6 | 0.3 | 3 |
| Epic weapon to Mk III | 180 | 1.7 | 1.0 | 8 |
| Two Field repair call-ins | 80 | 0.8 | 0.4 | 3 |
| Everything | 2,985 | 29 | 16 | 124 |

A victorious co-op climb would bank about 105 + 122 + 186 + 220 + 301 ≈ 930 per mech without Overtime and about 1,400 with it, so everything costs about 3 victorious climbs (2 with Overtime). Repairs are no sink: wear is 10% × armor lost ÷ max armor per extract, and a mech loses 48 (co-op L1) to 127 (solo L2) armor per extract, so a fitted rare 60-scrap part costs 2 to 4 scrap to repair and an epic 120-scrap part 5 to 12.

### Climb length

| Players | Accuracy | Climbs | Victories | Died on level 1 / 2 / 3 / 4 / 5 | Mean climb, match time | Banked per mech per climb |
| --- | --- | --- | --- | --- | --- | --- |
| Solo | mix | 100 | 0 | 87 / 13 / 0 / 0 / 0 | 2.6 min | 25 |
| Solo | perfect | 100 | 0 | 87 / 12 / 1 / 0 / 0 | 2.4 min | 31 |
| Co-op | mix | 100 | 0 | 6 / 25 / 69 / 0 / 0 | 6.6 min | 185 |
| Co-op | perfect | 100 | 0 | 4 / 30 / 66 / 0 / 0 | 6.6 min | 187 |

No pilot climb gets past level 3. From the cleared waves (grid at levels 1 and 2, sturdy proxy at 3 to 5, breathers included) a victorious co-op climb is about 110 + 165 + 230 + 320 + 520 s ≈ 22 minutes of match time before garage time, and a solo one about 35 minutes; the level-5 match alone is 9 to 10 minutes, half of it the Warden.

### Proposed targets for kr0

One per question, for kr0 to accept, change or replace. "The pilot" is the scripted pilot at the 70/25/5 mix; a target in pilot terms is a regression guard, not a promise about players.

1. **Combo:** a mix pilot reaches ×4 in about 60% of matches, solo and co-op, with 10 to 20% of its kills at ×4. Today solo is close (47%), co-op is low (31%) because two mechs split the heavy shots; ×4 should feel reachable in co-op too.
2. **Redline:** one full Redline fired from a lockout costs at most 20 armor (a fifth of the bar) and leaves a lockout no longer than the 3 s it saved. Today it costs 32 to 52 and leaves 5.9 s, which makes it a trap rather than a clutch.
3. **Overtime:** for a team that reaches the prompt, Overtime clears about 70% of the time and adds about 50% to the extract's scrap, so it is a real gamble. Today co-op clears 88 to 91% at level 1 (too safe) and solo 21 to 38% (a trap); the +50% is right.
4. **Call-ins:** one call-in costs about 20 to 25% of a typical extract at its level, and two Field repairs lift a struggling solo player's extract rate by at least 15 points. Today 40 is 22% of a solo extract but 38% of a co-op mech's; the extract lift (+23 points) is there.
5. **Collapse lethality:** a span drop kills every light enemy (bot, Scuttler, Wrecker) at every level, and nothing armored or Elite unless staggered. Today the Wrecker survives by 10 × the level scale.
6. **Warden:** a pair breaks it in 90 to 120 s and a solo player in 3 to 4 minutes, with legs first about 20% faster than body first. Today a pair needs 136 to 160 s and solo 270 to 345 s.
7. **Multi-kills:** at least one multi-kill in 80% of matches and a triple or better in a third of them. The minigun alone gives the first (81 to 100% at levels 1 to 3, less at level 5); the second needs collapses the pilot doesn't make, so this target needs a pilot that drops spans before it can be checked.
8. **Scrap curve:** the first rare part after 1 to 2 extracts, the first epic after 2 to 3, and everything (2,985) after about 25 to 35 extracts, or 5 to 8 victorious climbs. Today a co-op pair gets there in about 3 victorious climbs (29 level-1 extracts), so the late-level income is on the high side once players can win. Repairs should take about 10% of income; today they take 1 to 5%.
9. **Death rate per wave and zone enemies:** each new zone enemy costs a given pilot no more than 10 points of extract rate on its first level (a step); no wave kills more than 50% of the pilots who reach it. Today the Bulwark costs 30 points and wave 4 of level 3 kills 100%.
10. **Climb length:** keep 5 levels, with a victorious climb taking 20 to 30 minutes of match time in co-op and up to 35 solo. Today's estimate is about 22 minutes co-op and 35 solo, so the length is right; the difficulty curve, not the count, is the problem.
11. **Wave density:** first contact within 3 s of a wave's start and no more than 25% of wave time idle, at every level, solo and co-op. Today level 1 meets it (16 to 22%, under 2 s); level 5 is 43 to 48% idle with 6 s to first contact.
12. **Per-level extract rates:** for the mix pilot, solo 40 to 60% at level 1 falling by about 10 points a level, co-op 75 to 90% at level 1 falling by about 10 points a level. Today solo is 13% at level 1 and co-op 96%, and both hit 0% at level 3.

### Candidate changes

Each is a proposal for kr0; none is applied. "Tested" means a run-only `--tune` batch on the same paired seeds (in `2026-10-28-phase9-candidates.jsonl`); "untested" means expected from the numbers above.

| T key | Current | Proposed | Expected effect | Evidence |
| --- | --- | --- | --- | --- |
| `waves[3]`, `waves[4]` (waves 4 and 5) | 6 bots + 2 loaders; 5 bots + 1 loader + boss | 5 bots + 1 loader; 4 bots + 1 loader + boss | Solo level 1 extracts 13% → 30%, level 2 4% → 13%; co-op level 1 96% → 98%, level 2 73% → 83%; banked per extract −7% solo, −10% co-op | Tested (mix, 100 runs each). Wave 4 deaths solo L1 45% → 20%. Also drops co-op ×4 reach (fewer heavy-shot targets), so pair it with the combo decay |
| `redline.armor`, `redline.per10` | 0.5, 1 | 0.25, 0.5 | Armor per use 29 → 16; Redline killing blow 64% → 37% of runs; a full use from 50 heat costs about 16 and locks about 4.5 s | Tested at level 2 solo (pilot fires through it) |
| `combo.decay` | 12 s | 16 s | ×4 reach 47% → 74% solo, 31% → 54% co-op at level 1; kill scrap +10% solo, +3% co-op; no change to extract rates | Tested at level 1 solo and co-op |
| `warden.hp`, `warden.leg.hp` | 1500, 300 | 1000, 200 | Co-op fight 160 s → 122 s (nearest), 136 s → 107 s (legs first); solo 344 s → 259 s | Tested in the scripted Warden fight (armor refilled). A normal pair still dies in under a minute, so the barrage damage (`warden.barrage.mechDmg` 20) is the next lever, untested |
| `zoneThreats` row 2 (Bulwark) `waves` | [4, 5] | [5] on its first level, or a Bulwark counter the pilot can learn | Level-3 co-op wave-4 deaths 100% → 23%; wave 5 still 100% | Tested. `bulwark.arc` 45 and `bulwark.hp` 160 changed nothing, so the fix is the pilot (flanking) or a rule (shield chip damage), which needs a GDD row; list as a question for kr0 |
| `collapse.botDmg` | 80 | 90 | A span drop kills a Wrecker at every level (90 base health), and nothing new among armored enemies | Lab: Wrecker left with 10 × level scale; the scale is shared, so the result holds at every level |
| `durability.share` | 0.10 | 0.25 | Repairs take about 5 to 12% of income instead of 1 to 5%, so wear becomes a sink | Untested; from armor lost per extract (48 to 127) and repair rates |
| `overtime.loaders` | 1 | 2 for co-op | Co-op Overtime clear rate 88 to 91% → about 70% | Untested, and needs a per-player rule (the key is shared with solo, where Overtime is already a trap); a question for kr0 |
| new key for the spawn ring (today the literal 10 m in `pickSpawn` and `pickZoneSpawn`) | more than 10 m, anywhere in the open zones | between 10 and about 30 m of a living mech | Level 3 to 5 idle share 31 to 48% → toward level 1's 16 to 22%; first contact 3 to 6 s → under 3 s | Untested; the cause is spawns spread over up to 216 m. It changes the GDD's Wave pacing line and the plan's "every number is a key" rule, so it needs a decision row before any code |
| `callin.price.overclock` | 30 | keep, or 20 | No pilot effect (it can't use Overclock) | Overclock call-ins lowered the extract rate (13% → 9%); a human test should decide |

Top five by expected effect: the waves 4 and 5 counts (solo survival), the Redline cost, the spawn ring (density from level 2 on), the Warden health, and the combo decay. The Bulwark wall is the biggest single number in the sweep but is mostly the pilot's: teaching the pilot to flank and to drop spans should come before any Bulwark change, and the sweep should be re-run with that pilot before kr0 fixes the level 3 to 5 targets.

## Sweep with pilot v2 (Oct 28, 2026)

The phase 9 sweep above was biased by its pilot: it never dashed, used Q or call-ins, or played the city, and it couldn't flank. kr0 decided (Oct 28) to build a smarter scripted pilot and re-run the sweep before any tuning change. This section is that re-run. It is measurement and proposals only: no value in `T`, no rule and no GDD or TDD number changed.

**Pilot v2.** `MetroPilot.make({skill: "v2"})` in `simulations/pilot.js`; `run.js --pilot v2`. The default stays v1, so old records and replay hashes are unchanged. Like v1 it only reads sim state and sets inputs, and it keeps v1's ring accuracy model (`mix` is 70% Perfect, 25% Good, 5% Miss). It draws from its own seeded stream. What it adds:

- **Dodges.** It dashes or walks out of a loader's or the Juggernaut's charge line, a flashing Scuttler, a Warden barrage line or stomp tell, an enemy-taken Strike beacon line, slag and a Bulwark's bash. It picks its walking direction around orbs that are about to hit.
- **Closes and escapes.** It dashes into pile-bunker reach when the bar is full. It rings a loader or the Juggernaut only in the window after a charge, and it backs off when low on armor.
- **Bulwark.** It flanks to the Bulwark's back or baits a front Perfect, and it holds fire into the shield.
- **Warden.** It shoots riders and platforms first, then legs, then the body.
- **City.** It breaks a pillar to drop a span on two or more enemies that a collapse can kill.
- **Cover.** It kites, and backs into cover when a shooter has line of sight.
- **Q.** It uses Q per shoulder part: mortar, vent, Redline as a burst, and breach throw and detonate.
- **Call-ins.** It uses its call-in slots: Field repair below 45% armor, Overclock with a boss or 5+ enemies up, Strike at a group or a heavy.
- **Stalemates.** It breaks a stalemate (no enemy damaged for 20 s) by playing plainly for 10 s.

`rules-check.js` asserts it in scripted setups:

| Setup | Pilot v2 | Comparison |
| --- | --- | --- |
| Loader charge | 0 armor lost, 1 dash | Standing still loses 22 |
| Level-3 Bulwark 1v1 | Kills it in 9 s, 0 armor lost, never breaks the shield | v1: no kill in 40 s, loses 100 |
| Span drop on 4 bots | Crushes 3 | v1: crushes 0 |
| Field repair | Called at its feet, armor 30 → 70 | — |

`run.js` also gained `--callins A,B` and `--build slot=part`.

**How it was run.**
- Branch `pilot-v2` from `012d198`.
- Same spread seeds as phase 9 (run k uses seed 1 + 7919 k), same climb plans, 100 runs per batch unless noted.
- About 8,200 matches plus 240 climbs, about 1.6 hours of wall time on 4 cores. A level-1 solo match takes about 0.7 s; a level-5 co-op match takes about 9 s.
- The harness is a scratch copy of `run.js`'s match loop with v2 pilots, as in phase 9.
- Records are in `tuning-runs/2026-10-28-pilot-v2-*.jsonl`: `grid`, `zonethreats`, `overtime`, `callins-redline` (with the per-part Q batches), `warden`, `climbs` and `candidates`. Each batch starts with a header line holding its config.
- Records are trimmed: per-run totals, per-wave density and the pilot's usage counts.
- v2 stalls now and then at levels 3 to 5: 0 to 12 timeouts per 100 runs at the 900 s cap. They count as not extracted.

**Headline.**
- v2 clears levels 1 and 2 almost every time, solo and co-op.
- The wall moves to wave 4 of level 3 and is still the Bulwark. It does 43 to 59% of all damage at levels 3 and 4, even though v2 flanks it about 10 times a match.
- A co-op pair now extracts level 3 62% of the time and level 5 16%, and wins 5 of 60 climbs.
- The Warden is beatable by a pair: 20 of 40 fights at normal armor. Its fight is long because rider snipers and Bulwarks out-damage the barrage.
- Several v1 findings flip:
  - Lighter waves 4 and 5 aren't needed at levels 1 and 2.
  - Overtime is now too safe at levels 1 and 2, solo as well as co-op.
  - Two Field repairs don't lift level 1 or 2 any more.

### Behaviour usage counts

Per mech per match, mix accuracy, starter build (no shoulder part, no call-ins), from the grid unless noted.

| Scenario | Dashes | Where the dashes go | Flanks | Bulwark baits | Span plans | Spans down per match | Stalemate breaks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Level 1, solo | 18.1 | loader 6.0, orb 3.4, Strike 0.2; close 7.8; escape 0.8 | 0 | 0 | 1.6 | 0.40 | 0 |
| Level 1, co-op | 9.2 | loader 3.1, orb 1.1, Strike 0.2; close 4.8 | 0 | 0 | 0.5 | 0.18 | 0 |
| Level 2, solo | 22.6 | loader 9.1, orb 3.9; close 8.4; escape 0.9 | 0 | 0 | 2.0 | 0.35 | 0.2 |
| Level 3, solo | 36.6 | loader 5.4, bash 6.2, orb 3.6, Juggernaut 0.3, Scuttler 0.3; close 9.6; escape 4.9; flank 6.3 | 9.7 | 1.0 | 2.5 | 0.38 | 2.0 |
| Level 3, co-op | 28.1 | loader 2.8, bash 5.0, orb 1.9; close 9.5; escape 2.4; flank 6.1 | 13.1 | 1.4 | 2.7 | 1.00 | 1.5 |
| Level 5, solo | 45.8 | loader 8.8, bash 3.6, orb 5.0, barrage 1.2, Juggernaut 0.5; close 14.9; escape 6.7; flank 4.5 | 6.7 | 0.7 | 1.3 | 0.57 | 1.8 |
| Level 5, co-op | 36.3 | loader 4.4, barrage 4.7, bash 3.8, orb 2.6; close 11.1; escape 4.2; flank 4.9 | 11.2 | 1.4 | 1.2 | 0.83 | 1.1 |
| Warden lab, pair | 19.7 | barrage 9.7, bash 2.3, orb 1.7; close 2.5; flank 2.8 | 2.8 | — | — | — | — |

"Span plans" counts the times v2 picked a span with enough enemies under it and went for its pillar. "Spans down" counts every span that fell, whoever broke it. Slag and stomp dodges are near 0. v2 rarely stands under the Warden, since it shoots the riders first.

**Q by part** (level 2, solo, mix, 50 runs per part; Redline 100 runs):

| Shoulder part | Q uses per match | Extract rate (starter: 93%) |
| --- | --- | --- |
| Twin-pod siege mortar | 33 shots | 96% |
| Cryo flash-vent | 3.4 vents | 100% |
| Redline vent | 6.6 uses | 84% |
| Breach charges | 23.5 throws, 21.1 detonations | 98% |

**Call-ins per match (solo, levels 1 to 3):**
- Repair + repair: 0.4 used at levels 1 and 2, 1.8 at level 3.
- Repair + strike: the Strike is always used (1.0); 0.2 to 1.0 repairs.
- Overclock + overclock: both used (2.0).

### Per-level extract rates (v1 → v2)

Starter build, no upgrades, every level played from full armor. Banked = scrap per mech per extract (mix).

| Level | Solo mix | Solo perfect | Co-op mix | Co-op perfect | v2 banked: solo / co-op | v2 mean extract length: solo / co-op |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 13% → 99% | 14% → 99% | 96% → 100% | 97% → 100% | 204 / 102 | 174 s / 107 s |
| 2 | 4% → 93% | 1% → 98% | 73% → 100% | 75% → 100% | 230 / 116 | 248 s / 159 s |
| 3 | 0% → 4% | 0% → 5% | 0% → 62% | 0% → 76% | 401 / 183 | 416 s / 275 s |
| 4 | 0% → 1% | 0% → 1% | 0% → 52% | 0% → 58% | 419 / 209 | 482 s / 347 s |
| 5 | 0% → 0% | 0% → 0% | 0% → 16% | 0% → 16% | — / 284 | — / 620 s |

Perfect timing now matters: it adds 14 points at level 3 co-op and 5 points at level 2 solo, because v2 rings 11 to 34 times a match, on targets in their opening window.

Sturdy proxies under v2:
- Armor 300: level 3 is 52% solo and 98% co-op; level 5 is 2% solo and 86% co-op. v1 got 0% / 3% at level 3 and 0% / 0% at level 5.
- Solo dies at the start of level 3 even at armor 300 (wave 4 kills 14%, wave 5 kills 40%).

### Death rate per wave and the zone enemies

Deaths per wave = matches lost in that wave / matches that reached it (mix).

| Level | Solo, v1 | Solo, v2 | Co-op, v1 | Co-op, v2 |
| --- | --- | --- | --- | --- |
| 1 | W2 3%, W3 9%, W4 45%, W5 73% | W4 1% | W4 2%, W5 2% | none |
| 2 | W2 3%, W3 38%, W4 70%, W5 76% | W5 7% | W4 2%, W5 24% | none |
| 3 | W2 31%, W3 74%, W4 100% | W2 2%, W3 1%, W4 74%, W5 84% | W3 11%, W4 100% | W4 8%, W5 33% |
| 4 | W2 40%, W3 90%, W4 100% | W2 1%, W3 3%, W4 81%, W5 94% | W3 19%, W4 100% | W4 14%, W5 40% |
| 5 | W1 7%, W2 66%, W3 97%, W4 100% | W2 2%, W3 6%, W4 79%, W5 100% | W2 1%, W3 48%, W4 100% | W4 25%, W5 79% |

The step each zone enemy adds, on paired seeds (mix). The columns are the extract rate with no zone enemies, without the newest, and with the full table.

| Level (newest enemy) | Players | No zone enemies | Without the newest | Full table | Step from the newest, v2 | Step, v1 |
| --- | --- | --- | --- | --- | --- | --- |
| 2 (Scuttler packs) | Solo | 94% | 94% | 93% | −1 pt | +3 pts |
| 2 (Scuttler packs) | Co-op | 100% | 100% | 100% | 0 | +12 pts |
| 3 (Bulwark) | Solo | 70% | 66% | 4% | **−62 pts**; wave-4 deaths 7% → 74% | — (0% throughout) |
| 3 (Bulwark) | Co-op | 99% | 100% | 62% | **−38 pts**; wave-4 deaths 0 → 8%, wave-5 deaths 0 → 33% | −30 pts |
| 4 (Wrecker) | Solo | 43% | 2% | 1% | −1 pt (masked by the Bulwark) | — |
| 4 (Wrecker) | Co-op | 99% | 49% | 52% | +3 pts | masked |
| 5 (Elites) | Co-op | 37% | 11% | 16% | +5 pts | masked |

The Bulwark is still the cliff, now measured cleanly. v2 kills a lone Bulwark easily (rules-check: 9 s, no armor lost). Two Bulwarks with bots and a loader in wave 4 are another matter. The bash does 51% (solo) to 57% (co-op) of all damage taken at level 3, against 0% without it. Shield breaks stay rare (0.1 per match), since v2 kills from behind rather than breaking the shield. The packs, the Wrecker and the Elites are steps of 5 points or less, inside the target. Without zone enemies the levels still fall: solo 94%, 70%, 43%, 0%, and co-op 100%, 99%, 99%, 37% at levels 2 to 5. Co-op's drop at level 5 is the Warden.

### Wave density on the 216 × 48 m map

Per cleared wave, mix accuracy. Each cell reads wave length / first contact within 16 m / idle seconds per mech. The last two columns give v2 with v1 in brackets.

| Level | Players | W1 | W2 | W3 | W4 | W5 | Idle share: v2 (v1) | Mean nearest enemy: v2 (v1) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Solo | 13 / 1.6 / 4.1 | 29 / 2.0 / 4.8 | 23 / 0 / 2.5 | 51 / 2.0 / 5.8 | 45 / 0 / 3.1 | 13% (16%) | 10 m (10) |
| 1 | Co-op | 10 / 1.5 / 4.0 | 18 / 1.8 / 5.0 | 14 / 0 / 3.2 | 28 / 1.6 / 4.8 | 24 / 0 / 3.1 | 21% (22%) | 11 m (12) |
| 2 | Solo | 22 / 2.7 / 9.3 | 35 / 2.6 / 10.0 | 40 / 0.2 / 8.6 | 77 / 2.5 / 10.6 | 57 / 0.1 / 8.4 | 20% (30%) | 12 m (13) |
| 2 | Co-op | 17 / 2.5 / 10.0 | 24 / 2.7 / 10.1 | 23 / 0.1 / 7.7 | 44 / 2.4 / 9.8 | 33 / 0.1 / 7.8 | 32% (33%) | 15 m (15) |
| 3 | Solo | 30 / 3.3 / 14.3 | 70 / 3.1 / 17.3 | 60 / 0.9 / 13.4 | 113 / 3.6 / 20.7 | 118 / 1.9 / 21.0 | 26% (31%) | 14 m (15) |
| 3 | Co-op | 25 / 3.1 / 15.8 | 44 / 2.9 / 16.0 | 38 / 0.9 / 14.6 | 76 / 3.3 / 17.3 | 81 / 1.3 / 15.7 | 32% (42%) | 16 m (18) |
| 4 | Co-op | 32 / 4.4 / 22.3 | 62 / 3.2 / 26.7 | 51 / 1.1 / 22.9 | 97 / 3.4 / 25.7 | 92 / 0.6 / 22.8 | 38% (47%) | 19 m (22) |
| 5 | Solo | 58 / 6.1 / 32.4 | 124 / 3.1 / 38.1 | 133 / 4.8 / 37.8 | 203 / 5.4 / 40.7 | — | 33% (43%) | 20 m (23) |
| 5 | Co-op | 46 / 5.8 / 32.8 | 81 / 3.4 / 37.4 | 82 / 4.2 / 34.8 | 126 / 3.8 / 38.2 | 264 / 4.8 / 45.3 | 41% (48%) | 23 m (25) |

A pilot that hunts cuts idle time by 5 to 10 points from level 2 up. First contact is the spawn's, not the pilot's, so it is unchanged: 3 to 6 s from level 3 up. Idle time still roughly doubles from level 1 to level 5, so the spawn ring remains the density lever.

### Combo, multi-kills and span drops

| Level | Players | ×4 reach, mix / perfect: v2 (v1) | Kills at ×1 / ×2 / ×3 / ×4 (v2 mix) | Runs with a multi-kill: v2 (v1) | Runs with a triple or better: v2 (v1) | Multi-kills per run, v2 mix: doubles / triples / quads / 5+ | CRUSHED kills per run: v2 (v1) | Spans down per run: v2 (v1) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Solo | 57% / 91% (47% / 89%) | 48 / 32 / 12 / 7% | 91% (81%) | 24% (18%) | 1.7 / 0.2 / 0 / 0 | 0.46 (0.05) | 0.40 (0.07) |
| 1 | Co-op | 21% / 38% (31% / 58%) | 61 / 31 / 7 / 1% | 98% (93%) | 34% (41%) | 2.4 / 0.3 / 0.1 / 0 | 0.19 (0.03) | 0.18 (0.26) |
| 2 | Solo | 58% / 81% (41% / 71%) | 52 / 31 / 11 / 6% | 100% (94%) | 82% (53%) | 2.5 / 0.7 / 0.4 / 0.1 | 0.40 (0.02) | 0.35 (0) |
| 2 | Co-op | 22% / 40% (58% / 86%) | 68 / 26 / 4 / 1% | 100% (100%) | 81% (70%) | 3.3 / 0.9 / 0.3 / 0.1 | 0.26 (0.17) | 0.55 (0.35) |
| 3 | Solo | 61% / 91% (58% / 83%) | 53 / 31 / 11 / 5% | 99% (90%) | 80% (45%) | 2.6 / 0.7 / 0.4 / 0.2 | 0.49 (0.21) | 0.38 (0.04) |
| 3 | Co-op | 71% / 83% (56% / 87%) | 63 / 27 / 7 / 4% | 100% (100%) | 84% (60%) | 4.4 / 1.2 / 0.4 / 0.2 | 0.95 (0.14) | 1.00 (0.22) |
| 4 | Solo | 53% / 87% | 55 / 29 / 11 / 5% | 99% | 37% (23%) | 2.3 / 0.4 / 0.1 / 0.1 | 0.25 (0.14) | 0.32 (0.07) |
| 4 | Co-op | 68% / 96% | 62 / 26 / 8 / 4% | 100% | 63% (35%) | 3.7 / 0.7 / 0.2 / 0.1 | 0.51 (0.13) | 0.49 (0.23) |
| 5 | Solo | 83% / 96% (54% / 80%) | 51 / 29 / 11 / 8% | 95% (49%) | 49% (13%) | 1.8 / 0.4 / 0.2 / 0.1 | 0.46 (0.06) | 0.57 (0.10) |
| 5 | Co-op | 76% / 93% (73% / 93%) | 65 / 24 / 7 / 3% | 99% (85%) | 75% (23%) | 4.0 / 1.0 / 0.4 / 0.1 | 0.45 (0.12) | 0.83 (0.37) |

**Combo.** v2's ×4 reach grows with the match. At levels 1 and 2 co-op it is worse than v1's, because a pair that clears fast has few heavy-shot targets and splits them.

**Multi-kills.** The multi-kill target is met almost everywhere: 91 to 100% of runs. Triples or better are a third or more of runs except at level 1, which has few enemies.

**Collapses.** v2 crushes 2 to 20 times as many enemies as v1, but collapse kills are still only 1 to 2% of all kills. They also cost armor: a mech takes 2 (level 1) to 12 (level 3 co-op) armor per match from collapses, some of it from its partner's span drops.

### Redline armor cost

v2 presses Q for a burst when a target is staggered or a heavy is close, then fires up to 96.5 heat, or 110 only to finish a kill. Solo, Redline vent build, 100 runs per batch.

| Batch | Extract rate (starter build) | Uses per match | Armor per use | Armor per match from Redline | Share of armor lost |
| --- | --- | --- | --- | --- | --- |
| Level 2, mix | 84% (93%) | 6.6 | 5.9 | 39 | 41% |
| Level 2, perfect | 75% (98%) | 6.9 | 5.7 | 39 | 41% |
| Level 3, mix | 0% (4%) | 5.8 | 7.3 | 43 | 35% |
| Level 2, `redline.armor` 0.25, `per10` 0.5 | 87% | 7.3 | 3.0 | 22 | 27% |
| Level 3, same tune | 0% | 6.1 | 3.5 | 21 | 18% |

The cost is much lower used well: v1 paid 28 to 29 armor per use, firing through it as a heat dump. But even used well, the Redline costs 9 points of extract rate at level 2, against a vent or no shoulder part. The lab numbers above (32 to 52 armor for a full use from a lockout) are pilot-independent and still stand. The halved cost gives back 3 of the 9 points.

### Extract rate and scrap with and without Overtime (v2)

Paired seeds, mix. The host calls Overtime at the prompt or extracts at once. Banked per mech; expected = mean over all runs, with deaths counting 0.

| Level | Players | Reached the prompt | Extract rate: no OT / OT | OT cleared: v2 (v1) | Banked per extract: no OT / OT | Expected per run: no OT / OT |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Solo | 99% | 99% / 94% | 95% (38%) | 204 / 298 | 202 / 280 |
| 1 | Co-op | 100% | 100% / 100% | 100% (88%) | 102 / 150 | 102 / 150 |
| 2 | Solo | 93% | 93% / 89% | 96% | 230 / 350 | 214 / 311 |
| 2 | Co-op | 100% | 100% / 100% | 100% (77%) | 116 / 176 | 116 / 176 |
| 3 | Solo | 4% | 4% / 0% | 0 of 4 | 401 / — | 16 / 0 |
| 3 | Co-op | 62% | 62% / 32% | 52% | 183 / 265 | 113 / 85 |
| 5 | Co-op | 16% | 16% / 6% | 38% | 284 / 413 | 45 / 25 |
| 3 | Solo, armor 300 | 52% | 52% / 26% | 50% | 375 / 561 | 195 / 146 |
| 3 | Co-op, armor 300 | 98% | 98% / 96% | 98% | 186 / 282 | 183 / 271 |
| 5 | Co-op, armor 300 | 86% | 86% / 80% | 93% | 294 / 430 | 253 / 344 |

Overtime still adds about 45 to 50% to an extract. With v2 it is a free +40 to 50% at levels 1 and 2, solo and co-op. At level 3 and up it is the gamble the GDD wants: it clears 38 to 52% of the time and loses expected scrap. The target (clear about 70%) is now missed on the safe side at levels 1 and 2, for solo as well as co-op.

### Call-ins (v2)

Solo unless noted, mix. v2 carries the two call-ins and decides when to call them (rules above). Paired with the grid. Pair price = garage price × (1 + 0.1 × (level − 1)).

| Level | Slots | Extract rate: none / with (v1) | Used per mech per match | Price of the pair | Banked per extract (with) | Expected per run: none / with, before the price |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Repair + repair | 99% / 98% (13% / 36%) | 0.4 | 80 | 204 | 202 / 200 |
| 1 | Repair + strike | 99% / 99% (13% / 29%) | 1.2 | 90 | 203 | 202 / 201 |
| 1 | Overclock + overclock | 99% / 99% (13% / 9%) | 2.0 | 60 | 203 | 202 / 201 |
| 2 | Repair + repair | 93% / 98% (4% / 10%) | 0.5 | 88 | 231 | 214 / 226 |
| 2 | Repair + strike | 93% / 97% (4% / 8%) | 1.4 | 99 | 231 | 214 / 224 |
| 2 | Overclock + overclock | 93% / 96% | 2.0 | 66 | 233 | 214 / 224 |
| 3 | Repair + repair | 4% / 10% (0% / 0%) | 1.7 | 96 | 358 | 16 / 36 |
| 3 | Repair + strike | 4% / 15% | 1.9 | 108 | 360 | 16 / 54 |
| 3 | Overclock + overclock | 4% / 3% | 1.8 | 72 | 359 | 16 / 11 |
| 3 | Co-op, repair + repair | 62% / 76% | 1.0 | 96 per mech | 184 | 113 / 140 |
| 5 | Co-op, repair + repair | 16% / 28% | 1.7 | 112 per mech | 290 | 45 / 81 |

Call-ins buy survival where it's short: +6 to +11 points solo at level 3, +12 to +14 co-op at levels 3 and 5. They still never pay for themselves: the expected gain is 12 to 38 scrap against a price of 88 to 112. Overclock still does nothing for a scripted pilot.

### Collapse lethality

The span-drop lab above is pilot-independent: bots and Scuttlers die at every level, the Wrecker survives with 10 × the level scale. In matches, v2 drops 0.2 to 1.0 spans per match and crushes 0.2 to 1.0 enemies, mostly bots and Scuttlers, plus damaged loaders and Bulwarks. A run-only `collapse.botDmg` 90 changed nothing measurable in level-4 and level-5 co-op:

| Level, co-op | Extract rate: 80 / 90 | Crushed per run: 80 / 90 | Wreckers crushed in 100 runs: 80 / 90 |
| --- | --- | --- | --- |
| 4 | 52% / 53% | 0.51 / 0.49 | 2 / 3 |
| 5 | 16% / 16% | 0.45 / 0.49 | 0 / 4 |

Wreckers rarely stand under a span.

### Warden fight with real armor

Same scripted setup as above: level 5, waves 1 to 4 emptied by a run-only override, 40 seeds each. Wave 5 still brings its zone enemies, Bulwarks among them. "Armor 1000" is the sturdy proxy that replaces v1's "refilled". Fight length runs from the Warden's spawn and includes its walk-in.

| Setup | Mechs | Warden killed | Fight length of wins, median (range) | Legs broken | Armor lost per mech | Per mech per minute |
| --- | --- | --- | --- | --- | --- | --- |
| Normal armor | 1 | 1 of 40 | 349 s | 0.1 | 100 (dies) | 57 |
| Normal armor | 2 | 20 of 40 | 210 s (177 to 280) | 1.0 | 78 | 27 |
| Normal armor, `warden.hp` 1000, `leg.hp` 200 | 1 | 0 of 40 | — | 0.2 | 100 (dies) | 57 |
| Normal armor, hp 1000 / 200 | 2 | 29 of 40 | 164 s (144 to 228) | 1.1 | 70 | 26 |
| Armor 1000 | 1 | 39 of 40 | 378 s (293 to 583) | 0.9 | 444 | 67 |
| Armor 1000 | 2 | 40 of 40 | 204 s (173 to 277) | 1.8 | 108 | 31 |
| Armor 1000, hp 1000 / 200 | 1 | 40 of 40 | 298 s (229 to 405) | 1.1 | 329 | 65 |
| Armor 1000, hp 1000 / 200 | 2 | 40 of 40 | 159 s (138 to 218) | 1.5 | 101 | 37 |

**v1 against v2.** v1 never won at normal armor (a pair died after 47 s), and with armor refilled took 136 to 160 s as a pair. v2 wins half its pair fights. It takes about a sixth of the damage per minute (27 to 37 against 149 to 217), but fights longer, because it shoots riders first, takes cover and breaks few legs. It never brought the Warden down.

**Where the damage comes from** (pair, normal armor):
- rider and boss snipers 43%
- Bulwark bash 31%
- orbs 12%
- collapses 6%
- the barrage 5%; v2 dodges it about 10 times a fight

So `warden.barrage.mechDmg` is not the lever v1 suggested. The riders and the wave-5 escort are. A solo player at normal armor still can't win: 1 of 40 fights, even with the smaller Warden.

### The scrap curve against garage prices (v2)

Banked per mech per extract (mix):
- Solo: 204, 230, 401 and 419 at levels 1 to 4.
- Co-op: 102, 116, 183, 209 and 284 at levels 1 to 5.

Levels 1 and 2 are close to v1's numbers (186 / 104 and 228 / 122). The level 3 to 5 numbers are measured for the first time, and they sit close to the sturdy proxy's (186, 220, 301).

Where the cubes come from (co-op level-1 extracts): light gun kills 81%, contracts 13%, pods 5%, collapses 1%, heavy kills under 1%. Heavy kills reach 20% of solo level-3 income.

A victorious co-op climb banks about 102 + 116 + 183 + 209 + 284 ≈ 894 per mech without Overtime, and about 1,300 with it. Everything (2,985) is still about 3.3 victorious climbs, or 29 level-1 extracts. Wear is still no sink: v2 loses 13 (co-op level 1) to 154 (solo level 5) armor per mech per match, and only 45 solo at level 1 (v1 113).

### Climb length

| Players | Accuracy | Climbs | Victories: v2 (v1) | Died on level 1 / 2 / 3 / 4 / 5 | Mean climb, match time: v2 (v1) | Victorious climb, match time | Banked per mech per climb: v2 (v1) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Solo | mix | 60 | 0 (0) | 1 / 3 / 53 / 3 / 0 | 12.8 min (2.6) | — | 431 (25) |
| Solo | perfect | 60 | 0 (0) | 1 / 3 / 56 / 0 / 0 | 11.8 min (2.4) | — | 434 (31) |
| Co-op | mix | 60 | 5 (0) | 0 / 0 / 18 / 16 / 21 | 15.9 min (6.6) | 23.3 min | 461 (185) |
| Co-op | perfect | 60 | 1 (0) | 0 / 0 / 19 / 17 / 23 | 16.1 min (6.6) | 21.9 min | 443 (187) |

The first measured victorious climbs take 22 to 23 minutes of match time, inside the 20 to 30 minute target, and close to the 22 minutes estimated from cleared waves. Solo climbs end at level 3, the Bulwark.

### Proposed targets for kr0, updated

Same twelve. Each shows where pilot v2 stands, and how the target changes once a pilot can play. "The pilot" now means pilot v2 at the mix accuracy. A v2 number is still a regression guard, not a promise about players. But v2 dodges, flanks and drops spans, so its numbers are closer to a careful player's than v1's floor.

1. **Combo:** ×4 in about 60% of matches, solo and co-op, with 10 to 20% of kills at ×4. v2 is at 53 to 83% solo, and at 21 to 22% co-op at levels 1 and 2, where pairs clear too fast to chain heavy shots. The co-op gap is now firmer evidence for a longer decay.
2. **Redline:** unchanged. A full Redline from a lockout costs at most 20 armor. Add: used well (v2), it costs no more than about 5 points of extract rate against a vent. Today it costs 32 to 52 in the lab, and 9 points of extract at level 2 with v2.
3. **Overtime:** clears about 70% for a team that reaches the prompt, and adds about 50%. v2 clears 95 to 100% at levels 1 and 2 (too safe, solo too) and 38 to 52% at levels 3 to 5 (about right to harsh).
4. **Call-ins:** one call-in costs about 20 to 25% of an extract at its level, and two Field repairs lift a struggling player by at least 15 points. v2 sees +6 to +14 points where it struggles (level 3 and up), and nothing at levels 1 and 2.
5. **Collapse lethality:** unchanged. The lab result holds whoever drops the span.
6. **Warden:** a pair breaks it in 90 to 120 s and a solo player in 3 to 4 minutes. Add: a pair at normal armor wins at least 60% of its Warden fights. v2 as a pair: 20 of 40 wins, 210 s; 29 of 40 and 164 s with hp 1000 / leg 200. Solo: 1 of 40.
7. **Multi-kills:** at least one multi-kill in 80% of matches and a triple or better in a third. v2 meets both from level 2 up (95 to 100% and 37 to 84%). At level 1 the triple rate is 24 to 34%, which is fine for the first level. Treat this target as met.
8. **Scrap curve:** unchanged. v2's income matches v1's at levels 1 and 2, and the sturdy proxy's at levels 3 to 5.
9. **Death rate per wave and zone enemies:** each zone enemy costs at most 10 points on its first level, and no wave kills more than 50% of those who reach it. v2 meets it for packs, the Wrecker and Elites. The Bulwark costs 62 points solo and 38 co-op. Wave 4 kills 74 to 81% of the solo pilots who reach it at levels 3 to 5, and wave 5 of level 5 kills 79% of pairs.
10. **Climb length:** unchanged; 22 to 23 minutes for v2's victorious co-op climbs, inside the target.
11. **Wave density:** unchanged (first contact within 3 s, at most 25% idle). v2 is at 13 to 21% idle at level 1, but 26 to 41% at levels 3 to 5, with first contact at 3 to 6 s.
12. **Per-level extract rates, in v2 terms (replaces the v1 wording):** solo about 90% at level 1, falling about 15 points a level to about 30% at level 5; co-op about 95% at level 1, falling to about 50% at level 5. v2 today:
    - solo 99%, 93%, 4%, 1% and 0%
    - co-op 100%, 100%, 62%, 52% and 16%

    Levels 1 and 2 are a little easy for a careful player, and levels 3 and 5 are cliffs (the Bulwark wave and the Warden wave).

### Candidate changes, re-tested with pilot v2

Ranked by evidence and effect. "Tested" means a run-only `--tune` batch with pilot v2 on the same paired seeds, in `2026-10-28-pilot-v2-candidates.jsonl` (the Redline and Warden ones in `callins-redline` and `warden`). None is applied.

| Rank | T key | Current | Proposed | v2 result | v1 result | Still needed? |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `zoneThreats` row 2 (Bulwark) `waves`, or a Bulwark rule | [4, 5] | [5] on its first level; or a gentler bash (damage, arc or turn rate) | Tested. Level 3: solo 4% → 25% (wave-4 deaths 74% → 7%), co-op 62% → 83% (wave-5 deaths 33% → 17%) | Co-op wave-4 deaths 100% → 23% | **Yes.** It is the largest effect in the sweep even for a pilot that flanks, and the bash does half of all damage at levels 3 and 4. The bash damage, arc and turn rate are untested; a decision row should pick between moving the Bulwark and softening its bash |
| 2 | `warden.hp`, `warden.leg.hp` | 1500, 300 | 1000, 200 | Tested. Pair wins at normal armor 50% → 73%, fight 210 s → 164 s; armor 1000: 204 → 159 s (pair), 378 → 298 s (solo) | Co-op 160 → 122 s refilled | **Yes**, and it is still short of 90 to 120 s. Rider damage (snipers 43% of what a pair takes) is the next lever, not the barrage (5%) |
| 3 | `combo.decay` | 12 s | 16 s | Tested. Level 1 ×4 reach 57% → 79% solo, 21% → 51% co-op; kills at ×4 7% → 18% solo, 1% → 6% co-op; banked +3% / +2%; extract rates unchanged (99% → 100%, 100%) | ×4 47 → 74% solo, 31 → 54% co-op | **Yes**, the same effect with v2, and co-op needs it more |
| 4 | `overtime.loaders` (or a per-level Overtime wave) | 1 | 2 at levels 1 and 2 | Untested. v2 clears 95 to 100% of Overtimes at levels 1 and 2, solo and co-op; 38 to 52% from level 3 | Co-op 88 to 91% | **Yes**, more than before: it now applies to solo too, so a per-level rule rather than per-player; a question for kr0 |
| 5 | New key for the spawn ring (the literal 10 m in `pickSpawn` and `pickZoneSpawn`) | more than 10 m, anywhere in open zones | 10 to about 30 m of a living mech | Untested. v2 idles 26 to 41% at levels 3 to 5 (v1 31 to 48%), first contact 3 to 6 s | — | **Yes**; needs a decision row first, as before |
| 6 | `redline.armor`, `redline.per10` | 0.5, 1 | 0.25, 0.5 | Tested at level 2 solo: armor per use 5.9 → 3.0; extract 84% → 87% (starter build 93%); Redline share of armor lost 41% → 27%; level 3: 7.3 → 3.5 per use, 0% either way | 29 → 16 per use | **Probably.** The lab worst case (32 to 52 from a lockout) is what makes it a trap for players, and that's unchanged. Used well, it is less urgent than v1 suggested |
| 7 | `waves[3]`, `waves[4]` (waves 4 and 5) | 6 bots + 2 loaders; 5 bots + 1 loader + boss | 5 bots + 1 loader; 4 bots + 1 loader + boss | Tested. Level 1: 99% → 99% solo, 100% → 100% co-op; level 2: 93% → 99% solo, 100% → 100% co-op; level 3: 4% → 7% solo, 62% → 75% co-op. Banked per extract −11% at level 1; ×4 reach 57% → 39% solo, 21% → 10% co-op | Solo L1 13% → 30% | **No** at levels 1 and 2, where v2 already clears; it costs scrap and combo there. At level 3 it does less than moving the Bulwark. Drop it, or keep it as a level-3+ question |
| 8 | `collapse.botDmg` | 80 | 90 | Tested in level-4 and level-5 co-op: no measurable change (extract 52% → 53%, 16% → 16%; crushes 0.51 → 0.49, 0.45 → 0.49) | Lab only | **Optional.** The lab reason (a Wrecker survives every drop) still holds, but matches don't feel it |
| 9 | `durability.share` | 0.10 | 0.25 | Untested. v2 loses less armor per match than v1 (13 to 154 per mech), so wear is even less of a sink | — | As before, a question for kr0 |
| 10 | `callin.price.overclock` | 30 | keep, or 20 | Tested as a pair: v2 calls both every match with no extract lift (level 1 99%, level 2 96% against 93%, level 3 3% against 4%) | Same | No pilot evidence either way; a human test should decide |

Top five with pilot v2: the Bulwark (move it to wave 5 on level 3, or soften the bash), the Warden's health together with its rider damage, the combo decay, Overtime at levels 1 and 2, and the spawn ring. Lighter waves 4 and 5 drop off the list: they were the pilot's problem, not the waves'.

## Baseline: tuning in the prototype (Oct 25, 2026)

The values in `sim.js` `T` and `PARTS`, carried over unchanged. They are the prototype's, not targets.

| Group | Values |
| --- | --- |
| Clock | 1/60 s fixed tick; ATB fill 6 s; timing ring 1.0 s, start radius 72, target 30 |
| Timing | Perfect window 5% and Good window 18% of the start radius (release within ± 0.086 s and ± 0.31 s of 1.0 s; auto-Miss at 1.31 s); damage ×2, ×1, ×0.5 for Perfect, Good, Miss |
| Heat | Drain 20 per second; overheat lockout 3 s; 28 per heavy shot (every heavy weapon, every grade); minigun 3.2 per shot; dash 10 |
| Mech | Armor 100; speed 4.4; dash 12 for 0.15 s, 1.3 s cooldown; weight slows by 1/(1 + 0.004 × (weight − 100)) |
| Waves | 3 bots; 4 bots and 1 loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, 1 loader and the boss |
| Enemies | Bot hp 60; loader hp 160; boss hp 180, 18 damage |
| Pods | 1 per wave plus 0.4 extra; Field repair heals 40%; Overclock ×2 for 15 s |
| Levels | Per level above 1: enemy count +25%, hp +15%, damage +15%, scrap +10%; maximum level 50 (5 accepted, GDD-D47); a downed co-op mech returns with 30% armor |
| Repair | 3 armor restored per scrap |
| Collapse | Warning 0.9 s; bot damage 80; player damage 40; debris cap 300 |
| Parts | 21 parts; prices 0 to 140 scrap across three rarity tiers (see the GDD parts list) |

## Values the GDD sets that the prototype doesn't have yet

The GDD sets these (GDD-D18, GDD-D20, GDD-D23 and GDD-D24). kr0 accepted the GDD-D18, D20 and D23 values on 2026-10-26 as starting values; the revive values are Proposed. None is tuned.

| Key | Value |
| --- | --- |
| `durability.share` | 0.10 of armor lost ÷ max armor, as wear on each fitted non-starter part (a starting value for the sweep below, not a target) |
| `durability.repair` | Common 0.25, rare 0.5, epic 0.75 of price × wear |
| Wave-5 boss | Health × 1.5, fire interval 1.5 s, scrap 18 |
| `upgrade.levels` | 2 (Mk I to Mk III) on the nine weapons: four Arm-R guns, three Arm-L heavy weapons, siege mortar, Cryo flash-vent |
| `upgrade.dmg` | 0.10 of the weapon's damage to enemies per level |
| `coop.revivePrice` | 40 scrap at level 1, × (1 + 0.10 × (level − 1)), rounded; paid from the survivor's match scrap at the end of waves 1 to 4 |
| `coop.reviveArmor` | 0.30 of max armor (the prototype's `level.revive`) |
| `upgrade.cost` | Common 20 and 40, rare 35 and 70, epic 60 and 120 scrap for Mk II and Mk III |

## Changes

### Tuning pass 1 (Oct 29, 2026, GDD-D57)

kr0 picked the three tested changes from the [pilot v2 candidate table](#sweep-with-pilot-v2-oct-28-2026). Each is now in `T`:

| T key | Was | Now | Evidence |
| --- | --- | --- | --- |
| `zoneThreats` row 2 (Bulwark) | waves [4, 5] | waves [4, 5], and `firstWaves` [5] on the level Smelter Row opens (level 3) | Re-run after the change, pilot v2, 60 runs each, seeds 1 + 7919 k: level 3 solo extracts 13 of 60 (22%, was 4%), deaths by wave {2: 1, 4: 4, 5: 41}; co-op 49 of 60 (82%, was 62%), deaths only in wave 5 (9). Records in `tuning-runs/2026-10-29-tune1-l3-solo.jsonl` and `-l3-coop.jsonl` |
| `warden.hp`, `warden.leg.hp` | 1500, 300 | 1000, 200 | From the run-only Warden batch in `2026-10-28-pilot-v2-warden.jsonl`: a pair at normal armor wins 29 of 40 (was 20), median fight 164 s (was 210 s). Still above the 90 to 120 s target; rider damage is the next lever |
| `combo.decay` | 12 s | 16 s | Re-run after the change, level 1 solo, 100 runs: ×4 reached in 79 (was 57). Record in `tuning-runs/2026-10-29-tune1-l1-solo.jsonl` |

The rules check now expects no Bulwark in wave 4 of level 3, one in wave 5, Bulwarks in waves 4 and 5 from level 4, and a 1,000-health Warden with 200-health legs. Still open for kr0: Overtime at levels 1 and 2, the spawn ring, the Redline cost, and the Warden's rider damage.

## Tokens per story

None logged yet.

## Scenario credits per character

| Date | Character | What | Credits |
| --- | --- | --- | --- |
| 2026-10-28 | Tim-o | Puppet parts sheet v2 (GPT Image 2.5 Sunburst, medium, transparent) | 4 |
| 2026-10-28 | Tim-o | Isometric dash sprite sheet (GPT Image 2, medium) | 13 |
| 2026-10-28 | Tim-o | Parts sheet v2.1, torso side socket removed (GPT Image 2.5 Sunburst edit, medium) | 4 |
| 2026-10-28 | Tim-o | Isometric jump-jet hop sprite sheet (GPT Image 2, medium) | 13 |
| 2026-10-28 | Tim-o | Isometric win cheer sprite sheet (GPT Image 2, medium) | 13 |
| 2026-10-28 | Tim-o | Isometric jump-jet hop, round 4 with the turnaround reference (GPT Image 2, medium) | 13 |
| 2026-10-28 | Tim-o | Isometric idle, run and destroyed, round 4 (GPT Image 2, medium, 13 each) | 39 |
| 2026-10-29 | Tim-o | Isometric run, guided method (pose guide sheet): GPT Image 2.5 Sunburst 4 and Gemini 3.1 Flash 20 | 24 |
