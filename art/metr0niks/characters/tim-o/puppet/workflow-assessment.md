# Workflow assessment: from the reference image to a rigged puppet

Written 29 October 2026 for kr0's ask: "Step back and assess the workflow from reference image to these puppet parts, then another agent to rig the parts together and another to verify. Don't limit yourself to Scenario. Research how people do this with Scenario; otherwise generate yourself." Inputs: the research note `games/metr0niks/research/2026-10-29-puppet-rig-workflows.md`, the rigger's report `tools/rig-harness/proposals/rigger-v4.md`, the verifier's report `tools/rig-harness/proposals/verifier-v4.md`, and the Scenario catalog prices read today.

## The workflow as it stands, stage by stage

| Stage | Input → output | What it is today | Where it went wrong before | State after today |
| --- | --- | --- | --- | --- |
| 1 Reference | kr0's idea → character sheet + four-view turnaround | Scenario workflows (sheet, turnaround) | Fine; the turnaround is the agreed truth | Unchanged |
| 2 Hero frame | turnaround → the mech drawn ONCE in the game camera, rest pose, every joint a ball | GPT Image 2.5 on Scenario, 4 credits | Did not exist: parts were asked for one by one, so nothing matched (v2, v2.1, v3, v3.1: 16 credits, all rejected) | `parts/hero-v1.webp`; kr0: "looks good" |
| 3 Separation | hero frame → one transparent piece per part, with caps and sockets | Exploded-sheet edit, 4 credits | New today. Weakness found by the rigger: the edit does not keep one scale (torso .855 of the sheet, arms .85, pack .73, back leg .72–.78, front leg .64) and it drew a ball on both sides of the elbow and knee instead of a ball and a cup | Works, but must be measured, never trusted |
| 4 Slice + seed | sheet → atlas + pivots/joints from the sand caps | `timo_exploded.py` | Seeded joints were 11–56 hero px off because of the scale drift | Still the first pass |
| 5 Reassemble (new) | pieces + hero frame → each piece's true position and scale on the hero, joints derived from where the caps land, rest pose = hero frame | `timo_reassemble.py` (masked NCC per piece, parents first) | Did not exist; this is what the field does (`spine-animation-ai` SIFT re-placement, `rig-parts` recomposite) | Rest frame sits on the hero; knees meet at 0 px; the minigun arm hangs where the hero draws it |
| 6 Rig maths | rig data → poses (rest, walk, aim, stress) | Lab `bipedOps` (two-bone arms, IK legs), same maths as the game | One-piece arms, both legs sharing the front thigh's bone, the far arm aimed along the gun so it always ran behind the torso | Per-side leg lengths, rest aim/bend per arm from the hero, far arm follows the aim from its rest pose |
| 7 Verify | poses → numbers and pictures | `tools/rig-harness` battery (8 tests) + `overlay-hero.py` | Battery assumed caps hidden in sockets and one-piece legs; no check that rest = hero | Rest-vs-hero overlay and a ground-contact test added; the verifier caught feet following the body bob and a floating near foot, the rigger fixed both (round 2). v4 now passes 6 of 8; the two failing are slivers from the sheet's double balls and proportions against the turnaround |
| 8 Review | kr0 marks in the Puppet Rigging Lab | Lab rig "Tim-o v4" | Fine | Hero-frame underlay still to add |
| 9 Into the game | lab rig → `prototype-ink.html` | Not done | Game still draws v2.1 one-piece arms | Round 4 of the plan |

## What the research says

- Everyone credible draws the character once and takes it apart (Meta Animated Drawings, See-through / Bunraku / Textoon papers, Riggy, SpineFactory, `rig-parts`, `spine-animation-ai`, Scenario's own layer tools). Nobody generates parts one by one. Our stage 2 is right.
- They separate by **segmentation plus inpainting of the hidden bits**, not by asking the model to redraw the figure exploded. Scenario has this as first-party tools: `Image to Layers` and `Seedream 5.0 Flash Layerize`. Scenario has **no** cut-out, Spine or puppet rigging feature; its documented route is "neutral pose, remove background, rig by hand in Blender".
- Priced today for our hero frame: `Image to Layers` with 10 layers costs **160 credits** (FLUX.2 Klein fill) to **260 credits** (GPT Image 2 fill). The exploded-sheet edit costs 4. Not run.
- Gemini image models are the other candidate for the edit (up to 14 references) but no benchmark shows them keeping a character more faithfully than GPT Image, and they return no transparency. The Gemini API is attached to this session but its credential injection failed today (502 from the proxy), so a "generate it myself" A/B outside Scenario is not possible until that connector is fixed.

## Recommendation

Keep stages 1, 2, 5, 6 and 7 as they now are. Change stage 3 and 4 like this:

1. **Cut the parts from the hero frame itself, not from the sheet.** The reassembly already knows where each exploded piece sits on the hero and at what scale. Use that as a mask: each part's visible pixels come straight from the hero (pixel-exact, one scale, no redraw), and only the pixels the hero hides (a cap under a knee plate, the far shoulder behind the torso) are taken from the exploded piece. No credits; a day of script work in `timo_reassemble.py`. This is the segmentation-plus-fill route the field uses, with the exploded sheet as the fill instead of a 160-credit inpaint.
2. **Make the sheet edit ask for cups, not two balls.** One sentence change in the prompt ("the parent side gets a round socket cup, the child side gets the ball") for the next hero. Removes the knee and elbow cracks the verifier measured.
3. **Gate on reassembly, not on eyes.** A sheet whose piece scales differ from the torso's by more than 10% or whose rest-vs-hero error map shows uncovered hero pixels fails and is re-run before anyone looks at pivots. (`parts/reassembled-v1.png` and `rest-vs-hero.png` are the pictures.)
4. **Re-scope the battery for a rig that reproduces its hero**: a visible ball is not a fault when the hero draws it visible; the knee "gap" measured to the ring is zero when measured to the ball. Keep the slivers and the proportions tests strict.
5. **Hero underlay in the lab** so kr0 reviews the rest pose against the drawing it came from.
6. **Enemies** go through the same stages once kr0 approves this on Tim-o: hero frame first (kr0 gate), then the sheet, about 8 credits each.

## Open for kr0

- Legs: the hero frame draws the far foot 85 px lower than the near foot (perspective). The rig stands on the lower foot. Keep the hero's stance, or redraw the hero with both feet on one line (4 credits)?
- Weapons: the hero put the pile-bunker on the near arm. Keep (the game swaps in code) or redraw?
- Proportions: the hero's arms and pack are about a quarter larger than the turnaround's side view. Accept the hero as the model, or redraw it closer to the turnaround before the enemies follow the same path?
