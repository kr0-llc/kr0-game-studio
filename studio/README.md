# kr0 Game Studio: studio guide

Last updated: 23 October 2026 · Owner: kr0

Everything in `studio/` applies to every game. A game may add its own rules in `games/<name>/`, but it never contradicts this folder without a written decision in that game's decision history.

## Layout

| Folder | Holds |
| --- | --- |
| `studio/` | Rules for every game: ways of working, GDD template, brand rules, art style guides, shared skills |
| `games/<name>/` | One game's documents: pitch, GDD, TDD, open questions, tuning history, decision histories, prototype, `superseded/` |
| `art/<name>/` | One game's art: concept art, art board, prompts, sprites, drawing source, screenshots |
| `site/` | The public studio site and its deploy scripts |
| `INDEX.md` | Every document and folder, with status and source links |

Games: `blackletter`, `dropfront`, `dual-tech`, `metr0niks`. Folder names are lowercase with hyphens.

## How work runs

1. **One thread per piece of work, titled by game,** for example "Metr0niks zone unlocks". Work that touches every game is one thread that changes `studio/` first, then checks each game against it.
2. **The repo is the source of truth.** Documents and art live here, not in chat or in a single project's files. Change it through a branch and a pull request so drift shows up as a diff.
3. **kr0 decides.** Agents propose and draft; kr0 approves. See [ways of working](ways-of-working.md).
4. **Old versions move to `superseded/`,** never deleted, and `INDEX.md` marks them.
5. **New art** goes in `art/<name>/<style or kind>/`, with its prompt saved in `art/<name>/prompts/`.

## Documents every game has

Pitch, GDD, TDD, open questions, tuning history, GDD decision history, TDD decision history (section 11 of [ways of working](ways-of-working.md)). Start a GDD from [the template](gdd-template.md).

## Files in this folder

- [ways-of-working.md](ways-of-working.md): crew, chain of command, phases, guardrails, token budgets. `site/ways-of-working.md` is the published copy.
- [gdd-template.md](gdd-template.md): the default GDD outline.
- [brand.md](brand.md): studio brand rules, including the r0 styling.
- [art-style-guides.md](art-style-guides.md): the candidate looks for each game and which one is chosen.
- [skills/gdd-designer/SKILL.md](skills/gdd-designer/SKILL.md): the GDD designer skill.
- [project-instructions-draft.md](project-instructions-draft.md): draft project instructions, waiting for kr0's approval.
