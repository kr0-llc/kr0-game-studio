# Tim-o v3 rig, animation expert round 1

Files: `expert-r1.json` (the override, pivots and joints as shares, rot in radians) and this note.
Pixel offsets below are sheet pixels (store size, 1.5x display). Ball centres were found by fitting
a circle to the outer outline of each cap in `out/timo3/parts/*.png`, not by eye.

Harness, worst over all 25 frames, current rig then proposal:
capExposure and socketGap were already 0 for every jointed part in both (the pack's 0.36 to 0.44
and the torso's 1.0 have no parent and are not joints). The new fit numbers are what moved:
knee peek 0.16 to 0, knee overhang 0.12 to 0 (the thigh's knee ball no longer shows beside the
shin's). Knee "hole" rose from 43 to 162 and "sliver" from 34 to 98 px: with the two balls now
concentric and almost the same radius, every background pixel round the rim touches both outlines,
so the hole scan counts the whole rim; the sliver is a crack between the thigh's narrow neck and the
shin's collar at deep bends, hidden under the ball. With legLen .95 (see below) sliver drops to 6.
Hip hole stayed at 26 to 37 px (background between the hip ring and the thigh's neck).

## Per joint

Front upper arm `p_upF`. The pivot was at (48,19), the small sand ball at the top right of the pad,
3 px from the part's top edge. The arm therefore swung the pad around its own corner, sliding it
across the torso through the aim sweep. Moved 17 px left and 15 px down to the centre of curvature
of the pad dome (31.5,34.7), r 29, so the pad spins in place on the shoulder like a ball in a socket.
Elbow joint moved 4 px left and 3 px down to the fitted ball centre (111.7,41.6), r 20.5; it was on
the ball's right flank, which left the forearm's cap peeking out to the right (visible double rim in
the old elbow close-up). Bone was 5 deg down after the move, so rot -0.086 levels it.

Minigun forearm `p_foreF`. Pivot moved 3 px down to the cap centre (20.9,23.6), r 19.9; the old
pivot sat on the lit top half of the cap. Barrel runs 3 deg down from cap to muzzle, rot -0.05.
Muzzle joint moved 1 px, it was right.

Back upper arm `p_upB`. Pivot (29.5,19.5) was within 2 px of the ball centre (27.5,19.2), kept
there. Elbow moved 4 px left and 3 px down to (111.9,32.8). Bone ran 9 deg down, rot -0.158.

Pile-bunker forearm `p_foreB`. Pivot moved 3.5 px down to the cap centre (21.5,25); tip joint kept.
Barrel runs 5 deg down, rot -0.085.

Thigh `p_thigh`. Both balls are drawn at x 0.58, not 0.5: hip ball centre (28.9,13.9), knee ball
(29.5,92.7). Pivot moved 4 px right, 3 px down; knee joint moved 4.5 px right and 7 px up (it was
at y 0.9, below the ball). That 7 px was the whole knee fault: the thigh's ball stuck out above the
shin's by 5 display px in every frame.

Shin `p_shin`. Knee ball centre is (36.9,14.2); pivot moved 7 px right. Bone pivot to sole is
within 3 deg of vertical, no rot.

Torso `p_torso`. The art has no shoulder sockets, the pad acts as the socket cover, so the shoulder
joint is where the pad centre should sit. Near shoulder armF moved 2.5 px right and 7 px down to
(0.82,0.57): with the pad now centred on it, the pad overhangs the torso's right edge by a third of
its width like the turnaround's near shoulder; higher than 0.55 puts the dome over the eye ring.
Far shoulder armB moved 7 px right and 5 px down to (0.20,0.46), mirrored across the torso from the
near one and raised for the high camera; it is behind the pack and torso either way. Hip joints
moved onto the centres of the two dark rings at the torso's base: hipF 5 px right and 2 px up to
(0.66,0.865), hipB 4 px up to (0.30,0.87). Eye joint moved 5 px left onto the lens centre.

## Draw order

Keep the order as it is: back leg, back arm (forearm under upper arm), pack, front leg, torso,
front arm (forearm under upper arm). It satisfies rule 3 everywhere: the shin's ball covers the
thigh's knee ball, the upper arm's elbow ball covers the forearm's cap, the torso covers both hip
balls so the rings read as sockets, and the pack covers the far shoulder. Do not move the pack
behind the back arm: with the flipped pad on `p_upB` the pack is what hides it.

## Rest pose

Keep the front elbow bend at 0.8 rad: the front pad is drawn tilted 45 deg so it stands upright at
exactly this bend, and the elbow then sits at the torso's bottom edge as in the turnaround.
The back arm is invisible at rest, in the walk and in most of the aim sweep: both arms share the
same aim and bend, the back one at .92 scale, so the bunker sits entirely behind the minigun.
Proposal (tested in a scratch copy of the page, not applied): back arm aim offset -0.35 rad and
rest bend 0.35 (walk bend 0.45 +- 0.22). The bunker then emerges above the near pad at eye level
and reads as a second weapon; the far upper arm stays hidden behind the torso, which is fine.
Aim clamp -46 to +54 deg and bend 0 to 1.5 stay; no new faults appear in stress.

## Proportions against the turnaround side view (fig 2, torso 222 to 392 px = 1.0)

Reference: shoulder ball at 0.50 of torso height, upper arm 0.37, forearm plus hand 0.72, leg hip
to sole 1.09 to 1.13, pack height 0.98, pack top 0.49 above the shoulder, pack overhang 0.47.
Rig with the proposal: shoulder 0.57 (within range once the eye is accounted for), upper arm 0.61
(+65%), forearm 1.10 (+53%, it is a minigun not a hand), leg 0.93 (-15%), pack height 0.62 (-37%),
pack top above shoulder 0.50 (ok), pack overhang 0.29 (-38%, less in three-quarter).
Proposed constants in template.html (scratch-tested, all harness numbers stay green):
front arm scale .85, back arm .78 (reach 1.71 to 1.46 torso, upper arm 0.52);
legLen .82 to .95 (leg 1.07 torso, knee sliver falls to 6);
pack scale .7 to .85 with torso pack joint y .38 to .45 (height 0.75, top stays, overhang 0.35).
The upper arm stays long after scaling because the art's tube is long; only a redraw fixes it.

## Needs new art

1. `p_upB`: the shoulder pad is flipped (ball on top, cup underneath). Redo as the far-side twin of
`p_upF`: dome on top pointing up-left at 45 deg, ball under it, same tube and elbow ball. Then
pivot it at the pad's centre of curvature like the front arm.
2. `p_upF` and `p_upB`: the tube between collar and elbow ball is 55 px; 35 px would give the
turnaround's 0.37 upper arm without a scale hack.
3. `p_torso`: there is no socket drawn at either shoulder and the eye sits at x 0.745, so the near
pad must overlap the eye ring at any shoulder height above 0.55. A redraw with the eye at x 0.65
and a faint socket ring at (0.84,0.5) would let the shoulder go back up to 0.50.
4. `p_pack`: fine as art; only scale is off.
