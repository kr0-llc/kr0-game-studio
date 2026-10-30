# Tim-o animation coverage

Last updated: 29 October 2026 (route comparison added after kr0: "What about isometric instead of puppet") · Asked by kr0: "do these animations cover all the ones we need? how about when the character turns around and walks away from camera?"

**Short answer: no.** Every Tim-o drawing so far faces one way: front-right three-quarter, mirrored for the left. Nothing shows him from behind, so he can't turn and walk away from the camera, up the screen. The game's camera is a 2:1 dimetric isometric view with 8 directions, and the legs and torso face separately (GDD, Controls and camera), so the 2D look needs him from every angle. The voxel prototype (`games/metr0niks/prototypes/prototype.html`) builds the mech from 3D boxes that turn with the legs and the aim, so it already faces every way. This gap is only for the drawn 2D look.

## Facings

| Facing | Screen direction | Have it? |
| --- | --- | --- |
| Front | Down the screen, toward the camera | No (the turnaround has it) |
| Front 3/4 | Lower right, mirrored for lower left | Yes: every set and the parts sheet |
| Side | Right, mirrored for left | No (the turnaround has it) |
| Back 3/4 | Upper right, mirrored for upper left (walking away) | No |
| Back | Up the screen, away from the camera | No (the turnaround has it) |

Five drawn facings give all eight, because the left-hand three are mirrors. On the cut-out puppet a mirror is safe: the arms are separate sprites, so the minigun stays on the right arm. On a baked frame-by-frame sheet a mirror swaps the weapons to the wrong arms, so that route needs all 8 facings for every move.

## Moves

| Move (GDD) | Puppet today | Frame-by-frame today |
| --- | --- | --- |
| Walk, 8 directions, backwards while aiming | IK walk, front 3/4 only (v4 rig from the hero frame) | `sprites/run-iso-r5/` (round 5, from the hero frame; round 4 kept), front 3/4 only |
| Turn, walk away from the camera | Missing: needs back views | Missing |
| Torso aim, apart from the legs | Yes, about 45° up to 55° down, front 3/4 only | Can't: the torso is baked to the legs |
| Minigun fire | Recoil and flash | None |
| Pile-bunker charge, fire, retract | Done (review page and ink prototype) | None |
| Dash | Done | `sprites/dash-iso/` (round 2) |
| Jump-jets, drop-in, extract | Done | `sprites/jetpack-iso-r4/` (round 4) |
| Hit | Hit flash | None |
| Overheat vent | Done | None |
| Destroyed | Break-apart | `sprites/explode-iso/` (round 4) |
| Garage idle | Breathing | `sprites/idle-iso/` (round 4) |
| Results cheer | None | `sprites/win-iso/` (round 3) |
| Other parts: shotgun, plasma cutter, rail rifle, bunker-buster, mag-winch, siege mortar, flash-vent, treads, servo-legs | No art; each one is a part sprite swap | A new sheet per part, move and facing |

## What it would take

- **Puppet (recommended):** four more parts sheets drawn from the four-view turnaround (front, side, back 3/4 and back), about 4 credits each, so about 16 in total. The code then picks the parts by angle, and every move above works in every facing, including walking away while aiming back over the shoulder. Start with the back 3/4 sheet (4 credits) to test walking away.
- **Frame-by-frame:** a 12-frame grid now costs 4 credits on GPT Image 2.5 Sunburst (it was 13 on GPT Image 2), so 8 facings for each of about 10 moves is about 320 credits before re-rolls, not 1,000. It still can't aim apart from the legs, and a mirrored frame swaps the weapons to the wrong arms. Keep it for the garage idle, the results cheer and destroyed, which face one way (kr0 marked idle and destroyed Keep on 29 October).

## Isometric frame-by-frame instead of the puppet? (29 October)

Research: `games/metr0niks/research/2026-10-29-iso-sprite-workflows.md`. The rerun (run, round 5, 4 credits, from the v4 hero frame) is on the review page next to the puppet. Credits below are for 6 moves × 2 facings (front 3/4 and back 3/4), with the assumptions in the research note.

| Route | Credits | Facings | Torso aims apart from the legs | Mirror safe | Where it breaks |
| --- | --- | --- | --- | --- | --- |
| Puppet (v4 rig, hero frame + exploded sheet) | 4 to 10 (one back 3/4 sheet; moves are code) | every drawn sheet gives two (mirror) | Yes | Yes (arms are separate sprites) | Reads as a cut-out; each new facing is a sheet and a reassembly |
| Frame-by-frame grids (GPT Image 2.5) | about 48 first pass, about 120 to approval; 190 to 480 for the real 8 facings | one per sheet | No | No (weapons swap sides) | Drift between frames (Scenario's own skill measures 60 px centre wander, 90 px foot spread); fixed only by per-frame alignment afterwards |
| Video lane (Veo / Kling / Wan, then extract and key) | about 430 (Veo Lite) to 1,000 (Kling) | one per clip | No | No | No alpha from any video model; back views drift to profile; 5 s clips grow 1.45× |
| 3D to sprites (Tripo mesh exists: asset_xhPHTKBPCQgbrwErBttNdQVC; Meshy or Uthana rig; render 8 cameras in Blender) | about 130 with hand-keyed moves (960 with Uthana motion) plus 2 to 4 days of Blender setup | all eight, free after setup | Yes (separate torso bone) | Yes | Toon shading has to match the flat ligne-claire ink; unproven; a humanoid auto-rigger may refuse a ball-jointed mech |

Experiment run on 29 October (kr0: "Do the experiment", 8 credits): the clay grid locked the poses and gave the first back-3/4 walk, but the repaint grew the figures a fifth and set each row at its own height (height spread 7 to 8%, feet 16 to 53 px), so baked sets still need per-frame alignment in post; results on the review page and in the research note.

Recommendation: the puppet stays the gameplay route (it is the only cheap one with independent torso aim and safe mirroring, both GDD requirements). Frame-by-frame grids stay for the one-facing screens. If kr0 wants 8-direction drawn frames, the 3D-to-sprites route is the honest alternative, and the research note proposes a 12 to 15 credit experiment first: render flat clay pose grids from the voxel prototype or the mesh, repaint them with one GPT Image 2.5 call each using the hero frame as reference, and measure drift against the clay.
