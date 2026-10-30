# Tim-o puppet rigging plan

Written 29 October 2026 for kr0's ask: "iterate on the puppet for Tim-o; it should be like the reference image, the arms should line up in sockets, elbows etc.; use best practices for puppet rigging; suggest a plan." Status: proposed. kr0 owns every decision; the rounds below only move when kr0 says so. Round 1 ran on 29 October (findings: `games/metr0niks/feedback/synthetic/2026-10-29-tim-o-puppet-rig-review.md`); round 2's Claude half is applied. On 29 October kr0 reviewed the lab ("These puppets and how we generate them need serious improvement") and the plan changed: parts are now made by the hero-frame + exploded-sheet pipeline in `generation-pipeline.md`, piloted as the Tim-o v4 rig; rounds 3 to 5 below run on that pipeline.

## The goal

A cut-out puppet of Tim-o that reads as the four-view turnaround (`../turnaround/four-view.png`, kr0's main reference): heavy round torso, shoulder pads on ball joints, arms with a visible elbow, chunky legs with knee plates, the big reactor pack. Every joint sits in its socket in every pose the game uses (walk, aim sweep, dash, pile-bunker, jump-jets, overheat, destroyed), with no gap and no floating cap.

## Best practices we follow

1. **One camera, one scale.** Every part is drawn from the game's camera (high three-quarter, facing right) at one scale, on one sheet or on sheets that reference the first one. A part made later is checked against the first sheet's size before it is sliced (the v3 arms came back 1.5× and were scaled down at slice time).
2. **Ball-and-socket at every joint, drawn into the art.** The child part ends in a plain round cap; the parent has a round socket. The pivot is the centre of the cap circle, and the parent's joint is the centre of the socket. Pivots never sit on the edge of a part.
3. **The later-drawn part owns the joint.** Draw order decides which cap shows: shin over thigh (the knee plate covers the thigh's knee ball), forearm under upper arm (the elbow socket covers the forearm's cap), arms over torso at the near shoulder, under it at the far shoulder. The cap of the part underneath is at least one cap radius inside the part on top, so a bend never opens a gap.
4. **Rest angles live in the data, not the art.** A part drawn slightly tilted gets a `rot` so its bone axis is horizontal or vertical in rig space; the animation code never compensates for art.
5. **Bone lengths come from the marks.** Thigh length is pivot to knee joint, shin length is pivot to sole, upper arm is shoulder to elbow. The IK and the aim use those, so moving a mark moves the rig consistently.
6. **Clamp what a flat cut-out cannot do.** Arms aim within about −46° to +54°; past that a side-view arm reads as detached. Elbow bend stays within 0 to 1.5 rad. Legs never fully straighten (0.999 of reach).
7. **Measure, don't eyeball.** `tools/rig-harness/render.js` renders every mode headlessly and reports, per joint, cap exposure (how much of a cap touches nothing) and socket gap (distance from a joint to its child's art). A rig passes when every cap exposure is under 0.05 and every gap is 0 in every frame.
8. **One drawing, then take it apart.** Parts are never generated on their own: draw the character once in the game camera (the hero frame, the on-model gate), then edit it into an exploded sheet with caps and sockets, then slice and seed the pivots from the caps (`generation-pipeline.md`). A redo is an edit of that sheet with "keep every other piece exactly as it is", about 4 credits.
9. **Review every round** in the Puppet Rigging Lab (studio rule, design-workflows "Animation review"): kr0's pivots and Keep/Fix/Redo marks per part are read back before the next round.

## Rounds

| Round | What | Who | Done when |
| --- | --- | --- | --- |
| 1 (done) | Animation expert reads each part's art and the reference, proposes pivot, joint, rot and draw-order fixes for Tim-o v3 and a rest pose that matches the turnaround's stance. Visual tester renders original vs proposal in every mode, reports cap exposure, gaps, and proportions against the turnaround (arm length / torso height, leg length / torso height, pack height above the shoulder). Two passes between them. | Claude agents | Harness passes rest, walk, aim; stress faults listed with cause |
| 2 (Claude half done) | Apply the agreed marks to `arms-v3.js`, `rig-v2-1.js`, `timo_v21.js`; republish the lab with the iterated rig opened first and the round-1 findings on the page. kr0 corrects pivots and marks parts. | Claude, then kr0 | kr0's marks saved |
| 2b (done 29 Oct) | kr0's marks read back: shoulders don't match, elbows don't connect, torso needs sockets, enemies have nowhere to attach legs. New pipeline: hero frame, then exploded sheet (`generation-pipeline.md`), piloted on Tim-o as rig v4 in the lab. | Claude | kr0 reviews v4 |
| 3 | Redo parts kr0 marks on v4 as edits of the exploded sheet (hero frame as reference, "keep every other piece exactly as it is"), re-slice, re-seed, re-run the harness and the lab. Then the three enemies through the same pipeline (about 8 credits each). | Claude after kr0 | All parts Keep or Fix |
| 4 | Wire the elbow rig into `prototype-ink.html` and `puppet-moves.js`: two-bone arms, elbow bend keyed per move (dash tucks, bunker extends, vent droops). Review page per the studio rule. | Claude after kr0 | Review page marks Keep |
| 5 | Back-view parts sheet (walking away from camera), same pipeline. | Claude after kr0 | Coverage table in `../animation-coverage.md` complete |

## Costs

Round 1 and 2: no credits. Round 2b: 8 credits (Tim-o hero frame + exploded sheet). Round 3: about 4 credits per sheet edit, about 8 per enemy. Round 5: about 8 credits for a back-view hero frame and sheet.

## Open for kr0

- The turnaround shows hands; the parts sheets show the minigun and pile-bunker (the GDD starter loadout). The plan keeps the weapons as the forearm and treats hands as a later weapon-swap part.
- Whether the elbow should bend in the game's walk (plan: yes, a small swing) or stay fixed and only bend for set moves.
