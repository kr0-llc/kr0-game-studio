# Simulation and tuning

Last updated: 23 October 2026 · Owner: kr0 · Kept by: technical-director (simulation) and systems-designer (tuning)

This standard applies to every kr0 game. It turns [ways of working](ways-of-working.md) principle 5, *every number is data*, into a working method: each game can play itself without a screen, every tuning change is backed by runs of that simulation, and the runs report what happened rather than whether it was good.

How much to run, what counts as passing and when to run again are left to each game. Each game writes those down in its own docs (section 4). A game's approach can go beyond this standard but never below it without a decision logged in that game's decision history.

---

## 1. Every game has a headless deterministic simulation

The simulation is the game's rules with no renderer. It is the same code the player runs, not a copy kept for balance.

| Requirement | What it means |
| --- | --- |
| Headless | Runs in Node (or the engine's batch mode) with no DOM, no canvas and no browser globals. Views are clients of the simulation and add no rules of their own. |
| Fixed step | Time advances in fixed ticks, never from the frame clock. Speed-ups change how many ticks run per real second, not the tick. |
| Seeded | Every random draw comes from a seeded stream owned by the simulation. `Math.random` (or any unseeded source) is banned inside the rules. In-game agents (bots, AI commanders) draw from their own seeded stream. |
| Replayable | A seed, the tuning version and the input or command log reproduce a run to the same state hash. |
| Tunables in one place | Every number the rules use is a key in one tuning table or file, with a version. Pace presets and scenarios apply overrides on top. Nothing else hard-codes a number. |
| Playable by a bot | At least one scripted player can drive the simulation to an end state, so a run needs no human. |
| Reports metrics | A run ends with a small record of measures (length, winner, resources, errors). What to measure is the game's call. |

**Replay check.** Every batch of runs replays at least one of its runs and compares state hashes. A mismatch is a failing build, fixed in the engine and never tuned around.

**Shared tools.** Tooling used by every game lives in [`tools/`](../tools/README.md). The studio's simulation and tuning platform, `chronos-sim`, will be built there. Until it exists, a game runs sweeps with its own runner and still follows this standard.

**Prototypes.** A throwaway prototype may skip the simulation (ways of working section 9 relaxes prototype standards). The simulation is required before a game's first tuning change is logged, and at the latest by the end of pre-production.

## 2. Tuning changes are evidence-based

A tuning change is any change to a value in the tuning table, or a rule change whose purpose is balance.

1. **Ask a question.** State what you're trying to move and the game's target for it, for example "Shooter over Chopper, target 65 to 80%".
2. **Sweep.** Run the baseline and each variant on the **same seeds** (paired seeds), so differences come from the change and not from luck. Change as few keys per variant as the question allows.
3. **Read the whole table.** Look at every measure the game tracks, not only the one you're moving. A fix that breaks another measure is not a fix.
4. **Log it.** Record the sweep in the game's `tuning-history.md`: question, method (seed count, scenario, build or commit, tuning version), the table of results, and what it says.
5. **Decide.** kr0 picks the change. The decision goes in the GDD decision history with the sweep it came from, and the tuning version is bumped.

Tokens spent on the story still go in the tuning history, as ways of working section 6 already says.

Blackletter's two duel sweeps of 2026-10-21 ([tuning history](../games/blackletter/tuning-history.md)) are the worked example: the first round's reading ("the fix must be a rule") was wrong, the second round found that tempo decided the leg, and GDD-D15 replaced GDD-D10 on that evidence.

## 3. Reports give observations, not verdicts

Ways of working section 9 already says helper scripts report observations and never verdicts. For simulation this means:

- **A report states measures against the game's documented targets** ("31.8%, target 65 to 80"). It may mark a value outside its target (the tuning history uses **broken** and **missed**), because that is a fact about the number.
- **A report never decides.** No "ship it", "approved" or "balanced". A script can't see the pillars, the player personas or the decisions already made, so it can't overrule them.
- **Readings are labelled as readings.** "What it says" sections interpret the table and can be wrong; Blackletter's first sweep reading was. Keep the table next to the reading so the next sweep can correct it.
- **Unfinished runs are reported, not dropped.** Runs that hit a time cap, crash or diverge on replay are counted in the report.
- **Model-written suggestions are suggestions.** A model may propose a sweep plan (Blackletter's sweep suggester does), but a person edits it and starts it, and its output is validated against the known tuning keys first.

## 4. What each game decides and documents

Seed counts, pass/fail thresholds and re-run triggers differ by game: a five-minute capture-point match and a fifteen-minute tactics battle don't need the same sample. Each game writes them down in its TDD (testing section) or in a "Simulation" section at the top of its tuning history, using the template below. Until a game fills it in, its sweeps are exploratory and can't close a tuning story.

### Template

```markdown
## Simulation

- **Runner:** how to run it (command, entry point) and where results land.
- **Determinism:** seed source, tick length, how the replay check runs.
- **Scenarios:** the standard setups a sweep runs (mode, map, opponents, pace).
- **Players:** which bots or scripted players drive the runs, and at which settings.
- **Seeds:** how many runs per variant for each kind of sweep, and whether seeds are paired.
- **Measures and targets:**

  | Measure | Target | Source of the target |
  | --- | --- | --- |
  | e.g. match length | e.g. 5 to 8 min | GDD section or decision id |

- **Re-run when:** the changes that trigger a fresh sweep before a story closes.
- **Caps:** time or tick cap per run, and how capped runs are reported.
```

### Example only: Blackletter today

This shows a filled-in section. It is not a studio default and other games should not copy the numbers.

- **Seeds:** self-play battles use 24 paired seeds per pace; duel sweeps use 400 duels per matchup; the stall story plans 1,000 seeds.
- **Targets:** battle length 12 to 16 minutes (GDD-D14), even seat win shares, zero rejected orders, each duel leg won 65 to 80% by its favoured side.
- **Re-run when:** a rule changes the exchange a target measures, for example the open question "re-run the duel sweep on 4.0.0 with Shooter INIT 3 before the build adopts it".

## 5. Where each game stands

Observed in the studio repo on 2026-10-23. Each gap is a story for that game, not a change made by this standard.

| Game | Simulation today | Gaps against this standard |
| --- | --- | --- |
| Blackletter | Deterministic engine with seeded streams and command logs; Node self-play and duel sweeps, paired seeds, replay check; tuning history with sweeps | Seed counts and re-run triggers are spread across the TDD, tuning history and open questions; gather them into one Simulation section |
| Metr0niks | `games/metr0niks/sim.js`: headless (no DOM, no timers), fixed 1/60 s tick, seeded stream, tunables in `T`; runs in the browser and in Node | No headless runner, metrics record or replay hash check yet; no tuning-history file; no documented seeds or targets |
| Dropfront | TDD plans a seeded headless runner playing thousands of matches overnight, target 5 to 8 minutes | Prototype draws from `Math.random`; no runner yet; no tuning-history file |
| Dual Tech | TDD plans balance runs with simulated perfect, good and 50/50 players, one tuning table | Prototype draws from `Math.random`; no runner yet; no tuning-history file |
