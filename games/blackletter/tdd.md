# Blackletter: Chronos TDD

Oct 21, 2026 · @kr0 · Technical Design Document

This document plans the build. Why each choice was made is in the [TDD decision history](tdd-decisions.md); the rules it implements are in the [GDD](gdd.md).

## Goals and constraints

Build a deterministic rules engine once and run it everywhere: in the browser for practice, in a Node simulator for balance, and later on a game server for online play. Every in-match agent is plain code, so a battle costs zero tokens and replays exactly from its seed.

- **Team:** kr0 directs twelve AI agents (below). kr0 approves every design decision and every file.
- **Platform:** desktop and phone browsers, mouse, keyboard and touch. English and Latin American Spanish from the first build.
- **Determinism first.** A seed plus a command log must reproduce any battle to the same state hash. Every guarantee in this plan rests on that.
- **Numbers live in one place.** Every rule number is a key in one tuning file with a version and a ledger entry per change. Nothing else hard-codes a number.
- **Zero runtime tokens.** Sebastion, Counsel and the Coach never call a model. Models are used only around the match: the agents that build the game, synthetic playtesters, and a sweep suggester for the balance lab.
- **Semester scope:** 15 weeks ending in one playable vertical slice (see Semester scope below).

## Engine and tools

| Need | Choice | Why |
| --- | --- | --- |
| Client | Plain JavaScript ES modules, no framework; one canvas for the board, DOM for panels | Small, fast to load on phones, easy for agents to read whole |
| Engine | One pure module stepping the battle in fixed time steps from a seeded random stream | Same code in browser, simulator and server |
| Simulation | Node worker pool; the same engine with no renderer | Thousands of self-play battles per balance change |
| Hosting and auth | Static hosting with Google sign-in for online modes | The 2D game is static files; the server is only for online rooms |
| Game server (after the semester) | Node on a container service, WebSockets, one authoritative room per match | Per-seat snapshots keep sealed bids and hidden prep secret |
| Storage | A document database for match logs, rooms and player records | Logs are the replay format |
| Tests | Node's test runner for rules; Playwright for the UI on desktop and a Pixel-class phone profile | Every rules change ships with an acceptance test |
| Art | The Blackletter tabletop card art and brand masks; concept art generated and approved by kr0 | The look exists already |

## Architecture

The engine is the only thing that knows the rules. Everything else is a client of it.

- **Commands are the only way in.** Players, Sebastion and the Coach change the game only through a command module. Every command is logged with its time, so any match replays to the same state hash without the bot present.
- **Per-seat views.** A view function produces what one seat may see. The opponent's sealed bid, hidden prep placements and unsent orders are left out. Sebastion builds his private view from the same function, which is how the fairness rule is enforced in code rather than by policy.
- **Fixed steps.** The engine advances in 100 ms steps. Gauges, marches, captures, bleed and timers all tick in the step; the renderer interpolates between steps, so the 2× and 3× clock speeds change only how many steps run per real second.
- **Frozen clock.** A Secret Wager sets a single frozen flag that stops the step loop; nothing else needs to know the clock is frozen.
- **Views are clients.** The 2D board, the Game Master view and the simulator's headless runner all read the engine and send commands the same way. Any later view (a 3D view, a replay viewer) adds no rules of its own.

### Data

| Store | Holds |
| --- | --- |
| Tuning file | Every number in the GDD, keyed and versioned; timing values as one set |
| Unit profiles | The three units' stats and traits; the six upgrade cards as stat deltas |
| Board generator | Point-symmetric layouts for 11, 15, 21 and 25 hexes with 3, 5, 5 and 7 nodes; terrain seeded |
| Command log | Seed, tuning version, and every command with its step; the replay and the save format |
| Player record (online) | Sign-in id, display name, matches played |

## Agent architecture

### In-match agents (no model)

**Sebastion** is a utility AI run by a controller for one seat wherever the engine runs. On each look he rebuilds his view from his seat's snapshot and asks the brain for plain commands.

| Layer | Input | Output |
| --- | --- | --- |
| Perception | The seat's view | Node state, distance fields, enemy threat per hex |
| Strategy | Perception, Tithes, Fervor | A node assignment per unit; what to recruit or refit; which Miracle to cast |
| Tactics | Each ready unit | The option with the best utility: attack or charge (expected exchange from the combat maths), move (position score), or hold |
| Wager | Morale, Fervor, units engaged, past opponent bids | Whether to call a Challenge, and the bid |

Utility weights live in a profile file (a kill is worth 2.0, holding the assigned node 9). Difficulty profiles change only how often he looks, orders per look, a slip chance of taking a lesser option, and a few weights. His random choices use his own seeded stream, so he is as deterministic as the engine.

**Counsel** runs a second controller in the Game Master view and shows its top three scored options for the selected unit. **The Coach** is an event-driven script: it watches engine events, opens tips, pauses the clock through the client, and sets Sebastion's hold-back flag for the opening of a coached battle. That flag is the one place two in-match agents coordinate.

### Around-the-match agents (model-backed)

| Agent | Built from | Input | Output |
| --- | --- | --- | --- |
| Synthetic players (7 personas) | Claude agent sessions with a persona brief, driving the page headless | Screenshots and page text only; never the code or docs | A play log, 10 rubric scores with evidence, and an in-character report |
| Player researcher | A Claude session | The seven reports | A round summary with findings ranked by severity and reach |
| Sweep suggester | One structured-output model call in the balance lab | The Game Master's question and the current sweep plan | A sweep manifest and a rationale, validated before it is shown |

Self-play (Sebastion against Sebastion) is the balance oracle: a sweep plays every variant on the same seeds across worker processes and caches finished matches by engine, tuning and seed.

### Development agents

Twelve AI agents build Blackletter: Chronos. kr0 directs them and approves every design decision and every file they write.

| Agent | Role on Blackletter |
| --- | --- |
| creative-director | Keeps every rule and screen tied to the five pillars, and owns the illuminated-manuscript look. |
| technical-director | Owns determinism: the fixed step, the seeded streams, the command log and the per-seat view. Signs off architecture decisions. |
| producer | Plans the sprints, tracks spend against the 44.1M-token budget, and moves stories below the cut line when a sprint overruns. |
| game-designer | Owns the GDD: the skirmish, the nodes, the Wager and the Miracles. |
| systems-designer | Owns the tuning file. Tunes pace, bleed and the unit triangle from self-play sweeps and keeps the tuning history. |
| economy-designer | Balances Tithes, Fervor, recruit and card prices so an army behind on nodes can still buy its way back. |
| gameplay-programmer | Builds the engine: clock, movement, combat, capture, economy, merges and Miracles. |
| ai-programmer | Builds Sebastion's perception, strategy, tactics and wager layers, the three difficulty profiles, Counsel and the Coach. |
| ui-programmer | Builds the canvas board, the HUD, the Action Queue, the Wager seal, touch and keyboard play, and Spanish. |
| sound-designer | Makes the bell, the march, the dice, the capture chime and the Wager's seal. |
| qa-tester | Runs the self-play sweeps and replay checks before each balance change and hand-plays every finished story. |
| prototyper | Built the one-screen browser prototype the pitch links to. |

**How they hand work over.** A rule goes from the game-designer's text to the gameplay-programmer's engine code with an acceptance test in the same commit, then to the ai-programmer so Sebastion can use it, then to the qa-tester's sweep. If the sweep pushes battle length outside 12 to 16 minutes or a duel leg outside 65 to 80%, the systems-designer tunes before the story ships, and the producer records the tokens the story used.

## Token budget and API constraints

### Development budget

Planning estimate for the semester build. Most tokens are input, because every call re-reads the rules and code it touches. Actual spend per story goes into the [tuning history](tuning-history.md) and the plan is redone at each sprint close.

| Feature | Main agents | Tokens |
| --- | --- | --- |
| Design upkeep and stories | game-designer, producer | 1.5M |
| Hex board, terrain, movement and sight | gameplay-programmer | 3.0M |
| ATB clock, Action Queue and the frozen clock | gameplay-programmer | 2.5M |
| Skirmish dice, traits, upgrade cards and merges | gameplay-programmer, game-designer | 3.5M |
| Nodes, Tithes, Morale bleed and win conditions | gameplay-programmer, economy-designer | 2.5M |
| Fervor, Miracles and the Secret Wager | gameplay-programmer | 2.5M |
| Sebastion: four layers and three difficulties | ai-programmer | 4.5M |
| The Coach and Counsel | ai-programmer | 1.5M |
| Board renderer, HUD, touch and keyboard, Spanish | ui-programmer | 4.5M |
| Sound | sound-designer | 1.0M |
| Simulator, sweeps, replay checks and synthetic playtests | qa-tester, systems-designer | 3.5M |
| **Subtotal** |  | **30.5M** |
| Rework reserve (40%) |  | 12.2M |
| **Total development budget** |  | **44.1M** (rounded) |
| Runtime tokens per match |  | 0 |

### Runtime and tooling budget

| Activity | Budget | Basis |
| --- | --- | --- |
| One live match, any mode | 0 tokens | Checked in code: no in-match module imports a model client |
| One sweep suggestion | Output capped at 16,000 tokens; input about 6,000, mostly a cached system prompt | Cap in code; the system prompt carries the tuning reference |
| Sweep suggestions per Game Master | 4 a minute | Rate limit in code |
| One balance question (agent reading sim results) | About 320 tokens | Measured in the balance lab, a 74× saving over reading raw logs |
| One synthetic playtest round | To be measured in sprint 1 | 7 personas, at least 25 orders and about 25 screenshots each |

### API constraints on the agent crew

- **Context window.** Agents read the GDD one section at a time; the clock table and the unit table are the sections most stories load.
- **Rate limits.** At most three agents work in parallel, and never two on the engine's step loop at once.
- **Model tiers.** Directors run on the strongest model; specialists run on the session's model.
- **Sweep suggester.** No tools, structured output only. The Game Master's text and the current plan are sent as data, never as instructions. Only known numeric tuning keys, each between 0 and ten times its current value, at most 8 variants, 50 matches and 6 changed keys per variant. A person edits the plan and presses Start; nothing runs by itself. A cut-off answer returns an error asking for a narrower request.

## Testing, tuning and deployment

- **Rules tests.** Every rules change ships with an acceptance test in the same commit as the GDD edit.
- **UI tests.** Playwright suites on desktop and a phone profile; every HUD story keeps a screenshot.
- **Replay check.** Every sweep replays its first match and compares state hashes; a mismatch is a failing build, never tuned around.
- **Balance targets.** Match length 12 to 16 minutes, even seat win shares, zero rejected orders, and each duel matchup won 65 to 80% by its favoured side. Each tuning change bumps the tuning version and quotes the winning sweep line in the tuning history.
- **Deployment.** Trunk-based: every push to main builds, tests and deploys the static site. The online server is a post-semester milestone.
- **Performance.** A frame-cost probe runs in CI; the real-device budget for phones and iPad is set in sprint 2 and is an open question until then.

## Semester scope

| Ships this semester | After the semester |
| --- | --- |
| The 2D board at all four sizes, generated | Authored maps and a 3D view |
| The four modes: practice, online vs Sebastion, online two-player, Game Master | Ranked rules and tournament pause limits |
| Sebastion at three difficulties, Counsel and the Coach (Tutorial Chapter I) | Tutorial Chapters II to VI |
| Three units, six cards, merges, three Miracles and the Secret Wager | Warband-chosen Miracles |
| Mouse, keyboard, touch; English and Spanish | Further languages |
| Simulator, sweeps and one synthetic playtest round per sprint | A public balance lab |

## Technical risks

| Risk | What could go wrong | Spike to de-risk it |
| --- | --- | --- |
| Determinism leaks | A float or `Math.random` slips into a view and replays diverge | Replay check in CI from sprint 1; lint rule banning `Math.random` outside the seeded stream |
| Battle runs long | The battle runs about 14 minutes, past the 12-minute target | Sweep gauge fill and bleed in sprint 1 before any feature work |
| Normal is too strong | New players lose the opening race every time | First human playtest in sprint 3; Easy becomes the default for a first battle if so |
| Stalled battles | Even node counts with no bleed | Ship the late-match bleed behind a tuning key and test both fixes in sweeps |
| Phone performance | Canvas redraw of a 25-hex board drops frames on mid-range phones | Dirty-rect redraw and a frame probe on a real phone in sprint 2 |
| Secrets in the view | The sealed bid or hidden prep leaks through a snapshot | A test that serialises each seat's view and asserts the fields are absent |
