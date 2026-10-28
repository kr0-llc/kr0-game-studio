# Tim-o animation review

Source: Claude (agent review, synthetic) · Date: 28 October 2026 · Judged: the six Tim-o sprite sets from PR #7 (commit e7d0be5, branch `claude/project-thread-gz3ylo`, `art/metr0niks/characters/tim-o/sprites/`), against `art/metr0niks/characters/tim-o/` and the GDD's controls and combat sections.

Review page: https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8 (frame player, kr0's marks and review comments). kr0's own marks go in `../human/2026-10-28-tim-o-animation-review.md` once given.

## Across all six sets

- **Off-model.** The sheet's Tim-o is a 2.4 m, 980 kg heavy unit with broad shoulder pads and a lens set in a sage ring. The sprites draw a small cute robot; the prompt said "a small robot with a jetpack tank", and the only input was a side-view crop. Idle and run do not match each other.
- **Arms detach, thrust from the fists.** Each frame is drawn on its own with no skeleton, so arms float (run, idle, win) and in dash and jetpack the flame comes from the hand. This is the fault kr0 rejected on 27 October.
- **Wrong camera.** Side-view platformer frames; the game is a 2:1 dimetric isometric twin-stick with legs and torso turning separately.
- **Wrong loadout.** Empty hands by prompt; the starter mech has a minigun (right arm) and a pile-bunker (left arm).
- **Not registered.** The idle body slides 24 px and win 63 px while standing in place.
- **Worth keeping:** the acting. Idle breath, tilt and blink; the dash crouch and skid; the explode sequence; the win cheer.

## Per set

| Set | Frames with faults | Keep |
| --- | --- | --- |
| idle | all: cartoon eyeball, not the lens ring; f3–4 hand floats in front of the torso; f5–6 shoulder disappears; f3 tank taller | Breath, tilt, blink, steam puff |
| run | f2–12 far arm hangs below the tank with no shoulder; all: near arm comes out of mid-torso; f7–9 legs hard to read; f1 keying fringe | Best registration (12 px bounce) |
| dash | f4–8 flame from the back hand, tank floats off the back; f10 arm loose; f12 does not return to f1 | Anticipation, stretch, skid dust |
| jetpack | f5–8, 10 thrust from the fist; all mirrored, lens hidden, tank on the wrong side; f4 legs merge; f5–6 knee bends backwards; f11–12 lands instead of hovering | Flame and smoke |
| explode | f1–8 mirrored, seen from behind, arm hangs from the dome; single-cylinder tank | Fire, blast, debris, wreck (f9–12) |
| win | f1, f7–12 mirrored so the tank jumps sides; f4–5 legs fused; f10 arm floats; f11 lens slides down the dome | Cheer, hearts, squint |

## Animation routes

1. Frame-by-frame: Scenario Action Sprite Studio (`studio/design-workflows.md` section 3), or GPT Image 2 called directly with the same brief.
2. Cut-out puppet: the ink prototype rig (parts sheets, `art/metr0niks/source/ink_atlas.py`, code IK in `prototypes/prototype-ink.html`). Not yet written up as a studio workflow.

Recommendation: the puppet for gameplay, frame-by-frame for acting reference and screens outside gameplay. kr0 chose on 28 October to compare both on dash first. The puppet dash is on the review page; the isometric frame-by-frame brief is `art/metr0niks/prompts/tim-o-sprites-dash-iso.txt`, priced at 13 credits and not yet run.
