# Metr0niks hand-off kit

Builds kr0-llc/metr0niks from this repo (kr0, 2026-10-31). Plan: [Metr0niks hand-off plan](https://claude.ai/artifact/1BqoYtKMHNZuQWVcsVbCdg).

Run `handoff/metr0niks/assemble.sh ../metr0niks`. It copies the design docs, decision logs (10 newest rows each), option papers, feedback, research, tuning runs, the reference sim and all Metr0niks art, and adds CLAUDE.md, BOARD.md, the four agent definitions, Scenario MCP, `npm test` and the Tim-o reference page. It never changes this repo.

Not copied: the prototypes and labs (they stay playable on the studio site via `site/gcp/stage-metr0niks.sh`), level concepts (redone in the new project) and git history.
