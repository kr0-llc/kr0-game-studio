# Blackletter: Chronos, Technical Design Document

Oct 21, 2026 · @kr0

## Summary

One deterministic JavaScript engine runs everywhere: in the browser for practice, on the game server for online matches, and in Node for simulation. Every agent in the match (Sebastion, his counsel, the Coach) is plain code with no model calls, so a match costs zero tokens and replays exactly. Language models are used only around the match: synthetic playtesters, the Tuning Lab's sweep suggester, and the Claude Code sessions that build the game.

### Stack

| Layer | Technology |
| --- | --- |
| Client | Plain JavaScript ES modules, no framework; canvas board renderer; Three.js (vendored) for the experimental 3D view |
| Hosting and auth | Firebase Hosting; Google sign-in through Firebase Auth |
| Game server | Node on Cloud Run, WebSockets (`ws`); one authoritative room per online match |
| Storage | Firestore: match logs, room leases, player records, Game Master list, sim runs |
| Simulation | Node worker pool locally; Cloud Run Job `chronos-sim` for large sweeps |
| Model API | Anthropic SDK on the game server, for the sweep suggester only |
| Tests | Node test runner (535 unit tests), Playwright UI suites on desktop and Pixel 9 |

## Architecture

&#91;embedded content: system architecture · browser, server, storage and simulation\]

The same engine module runs in all three places: in the browser for practice, inside each online match room, and in the simulator's worker processes. Only the sweep suggester calls a model, and the synthetic players reach the game the way a person does, through the page.

## Engine and determinism

The engine (`src/engine.js`) steps the battle in fixed time steps and draws every die from a seeded random stream, so a seed plus a command log always reproduces the same battle. Every guarantee in this design rests on that.

- **Commands are the only way in.** Players, Sebastion and the Coach change the game only through `src/commands.js`. Every command is logged, so any match, bot matches included, replays to the same state hash without the bot present.
- **Per-seat views.** `serializeState(engine, seat)` produces what one seat may see. The opponent's sealed bid, hidden prep placements and queued orders are left out. Online clients receive only their seat's snapshot, and Sebastion builds his private view engine from the same snapshot (`src/mirror.js`).
- **Numbers live in one place.** Every rule number is a key in `src/tuning.js` (v2.14.6), with a ledger entry for each change. Pace presets and scenario files apply overrides on top; nothing else hard-codes a number.
- **Online rooms.** The server runs one authoritative room per match in fixed steps, accepts commands from each socket for its own seat only, and streams per-seat snapshots. The command log is saved to Firestore as the battle runs, and a lease names the one Cloud Run instance running the room. If that instance dies, another rebuilds the battle by replaying the saved log.
- **Views are clients.** The 2D board, the Game Master view and the experimental 3D view all read the engine and send commands the same way, so the 3D view adds no rules of its own. The one engine change it needs, an authored-map option, uses no randomness or clock.

## Agent architecture

### In-match agents (no model)

**Sebastion** (`src/bot/`) is a utility AI. `BotController` runs him for one seat wherever the engine runs. On each look it rebuilds a view engine from his seat's snapshot and asks `Brain.decide(view, seat)` for plain commands.

| Layer | Input | Output |
| --- | --- | --- |
| Perception | The seat's view | Node state, distance fields, enemy threat per hex |
| Strategy | Perception, Tithes, Fervor | A node assignment per unit; what to recruit or refit; which Miracle to cast |
| Tactics | Each ready unit | The option with the best utility: attack or charge (expected exchange from the combat maths), move (position score), or hold |
| Wager | Morale, Fervor, units engaged, past opponent bids | Whether to call a Challenge, and the bid |

The utility weights live in `src/bot/profile.js` (for example, a kill is worth 2.0, holding the assigned node 9). Difficulty profiles change only how often he looks (`decisionSec`), orders per look, the `slip` chance of taking a lesser option, and a few weights. His random choices use his own seeded stream, so he is as deterministic as the engine.

**Counsel** runs a second `BotController` in the Game Master view and shows its top three scored options for the selected unit. **The Coach** (`src/coach.js`) is an event-driven script: it watches engine events, opens tips, pauses the clock through the client, and sets Sebastion's `holdBack` flag for the opening of a coached battle. That flag is the one place two in-match agents coordinate.

### Around-the-match agents (model-backed)

| Agent | Built from | Input | Output |
| --- | --- | --- | --- |
| Synthetic players (7) | Claude agent sessions with a persona brief, driving `scripts/playtest/play.mjs` (Playwright, headless Chromium) | Screenshots and page text only; never the code or docs | A play log, 10 rubric scores with evidence, and an in-character report |
| Player Researcher | A Claude session | The seven reports | A round summary with findings ranked by severity and reach |
| Sweep suggester | `server/suggest.js`: one Messages API call with structured outputs | The Game Master's question and the current sweep plan | A sweep manifest and a rationale, validated before it is shown |
| Studio roles (13) | Claude Code sessions on the repo, one role per thread | A brief and the role's own files | Commits with tests, docs and ledger entries |

Self-play (Sebastion against Sebastion) is the balance oracle: `npm run sim:sweep` plays every variant on the same seeds across worker processes and caches finished matches by engine, tuning and seed.

## Token budget and API constraints

The live game spends zero tokens per match. Tokens are spent during development, with hard caps where code calls a model.

### Token budget

| Activity | Budget | Basis |
| --- | --- | --- |
| One live match, any mode | 0 tokens | Checked in code: the sweep suggester is the only model call |
| One sweep suggestion | Output capped at 16,000 tokens; input about 6,000 or less, mostly a cached system prompt | Cap from code. Input inferred: a system prompt with the 9.3k-character tuning reference, plus at most 2,000 characters of request and 8,000 of current plan |
| Sweep suggestions per Game Master | 4 a minute | Rate limit in code |
| One balance question (agent reading sim results) | About 320 tokens, against about 23,600 before the Tuning Lab | Measured 2026-10-14, a 74× saving |
| One full balance pass | 10,000 to 20,000 tokens, against 60,000 to 180,000 before | Estimate in the simulation plan, not yet measured |
| One synthetic playtest round | Not measured. Bounded by 7 personas, at least 25 orders each and about 25 screenshots each | Protocol limits; agents stop viewing images reliably after about 30 |

### API constraints

- **Model.** Claude Sonnet 5.5 with medium effort, and a server-side fallback model if a request is declined.
- **No tools, structured output.** The model gets only a JSON schema for its answer. The Game Master's text and the current plan are sent as data in the user turn, never as instructions.
- **Validation before use.** Only known numeric tuning keys; each value between 0 and ten times its current value; at most 8 variants, 50 matches and 6 changed keys per variant; the cloud run's own checks on top.
- **Human in the loop.** Nothing runs by itself. The suggestion replaces the plan in the editor, and the Game Master edits it and presses Start.
- **Failure is visible.** A cut-off answer returns an error asking for a narrower request; without an API key the route returns 503. The key lives in Google Secret Manager (`anthropic-api-key`) and still has to be added.
- **Access.** Only signed-in Game Masters, listed in Firestore `config/gm`, can reach the suggester or start cloud runs.

## Testing, tuning and deployment

- **Rules tests.** Every rules change ships with an acceptance test in `tests/acceptance/` in the same commit as the rulebook edit. The unit suite (535 tests) runs quietly with `npm test`.
- **UI tests.** Playwright suites in `tests/ui/` run on desktop and on a Pixel 9 profile; the Tuning Lab has 58 of its own.
- **Replay check.** Every sweep replays its first match and compares state hashes; a mismatch is reported as `replay DIVERGED`, never tuned around.
- **Balance targets.** Match length 8 to 12 minutes, even seat win shares, zero rejected orders, and each duel matchup won 65 to 80% by its favoured side. Each tuning change bumps `TUNING_VERSION` and quotes the winning sweep line in the ledger.
- **Deployment.** Trunk-based: every push to `main` deploys Hosting, Firestore rules and the Cloud Run server through GitHub Actions, sometimes on a self-hosted Mac runner. The dev site is [blackletter-kr0nos-dev.web.app](https://blackletter-kr0nos-dev.web.app).
- **Performance.** `npm run perf` and `npm run perf:atb` probe frame cost; a real-device budget for phones and iPad is still an open milestone.
