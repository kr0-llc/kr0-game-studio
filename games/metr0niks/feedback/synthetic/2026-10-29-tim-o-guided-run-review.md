# Tim-o guided run review

Source: Claude (agent review, synthetic) · Date: 29 October 2026 · Judged: a Tim-o isometric run cycle made without the Action Sprite Studio workflow, on two models, against the four-view turnaround, the Oct 28 isometric run (`run-iso`) and the GDD's camera and starter loadout.

Review page: https://claude.ai/artifact/V8jnzRVMJnCg9CKvp91cRu (frame player, kr0's marks, review comments). kr0's own marks go in `../human/2026-10-29-tim-o-guided-run-review.md` once given.

## Why

kr0 asked on 29 October 2026 for a run that doesn't use the prebuilt workflow, using a method of Claude's own. The workflow's LLM step had dropped every frame plan we typed ([research](../../research/2026-10-29-action-sprite-studio-runs.md)), and the direct calls of 28 October kept the plan but produced legs that barely move.

## Method

1. A hand-written 8-beat run plan: contact, down, passing and up for each leg.
2. A pose guide sheet drawn in code (`art/metr0niks/source/pose_guide.py run-iso`): per cell a ground footprint, a height line and a blue stick rig (knees, feet, torso, pack, gun arms; dark blue near side, light blue far side). Sent as the second reference after the turnaround.
3. The prompt sent word for word, no rewrite step.
4. The same prompt on two models: GPT Image 2.5 Sunburst (1536 × 1024, medium, transparent, 4 credits) and Gemini 3.1 Flash (2K, 3:2, thinking high, 20 credits).
5. Local slicing, keying, line-up and measuring (`art/metr0niks/source/sheet_frames.py`).

Run record: `art/metr0niks/prompts/tim-o-sprites-run-iso-guided.txt`. Frames: `art/metr0niks/characters/tim-o/sprites/run-iso-guided/`.

## Findings

| Set | Run | Facing | Loadout | On-model | Height spread | Ground drift in sheet |
| --- | --- | --- | --- | --- | --- | --- |
| Guided, Sunburst | Yes: legs alternate, knees lift (f3, f7), push-offs stretch (f4, f8) | Lower right in all 8 | Minigun near right, pile-bunker far left, both level | Partly: torso a plain sphere, no chest plate or hip skirt, bigger pale lens | 14% | 41 px |
| Guided, Gemini | No: a short-stride walk; guide ignored | Three-quarter right | Wrong: open hand on the right, drill on the left, gone in f2 and f3 | Best so far | 5% | 22 px |
| Baseline run-iso r4 | Weakly: legs barely change | Lower left (wrong) | Right weapons, guns hang down | Partly | 5% | 17 px |

- The pose guide worked on Sunburst: the timing, facing and arm aim all follow it, and none of its lines leaked into the art. Leg action is the thing the earlier sets lacked.
- Sunburst rises too high on f4 and f8 (the top of the pack moves 83 px across the sheet against a guide bob of about 24 px), so the loop is bouncy.
- Sunburst stray ink dot past the pile-bunker tip in f1 and f5.
- Gemini kept the turnaround's look but not the pose, loadout or camera, and costs five times as much.

## Suggested next step

Keep Sunburst with the guide for pose and timing, and fix the look with an edit pass: the same model with the guided sheet as first reference and the turnaround second, "keep every pose exactly, redraw the torso, chest plate, hip skirt and lens to match the turnaround" (about 4 credits). Shrink the guide's up-frame bob or name the bob in pixels. This is a suggestion for kr0, not done.
