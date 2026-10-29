# scenario-run-record

Last updated: 29 October 2026 · Owner: art-director

Writes the run record for a Scenario job: what was typed, every reference asset, the inputs fixed inside a workflow graph (hidden images, brief text), the prompt each model actually received after any LLM step, every step's settings, job ids, output asset ids and cost. Used by every game that generates art in Scenario. Why it exists: [Action Sprite Studio runs](../../games/metr0niks/research/2026-10-29-action-sprite-studio-runs.md).

## Run it

```
python3 tools/scenario-run-record/run_record.py job_xxx [job_yyy ...] \
    --project proj_T9sfQEQPZ2s4yoHgggBe1fAE \
    --title "Tim-o run cycle, side view" \
    --note "kr0 mark Redo on 2026-10-28" \
    --out art/metr0niks/prompts/tim-o-sprites-run-side.txt \
    --jsonl art/metr0niks/prompts/tim-o-sprites-runs.jsonl
```

- Works for workflow runs (it reads every step's sub-job) and for direct model calls.
- `--no-hidden-text` leaves a long fixed brief out of the record when it is kept in its own file.
- `--jsonl` appends one JSON row per job for tools.
- Python 3 standard library only.

## Credentials

Scenario API key and secret in `SCENARIO_API_KEY` and `SCENARIO_API_SECRET` (HTTP basic). In a studio cloud session the proxy adds them, so leave the variables unset. Never commit a key.

## Limits

Scenario drops sub-jobs that never started, so a run that failed early lists those steps as "not billed" with no settings. The record shows the settings each step was sent; a workflow's current graph may have changed since (`workflow_get` shows today's).
