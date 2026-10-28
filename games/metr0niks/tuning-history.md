# Metr0niks tuning history

Oct 25, 2026 · updated Oct 27, 2026 · @kr0 · kept by the systems-designer

Every changed number, why it changed, and the tokens each story spent. No tuning change has been logged yet. This file opens with the Simulation section the [studio standard](../../studio/simulation-and-tuning.md) requires and the baseline values the prototype ships with. Until the unset rows below are filled in, sweeps are exploratory and can't close a tuning story.

## Simulation

- **Runner:** none yet. The rules are `simulations/sim.js`; in Node, `import './simulations/sim.js'` from this folder then `globalThis.MetroSim.create({seed, builds, level})`, and `sim.step()` advances one tick. A runner that plays whole excursions and writes a metrics record per run is to be built. Results will land in `games/metr0niks/tuning-runs/` (proposed).
- **Determinism:** the simulation draws from one seeded stream, steps in fixed 1/60 s ticks and has no DOM, timers or browser globals. `MetroSim.hash` exists. The replay check (a seed, the tuning version and the input log reproducing one state hash) is not built.
- **Scenarios:** to be set by kr0. Likely: Excursion level 1 and level 3 (all zones open), single-player and two-player co-op, Overpass Sector 4.
- **Players:** none yet. A scripted bot has to drive a mech through five waves; co-op needs a second bot.
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

Questions that need sweeps:

- Whether 10% wear and the repair rates let a losing player recover.
- Co-op revive (GDD-D24): how often a survivor can afford the revive price by wave, by level. Needs the runner, a two-bot scenario and kr0's target.
- Weapon upgrades (GDD-D23): how many extracts it takes to take a weapon to Mk III, and how much each level shortens a wave. Planned variants: damage per level 0.05, 0.10 and 0.15, crossed with upgrade cost ×0.5, ×1 and ×2, on paired seeds at level 1 and level 3, single-player, the starter build and one rare build. Needs the runner and kr0's targets first.

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
| Levels | Per level above 1: enemy count +25%, hp +15%, damage +15%, scrap +10%; maximum level 50; a downed co-op mech returns with 30% armor |
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
