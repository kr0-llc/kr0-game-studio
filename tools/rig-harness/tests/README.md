# Rig test battery

Measurable, repeatable checks for the Tim-o puppet rigs (`timo3`, the v3 elbow rig, and `timo`, the v2.1 one-piece-arm baseline). Everything here reads the numbers that `tools/rig-harness/render.js` writes to `report.json`; nothing is eyeballed except the qualitative notes in `r1-report.md`.

## Rerun everything

```
node tools/rig-harness/tests/run.js --rig timo3                 # renders to tools/rig-harness/out/tests-timo3, prints PASS/FAIL, exit 1 on any FAIL
node tools/rig-harness/tests/run.js --rig timo                  # baseline rig
node tools/rig-harness/tests/run.js --rig timo3 --override p.json   # a pivot proposal: {"p_upF":{"rot":-0.28,"pivot":[u,v],"joints":{"elbow":[u,v]}}, ...}
node tools/rig-harness/tests/run.js --rig timo3 --out tools/rig-harness/out/tester-r1   # the round-1 output folder used by r1-report.md
node tools/rig-harness/tests/run.js --rig timo3 --no-render     # re-score an existing output folder without rendering
node tools/rig-harness/tests/run.js --rig timo3 --json          # machine-readable; tests.json is always written next to report.json
```

Options: `--frames 8` (frames per animated mode), `--capTol 0.05`, `--gapTol 0`, `--sliverTol 0`, `--peekTol 0.05`, `--overhangTol 0.25`, `--propTol 15` (percent). Needs the built lab page and Playwright, like `render.js`.

Render alone (same CLI as before, new flags are optional): `node tools/rig-harness/render.js --rig timo3 --dots --csv --frames 8 --out <dir>`. New outputs: `contact-<mode>.png` (all frames of a mode side by side, off with `--no-sheet`), `fit.csv` (one row per joint per frame, with `--csv`), and per part `box` (placed quad) and `ink` (opaque bounding box) in `report.json`. `--holeR 12` and `--sliverMax 40` tune test 2.

Units: `report.json` positions are canvas px; rig px = canvas px / `zoom` (zoom is in the report, about 1.94 for timo3). Gaps are reported in rig px, pixel counts in canvas px.

## The tests

1. **Joint fit.** For every parent joint that has a child (knee x2, elbow x2, armF, armB, hipF, hipB, pack) in every frame of every mode: the child's `capExposure` (share of its pivot cap disc that touches no other part) must be below 0.05 and the parent's `socketGap` (rig px from the joint to the child's nearest ink) must be 0. The pack is placed 6 rig px off its mark by the rig code, so only its gap is scored. Failures are listed per joint with the failing frames and the worst frame's PNG.
2. **Visual gap scan.** Within 12 rig px of each joint, count transparent pixels that touch both the parent's and the child's ink within 3 px (`hole`, an open notch where two round outlines meet, informational), and those of them that lie in a sealed transparent region of at most 40 rig px² (`sliver`, a see-through crack). `enclosed` counts all sealed background near the joint, including the space between limbs, and is informational. PASS when `sliver` is 0 at every joint in every frame.
3. **Draw order.** At each joint, `top` says whether the child or the parent is drawn later. The plan wants shin over thigh (knee: child), upper arm over forearm (elbow: parent), front arm over torso (armF: child), back arm under torso and pack (armB: parent, and `p_upB` drawn before `p_pack`). Within a cap disc of 7 rig px around the joint, `overhang` is the share of the top part's ink that sits outside the bottom part (the top cap sticking out past the socket) and `peek` is the share of the bottom part's ink the top part does not cover (the bottom cap showing). FAIL when the order differs from the plan, `peek` > 0.05, or `overhang` > 0.25.
4. **Elbow behaviour.** For walk, aim and stress, the signed angle between the upper-arm bone (shoulder pivot to elbow mark) and the forearm bone (elbow to muzzle or tip), from `report.json`. Positive is the direction `arm2()` bends (forearm swings back up toward the aim); a negative value means the forearm crossed back through the upper arm. Also checks `jointHits` for the muzzle and the pile tip: FAIL if either lies on torso ink in any frame. Frames where the tip is below the ground line are listed, and a bend above 86 deg (the plan's 1.5 rad clamp) is a WARN, because the measured angle includes the art's own tilt (the upF bone is drawn 15.9 deg below horizontal with `rot` 0).
5. **Proportions.** The second figure of `four-view.png` (side view, on white) is segmented by colour: ink is any pixel with a channel below 190 or saturation above 40, the grey drop shadow does not count as the sole. Landmarks: top = first ink row, sole = last saturated row, waist = first row below the widest torso row narrower than 80 percent of it, hip = first row below the waist narrower than 55 percent, hipJoint = midpoint of waist and hip, shoulder = centroid of the green shoulder pad, fingertip = lowest green hand pixel, packTop = first ink row in the right quarter of the figure. Rig side, from the rest frame: torso = torso ink top to the mean hip joint, arm = shoulder-to-elbow plus elbow-to-muzzle bone length (the minigun stands in for the hand), leg = hip-to-knee bone plus shin ink below its pivot, pack above shoulder = armF joint y minus pack ink top, total = all-parts ink height. Ratios to torso height are compared; FAIL beyond 15 percent. The landmarks are written to `ref-measure.json` in the output folder so they can be checked against the image.
6. **Contact sheets.** `contact-<mode>.png` exists for every rendered mode.
7. **Regression hook.** `run.js` itself: renders, scores, prints PASS/FAIL with the numbers, writes `tests.json`, exits 1 when any test fails. Works for `--rig timo3` and `--rig timo` and with `--override`.
