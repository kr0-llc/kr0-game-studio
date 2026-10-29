#!/usr/bin/env python3
"""Write the run record for a Scenario workflow or model job.

A run record is the text file every generated asset should have in
art/<game>/prompts/: what was typed, what the model actually received
(after any LLM rewrite), the hidden inputs fixed in the workflow graph,
every setting, every job and asset id, and the cost.

    python3 run_record.py job_xxx [job_yyy ...] --project proj_xxx \
        [--title "Tim-o run cycle, side view"] [--note "Used in PR #7"] \
        [--out art/metr0niks/prompts/tim-o-sprites-run-side.txt] [--jsonl runs.jsonl]

Auth: Scenario API key and secret in SCENARIO_API_KEY and SCENARIO_API_SECRET
(HTTP basic). In a studio cloud session the proxy adds the credentials, so the
variables can be left unset. Offline: --from-dir DIR reads job_<id>.json files
saved from GET /v1/jobs/<id> instead of calling the API.
"""
import argparse
import base64
import json
import os
import sys
import urllib.request

API = "https://api.cloud.scenario.com/v1"


class Client:
    def __init__(self, project, from_dir=None):
        self.project = project
        self.from_dir = from_dir
        key = os.environ.get("SCENARIO_API_KEY", "x")
        secret = os.environ.get("SCENARIO_API_SECRET", "x")
        self.auth = "Basic " + base64.b64encode(f"{key}:{secret}".encode()).decode()

    def get(self, path):
        url = f"{API}/{path}?projectId={self.project}"
        req = urllib.request.Request(url, headers={"Authorization": self.auth})
        with urllib.request.urlopen(req) as r:
            return json.load(r)

    def job(self, job_id):
        if self.from_dir:
            p = os.path.join(self.from_dir, f"{job_id}.json")
            if not os.path.exists(p):
                return None
            with open(p) as f:
                return json.load(f).get("job")
        try:
            return self.get(f"jobs/{job_id}").get("job")
        except Exception:
            return None  # Scenario drops sub-jobs that never started


def step_settings(inp, earlier):
    """Every model input except the long texts, which are printed separately.
    A value that is an earlier step's output is named by that step."""
    skip = {"prompt", "instruction", "textInputs", "modelId"}
    out = []
    for k, v in inp.items():
        if k in skip:
            continue
        src = next((n for n, a in earlier if a and (v == a or v == a[0] and len(a) == 1)), None)
        out.append(f"{k} = {src} output" if src else f"{k} {json.dumps(v)}")
    return ", ".join(out)


def build(client, job_id):
    job = client.job(job_id)
    if job is None:
        sys.exit(f"{job_id}: not found")
    m = job.get("metadata", {})
    rec = {
        "job": job["jobId"], "created": job["createdAt"], "status": job["status"],
        "workflow": m.get("workflowId"), "model": m.get("modelId") or m.get("input", {}).get("modelId"),
        "inputs": m.get("input", {}), "outputs": m.get("assetIds") or [],
        "error": m.get("error"), "steps": [], "hidden": [], "cu": 0,
    }
    flow = m.get("flow") or []
    if not flow:  # a direct model call: the job is the only step
        rec["steps"].append({"node": "model", "model": rec["model"], "job": job["jobId"],
                             "status": job["status"], "cu": job["billing"]["cuCost"],
                             "input": m.get("input", {}), "assets": rec["outputs"]})
        rec["cu"] = job["billing"]["cuCost"]
        return rec
    for s in flow:
        if s.get("type") == "transform":
            out = s.get("output")
            if isinstance(out, str) and out.startswith("asset_") and s["id"] not in rec["inputs"]:
                rec["hidden"].append({"node": s["id"], "asset": out})
            elif isinstance(out, str) and len(out) > 200:
                rec["hidden"].append({"node": s["id"], "text": out})
            continue
        step = {"node": s["id"], "model": s.get("modelId"), "job": s.get("jobId"),
                "status": s.get("status"), "assets": [a["assetId"] for a in s.get("assets", [])],
                "error": s.get("error")}
        sub = client.job(s["jobId"]) if s.get("jobId") else None
        if sub:
            step["cu"] = sub["billing"]["cuCost"]
            step["input"] = sub["metadata"].get("input", {})
            step["started"] = sub["createdAt"]
            rec["cu"] += step["cu"]
        rec["steps"].append(step)
    # The flow is stored unordered: list steps in the order they ran, unstarted ones last
    rec["steps"].sort(key=lambda s: s.get("started") or "~")
    return rec


def render(rec, title=None, note=None):
    lines = []
    if title:
        lines.append(title)
    where = f"workflow {rec['workflow']}" if rec["workflow"] else f"model {rec['model']}, direct call"
    lines.append(f"Tool: Scenario, {where}")
    lines.append(f"Run: {rec['job']}, {rec['created'][:16].replace('T', ' ')} UTC, {rec['status']}"
                 + (f" ({rec['error']})" if rec["error"] else ""))
    if rec["workflow"]:
        for k, v in rec["inputs"].items():
            if isinstance(v, str) and v.startswith("asset_"):
                lines.append(f"Input {k}: {v}")
            elif isinstance(v, list):
                lines.append(f"Input {k}: {', '.join(map(str, v))}")
        for h in rec["hidden"]:
            if "asset" in h:
                lines.append(f"Hidden input (fixed in the graph): {h['node']} {h['asset']}")
    lines.append(f"Cost: {rec['cu']:g} credits")
    lines.append("Steps, in the order they ran:")
    earlier = []
    for s in rec["steps"]:
        cu = f"{s['cu']:g} credits" if "cu" in s else "not billed"
        lines.append(f"  - {s['node']}: {s['model']}, {s['status']}, {cu}, job {s['job'] or 'none'}")
        if s.get("input"):
            lines.append(f"    settings: {step_settings(s['input'], earlier)}")
        if s["assets"]:
            lines.append(f"    outputs: {', '.join(s['assets'])}")
        earlier.append((s["node"], s["assets"]))
    if rec["outputs"]:
        lines.append(f"Final outputs: {', '.join(rec['outputs'])}")
    if note:
        lines.append(f"Status: {note}")
    for k, v in rec["inputs"].items():
        if isinstance(v, str) and not v.startswith("asset_"):
            lines += ["", f"Input {k} (as typed):", v]
    for s in rec["steps"]:
        inp = s.get("input") or {}
        if inp.get("textInputs") and not set(inp["textInputs"]) <= set(map(str, rec["inputs"].values())):
            lines += ["", f"{s['node']} text inputs:", *inp["textInputs"]]
        if inp.get("prompt"):
            lines += ["", f"Prompt {s['node']} received:", inp["prompt"]]
    for h in rec["hidden"]:
        if "text" in h:
            lines += ["", f"Hidden text (fixed in the graph, node {h['node']}):", h["text"]]
    return "\n".join(lines) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("jobs", nargs="+")
    ap.add_argument("--project", required=True)
    ap.add_argument("--title")
    ap.add_argument("--note")
    ap.add_argument("--out", help="text record path (default: stdout)")
    ap.add_argument("--jsonl", help="append one JSON row per job to this file")
    ap.add_argument("--no-hidden-text", action="store_true",
                    help="leave out long fixed texts (when they are kept in their own file)")
    ap.add_argument("--from-dir")
    a = ap.parse_args()
    client = Client(a.project, a.from_dir)
    recs = [build(client, j) for j in a.jobs]
    if a.no_hidden_text:
        for r in recs:
            r["hidden"] = [h for h in r["hidden"] if "text" not in h]
    text = "\n\n".join(render(r, a.title, a.note) for r in recs)
    if a.out:
        with open(a.out, "w") as f:
            f.write(text)
    else:
        sys.stdout.write(text)
    if a.jsonl:
        with open(a.jsonl, "a") as f:
            for r in recs:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
