# Tim-o v3 rig, round 1 test results

Visual tester, 29 October 2026. Rigs as published in the lab page today, no overrides. Outputs: `tools/rig-harness/out/tester-r1/` (timo3) and `tools/rig-harness/out/tester-r1-timo/` (v2.1 baseline). Rerun with `node tools/rig-harness/tests/run.js --rig timo3 --out tools/rig-harness/out/tester-r1`. Thresholds and method are in `README.md` next to this file. All paths below are relative to the repo root. Pixel figures are canvas px at zoom 1.94 unless they say rig px.

## Summary

| Test | timo3 (v3 elbows) | timo (v2.1 baseline) |
| --- | --- | --- |
| 1 Joint fit (cap < 0.05, gap 0) | PASS, 225 joint-frames, every cap 0, every gap 0 | PASS, 175 joint-frames |
| 2 Visual gap scan (sliver 0) | FAIL: front knee 19 px in stress-2, back knee 4 px, hipF 14 px in aim-6 | FAIL: front knee 19 px stress-2, hipF 15 px walk-4 |
| 3 Draw order | FAIL: thigh knee ball peeks 0.16 past the shin cap at both knees | FAIL: same 0.16 |
| 4 Elbow behaviour | PASS, no negative bend, no weapon in torso; WARN bend reaches 95 deg; weapons below ground in 5 frames | PASS (no elbow), 0 frames below ground |
| 5 Proportions (15 percent) | FAIL: arm +53, leg +35, pack +40, shoulder height +52 percent | FAIL: leg +36, pack +39, shoulder +52 (arm +8) |
| 6 Contact sheets | PASS, `out/tester-r1/contact-{rest,walk,aim,stress}.png` | PASS |
| 7 Regression hook | PASS, exit 1 overall because 2, 3, 5 fail | PASS |

The acceptance in the rigging plan (cap exposure and socket gap) passes for every joint in every frame on both rigs. That metric is satisfied because every cap is fully overlapped by some part; it does not see a cap that is overlapped but not concentric, a crack sealed by a third part, a weapon in the floor, or a limb that is the wrong length. Tests 2 to 5 catch those.

## 1 Joint fit

Every child cap (shin x2, forearm x2, upper arm x2, thigh x2) has capExposure 0 in all 25 frames, and every parent joint (knee x2, elbow x2, armF, armB, hipF, hipB, pack) has socketGap 0. The pack is placed 6 rig px left of its torso mark by `bipedOps` (`pk.x-6`), so the harness matches it by proximity and scores only its gap; its own capExposure (0.36) is the pack's centre pixel disc, not a cap, and is not scored.

## 2 Visual gap scan

Open notches where two round outlines meet are everywhere a ball meets a socket (knee 43 px, hipB 37 px, hipF 30 px at worst) and are not faults. Sealed cracks that touch both parent and child:

- Front knee, stress-2: 19 px crack between the thigh's lower edge and the shin's cap ring, sealed behind by the back leg. `out/tester-r1/stress-2.png` (joint at 288,366). Also 3 px in stress-6 and 1 px in walk-4.
- Back knee, stress-2: 4 px, same shape. stress-6 2 px, walk-4 1 px.
- Front hip, aim-6: 14 px triangle under the torso between the thigh and the front forearm. `out/tester-r1/aim-6.png` (joint at 235,257).

The baseline has the same knee crack (19 px stress-2) and a 15 px hipF crack in walk-4, so these come from the v2.1 thigh and shin caps, not from the new arms.

## 3 Draw order

Order matches the plan at every joint: shin over thigh, upper arm over forearm, front upper arm over torso, back upper arm under torso and under the pack. Cap fit inside that order:

- Knee (both legs, every frame): peek 0.16, worst `out/tester-r1/walk-3.png` (back) and `out/tester-r1/aim-0.png` (front). The thigh's knee ball shows as a second bulge above and to the right of the shin's cap: the two circles overlap but are not concentric. Either the thigh `knee` mark (0.5, 0.9) or the shin pivot (0.47, 0.12) is off by about a third of a cap radius. Overhang 0.12 is the knee plate being wider than the thigh, acceptable.
- Elbows: overhang 0 and peek 0 in every frame; the forearm cap is fully inside the upper arm's elbow ball. This is the one joint that behaves exactly as the plan asks.
- Shoulders: overhang 0, peek 0. Hips: the torso covers the thigh cap completely (peek 0).

## 4 Elbow behaviour

Front arm bend 11.8 deg (stress-2) to 95.1 deg (stress-6); back arm 3.2 to 86.4 deg. Never negative, so the forearm never folds back through the upper arm. The pose data clamps the bend to 0 to 1.5 rad (86 deg); the measured angle is higher because the upF elbow bone is drawn 15.9 deg below horizontal while `rot` is 0, and the foreF muzzle bone 4.3 deg (upB 6.9, foreB 6.2). Plan rule 4 says that tilt belongs in `rot`, not in the pose; today it adds about 12 deg of bend to the front arm in every frame.

Neither muzzle nor pile tip ever lies on torso ink. But the weapons go through the floor: muzzle below the ground line in aim-1, aim-6, stress-1, stress-2, stress-7; pile tip in aim-1, stress-1, stress-7. In stress-2 the pile tip lands on the front shin (`jointHits.tip` = p_shin@hipF). Cause: the upper arm hangs from the shoulder by the bend angle, so at -46 deg aim the forearm starts near hip height and points down; with the crouch of stress it reaches the ground. The v2.1 rig (arm pivoting at the shoulder) never touches the ground in the same poses.

## 5 Proportions against four-view.png, side view

Reference landmarks (image px): top 222, shoulder pad centroid (516, 293), waist 376, hip 439, hip joint 407.5, fingertip (481, 518), sole 586, pack top 226. Torso 186, total 364, arm 228, leg 179, pack above shoulder 67.

| Ratio | reference | timo3 | diff | timo | diff |
| --- | --- | --- | --- | --- | --- |
| arm / torso | 1.23 | 1.88 | +53 percent | 1.32 | +8 percent |
| leg / torso | 0.96 | 1.30 | +35 percent | 1.30 | +36 percent |
| total / torso | 1.96 | 2.26 | +15 percent | 2.25 | +15 percent |
| pack above shoulder / torso | 0.36 | 0.50 | +40 percent | 0.50 | +39 percent |
| shoulder below top / torso | 0.38 | 0.58 | +52 percent | 0.58 | +52 percent |

The arm figure is the one that changed with v3: the upper arm bone alone is 104 px (0.60 of torso) where the reference shoulder to elbow is about 74 of 186 (0.40). The forearm is a minigun, so arm length is only indicative, but the upper arm is about 50 percent too long on its own. Leg, pack and shoulder height are the same on both rigs, so they come from the v2.1 torso, legs and pack. The hip landmark moves these numbers: taking the waist (376) as the hip joint gives leg / torso 1.36 for the reference and the legs pass; taking the hip row (439) gives 0.68 and they fail harder. Treat leg length as borderline and the shoulder height and pack height as real.

## 6 Contact sheets

`out/tester-r1/contact-rest.png`, `contact-walk.png`, `contact-aim.png`, `contact-stress.png` (and the same under `out/tester-r1-timo/`).

## Qualitative findings from the PNGs

- The front upper arm's green shoulder pad covers the lower half of the eye lens in every standing frame (`rest-0.png`; the harness reports upF ink on the torso `eye` mark in 15 of 25 frames). The pad should sit below and in front of the dome, as in the reference, not over the lens.
- The front upper arm hangs almost vertically with the elbow ball at hip height, so the minigun fires from the hip in rest and walk (`rest-0.png`, `walk-2.png`). The reference and the v2.1 rig carry the weapon at shoulder height. The 0.8 rad rest bend plus the 16 deg art tilt plus the long bone all push the same way.
- The armF mark on the torso sits about 10 rig px above the torso's drawn shoulder socket ring (visible in `rest-0.png` as the dark ring under the pink pivot). Worth a look by the animation expert before moving the arm pivots.
- The back arm disappears completely in walk-4 to walk-7 (`contact-walk.png`): upper arm and pile bunker are both behind the torso and the front arm. In the reference side view the far arm is still partly visible.
- In aim-1, stress-1 and stress-7 both weapons point into the ground, and in stress-2 the pile spike rests on the front shin (`stress-2.png`). With a crouch the whole forearm should be clamped above the sole.
- The knee reads as a double ball in every frame (`walk-3.png` at 204,356): the thigh's knee ball and the shin's cap are visibly two circles.
- The thigh and shin art is drawn for a straighter leg than the rest pose uses; the rest pose stands on bent knees with splayed feet, which is where the 0.82 legLen and 0.93 reach put it. Not a fault of the marks, but it is why the figure looks shorter than the parts measure.
- Nothing floats and no part pops: every cap stays covered in all 25 frames, including the stress crouch.

## Top 5 faults

1. Front upper arm too long and hung too low: upper-arm bone 0.60 of torso height versus 0.40 in the reference, arm / torso +53 percent, elbow at hip height. `out/tester-r1/rest-0.png`.
2. Knee ball not concentric: thigh knee ball peeks 0.16 past the shin cap at both knees in every frame. `out/tester-r1/walk-3.png`.
3. Weapons through the floor and through the front shin at low aim: 5 muzzle and 3 tip frames below ground, tip on the shin in stress-2. `out/tester-r1/stress-2.png`.
4. Front shoulder pad covers the eye lens. `out/tester-r1/rest-0.png`.
5. Upper-arm art tilt (15.9 deg) not carried in `rot`, which adds 12 deg of bend everywhere and pushes the elbow past the 86 deg clamp (95 deg). `out/tester-r1/stress-6.png`.

Shared with the v2.1 baseline and therefore part of the torso, legs and pack rather than the new arms: knee peek, the stress-2 knee crack, pack 40 percent too tall above the shoulder, shoulder joint 52 percent lower on the torso than the reference's pad.
