# Blackletter: Chronos tuning history

Oct 23, 2026 · @kr0 · kept by the systems-designer

Every changed number, why it changed, and the tokens each story spent. The studio build starts from the experimental build's tuning v2.14.6, so this file opens with that baseline and the evidence behind it; the stories below it are planned, with their token column filled in as they close.

## Baseline: tuning v2.14.6 (carried over)

| Group | Values |
| --- | --- |
| Clock (Snappy → Grand Tactical) | Gauge 1.6 → 1.0 %/s per INIT; march step 1.6 → 2.6 s; prep 45 → 60 s |
| Nodes | Income 0.08 → 0.05 ₮/s; capture 8 → 13 s; neutralise 10 → 16 s; contested yields nothing |
| Morale | Start 20; bleed 0.05 → 0.03/s for one node, each further node ×0.5; underdog captures 25% faster |
| Fervor | Cap 100; +2/HP dealt, +1/HP taken; Reliquary 0.33 → 0.2/s; +0.15 → 0.09/s per node behind |
| Prices | Chopper 12₮, Jumper 14₮, Shooter 14₮; cards 6₮; Challenge 10, Prayer 15, Exorcism 25, merge 10 Fervor; purchase cooldown 3 → 5 s; supply 8 |
| Wager | Bids 0 to 10, clamped to floor(Morale); window 20 s online; blessings 45 → 75 s |
| Units | Chopper 3/3/1/3/+3/+3/1/11; Jumper 4/6/1/4/+3/+2/1/8; Shooter 2/3/8/4/+3/+2/2/8 (INIT/MOVE/RNG/ATK/HIT/DEF/DMG/HP) |
| Opening gauges | Jumper 100%, Chopper 55%, Shooter 30% |
| Dice | d6 + modifier ≥ 7; natural 1 fails; −1 HIT at 7+ hexes; Volley Weapon −2 HIT adjacent |
| Extinction | 30 → 50 s |

**Evidence at the baseline** (self-play, Sebastion Normal vs Normal, 24 paired seeds per pace; duels 400 each, 2026-10-21):

| Measure | Result | Target |
| --- | --- | --- |
| Battle length, Snappy | 9.85 ± 1.12 min | 8 to 12 |
| Battle length, Grand Tactical | 14.48 ± 1.20 min | 8 to 12 (**missed**); 12 to 16 from GDD-D14 (met) |
| Jumper over Shooter | 77.5% | 65 to 80 |
| Chopper over Jumper | 78.3% | 65 to 80 |
| Shooter over Chopper | 31.7% (Chopper wins 68.3%) | 65 to 80 (**broken**) |
| Morale lead changes per battle | 1.9 with comeback levers, 1.4 without | More than 1 |
| Rejected orders | 0 | 0 |

**How the experimental build got here.** Fourteen tuning versions. The ones that mattered: v2.11.0 cut four units (Mechanized, Ranger, Transport, War Engine) to the three-unit triangle; v2.12 added the underdog levers after one-sided battles; v2.13 introduced pace presets; v2.14.x raised the Chopper's HP and the Shooter's DMG to 2 and set the opening gauges so a Jumper always acts first.

## Duel sweep 2026-10-21: the Shooter vs Chopper leg

400 duels per matchup at start distance 8 on open ground (`npm run sim` in the experimental build). Target: the favoured side wins 65 to 80%.

| Variant | Shooter over Chopper | Jumper over Shooter | Chopper over Jumper |
| --- | --- | --- | --- |
| Baseline v2.14.6 | 31.8% (**broken**) | 77.5% | 78.3% |
| Suppressing Fire drain 15% | 31.8% | 77.3% | 78.3% |
| Suppressing Fire drain 20% | 31.3% | 77.0% | 78.3% |
| Shooter HP 9 | 36.8% | 74.5% | 78.3% |
| Shooter ATK 5 | 43.0% | 69.5% | 78.3% |
| Chopper HP 10 | 48.8% | 77.5% | 68.0% |
| Chopper HP 10, Shooter HP 9 | 52.3% | 74.5% | 68.0% |
| Chopper HP 9 | 48.8% | 77.5% | 58.3% (**broken**) |
| Chopper HP 8 | 66.0% | 77.5% | 46.3% (**broken**) |
| Chopper DEF +2 | 56.0% | 77.5% | 50.8% (**broken**) |

What it says: the Suppressing Fire drain does nothing in a duel, because a Chopper that reaches the Shooter wins the melee regardless of its gauge. Every stat change that gives the Shooter its leg takes the Chopper's leg against the Jumper. The fix has to be a rule that only touches the Shooter-vs-Chopper exchange, which is decision GDD-D10. Candidates for the sprint 1 story: a free opening volley when a Chopper starts its charge at 5 hexes or more; or the Retaliation Charge needs a 4+ roll after a volley that hit.

## Duel sweep 2026-10-21, second round: testing the rule candidates

Same method. The 4+ roll was a temporary engine patch, reverted after the run.

| Variant | Shooter over Chopper | Jumper over Shooter | Chopper over Jumper |
| --- | --- | --- | --- |
| Retaliation Charge needs a 4+ roll | 31.3% (**broken**) | 77.5% | 78.3% |
| Retaliation Charge never happens | 30.8% (**broken**) | 77.5% | 78.3% |
| Suppressing Fire drain 30% | 30.5% (**broken**) | 75.3% | 78.3% |
| Volley Weapon −1 instead of −2 | 65.8% | 57.8% (**broken**) | 78.3% |
| Volley Weapon 0 | 87.3% (**broken**) | 38.3% (**broken**) | 78.3% |
| **Shooter INIT 3** | **66.5%** | **76.3%** | **78.3%** |
| Shooter INIT 3, start distance 6 | 56.0% | 91.3% | 78.3% |
| Shooter INIT 3, start distance 12 | 56.3% | 87.5% | 78.3% |

What it says: the first round's reading was wrong. The Retaliation Charge is not what beats the Shooter: removing it entirely changes nothing. The Chopper wins on tempo. It walks into melee before a slow Shooter (INIT 2, 50 s a turn) gets enough volleys, and Volley Weapon then loses the melee for it. Shooter INIT 3 is the only change that puts all three legs in the 65 to 80% target at distance 8 without touching the other legs. At distances 6 and 12 the Shooter is still favoured, but it falls short of target.

## Carried over from the build, 2026-10-23: tuning 3.0.0 and 4.0.0

The build (`kr0/blackletter-chronos`, `src/tuning.js`) moved on after the baseline. Its two rule versions are now in the GDD (GDD-D16, D17). Values are given at this design's single pace; the build's Snappy values are 0.6 of them.

| Version | Change | Evidence in the build |
| --- | --- | --- |
| 3.0.0 (22 Oct) | Forward recruiting: a Fortress held unbroken opens the free hexes within 2 of it for recruits. Grace 50 s | Bot vs bot, 24 paired seeds, Snappy: 9.85 → 8.81 min, seat split 12/12 → 10/14, no unfinished battles. Sebastion placed 7.9 of 9.9 recruits forward |
| 4.0.0 (22 Oct) | Interrupt: a unit struck on the march owes 0.5 gauge, capped at 1. Forward grace 50 → 75 s. Sebastion values striking a marching target (weight 1.2); a march-exposure weight was tried and dropped because it skewed the seat split to 6/18 | Bot vs bot, 24 paired seeds, Snappy: 8.81 → 9.07 min, seat split 12/12, replays verified. ATB field, 8 seeds: 18.51 → 17.93 min, one battle hit the 30-minute cap |

Not yet measured: Grand Tactical battle length at 4.0.0, and the three duel legs with Interrupt and Shooter INIT 3 together (see Open questions).

## Planned stories

| Sprint | Story | Numbers in play | Target | Tokens |
| --- | --- | --- | --- | --- |
| 1 | Shorten the Grand Tactical battle | Gauge fill 1.0 %/s, bleed 0.03/s, capture 13 s | 8 to 12 minutes without changing Snappy | – |
| 1 | Restore Shooter beats Chopper | A rule change on the charge exchange (GDD-D10); stats are ruled out by the sweep above | 65 to 80% for the Shooter without moving the other two legs | – |
| 1 | Measure a synthetic playtest round | – | A token figure in the TDD | – |
| 2 | End stalled battles | Late-match bleed (prototype: 0.02/s after 12 min) vs sudden-death node | No battle past 20 minutes in 1,000 seeds | – |
| 3 | Easy as the first-battle default? | Easy's hesitation 8 to 22 s, slip 50% | New players win at least one of their first three battles | – |
| 3 | Hard with lookahead | New decision logic, not weights | Hard beats Normal 65% or more | – |

## Prototype tuning (prototype.html)

The pitch prototype plays Snappy on a 9-across board with three nodes and a simple Sebastion. It uses the baseline numbers above except: no terrain, no upgrade cards or merges, no Prayer or Exorcism, a Wager at a fixed 10 Fervor with Sebastion bidding from his Morale and need, and the late-match bleed after 12 minutes. Its purpose is to let a reader feel the clock, the node bleed and the Wager in two minutes, not to balance anything.
