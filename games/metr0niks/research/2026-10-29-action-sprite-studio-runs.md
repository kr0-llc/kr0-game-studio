# Action Sprite Studio: what the Tim-o runs were given, and how to run it better

Oct 29, 2026 · @kr0 asked for the inputs of the Action Sprite Studio runs to improve how the studio runs it · Research: suggestions, not decisions

kr0 asked on Oct 29 whether the prompts and settings passed to the Action Sprite Studio workflow were logged. They weren't: PR #7's `sprites/PROMPTS.md` says only "workflow View & Action text" for the three sets the workflow made. This paper recovers every input from Scenario's job records, says what they show, and proposes how to run animation workflows from now on.

## 1. What was recovered

The workflow (`wflow_hRqp6ojU7j6t1Az51W4XjaKd`) ran 18 times, all on Oct 26 between 17:30 and 19:47 UTC, all for Tim-o in side view. No other run exists in the project. Each run's record holds the typed input, the prompt the image model actually received, every step's settings, job ids, output asset ids and cost.

| File in `art/metr0niks/prompts/` | What it holds |
| --- | --- |
| `tim-o-sprites-run-side.txt`, `tim-o-sprites-jetpack-side.txt`, `tim-o-sprites-explode-side.txt` | The three runs that became PR #7's run, jetpack and explode sets (matched pixel for pixel to the sheets on the PR #7 branch) |
| `tim-o-sprites-workflow-runs-2026-10-26.txt` | All 18 runs: a summary table, then the full record of each |
| `tim-o-sprites-workflow-runs-2026-10-26.jsonl` | The same, one JSON row per run, for tools |
| `action-sprite-studio-brief-v1.txt`, `action-sprite-studio-brief-v2.txt` | The fixed animation brief inside the workflow, before and after the edit at 17:37 UTC on Oct 26 (v2 is what the workflow holds today) |

`tools/scenario-run-record/run_record.py` wrote them from the job ids, so any later run can be recorded the same way.

Cost: 180 credits. Nine runs succeeded at 16.5 each. Two drew a sheet and then failed at the video step (29 credits; the sheets exist as `asset_DCiAmt68uQhUtS5apuSjJT4W` win and `asset_9oAnzB1MbE4iLPbjMmo3S3N6` idle). Seven failed on the rate limit before drawing. Three of the 18 went into PR #7 (49.5 credits).

## 2. What the records show

**The image model never saw the action we wrote.** The workflow sends the View & Action text to an LLM step (Gemini 3.5 Flash Lite, thinking off) whose instruction is the fixed brief with four `****` blanks. The LLM's reply is the image prompt. In all 11 runs that reached the image model, the reply kept at most a short name for the action ("a jetpack rise action", "a mech destruction animation") and dropped everything else we typed: the frame-by-frame plan, the empty hands, "no ground", the jetpack tank on the back. In five runs it also dropped most of the brief, so the image model got a stub:

| Run | Typed (characters) | Image prompt the model received |
| --- | --- | --- |
| run (PR #7) | 312 | `side-view 2D platformer; run cycle loop; right` |
| dash | 288 | `side view 2D platformer` |
| idle, win (frame by frame), dash (frame by frame), explode (PR #7) | 247 to 607 | about 400 characters: the camera line, "Design a seamless loop for a <action>", and the right-hand weapon rule |
| jetpack (PR #7), explode, win | 331 to 355 | the full brief with the blanks filled, about 1,970 characters, still without our plan |

The longer, more careful frame-by-frame inputs of the second batch (runs 7 to 9) made no difference, because none of it got through.

**The brief describes a weapon strike, whatever the action.** Frames 1 to 4 anticipation, 5 to 7 "The Impact Strike", 8 to 10 follow-through, a weapon locked in one hand, and the feet pinned to one pixel. When the LLM did pass the brief on, it told the image model to draw a strike and keep the feet still, which fights a run cycle, a jetpack rise and an explosion. The fill-in rule filled the weapon hand with "right" even though Tim-o has no hand weapon in these sets. The v2 edit (empty hands when there is no weapon) reached the image model only twice, in the idle and win sheets that then lost their video to the rate limit, and the win prompt still read "it stays in the empty hand".

**A blank grid image is a hidden second reference.** The graph adds `asset_RveFaTyXuPAwQ62kwaU1QXzF`, a blank 4 × 3 grid, to every image call. It isn't shown as an input, and it is where the leaked grid lines and cell borders come from.

**Settings were all defaults.** GPT Image 2 at 1536 × 1024, quality `auto`, background `auto`; slicer 4 × 3; video MP4 at 6 fps. With `auto` the background varied: the stub-prompted dash came back on cream with a grass platform.

**The results match the fault.** Of the PR #7 sets, the jetpack faces left and the explosion is a slow crumble rather than the fireball we described; kr0 marked run Redo and jetpack Fix on Oct 28. The later isometric sets, drawn with a direct GPT Image 2 call and our own full prompt (`tim-o-sprites-*-iso.txt`), followed the frame plan.

**Three in parallel tripped the rate limit.** Scenario allows about one image generation every 13 minutes after a burst. Runs 10 to 18 were sent in threes and every one hit HTTP 429; retrying inside the window restarted it.

## 3. Recommendations

1. **Take the LLM out of the prompt path.** Build the image prompt with a text transform that joins a fixed header to the View & Action text word for word, as the direct calls do. This makes the run reproducible from its inputs, saves 0.5 credits a run, and puts our frame plan in front of the image model. If kr0 wants the LLM kept, give it the plan as a field it must copy unchanged, raise thinking, and record its output (the record tool already does).
2. **Make the motion logic an input, not a fixed strike.** Replace the anticipation-strike-follow-through block with a "Frame plan" input (12 numbered beats). Offer three starting plans in the field's help text: attack, locomotion cycle, one-shot (hit, death, celebration). Drop the pinned-feet rule for moves that leave the ground.
3. **Add the inputs the studio rules already require.** A second reference image (the turnaround goes first, per the Tim-o rule), a character height line ("one height per character"), and a loadout line. Today the workflow takes one image and one text.
4. **Show or drop the hidden grid.** Either describe the grid in the prompt only, or make it a visible, optional input so a run record lists it.
5. **Pin the settings.** Background opaque white (or transparent), quality medium for tests and high for keepers, and the game's frame rate on the video. No `auto`.
6. **Make the video step optional.** Two runs lost their video to the rate limit after the 13-credit sheet was already paid for. The sheet and frames are the product; the MP4 is a preview the review page already replaces.
7. **One run at a time.** Price with `dry_run`, start one run, wait for it, then start the next; after a 429, wait out the window it names before retrying.
8. **Rename the workflow.** Scenario lists it as "Action Sprite Studio (copy)".

Points 1 to 6 are edits to the workflow graph followed by `workflow_publish`. They change a tool every game uses, so they wait for kr0's go. Until then, the direct GPT Image 2 call with a full frame-by-frame prompt (the `*-iso.txt` files) is the more reliable route for frame-by-frame sets, and the cut-out puppet route stays the route for anything the player controls.

## 4. Proposed rule: a run record for every generation

**Adopted by kr0 on Oct 29, 2026** ("adopt as written"), widened to every model or API, not only Scenario: kr0 wants these calls kept so the studio can learn from them. The rule now lives under Run records in `studio/design-workflows.md`; the wording below is the original proposal.

> **Record every run.** Every Scenario run, whether a workflow or a direct model call, gets a run record in `art/<game>/prompts/<character>-<step>.txt`, committed with the art it made, rejected takes and failed runs included. Write it from the job id with `tools/scenario-run-record/run_record.py` rather than by hand, then add a title line and a Status line (what it was for, kr0's mark, what replaced it). The record holds:
>
> - the workflow or model id, the run's job id, the time and the result;
> - every input as typed, and every reference asset id in order;
> - inputs fixed inside the workflow graph (hidden images, brief text), or the file that holds them;
> - the prompt each model actually received, after any LLM step;
> - every step's settings, job id, output asset ids and cost.
>
> A batch of runs also gets one summary file with a row per run. A run with no record can't be reviewed, compared or repeated, so it doesn't go into a game.

This turns the existing row in the "Where the output goes" table into a rule and adds what was missing on Oct 26: the prompt after the LLM step, the hidden inputs, and the failed runs.
