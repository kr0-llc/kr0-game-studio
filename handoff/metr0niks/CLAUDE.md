# Metr0niks

A co-op mech extraction game by kr0. kr0 owns every decision. This is the only rules file: keep it under 100 lines.

## Brand

Write kr0 and Metr0niks with a zero. Wherever the name is styled, the 0 is pink (`#ff4f9a`).

## Every session

1. Read `BOARD.md`: the goal, who owns which files, what is open.
2. Read only the sections of `design/gdd.md` and `design/tdd.md` your task needs.
3. Finish by updating `BOARD.md`.

## The team

Four agents, defined in `.claude/agents/`. A thread runs them in order; small fixes skip the architect.

| Agent | Job | Writes |
| --- | --- | --- |
| architect | Plans the change against the GDD and TDD | A plan on `BOARD.md`; a decision row if a rule changes |
| implementer | Builds the plan, with a test per rule it touches | `game/`, `tests/` |
| reviewer | Synthetic feedback against the GDD and the plan | `feedback/synthetic/` |
| verifier | `npm test`, plays it in a browser, screenshots | Pushes to main, updates `BOARD.md` |

## Folders

| Folder | What lives there | Who writes |
| --- | --- | --- |
| `design/` | `gdd.md` (rules only), `tdd.md`, `proposals.md`, `level-design.md`, `gdd-template.md` | architect, with kr0 |
| `decisions/` | `gdd-decisions.md`, `tdd-decisions.md`, and option papers | architect |
| `feedback/human/` | kr0's verdicts | kr0 (agents transcribe) |
| `feedback/synthetic/` | Reviewer reports | reviewer |
| `research/` | Research notes | anyone |
| `level-concepts/` | Level concepts (sibling of research/) | architect |
| `tuning-runs/` | Sweep records (`*.jsonl`) and `README.md`, the tuning history | verifier |
| `art/` | All art, checked in. `art/characters/<name>/reference.html` is that character's one clean reference | anyone making art |
| `game/` | The build | implementer |
| `tests/` | What `npm test` runs. `tests/reference-sim/` is the old prototype's rules engine | implementer |
| `archive/` | Old versions, trimmed decision rows, old tuning history. Never deleted | anyone trimming |

Every new or retired document gets a row in `INDEX.md`.

## Decisions

- Rows are `GDD-Dn` or `TDD-Dn`, newest first. Proposed until kr0 accepts or rejects.
- Ideas kr0 hasn't adopted go in `design/proposals.md`, never in the GDD.
- **Trim at each milestone:** fold accepted rows into the GDD/TDD text, keep the 10 newest in each log, move the rest to `archive/`. Trim `tuning-runs/README.md` and `BOARD.md` the same day.

## Pushing

- Trunk-based: push straight to main. No pull requests at this stage.
- `npm test` must pass (pre-push hook: `git config core.hooksPath .githooks`). CI comes later.
- Small commits that say what changed and why.

## Threads

- One thread per playable slice, titled by what it adds ("Metr0niks Warden fight").
- At most 2 or 3 at once, never two on the same files. Claim files on `BOARD.md`.

## Art

- Art is open: try new workflows and different models. Scenario MCP is configured in `.mcp.json`.
- Check every asset into `art/`. Move to cloud storage only when the repo size becomes a problem.
- A character's `reference.html` shows only canon images. Never add drafts to it.
- Every animation run gets a review page in `art/characters/<name>/reviews/` (frame player, findings, kr0's marks).
- Rejected art moves to a `_retired/` folder next to it. Ask kr0 before deleting anything.

## Ask kr0 first

- Anything outward-facing: deploys, messages outside the project, new repos.
- Deleting art. Changing a rule in the GDD.

## Elsewhere

- kr0-llc/kr0-game-studio: the studio site (every old prototype and lab is playable there) and this project's full history.
