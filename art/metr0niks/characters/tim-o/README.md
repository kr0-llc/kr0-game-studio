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

## Animations

`sprites/<action>/` holds `sheet.png` (the generated 4 × 3 sheet), `frame-01.png` to `frame-12.png` (366 × 323, background keyed out, all facing right), `spritesheet-transparent.png` (6 × 2 strip), and `loop.mp4` (a preview on white). Prompts are in `sprites/PROMPTS.md`.

| Action | Frames | What happens | Loop |
| --- | --- | --- | --- |
| `idle` | 12 | Breath, curious head tilt, blink, shrug, steam puff | Yes |
| `run` | 12 | Full run cycle | Yes |
| `dash` | 12 | Crouch, low horizontal burst with jetpack flame and dust, skid, recover | One-shot, ends on frame 1's pose |
| `jetpack` | 12 | Crouch, ignite, rise with flame and smoke, hover | Rise then hover, not a clean loop |
| `explode` | 12 | Damage, fire, blast, debris, smoking wreck | One-shot, does not return to frame 1 |
| `win` | 12 | Jump with a cheer and hearts, wiggle dance, spin, bow | Yes |

Known issues:

- Frames are not anchored. Feet and body drift a little between cells, so align them on the feet in the engine or re-register before building an atlas. Frame sizes are 366 × 323, so large sprites need a re-run at a higher size.
- Keying the background out is a flood fill, so thin white outlines can leave a light fringe. `run` keeps a faint ground shadow.
- `jetpack` and `explode` were drawn facing left and are mirrored here; the jetpack tank is therefore on the right of the sheet but on the left in the frames. In `win`, six frames were mirrored to match, so a few arm poses swap sides.
- The mp4 files are 6 to 10 fps previews, not the game's frame rate.
