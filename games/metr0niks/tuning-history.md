# Metr0niks tuning history

Oct 25, 2026 · @kr0 · kept by the systems-designer

Every changed number, why it changed, and the tokens each story spent. No tuning change has been logged yet. This file opens with the Simulation section the [studio standard](../../studio/simulation-and-tuning.md) requires and the baseline values the prototype ships with. Until the unset rows below are filled in, sweeps are exploratory and can't close a tuning story.

## Simulation

- **Runner:** none yet. The rules are `sim.js`; in Node, `import './sim.js'` then `globalThis.MetroSim.create({seed, mode, builds, level})`, and `sim.step()` advances one tick. A runner that plays whole excursions and writes a metrics record per run is to be built. Results will land in `games/metr0niks/tuning-runs/` (proposed).
- **Determinism:** the simulation draws from one seeded stream, steps in fixed 1/60 s ticks and has no DOM, timers or browser globals. `MetroSim.hash` exists. The replay check (a seed, the tuning version and the input log reproducing one state hash) is not built.
- **Scenarios:** TBD. Likely: Excursion level 1 and level 3 (all zones open), single-player and two-player co-op, Overpass Sector 4.
- **Players:** none yet. A scripted bot has to drive a mech through five waves; co-op needs a second bot. Settings TBD.
- **Seeds:** TBD (kr0 to decide). Paired seeds are required by the standard.
- **Measures and targets:**

  | Measure | Target | Source of the target |
  | --- | --- | --- |
  | Excursion length | TBD | Not in the GDD yet |
  | Extract rate for a starter mech at level 1 | TBD | Not in the GDD yet |
  | Scrap per extract, by level | TBD | GDD Economy: all values TBD |
  | Runs to afford each part tier | TBD | Not in the GDD yet |
  | Share of damage that becomes durability damage | TBD | GDD-D9; open question |
  | Rejected inputs and errors | 0 | Standard |

- **Re-run when:** any key in `T` changes, a part's stat change or cost changes, the wave table changes, or the durability or repair rule changes.
- **Caps:** TBD. A run that exceeds the cap is counted and reported, not dropped.

Open design questions that need sweeps: what share of excursion damage becomes durability damage and what repairs cost (open questions), and the length of the rejoin window.

## Baseline: tuning in the prototype (Oct 25, 2026)

The values in `sim.js` `T` and `PARTS`, carried over unchanged. They are the prototype's, not targets.

| Group | Values |
| --- | --- |
| Clock | 1/60 s fixed tick; ATB fill 6 s; timing ring 1.0 s, start radius 72, target 30 |
| Timing | Perfect window 5% and Good window 18% of the start radius; damage ×2, ×1, ×0.5 for Perfect, Good, Miss |
| Heat | Drain 20 per second; overheat lockout 3 s; pile-bunker 28 per heavy shot; minigun 3.2 per shot; dash 10 |
| Mech | Armor 100; speed 4.4; dash 12 for 0.15 s, 1.3 s cooldown; weight slows by 1/(1 + 0.004 × (weight − 100)) |
| Waves | 3 bots; 4 bots and 1 loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, 1 loader and the boss |
| Enemies | Bot hp 60; loader hp 160; boss hp 180, 18 damage |
| Pods | 1 per wave plus 0.4 extra; Field repair heals 40%; Overclock ×2 for 15 s |
| Levels | Per level above 1: enemy count +25%, hp +15%, damage +15%, scrap +10%; maximum level 50; a downed co-op mech returns with 30% armor |
| Repair | 3 armor restored per scrap |
| Collapse | Warning 0.9 s; bot damage 80; player damage 40; debris cap 300 |
| Parts | 21 parts; prices 0 to 140 scrap across three rarity tiers (see the GDD parts list) |

## Changes

None yet.

## Tokens per story

None logged yet.
