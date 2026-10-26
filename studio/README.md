# kr0 Game Studio: studio guide

Last updated: 26 October 2026 · Owner: kr0

Everything in `studio/` applies to every game. A game may add its own rules in `games/<name>/`, but it never contradicts this folder without a written decision in that game's decision history.

## Layout

| Folder | Holds |
| --- | --- |
| `studio/` | Rules for every game: ways of working, GDD template, brand rules, art style guides, shared skills |
| `games/<name>/` | One game's documents: pitch, GDD, TDD, open questions, tuning history, decision histories, prototype, plus `research/`, `decisions/`, `simulations/`, `prototypes/`, `feedback/synthetic/`, `feedback/human/`, `artifacts/` and `superseded/` |
| `art/<name>/` | One game's art: concept art, art board, prompts, sprites, drawing source, screenshots |
| `tools/` | Tools shared by every game, such as `chronos-sim`, the simulation and tuning platform (to be built) |
| `site/` | kr0's game portfolio site (public) and its deploy scripts |
| `INDEX.md` | Every document and folder, with status and source links |
| `.mcp.json` | MCP servers that Claude Code sessions on this repo connect to (Scenario) |

Games: `blackletter`, `dropfront`, `dual-tech`, `metr0niks`. Folder names are lowercase with hyphens.

## How work runs

1. **One thread per piece of work, titled by game,** for example "Metr0niks zone unlocks". Work that touches every game is one thread that changes `studio/` first, then checks each game against it.
2. **The repo is the source of truth.** Documents and art live here, not in chat or in a single project's files. Change it through a branch and a pull request so drift shows up as a diff.
3. **kr0 decides.** Agents propose and draft; kr0 approves. See [ways of working](ways-of-working.md).
4. **Old versions move to `superseded/`,** never deleted, and `INDEX.md` marks them.
5. **New art** goes in `art/<name>/<style or kind>/`, with its prompt saved in `art/<name>/prompts/`. Characters and sprites are made with the [design workflows](design-workflows.md) and go in `art/<name>/characters/<character>/`.

## Documents every game has

Pitch, GDD, TDD, open questions, tuning history, GDD decision history, TDD decision history (section 11 of [ways of working](ways-of-working.md)). Start a GDD from [the template](gdd-template.md).

## Folders every game has

| Folder | Holds |
| --- | --- |
| `research/` | Research and reference studies. Suggestions, not decisions. |
| `decisions/` | Long decision records, linked from the GDD or TDD decision history. |
| `simulations/` | The game's headless simulation (such as Metr0niks' `sim.js`), plus sweep configs, run outputs and reports behind tuning changes. Prototypes load the simulation from here. |
| `prototypes/` | Every playable prototype (HTML builds, firing ranges, art tests) with its briefs and change lists, each with a README or stated hypothesis. |
| `feedback/synthetic/` | Feedback from agents: review boards, persona playtests, critiques. |
| `feedback/human/` | Feedback from people: playtests, surveys, comments. |
| `artifacts/` | Exports and hand-outs: PDFs, decks, one-pagers, page snapshots, agent handoff prompts. |

Section 11 of [ways of working](ways-of-working.md) says who writes each one. An empty folder holds a `.gitkeep` until its first file arrives.

## Files in this folder

- [ways-of-working.md](ways-of-working.md): crew, chain of command, phases, guardrails, token budgets. `site/ways-of-working.md` is the published copy.
- [gdd-template.md](gdd-template.md): the default GDD outline.
- [simulation-and-tuning.md](simulation-and-tuning.md): headless deterministic simulation, evidence-based tuning, and what each game documents.
- [design-workflows.md](design-workflows.md): the Scenario character workflows (sheet, turnaround, action sprites), the Scenario MCP server and skills, and the gemini-creative MCP server.
- [brand.md](brand.md): studio brand rules, including the r0 styling.
- [art-style-guides.md](art-style-guides.md): the candidate looks for each game and which one is chosen.
- [skills/gdd-designer/SKILL.md](skills/gdd-designer/SKILL.md): the GDD designer skill.
- [project-instructions-draft.md](project-instructions-draft.md): draft project instructions, waiting for kr0's approval.
