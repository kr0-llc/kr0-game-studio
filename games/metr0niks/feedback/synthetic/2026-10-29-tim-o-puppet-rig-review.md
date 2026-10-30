# Tim-o puppet rig review, rounds 1 and 2 (29 October 2026)

Agent findings only. kr0's marks go in `feedback/human/` once given, via the [Puppet Rigging Lab](https://claude.ai/artifact/3mHrUSYnuyBu1uvzrdpaPZ). Plan and best practices: `art/metr0niks/characters/tim-o/puppet/rigging-plan.md`. Numbers come from `tools/rig-harness` (renders in `out/`, not committed); the full notes are `tools/rig-harness/proposals/expert-r1.md` and `tools/rig-harness/tests/r1-report.md`.

## What was wrong (round 1, on the v3 arms as first sliced)

| Joint or part | Fault | Fix |
| --- | --- | --- |
| Knee | Thigh's knee joint sat at y .90 but the ball centre is at y .835, and both thigh balls sit at x .58 not .5, so the thigh ball peeked out past the shin cap (peek 0.16) in every frame | Knee joint up 7 px and right 4.5 px, thigh pivot right 4 / down 3, shin pivot right 7 px: peek 0 |
| Elbows | Both elbow joints 4 to 5 px right of the ball centre; forearm caps 3 px above their centres; upper arms drawn 9 to 16 deg below horizontal with rot 0, which added about 12 deg of bend and pushed the elbow past the clamp | Joints and pivots on the fitted centres; rot -.077 / -.175 on the upper arms, -.05 / -.085 on the forearms |
| Front shoulder | Pivot on the small ball at the pad's corner, so the pad slid across the torso during the aim sweep and covered half the eye lens | Pivot at the pad's centre of curvature; torso armF to (.82, .57) so the pad overhangs the torso edge as in the turnaround and clears the eye |
| Back arm | Hidden behind the minigun in rest, walk and most aims; its shoulder pad was drawn as a ball on top of a cup (the near-side pad), not the far-side twin | Regenerated (v3.1, 4 credits): pad as a cup with the ball inside; back arm aims .15 rad above the front one, bend .35 at rest and .45 ± .22 walking, so the pile-bunker shows level above the minigun |
| Upper arms | Tube 65% longer than the turnaround's upper arm | Regenerated shorter (bone 80 to 57 sheet px); arms scaled .85 front / .78 back |
| Legs and pack | Visible leg about 15% shorter than the turnaround; pack 37% too short | legLen .82 to .95; pack scale .7 to .85 |
| Weapons | Muzzle and pile tip went below the ground in low aims and crouches (8 frames) | Gone with the shorter arms and fitted rot |

## Test battery after round 2 (`node tools/rig-harness/tests/run.js --rig timo3`)

- PASS joint fit: 225 joint-frames, cap exposure 0 and socket gap 0 everywhere.
- FAIL visual gap scan: one 10 px sliver at the knee in two stress frames, the crack between the thigh's neck and the shin's collar under the ball (3 rig px², not visible at game size). Everything else 0.
- PASS draw order: overhang 0 and peek 0 at all 9 joints.
- PASS elbow behaviour: front bend 0 to 83 deg, back 3 to 86 deg, never negative, no weapon in the torso or below ground.
- FAIL proportions: the test measures the rig leg from the hip joint, which sits inside the torso ball, against a reference hip below the torso. Measured the same way on both, the visible leg is 1.10 torso heights on the rig and 1.14 on the turnaround (-3%). The test needs that correction; until then its leg and pack rows are not a fault.
- PASS contact sheets, PASS regression hook.

## Open for kr0

1. Leg length: .95 matches the turnaround's visible leg; .88 reads squatter (-12%). Which?
2. Back arm at rest: .15 rad above the front arm (bunker level above the minigun) or hidden behind it as before?
3. The torso has no drawn shoulder socket; the pad overhangs the torso edge. A torso edit with a socket ring at (.82, .57) would make the joint read like the turnaround (about 4 credits).
4. The one visible crack (knee neck) goes away if the thigh's knee ball is drawn 2 px larger, or by drawing the shin over the thigh with a 2 px larger collar. Not worth an edit on its own.
