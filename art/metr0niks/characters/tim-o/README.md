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

- The four-view turnaround is not the six-angle set from the turnaround workflow (see [design workflows](../../../../studio/design-workflows.md)). Its last two panels are both rear views. A real turnaround run should go in `turnaround/<angle>.png`.
- The ink prototype's parts sheets (`art/metr0niks/ink-proto/sheets/`) were made with these images as reference.
- The art style for Metr0niks is still "Not chosen" in `studio/art-style-guides.md`. These images set the mech's design and palette, not the final rendering style.

## Round 2 (28 October 2026)

Made after kr0's review comments on the [animation review page](https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8). kr0 approved both runs. The masters stay in Scenario; these are previews.

| File | What it is | Scenario asset | Model | Credits |
| --- | --- | --- | --- | --- |
| `parts/sheet-v2.webp` | Puppet parts sheet v2: torso, thigh, shin, reactor pack, minigun arm, pile-bunker arm, all at one scale with ball joints. It replaces the rejected `ink-proto/sheets/player_parts.webp` once kr0 approves it | `asset_AMDXu4YY3qLgskrTWtqTKnE6` | GPT Image 2.5 Sunburst | 4 |
| `sprites/dash-iso/` | Isometric dash, frame-by-frame: `sheet.webp` (the 4 × 3 grid) and `frame-01.webp` to `frame-12.webp` (366 × 323, white keyed out, scaled to fit) | `asset_1c381Us51PCRqc88pdNj9rzh` | GPT Image 2 | 13 |

Prompts: `../../prompts/tim-o-parts-v2.txt` and `../../prompts/tim-o-sprites-dash-iso.txt`. Known issues with the dash are listed on the review page: frames 11 and 12 stand taller than frame 1, the pack is mostly hidden, and he faces the camera while dashing sideways.
