# Metr0niks hand-off kit

Builds the new Metr0niks-only repo from this one (kr0, 2026-10-30). Plan: [Metr0niks hand-off plan](https://claude.ai/artifact/1BqoYtKMHNZuQWVcsVbCdg).

- `CLAUDE.md`, `BOARD.md`, `package.json`, `pre-push`, `tuning-runs/README.md`: new files for the new repo.
- `assemble.sh DEST`: copies GDD, TDD, decisions (logs trimmed to the 10 newest rows), feedback, research, tuning runs, the reference sim, all Metr0niks art and the gdd-designer skill into DEST, and writes INDEX.md. It never changes this repo.

Not copied: the prototypes and labs (they stay live on the studio site, `site/gcp/stage-metr0niks.sh`), level concepts (redone in the new project), the studio site and Asset Desk.

Steps once kr0 has created the empty repo:

1. Clone it next to this repo, run `handoff/metr0niks/assemble.sh ../<new-repo>`.
2. In the new repo: `git config core.hooksPath .githooks && npm test`, then commit and push to main.
