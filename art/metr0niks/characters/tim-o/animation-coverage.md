# Tim-o animation coverage

Last updated: 29 October 2026 (back 3/4 added) · Asked by kr0: "do these animations cover all the ones we need? how about when the character turns around and walks away from camera?"

**Short answer: no.** Every Tim-o drawing so far faces one way: front-right three-quarter, mirrored for the left. Nothing shows him from behind, so he can't turn and walk away from the camera, up the screen. The game's camera is a 2:1 dimetric isometric view with 8 directions, and the legs and torso face separately (GDD, Controls and camera), so the 2D look needs him from every angle. The voxel prototype (`games/metr0niks/prototypes/prototype.html`) builds the mech from 3D boxes that turn with the legs and the aim, so it already faces every way. This gap is only for the drawn 2D look.

## Facings

| Facing | Screen direction | Have it? |
| --- | --- | --- |
| Front | Down the screen, toward the camera | No (the turnaround has it) |
| Front 3/4 | Lower right, mirrored for lower left | Yes: every set and the parts sheet |
| Side | Right, mirrored for left | No (the turnaround has it) |
| Back 3/4 | Upper right, mirrored for upper left (walking away) | Yes, puppet only: `parts/sheet-back34.webp` (29 Oct) |
| Back | Up the screen, away from the camera | No (the turnaround has it) |

Five drawn facings give all eight, because the left-hand three are mirrors. On the cut-out puppet a mirror is safe: the arms are separate sprites, so the minigun stays on the right arm. On a baked frame-by-frame sheet a mirror swaps the weapons to the wrong arms, so that route needs all 8 facings for every move.

## Moves

| Move (GDD) | Puppet today | Frame-by-frame today |
| --- | --- | --- |
| Walk, 8 directions, backwards while aiming | IK walk, front 3/4 only | `sprites/run-iso/` (round 4), front 3/4 only |
| Turn, walk away from the camera | Walk on the back 3/4 parts (review page test, 29 Oct); the turn is a cut until front, side and back exist | Missing |
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

- **Puppet (recommended):** four more parts sheets drawn from the four-view turnaround (front, side, back 3/4 and back), about 4 credits each, so about 16 in total. The code then picks the parts by angle, and every move above works in every facing, including walking away while aiming back over the shoulder. The back 3/4 sheet is done (29 Oct, 4 credits); front, side and back would be about 12 more.
- **Frame-by-frame:** 8 facings for each of about 10 moves at 13 credits a sheet, over 1,000 credits, and it still can't aim apart from the legs. Keep it for the garage idle and the results cheer, which face one way.
