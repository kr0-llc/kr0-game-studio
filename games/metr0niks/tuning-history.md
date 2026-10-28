# Metr0niks tuning history

Oct 25, 2026 · updated Oct 28, 2026 · @kr0 · kept by the systems-designer

Every changed number, why it changed, and the tokens each story spent. No tuning change has been logged yet. This file opens with the Simulation section the [studio standard](../../studio/simulation-and-tuning.md) requires and the baseline values the prototype ships with. Until the unset rows below are filled in, sweeps are exploratory and can't close a tuning story.

## Simulation

- **Runner:** `simulations/run.js` (built Oct 28, TDD-D17). `node simulations/run.js --runs 100 --level 1` plays whole excursions headless with scripted pilots and prints a summary; `--players 2` for co-op, `--climb` for level 1 up until a death, `--tune file.json` for a variant (a partial `T` merged over a copy for those runs only, TDD-D11), `--out` writes one JSON record per run to `games/metr0niks/tuning-runs/`. Run k of a batch uses seed `--seed + k`, so batches share paired seeds. About 0.3 s per excursion.
- **Determinism:** the simulation draws from one seeded stream, steps in fixed 1/60 s ticks and has no DOM, timers or browser globals. Every runner batch replays its first match from the recorded inputs and compares `sim.stateHash()` every 10 s and at the end; a mismatch fails the batch. `sim.tuneHash()` identifies the tuning a record was made with. `simulations/rules-check.js` asserts single rules.
- **Scenarios:** to be set by kr0. Likely: Excursion level 1 and level 3 (all zones open), single-player and two-player co-op, Overpass Sector 4.
- **Players:** `simulations/pilot.js`, a scripted pilot: it fights the nearest enemy from about 9 m while circle-strafing, closes in for the pile-bunker when the ATB bar is full (not into a charging loader or a crowd), takes Field repair below 60% armor and picks up scrap. Ring accuracy is set per batch: `perfect`, `mix` (70% Perfect, 25% Good, 5% Miss), `random` or `none`. It is a baseline, not a model of a skilled player: it never dashes, uses Q or plays the city.
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

The patrol bots' orbs do the killing: with bot shots set to 0 damage, the solo pilot extracts 33 of 40 times. The solo/co-op gap is large; whether that's the pilot or the waves is a question for the wave-density sweep.

Questions that need sweeps:

- Whether 10% wear and the repair rates let a losing player recover.
- Co-op revive (GDD-D24): how often a survivor can afford the revive price by wave, by level. Needs the runner, a two-bot scenario and kr0's target.
- Weapon upgrades (GDD-D23): how many extracts it takes to take a weapon to Mk III, and how much each level shortens a wave. Planned variants: damage per level 0.05, 0.10 and 0.15, crossed with upgrade cost ×0.5, ×1 and ×2, on paired seeds at level 1 and level 3, single-player, the starter build and one rare build. Needs the runner and kr0's targets first.

- Fun pass (GDD-D35 to GDD-D55, Oct 28): every number in it is a starting value. Before kr0 fixes the values, the runner should answer: how often a bot-driven player reaches a ×4 combo (step 10%, decay 12 s); how much armor a Redline vent costs per use (5 s, cap 130, 0.5 armor per heat); the extract rate and scrap per run with and without Overtime at levels 1, 3 and 5 (×1.5 drops after the GDD-D54 trim); how much scrap call-ins absorb per climb, and whether the GDD-D55 trims (combo +10% a step, demolition +15%, Elites ×1.5, contract 15, Scrap cache 8) leave buying a part feeling earned; whether scaled collapse damage keeps a span drop lethal to bots at level 5; how long the Warden fight takes with and without leg breaks; how often a player sees a multi-kill; the scrap curve with every kill bonus stacked (combo, demolition, Elite, Overtime) against what there is to buy; whether each zone's enemy raises the death rate by a step rather than a cliff; and whether a 5-level climb is the right length. PR #12 scales the map 1.5× in both directions (216 × 48 m) so two mechs fit side by side, but leaves the waves as they are, so the same enemies spread over about 2.25× the floor. The sweep should check the wave counts on the larger map, in single-player and co-op, before the level-1 counts are fixed. The GDD-D50 stats record is the metrics record the runner needs. Needs the runner, a scripted player that uses the ring, and kr0's targets.

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

None yet.

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
