# Verifier report: Tim-o v4 rig (rigger-v4 rework)

29 October 2026, branch `claude/project-thread-174d8l`. Independent check of `proposals/rigger-v4.md`; nothing committed, pushed or
published, no credits spent. Everything below was measured again from the working tree (lab page rebuilt with `build.py`, byte-identical
to the one checked in), not taken from the rigger's report. Units: hero px = pixels of `parts/hero-v1.webp` (1024 square); 1 hero px =
0.222 rig px; the harness canvas is rig px x zoom (1.62 for timo4 at the fit zoom).

## Verdict per check

| Check | Verdict | One line |
| --- | --- | --- |
| 1 Rest vs hero | PASS with two offsets | Torso, pack, both arms within 1.4 hero px of the hero; front knee 6.8 hero px off, back knee 27.5 hero px (6.1 rig px) off. 10.6% of the hero's ink is not covered, almost all of it one missing piece (the pelvis) and leg plates the edit redrew narrower. |
| 2 Battery | 1, 3, 4, 6, 7 PASS after re-scoping for ball joints; 2, 5 FAIL; new test 8 FAIL | The cap/peek failures were the drawn balls (test re-scoped, see below). Test 2's slivers and test 8's ground contact are real. Test 5 is hero-vs-turnaround and timo3 fails it the same way. |
| 3 Visual read | Arms good, legs not | Minigun arm visible in every frame, elbows read naturally, knees and hips stay seated. The near foot never touches the ground, the crouch pushes the feet through the ground line, the torso has no crotch, every elbow shows two balls. |
| 4a "minigun arm hides behind the body" | FIXED | Minigun forearm 97% visible in 24 of 25 frames (91% aim-3, 65% stress-4); it was 2 to 8% on the committed page. |
| 4b "the legs don't line up" | HALF FIXED | Knees now seat on their own thigh's ball (were 40 px apart). Feet still do not line up: standing, the near sole hangs 32.7 rig px above the far sole (the hero's stagger is 25.5); walking, the near foot floats at least 29 rig px above the ground in every frame; crouching, the far foot sinks 25 rig px under the line. |
| 5 timo3 regression | PASS, 0 px | timo3 rendered from the committed page and from the working tree: max placement difference 0 canvas px over 130 part-frames, 0 differing pixels in rest-0, walk-1, aim-2, stress-3. Battery identical (PASS 1,3,4,6,7; FAIL 2,5). |

## 1. Rest vs hero (numbers)

`python3 tools/rig-harness/overlay-hero.py tools/rig-harness/out/verify-tests-timo4` reproduces the rigger's overlay
(`out/verify-tests-timo4/rest-vs-hero.png`). My own measurement maps every piece's registered box (`hero.pos` in `exploded-v1.js`) and
the rig's placed pivot and joints (`report.json`, rest frame) into hero px, aligned on the torso's eye joint as the overlay does:

| Piece | pivot offset (hero px) | joint offset (hero px) | piece rotation vs hero |
| --- | --- | --- | --- |
| torso | 0.2 | armB 0.1, armF 0.1, hipB 0.2, hipF 0.1, pack 0.2, eye 0.0 | 0.0 deg |
| pack | 0.2 | glow 0.2 | 0.0 |
| upB / foreB | 0.1 / 0.1 | elbow 0.1 / muzzle 1.4 | 0.0 / 0.0 |
| upF / foreF | 0.2 / 1.1 | elbow 1.1 / tip 2.3 | 0.1 / -0.1 |
| thighF / shinF | 0.2 / 6.9 | knee 6.8 | -2.9 deg (thigh) |
| thighB / shinB | 0.3 / **27.5** | knee **27.4** (dx -24.6, dy -12.1) | **+9.3 deg** (thigh), bone 0.958 of the hero's |

So every torso-attached joint, both arms and the pack land on the hero to the pixel. The front knee is the IK's 14.6 px forward bend
the rigger mentions (measured 6.8 px after the leg scale). The back knee is not mentioned in the rigger's report and is off by 27 hero px:
`legScaleB` 1.172 x `legLen` .749 = .878 of the torso is applied to both back pieces, but the sheet drew the back thigh at .912 of the
torso and the back shin at .842, so the thigh bone is 4% short and the shin 4% long and the IK puts the knee 6 rig px up-left of where
the hero has it (the doubled knee ball at (235,480) in `out/verify-tests-timo4/verify-crop-legs.png`).

Coverage map `out/verify-tests-timo4/verify-errmap.png` (red = hero ink no rig ink within 2 px, green = rig ink outside the hero,
blue = flat region whose colour differs by more than 90/765): hero figure 78,489 canvas px; red 8,358 (10.65%), green 1,989 (2.8% of
rig ink), blue 4,396 (11.5% of flat pixels, all 1 to 2 px line shifts along plate edges; no part has the wrong colour). The red is not
noise, it is four things, largest first:

- 5,507 px at hero (521,613): the hero's pelvis, the green groin plate and the body between the hips. **No piece on the exploded sheet
  carries it**: the torso piece ends at the two hip cups, so the rig has an inverted-V hole under the torso in every frame
  (`verify-crop-errmap-legs.png`, `verify-zoom-hips-rest.png`). Sheet defect.
- Bands of 5 to 10 canvas px along the inner edge of both thighs and shins (the red outlines of the legs in the error map): the edit redrew
  the leg plates narrower than the hero's (the rigger's "faint ghost around the legs"). Sheet defect, cosmetic.
- 1,066 px at hero (314,368): the underside of the far shoulder pad. The hero draws the far pad over the torso's edge; the rig draws the
  back arm under the torso (the plan's order), so the pad is clipped by the torso circle (`verify-crop-farside.png`). Draw-order
  choice, cosmetic; the rig is consistent with the plan, the hero is not.
- 234 px at the pile-bunker tip and 210 px at the front shoulder: 1 to 2 px registration slop.

Green: 599 px at the minigun barrels and 472 px at the far forearm's outer edge (the far forearm's scale .994 vs the registered .85/.855
= .994, fine; the barrels are drawn 2 px wider than the hero's), 174 px under the far sole (rig sole 3.2 rig px below the hero's).

## 2. Battery (`node tools/rig-harness/tests/run.js --rig timo4`, output `out/verify-tests-timo4/`)

Before any test change the battery reproduced the rigger's numbers exactly (1 to 5 FAIL, 6 and 7 PASS; knee gaps 3.7 / 4.9, hip caps
.79 / 1.0, elbow caps .51 / .70, hipF overhang .818, front bend -7.3, legs +8%, arms +23%). Per failure:

| Test | Failure | Cause | Call |
| --- | --- | --- | --- |
| 1 cap exposure hips .79/1.0, elbows .51/.70 | the thigh's and forearm's balls show below the torso and upper arm | the hero draws every joint as a visible ball (pipeline step 1) and the pieces reproduce it: `verify-zoom-hips-rest.png` | re-scope: ball-joint rigs report cap, do not score it |
| 1 knee gap 3.7 / 4.9 | the shin's pivot is the thigh's ball centre, 4 to 5 rig px above the shin's top edge | rig construction, visually seated (`verify-zoom-joints.png` middle) | re-scope: allow the pivot's overhang above the child's box + 1.5 px (4.3 / 5.0) |
| 1 elbows: two balls | `verify-zoom-joints.png` left: the upper arm's elbow ball and the forearm's cap ball stack like two beads | the edit drew a ball on both sides of each elbow (hero has ball + collar) | **sheet defect**, not hidden by the re-scope: it still shows as cap .70 and in test 2 |
| 2 slivers: knee F 13 px (walk-3), hipF 2 px (stress-5), elbow F 1 px (stress-4) | the shin's ring sits below the ball instead of around it; in a deep bend a crack opens (`verify-zoom-joints.png` right) | sheet defect (cup drawn as a second ring, 46 hero px below the ball) | keep failing |
| 3 peek at every ball joint, hipF overhang .818 | balls visible by design; the hip joint lies on the torso's bottom edge so most of the torso's ink in the cap disc is outside the thigh | criterion assumes caps hidden in sockets | re-scope: ball-joint rigs do not score peek, and score overhang only when the child is on top |
| 4 front bend -7.3 deg in walk | the hero rests the front elbow hyper-extended 7.5 deg (`restBend` -0.13); walk reproduces it | a hero pose, not a forearm crossing back | re-scope: negative bend fails only below the rig's own `restBend` - 0.5 deg |
| 5 arm +23%, total +25%, pack +27%, shoulder -18% | hero proportions vs the turnaround's profile view | timo3 fails identically (+24% arm, +21% total, +80% pack): the test compares a high three-quarter camera to a profile | **left as is**; kr0 decides between the hero and the turnaround, `legLen` is the knob. Not a v4 defect |

Test changes made in `tools/rig-harness/tests/run.js` (documented in `tests/README.md`), all gated on `R.restAim` (present only on
timo4) except test 8:

- `BALL` rigs: test 1 reports cap exposure but scores only gap; gap allowance = the child's pivot overhang above its own box + 1.5 px
  (0 for every joint except the v4 knees). Test 3 reports peek, scores overhang only when the child is drawn on top; the plan-order
  check is unchanged. Test 4's negative-bend floor is `min(-0.5, restBend - 0.5 deg)`.
- New test 8, ground contact, for every rig: rest stagger between the two soles <= 8 rig px; a sole may sink at most 10 rig px below
  its rest sole in any frame; in walk each foot must come within 4 rig px of the ground line at least once. timo3 passes it (stagger 0,
  sink 2.6 / 7.1, plant -6.8 / -6.8).
- timo3 before and after the change: identical PASS/FAIL and identical numbers on tests 1 to 7 (`--no-render` on the same report);
  only test 1's header line gained the words "(+ pivot overhang ...)" and test 8 was appended. timo3's own failures (test 2 knee
  slivers 9 and 1 px, test 5) are unchanged and predate this round.

After the change timo4: PASS 1, 3, 4, 6, 7; FAIL 2 (slivers), 5 (hero vs turnaround), 8 (ground contact, below).

## 3. Visual read

Frames: `out/verify-tests-timo4/verify-sheet-{walk,aim,stress}.png` (8 frames each, cropped to the figure, 1.2x), joints at 4x in
`verify-zoom-joints.png`, hips at 3x in `verify-zoom-hips-rest.png`. The requested `--zoom 2.5` sheets are in `out/v4-verify/` but the
harness canvas is a fixed 600 x 520, so at 2.5 the head and the feet are cut off; they are useful for joints only.

- Minigun (far) arm: visible in all 24 animated frames (see 4a); it hangs behind the torso and swings with the aim, never pointing along
  it. Reads as the hero. In stress-4 (aim -0.76 while raised) the forearm passes behind the near thigh and shows 65%; acceptable.
- Elbows: the front arm rises to the aim with a 0 to 73 deg bend, natural in every aim frame; hanging, it is straight with a 7 deg
  hyper-extension, as drawn. The far elbow keeps 26 deg. Every elbow shows **two stacked balls** (sheet defect).
- Knees: seated in every frame (gap = ball radius, 0 cap). A 13 px crack opens at the near knee in walk-3 and 3 px in walk-0.
- Hips: thigh balls hang under the torso's cups rather than in them; reads as the hero does, but the empty cups above the balls and the
  missing pelvis between the thighs are visible in every frame.
- Feet and ground: **the near foot never reaches the ground**. Standing (rest, aim) its sole is 26.3 rig px above the line while the far
  sole is 6.4 below it; walking, its closest approach is 29.4 rig px (walk-4), and in walk-4/5 both feet are in the air (`walk-4.png`).
  In stress the crouch (`P.c` up to 26 rig px) carries both feet down with the body: far sole 31 rig px below the ground line in stress-5,
  30 in stress-1 (`stress-5.png`, `stress-1.png`: the foot is cut by the line).
- Pops, flips, detachments: none. Draw order holds everywhere.
- Proportions vs the turnaround side view: the rig is the hero, and the hero is longer-limbed than the turnaround (arm +23%, total
  +25%). The near leg (reach 400 hero px) is 22% shorter than the far leg (513) because the sheet drew them at .75 and .88 of the
  torso; the hero itself has this stagger, the rig keeps it.

## 4. kr0's complaints

**"The arm with the minigun hides behind the body": fixed.** Share of the minigun forearm's pixels not covered by any later-drawn part
(my `visibility.js`, same page, same ops): committed page rest 3%, walk 2 to 5%, aim-1 20% (best); working tree rest 97%, walk 97% in
all 8 frames, aim 97% x 7 and 91% (aim-3), stress 97% x 7 and 65% (stress-4). Proof: `out/verify-tests-timo4/verify-sheet-walk.png`,
`verify-sheet-aim.png`; the committed page's `out/v4-baseline/rest-0.png` for the before.

**"The legs don't line up": half fixed.** Knees: fixed, each shin turns about its own thigh's ball (knee gap 3.7 / 4.9 rig px = the ball
radius, 0 slivers at rest; before, 40 px between shin and thigh). Feet: not fixed. `rest-0.png` and every aim frame: near sole 26.3
rig px above the ground line, far sole 6.4 below it, 32.7 apart (hero: 25.5; the rig adds 7 because the far shin is scaled 4% larger
than the sheet drew it). `walk-4.png`: both feet off the ground; the near foot is never closer than 29.4 rig px to the line in walk.
`stress-5.png`: far foot 31 rig px under the line. The rigger's report states the stagger and calls it the hero's; it does not mention
the walk float or the crouch sink, which are consequences of the same `legRest` code.

## Defects (severity, where, evidence)

1. **High, code** (`template.html` `bipedOps`, `leg()`): the foot target is `fy = hy + fr[1] - lift` with `hy = ty + hip.y` and
   `ty = by + bob + c`, so the feet follow the body's bob and crouch instead of the ground (v3's `fy = 0 - lift` anchors them). Sink up
   to 24.7 rig px below the rest sole (stress-5), 19.1 (stress-1 front). Fix: `fy = (fr ? by + hp.y + fr[1] : 0) - lift` (constant per
   foot; the lowest foot's rest y is exactly 0 by construction of `by`), so the crouch bends the knees.
2. **High, rig data / design** (`legRest` y, `kneeRest`): the near foot rests 26 rig px above the ground and nothing lowers it while
   walking, so it never plants (closest 29.4 rig px). Either blend each foot's rest y to the ground line as `walk` rises (one lerp in
   `leg()`), or give kr0 a `legRestY` knob (1 = hero stagger, 0 = both soles on the line; the rigger measured the cost at 30 px of far
   knee bend). The hero's stagger is a drawing of one standing pose, not a gait.
3. **Medium, sheet**: no pelvis. The hero's groin plate and the body between the hips (about 32,000 hero px) are on no piece; the torso
   ends at two cups. Next sheet edit: extend the torso piece down to the groin plate, hip cups on it. Evidence `verify-errmap.png`
   (red block under the torso), `verify-zoom-hips-rest.png`.
4. **Medium, sheet**: two balls per elbow. The forearm caps (`foreF`, `foreB` top) are balls under the upper arms' elbow balls;
   `verify-zoom-joints.png` left. Next sheet edit: collar/cup on the forearm side, one ball on the upper arm.
5. **Medium, rig data** (`timo_reassemble.py` consts): one `legScaleB` for two pieces of different scale puts the back knee 27.5 hero px
   (6.1 rig px) off the hero and rotates the back thigh 9.3 deg. Fix: per-piece scales (`thighScaleB` .912, `shinScaleB` .842 of the
   torso) or scale the back shin by .842/.912 inside `legLens`; `legLen` .749 for the front leg is right (bone ratio 1.001).
6. **Low, sheet**: the shin's knee ring sits 46 hero px below the thigh's ball instead of around it; slivers 13 px (walk-3), 3 px
   (walk-0), 1 px (stress-4); hipF 2 px (stress-5), elbow F 1 px (stress-4). Same edit as 4 (cup around the ball).
7. **Low, sheet**: the edit drew the leg plates narrower than the hero's (5 to 10 canvas px bands along both legs' inner edges) and the
   far shoulder pad is clipped by the torso because the plan draws the back arm under it where the hero draws the pad over it.
   Cosmetic; a `padOver` op (draw `p4_upB` after the torso, the forearm before it) would match the hero at the cost of the plan's rule.
8. **Info, harness**: `render.js` draws on a fixed 600 x 520 canvas, so `--zoom 2.5` crops the figure (`out/v4-verify/contact-*.png`).
   Not a rig issue; a `--pad` or auto-size would make the zoomed sheets usable.

## What should be fixed next, in order

1. Code: anchor the feet to the ground (defect 1) and blend or expose the foot stagger (defect 2). Both are in `bipedOps`; `legRest`
   data stays. Re-run test 8 (expected PASS once the near foot plants and the crouch bends the knees).
2. Rig data: per-piece back-leg scales (defect 5) in `timo_reassemble.py`'s `consts`, one line in `legLens`; expected back knee within
   3 hero px of the hero.
3. Sheet edit, one run, "keep every other piece exactly as it is": torso with the pelvis plate (3), cups instead of balls on the
   forearm tops (4) and shin tops (6), plates to the hero's width (7). Re-slice, re-register, rerun; tests 2 and the cap/peek numbers
   should then drop to the v3 level.
4. kr0's call, no work until then: hero vs turnaround proportions (test 5, also failing for timo3) and the far pad draw order.

## Files

- Report of this round: `tools/rig-harness/proposals/verifier-v4.md` (this file).
- Test changes: `tools/rig-harness/tests/run.js`, `tools/rig-harness/tests/README.md`.
- Evidence (not committed, `tools/rig-harness/out/`): `verify-tests-timo4/` (battery render, `rest-vs-hero.png`, `verify-errmap.png`,
  `verify-crop-legs.png`, `verify-crop-errmap-legs.png`, `verify-crop-farside.png`, `verify-zoom-joints.png`,
  `verify-zoom-hips-rest.png`, `verify-sheet-walk.png`, `verify-sheet-aim.png`, `verify-sheet-stress.png`, `tests.json`),
  `v4-verify/` (zoom 2.5 sheets), `verify-timo3/` and `verify-timo3-head/` (regression pair), `verify-tests-timo3-before/`
  (timo3 battery), `v4-baseline/` (the rigger's render of the committed page).
