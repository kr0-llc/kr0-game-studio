# Ink enemy animation review: first pass

28 October 2026 · Claude, synthetic · kr0's marks are kept separately (published lab, `verdicts` collection; a human record goes in `feedback/human/` once kr0 has marked)

What was reviewed: every animation and sprite part of the three enemies in `prototypes/prototype-ink.html`, drawn frame by frame in the review view of `prototypes/ink-enemy-lab.html#review`. All three are cut-out puppets posed in code from one Scenario parts sheet each; nothing is drawn frame by frame. "x" is wrong, "!" is worth a look.

## Across all three

- ! Drawn facing right only and mirrored, so there is no front or back view when walking up or down the screen (the same gap as Tim-o).
- ! Every landing squash scales the whole puppet, so feet slide outward instead of knees bending, and the dust is drawn in front of the feet.
- ! All three share one wreck: parts and bolts burst out and settle at any angle, so a leg can end standing on end.
- The rival palette (slate blue, coral, mustard) reads apart from Tim-o.

## Gunner bot (patrol bot role; `enemy_gunner.webp`)

- Walk: two-bone IK works (feet plant, knees bend, no skating). ! Both legs are the same sprite in one plane and overlap on frames 13 to 20; the gun arm doesn't sway.
- Aim: the arm clamp keeps it on the shoulder. ! The torso never turns, so a low aim pushes the gun into the legs.
- Fire: ! recoil lasts 0.08 s (one frame at 12 fps); the muzzle point sits above the barrels' centre line.
- Idle: ! a 1 px bob only. Hit: ! no flinch.
- Part `b_torso`: ! the big ring on its left reads as a face looking away from the gun; if it is the face, the torso is the wrong way round.

## Heavy loader (`enemy_brute.webp`)

- Walk: x no IK on the crab legs; they only rotate at the hip, so the feet slide and the back legs barely move.
- Tell: the "!" and raised claw read well. ! The claw snaps up in one frame; the ±2 px shake is hard to see.
- Charge and recover: ! both look almost like the walk (0.08 rad tilt, no lowered stance, no skid).
- Parts: ! two leg sockets carry four legs, so the legs bunch up; ! the hull's two mortar tubes (and the atlas's `mortar` point) are never used; the claw's jaws are one piece and can't open.

## Jumper boss (`enemy_scuttler.webp`)

- ! The sheet was made for the Scuttler (an 18 hp drone in the GDD) but is used for the 180 hp boss; one of the two will need new art when the Scuttler is built.
- Idle: x nothing moves; every frame is identical.
- Walk: x no IK, feet slide; the legs only rotate at the hip.
- Triple shot: ! the orbs come out of the body's centre; nothing on the sprite fires.
- Crouch and leap: the crouch reads (body drops, eye flickers). ! The legs never fold and splay the same amount through the whole leap.
- Parts: ! the side saw is never used; the legs have no knee; `j_leg2` is nearly a copy of `j_leg`.

## Suggested next steps (for kr0 to decide)

1. IK legs for the loader and jumper (code only, reusing the gunner's two-bone IK; needs a knee point, so a thigh and shin split of each leg sprite).
2. A new parts sheet per enemy with split leg segments, a working claw and a back 3/4 view, made with the turnaround-first approach used for Tim-o.
3. Decide whether the loader's mortars and the jumper's saw become attacks (GDD) or are painted out.
