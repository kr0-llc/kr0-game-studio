# kr0 Game Studio: tools

Last updated: 27 October 2026 · Owner: kr0

Tools used by every kr0 game live here, one folder per tool. A tool that only one game uses stays in that game's own folder or build.

- Each tool has a README saying what it does, how to run it, and which games use it.
- Tools follow the studio rules in [`studio/`](../studio/README.md), including [simulation and tuning](../studio/simulation-and-tuning.md).
- Tools never hard-code a game's numbers. A game's tunables, targets and seed counts stay in that game's docs and data.

## Tools

| Tool | Folder | Status |
| --- | --- | --- |
| `chronos-sim`: simulation and tuning platform for every game (runners, results, Tune Lab, tuning history) | `tools/chronos-sim/` | Not built yet; [project plan](chronos-sim/project-plan.md) is a draft for kr0's review |
| `asset-desk`: grade, tag and trace the provenance of studio art across the Drive folder, the repo and Scenario | `tools/asset-desk/` | Version 0.1 ([README](asset-desk/README.md), [feature list](asset-desk/FEATURES.md)) |
