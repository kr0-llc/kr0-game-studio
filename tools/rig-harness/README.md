# rig-harness

Renders a cut-out puppet rig headlessly and measures how well its joints fit, so a rig change can be judged by numbers before a person looks at it. Built 29 October 2026 for the Tim-o puppet (Metr0niks); it reads the rig from the Puppet Rigging Lab page, so any rig on that page (Tim-o v3, Tim-o v2.1, gunner bot, loader, boss) can be tested.

- `render.js`: renders every mode (rest, walk, aim, stress) of a rig to PNGs plus `report.json` with every part's placed box, pivot and joint positions and per-joint fit numbers. `node tools/rig-harness/render.js --rig timo3 --dots [--override marks.json] [--out dir]`.
- `tests/run.js`: the test battery, PASS/FAIL per test, exit 1 on failure. `node tools/rig-harness/tests/run.js --rig timo3 [--override marks.json]`. Tests and thresholds: `tests/README.md`.
- `proposals/`: rig proposals from review rounds, as `--override` JSON plus a findings note (`expert-r1.*` is round 1 for Tim-o v3).
- `out/`: renders; not committed.

Rebuild the lab page first when its template or the rig data changed: `python3 games/metr0niks/artifacts/puppet-rigging-lab/build.py`. The best practices the tests encode are in `art/metr0niks/characters/tim-o/puppet/rigging-plan.md`.
