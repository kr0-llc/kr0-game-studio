# Metr0niks Puppet Rigging Lab

Published page: https://claude.ai/artifact/3mHrUSYnuyBu1uvzrdpaPZ (private to kr0). Named the Pivot Bench until 29 Oct 2026, when kr0 renamed it.

kr0 places pivot and joint marks on puppet parts and reviews each part; Claude reads both back and applies them.

- **Rigs**: Tim-o v3 (v2.1 torso, legs and pack with the v3 arms split at the elbow), Tim-o v2.1, and the ink enemies (gunner bot, loader, boss) from `art/metr0niks/ink-proto/sprites/atlas.*`.
- **Pivot**: the point a part turns around; it is placed on its parent's joint. **Joint**: a point on a part where a child part's pivot goes (shares of the part's box, 0 to 1). **Rest angle**: the part's built-in rotation (`rot`), only on parts nothing else depends on.
- **Preview**: the rig is drawn with the same maths as `games/metr0niks/prototypes/prototype-ink.html` (`drawBiped`, `drawCrab`, `drawSpider`): IK legs, aim clamps and the code's leg nudges. Tim-o v3 adds two-bone arms that the game does not have yet: the upper arm drops by an elbow bend and the forearm comes back up to the aim (bend 0.8 rad at rest, swinging while walking, 0.35 while aiming). The forearm is drawn under the upper arm so the elbow socket covers its cap.
- **Saved marks**: database collection `pivots`, one document per rig (`timo3`, `timo`, `gunner`, `loader`, `boss`) with `parts.<sprite>.{pivot, joints, rot, note}`, `edited`, `note`, `updatedAt`. Rigs that share a sprite (Tim-o v3 and v2.1 share torso, legs and pack) load oldest first, so the newest marks win. `pivots-archive/timo-2026-10-28` holds trial marks kr0 made before saying no pivots were corrected yet.
- **Part reviews**: collection `reviews`, one document per sprite: `verdict` (Keep, Fix, Redo or null), `note`, `rig`, `part`, `updatedAt`. Each part card also opens a page comment.
- **Applying**: Tim-o goes into `art/metr0niks/ink-proto/sprites/timo_v21.js` and `art/metr0niks/characters/tim-o/puppet/rig-v2-1.js`, and the v3 arms into `art/metr0niks/characters/tim-o/puppet/arms-v3.js` (sliced by `art/metr0niks/source/timo_arms_v3.py`; set its `SPEC` so a re-slice keeps the marks). Enemies go into `atlas.js`, `atlas.json` and the `SPEC` table in `art/metr0niks/source/ink_atlas.py`.
- **Rebuild the page** after the rig data changes: `python3 games/metr0niks/artifacts/puppet-rigging-lab/build.py`, then republish `puppet-rigging-lab.html` to the same artifact URL.
