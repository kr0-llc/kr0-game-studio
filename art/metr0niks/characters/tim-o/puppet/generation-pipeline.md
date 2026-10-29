# Puppet generation pipeline: hero frame, then exploded sheet

Written 29 October 2026 after kr0's review of the Puppet Rigging Lab: "These puppets and how we generate them need serious improvement." The notes kr0 left on the rigs all point at the same cause, so this replaces the way parts were made. Status: piloted on Tim-o (v4 rig in the lab, 8 credits); proposed for the enemies.

## Why the old way failed

Parts sheets v2 / v2.1 / v3 asked the image model to draw each part separately, "as if the assembled mech were taken apart". Every run drifted on its own: the torso came back with no shoulder sockets, the two arms were drawn as different objects (kr0: "the right and left shoulders do not match"), the v3 arms were ball-and-tube assemblies that look nothing like the chunky arms on the turnaround, the elbow caps did not match each other ("the elbow joints don't really connect"), and each enemy body had nowhere for its legs to attach. Fitting pivots cannot fix art that was never one drawing.

## The pipeline

1. **Hero frame.** Draw the character ONCE, assembled, from the game camera (high three-quarter, facing right), in a rig-friendly rest pose: legs apart, arms away from the body, every limb visible, every joint drawn as a ball. References: the turnaround first, the character sheet second. 1024 × 1024, about 4 credits. This is the on-model check: if the hero frame is off, stop here and redo it, never the parts.
2. **Exploded sheet.** Edit the hero frame: "slide every piece straight away from the body along its limb, keep the drawing, size, angle and colours exactly, draw a sand ball cap on every limb end and a matching socket on every body side." 1536 × 1536, about 4 credits. Because every piece is a cut of the same drawing: one scale, one camera, matching left and right, sockets where the limbs were.
3. **Slice and seed.** `art/metr0niks/source/timo_exploded.py` labels the pieces, names them by where they sit on the sheet, finds the sand caps, and seeds every pivot (cap centre on the child) and joint (socket centre on the parent) plus the rest angle that turns each piece's bone axis horizontal (arms) or vertical (shins). It writes the atlas, the rig data and a marks image for review (`parts/exploded-<ver>-marks.png`).
4. **Measure.** `node tools/rig-harness/tests/run.js --rig timo4` renders rest, walk, aim and stress and reports cap exposure, gaps, draw order and proportions against the turnaround.
5. **Review.** kr0 corrects pivots and marks parts in the Puppet Rigging Lab (rig "Tim-o v4"); Claude applies the marks and, only for parts marked Redo, edits the exploded sheet with "keep every other piece exactly as it is".

## Pilot result (Tim-o v4, 29 October)

- Hero frame `parts/hero-v1.webp` (asset_4Me4ZE2qynHPE73AfAkMCV2Z): on-model against the turnaround, every joint visible. The model swapped the weapons (bunker on the near arm, minigun on the far arm); kept, the game swaps them in code.
- Exploded sheet `parts/exploded-v1.webp` (asset_47LbNCaxE5Brtae5Q8Jh3FRG): all ten pieces at the hero frame's scale, shoulder and hip sockets on the torso, knee sockets on the shins, a ball on every limb end. Sliced to `puppet/exploded-v1.{webp,js}` (`window.TIMO_RIG4`).
- Seeding found every cap except the torso's shaded socket rings, which are seeded by hand in the slicer (`TORSO_JOINTS`).
- Harness: elbows bend 0..85°, no tip inside the torso, walk and aim read as the reference (contact sheets in `tools/rig-harness/out/tests-timo4/`). Still failing: a crack at the front elbow in high aim (the sheet drew a ball on both sides of the elbow instead of a ball and a cup), the front thigh's knee ball peeks below the shin in deep bends, and the legs are a third longer than the turnaround's side view (the hero frame drew them long; `legLen .85` in the lab shrinks them, kr0 picks the final value).
- Credits: 8 (two runs). The whole previous route cost 16 over four runs and never matched.

## Next: the enemies, same pipeline

kr0's notes on the enemy rigs (29 October, lab `pivots` docs):

| Rig | kr0's note | Hero frame pose | Pieces on the exploded sheet |
| --- | --- | --- | --- |
| Gunner bot | "Fixed arm. Needs place to connect legs." | standing, gun arm forward, legs apart | torso with two hip sockets and one shoulder socket, gun arm (one piece, or upper + forearm if kr0 wants an elbow), thigh F/B, shin F/B |
| Loader | "The legs need left and right versions. There isn't a place to attach them really. This should walk like a crab." | side-on crab stance, four legs splayed, claw forward, mortar on top | hull with four leg sockets along the underside (two near, two far) and a claw socket, near leg, far leg (drawn as the far-side twin, not a mirror), claw |
| Boss | "The legs need a place to connect to under the body." | body raised on four legs, legs spread | body with four leg sockets under it (two near, two far), near leg, far leg |

About 8 credits per enemy (hero + exploded), 24 for the three. The crab and spider code in `prototype-ink.html` draws each leg sprite twice with a sideways nudge; with near and far leg parts those nudges go away and each leg hangs from its own socket (a code change in `crabOps` / `spiderOps`, lab first, then the game).

## Rules this adds to the rigging plan

- Never generate a part on its own. A new or redone part is an edit of the exploded sheet, with the hero frame as the first reference.
- The hero frame is the on-model gate. Compare it to the turnaround before spending credits on the sheet.
- Pivots are seeded from the caps, not typed in. A pivot typed by hand is a note for the next sheet edit, not a fix.
