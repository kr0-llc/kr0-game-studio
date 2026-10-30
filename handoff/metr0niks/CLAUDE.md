# Metr0niks

A co-op mech extraction game by kr0. kr0 owns every decision. This file is the only rules doc: keep it under 100 lines.

## Brand

- Write kr0 and Metr0niks with a zero. Wherever the name is styled, the 0 is pink.

## Start of every session

1. Read `BOARD.md`. It says the current goal, who is working on what and what is open.
2. Read only the sections of `docs/gdd.md` and `docs/tdd.md` that your task needs.
3. At the end, update `BOARD.md` (your line, any new open question, any decision).

## Roles

One thread wears these in order. Small fixes skip the architect.

| Role | Does | Leaves behind |
| --- | --- | --- |
| Architect | Plans the change against the GDD and TDD | A short plan in the thread; a decision row if a rule changes |
| Implementer | Builds it, with a test for each rule it touches | Code in `game/`, tests in `tests/` |
| Reviewer | Writes synthetic feedback against the GDD and the plan | Long ones go to `feedback/synthetic/` |
| Verifier | Runs `npm test`, plays it in a browser, screenshots visual work | Pushes to main, updates `BOARD.md` |

## Folders

| Folder | Holds |
| --- | --- |
| `docs/` | `gdd.md` (rules only), `tdd.md`, both decision logs, `proposals.md`, `gdd-template.md` |
| `docs/superseded/` | Old versions and archived decision rows. Nothing is deleted |
| `decisions/` | Option papers behind a decision |
| `feedback/human/` | kr0's verdicts |
| `feedback/synthetic/` | The reviewer's synthetic feedback |
| `research/` | Research notes |
| `level-concepts/` | Level concepts (sibling of research/) |
| `tuning-runs/` | Raw sweep records (`*.jsonl`) and `README.md`, the tuning history |
| `characters/<name>/` | `reference.html` (one clean reference), `reviews/` (animation review pages) |
| `art/` | Previews and `manifest.jsonl`. Masters live in Google Drive "kr0 Studio Art/metr0niks" |
| `game/` | The build |
| `tests/` | What `npm test` runs. `tests/reference-sim/` is the old prototype's rules engine, kept as a reference |

Every new or retired document gets a row in `INDEX.md`.

## Decisions

- GDD rows are `GDD-Dn`, TDD rows `TDD-Dn`, newest first. Status is Proposed until kr0 accepts or rejects.
- Ideas kr0 hasn't adopted go in `docs/proposals.md`, never in the GDD.
- **Trim at each milestone:** fold accepted decisions into the GDD/TDD text, keep the 10 newest rows in each log, move the rest to `docs/superseded/`. Trim `tuning-runs/README.md` and `BOARD.md` the same day.

## Pushing

- Trunk-based: push straight to main. No pull requests at this stage.
- `npm test` must pass before a push (pre-push hook). CI comes later.
- Keep commits small and say what changed and why.

## Threads

- One thread per playable slice, titled by what it adds ("Metr0niks Warden fight").
- At most 2 or 3 threads at once, never two on the same files. Claim files on `BOARD.md`.

## Art

- Open for now. Scenario MCP is available; no fixed workflow.
- Each character has one clean `reference.html`. Rejected or older versions go to `characters/<name>/_retired/`.
- Every animation run gets a review page in `characters/<name>/reviews/` (frame player, findings, kr0's marks).

## Ask kr0 first

- Anything outward-facing: deploying a site, messages outside the project, new repos.
- Deleting art. Retire it instead.
- Changing a rule in the GDD.

## Related

- Studio site, every old prototype and lab: kr0-llc/kr0-game-studio (`site/`). That repo is the archive of this project's history.
- Asset Desk: kr0-llc/kr0-home (kr0 runs it).
