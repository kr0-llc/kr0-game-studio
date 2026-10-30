# Metr0niks tuning history

Trimmed 2026-10-30. The full history up to tuning pass 1 is in [docs/superseded/tuning-history-2026-10-29.md](../docs/superseded/tuning-history-2026-10-29.md), and the raw records are the `*.jsonl` files in this folder.

## How sweeps ran

- Runner: `tests/reference-sim/run.js` played whole excursions headless (about 0.3 s each) with scripted pilots from `pilot.js`. `--runs`, `--level`, `--players 2`, `--climb`, `--tune file.json`, `--pilot v2`, `--out` wrote one JSON record per run here.
- Determinism: one seeded stream, fixed 1/60 s ticks, every batch replays its first match and compares `stateHash()`.
- Pilot v2 dodges, flanks, uses Q and call-ins. Its numbers are a regression guard, not a promise about players.

## Current values (after tuning pass 1, GDD-D57)

| T key | Value | Was |
| --- | --- | --- |
| Bulwark on the level Smelter Row opens (3) | wave 5 only | waves 4 and 5 |
| `warden.hp`, `warden.leg.hp` | 1000, 200 | 1500, 300 |
| `combo.decay` | 16 s | 12 s |

Pilot v2 after the change: level 3 solo extracts 22% (was 4%), co-op 82% (was 62%); level 1 solo reaches x4 combo in 79% of runs (was 57%); a Warden pair wins 29 of 40, median 164 s.

## Proposed targets (not yet set by kr0)

- Extract rate: solo about 90% at level 1 falling to about 30% at level 5; co-op about 95% falling to about 50%.
- Combo x4 in about 60% of matches. Warden: a pair breaks it in 90 to 120 s.
- Overtime clears about 70% for a team that reaches it. No wave kills more than 50% of those who reach it.
- Climb length 22 to 23 minutes for a co-op victory.

## Still open

Overtime at levels 1 and 2 (too safe), the spawn ring (26 to 41% idle at levels 3 to 5), the Redline armor cost, the Warden's rider damage.

## Changes

| Date | Change | Decision |
| --- | --- | --- |
| 2026-10-29 | Tuning pass 1 (table above) | GDD-D57 |
