# Metr0niks Pivot Bench

Published page: https://claude.ai/artifact/3mHrUSYnuyBu1uvzrdpaPZ (private to kr0)

kr0 places pivot and joint marks on puppet parts; Claude reads them back and applies them to the rig data.

- **Covers**: Tim-o v2.1 (`art/metr0niks/ink-proto/sprites/timo_v21.*`, same data as `art/metr0niks/characters/tim-o/puppet/rig-v2-1.js`) and the ink enemies (gunner bot, loader, boss) from `art/metr0niks/ink-proto/sprites/atlas.*`.
- **Pivot**: the point a part turns around; it is placed on its parent's joint. **Joint**: a point on a part where a child part's pivot goes (shares of the part's box, 0 to 1). **Rest angle**: the part's built-in rotation (`rot`), only on parts nothing hangs off.
- **Preview**: the rig is drawn with the same maths as `games/metr0niks/prototypes/prototype-ink.html` (`drawBiped`, `drawCrab`, `drawSpider`): IK legs, aim clamps and the code's leg nudges.
- **Saved marks**: the page's database, collection `pivots`, one document per rig (`timo`, `gunner`, `loader`, `boss`) with `parts.<sprite>.{pivot, joints, rot, note}`, `edited` (sprites that differ from the rig), `note` and `updatedAt`. Claude reads them with the ArtifactData tool.
- **Applying**: Tim-o goes into `timo_v21.js` and `rig-v2-1.js`; enemies go into `atlas.js`, `atlas.json` and the `SPEC` table in `art/metr0niks/source/ink_atlas.py` so a rebuild keeps them.
- **Rebuild the page** after the rig data changes: `python3 games/metr0niks/artifacts/pivot-bench/build.py`, then republish `pivot-bench.html` to the same artifact URL.
