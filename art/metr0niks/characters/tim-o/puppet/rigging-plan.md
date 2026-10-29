# Tim-o puppet rigging plan

Written 29 October 2026 for kr0's ask: "iterate on the puppet for Tim-o; it should be like the reference image, the arms should line up in sockets, elbows etc.; use best practices for puppet rigging; suggest a plan." Status: proposed. kr0 owns every decision; the rounds below only move when kr0 says so. Round 1 ran on 29 October (findings: `games/metr0niks/feedback/synthetic/2026-10-29-tim-o-puppet-rig-review.md`); round 2's Claude half is applied and waits on kr0.

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
8. **Fix pivots before regenerating art.** A part is regenerated only when no pivot or draw-order change can make it fit, or when the art itself is wrong (a flipped shoulder pad, a missing elbow). Regeneration uses an edit with the sheet as the first reference and "keep every other part exactly as it is", about 4 credits.
9. **Review every round** in the Puppet Rigging Lab (studio rule, design-workflows "Animation review"): kr0's pivots and Keep/Fix/Redo marks per part are read back before the next round.

## Rounds

| Round | What | Who | Done when |
| --- | --- | --- | --- |
| 1 (done) | Animation expert reads each part's art and the reference, proposes pivot, joint, rot and draw-order fixes for Tim-o v3 and a rest pose that matches the turnaround's stance. Visual tester renders original vs proposal in every mode, reports cap exposure, gaps, and proportions against the turnaround (arm length / torso height, leg length / torso height, pack height above the shoulder). Two passes between them. | Claude agents | Harness passes rest, walk, aim; stress faults listed with cause |
| 2 (Claude half done) | Apply the agreed marks to `arms-v3.js`, `rig-v2-1.js`, `timo_v21.js`; republish the lab with the iterated rig opened first and the round-1 findings on the page. kr0 corrects pivots and marks parts. | Claude, then kr0 | kr0's marks saved |
| 3 | Regenerate only the parts kr0 marked Redo (one edit per part, sheet v2.1 plus arms v3 as references), re-slice, re-run the harness and the lab. | Claude after kr0 | All parts Keep or Fix |
| 4 | Wire the elbow rig into `prototype-ink.html` and `puppet-moves.js`: two-bone arms, elbow bend keyed per move (dash tucks, bunker extends, vent droops). Review page per the studio rule. | Claude after kr0 | Review page marks Keep |
| 5 | Back-view parts sheet (walking away from camera), same pipeline. | Claude after kr0 | Coverage table in `../animation-coverage.md` complete |

## Costs

Round 1 and 2: no credits. Round 3: about 4 credits per regenerated part. Round 5: about 4 credits for the sheet plus edits.

## Open for kr0

- The turnaround shows hands; the parts sheets show the minigun and pile-bunker (the GDD starter loadout). The plan keeps the weapons as the forearm and treats hands as a later weapon-swap part.
- Whether the elbow should bend in the game's walk (plan: yes, a small swing) or stay fixed and only bend for set moves.
