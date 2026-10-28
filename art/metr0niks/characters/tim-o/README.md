# Tim-o

Tim-o is the Metr0niks reference mech: a salvaged heavy-duty resistance unit in peach and pale green, with a round torso, a single eye and a pneumatic hand-tool. kr0 picked the Scenario collection below as the art source for Metr0niks on 26 October 2026. Use these images as the reference input for any Metr0niks character, mech or sprite run.

Source collection: **metr0niks** in Scenario (team `team_pG6MaimfJd9b9PTLYKkYR7fQ`, project `proj_T9sfQEQPZ2s4yoHgggBe1fAE`, collection `col_W6fWcvXfsTcw3oBejXVTmJJX`). New Metr0niks reference art goes into that collection first, then the picked images come here.

| File | What it is | Scenario asset | Model |
| --- | --- | --- | --- |
| `sheet.png` | Full character sheet: five views, expressions, hand-tool, armor breakdown, mods, materials, action poses, stats, palette (3840 × 2160) | `asset_aST66TQJhq3jT1eHFbAsnexF` | GPT Image 2.5 |
| `turnaround/four-view.png` | Flat-colour four-view turnaround: front, side, rear, rear (1344 × 768) | `asset_fgDKMUX8fgmRfwyzQSSFqv2s` | Flux 2 Dev (custom model `model_pfi2CmX8He4Ay8zpBEHw5XEL`) |
| `reference/tech-poster.png` | "Auxiliary Utility Mech" cutaway poster: torso, legs, power, sensors, tools (1536 × 1024) | `asset_dRWxk1WirmQ4Uf2ALHNXV2mG` | GPT Image 2.5 |
| `reference/cutout.png` | Transparent cut-out of the mech, standing (402 × 457) | `asset_2mdcbkDumyxgbg9onwp5iR75` | Uploaded patch |
| `reference/garage-ui.webp` | Garage screen mock-up in the ink style, mechanic beside the mech (1400 × 781) | `asset_o8A7wQ8JAtXMHoTFkrDQC3YW` | Uploaded |

Notes:

- **The four-view turnaround is Tim-o's main reference** (kr0, 28 October 2026, on the review page: "this view is the correct reference. notice the jet pack. the only thing missing here is the eye emotes."). Use `asset_fgDKMUX8fgmRfwyzQSSFqv2s` as the first reference image in every Tim-o run. Copy the reactor pack from it: a big pack that covers almost the whole back, with two tall cylinders capped by round lights on top, rising above the shoulders in the side view. Take the eye emotes (neutral, happy, curious, determined) from the "Head & expressions" panel of `sheet.png`, the one thing the turnaround lacks. Runs before this note used the character sheet and the cut-out instead.
- The four-view turnaround is not the six-angle set from the turnaround workflow (see [design workflows](../../../../studio/design-workflows.md)). Its last two panels are both rear views. A real turnaround run should go in `turnaround/<angle>.png`.
- The ink prototype's parts sheets (`art/metr0niks/ink-proto/sheets/`) were made with these images as reference.
- The art style for Metr0niks is still "Not chosen" in `studio/art-style-guides.md`. These images set the mech's design and palette, not the final rendering style.

## Round 2 (28 October 2026)

Made after kr0's review comments on the [animation review page](https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8). kr0 approved both runs. The masters stay in Scenario; these are previews.

| File | What it is | Scenario asset | Model | Credits |
| --- | --- | --- | --- | --- |
| `parts/sheet-v2.webp` | Puppet parts sheet v2: torso, thigh, shin, reactor pack, minigun arm, pile-bunker arm, all at one scale with ball joints. It replaces the rejected `ink-proto/sheets/player_parts.webp` once kr0 approves it | `asset_AMDXu4YY3qLgskrTWtqTKnE6` | GPT Image 2.5 Sunburst | 4 |
| `parts/sheet-v2-1.webp` | Parts sheet v2.1: the v2 sheet with the extra side socket on the torso removed. The review page puppet now uses this one | `asset_Rzs92LmBTZFho7qvgetHLigv` | GPT Image 2.5 Sunburst (edit of v2) | 4 |
| `sprites/dash-iso/` | Isometric dash, frame-by-frame: `sheet.webp` (the 4 × 3 grid) and `frame-01.webp` to `frame-12.webp` (366 × 323, white keyed out, scaled to fit) | `asset_1c381Us51PCRqc88pdNj9rzh` | GPT Image 2 | 13 |

Prompts: `../../prompts/tim-o-parts-v2.txt` and `../../prompts/tim-o-sprites-dash-iso.txt`. Known issues with the dash are listed on the review page: frames 11 and 12 stand taller than frame 1, the pack is mostly hidden, and he faces the camera while dashing sideways.

## Round 3 (28 October 2026)

kr0 chose to redraw jetpack and win first, isometric and at one height. Brief changes from round 2: the reactor pack is copied from the character sheet (two tall upright cylinders, mounted high and fixed to the back), he never flips, and in the air he rises no more than a fifth of the cell.

| File | What it is | Scenario asset | Model | Credits |
| --- | --- | --- | --- | --- |
| `sprites/jetpack-iso/` | Jump-jet hop: thrust from the leg jets and the pack nozzles. On-model with the right pack, but he faces the lower left, not the lower right; frame 12 doesn't land back on frame 1 | `asset_SKfvh9KzBFvGWuY1iP5hA5F6` | GPT Image 2 | 13 |
| `sprites/win-iso/` | Win cheer: hop with arms raised, pink hearts, the happy lens. On-model; frame 7's squash is very low and frame 12 doesn't match frame 1 | `asset_frXn4UvjGS1qEHbUWrFaWvod` | GPT Image 2 | 13 |

Prompts: `../../prompts/tim-o-sprites-jetpack-iso.txt` and `../../prompts/tim-o-sprites-win-iso.txt`. Frame-1 heights: dash 229 px, jump-jets 239 px, win 225 px (in 366 × 323 frames).

## Puppet moves (28 October 2026)

`puppet/puppet-moves.js` animates Tim-o in code on parts sheet v2.1 (`puppet/atlas-v2-1.webp`, joints in `puppet/rig-v2-1.js`). It has dash, pile-bunker charge/fire/retract, jump-jets from the legs, overheat vent and destroyed break-apart. It uses the ink prototype's joints and two-bone IK legs and costs no credits. The review page plays every move. The same parts and poses are in `games/metr0niks/prototypes/prototype-ink.html` (copied to `ink-proto/sprites/timo_v21.*`). The route is written up as section 4 of `studio/design-workflows.md`.
