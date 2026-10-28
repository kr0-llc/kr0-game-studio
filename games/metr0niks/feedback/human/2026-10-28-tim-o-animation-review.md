# Tim-o animation review: kr0's comments

Source: kr0 (human), comments on the review page https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8 · Date: 28 October 2026 · Judged: the six Tim-o sprite sets from PR #7 (commit e7d0be5) and the ink prototype's puppet parts sheet (`art/metr0niks/ink-proto/sheets/player_parts.webp`). The agent's findings are in `../synthetic/2026-10-28-tim-o-animation-review.md`.

kr0's words, as written:

| Where | Comment |
| --- | --- |
| Idle | this character has a cute eye but it doesn't read like the reference image. it's too small and the faces don't match etc |
| Run | this image doesn't look like the reference character |
| Dash | doesn't read like the reference image |
| Jetpack | closest to referene but jetpack slightly unaligned |
| Explode | this is like the reference image but it is too small. ideally all the animations have the same size for comparison and continuity. |
| Win | this reads like the reference image however, the shoulder and arms do not match. |
| Puppet parts sheet | these parts don't align and shouldn't be used. |

No Keep, Fix, Redo or Drop marks were set on the page.

What follows from them:

- Jetpack is the best match of the six; explode and win are close in the body. Idle, run and dash are off-model.
- Every set of a character must be drawn at one fixed character height (added to the animation review rule in `studio/design-workflows.md`).
- The current puppet parts sheet is rejected. The puppet route needs a new, aligned parts sheet before it can be used; the puppet dash on the review page is a motion test only.
