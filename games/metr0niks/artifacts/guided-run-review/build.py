#!/usr/bin/env python3
"""Build the Tim-o guided run review page (https://claude.ai/artifact/V8jnzRVMJnCg9CKvp91cRu).

    python3 build.py WORKDIR OUT.html

WORKDIR holds the run outputs and sheet_frames.py results: out-sunburst.png,
out-gemini.png, f-sunburst/, f-gemini/, f-r4/ (frames + metrics.json),
guide.png, four-view.png and the workflow run sheet wf-run.png. Findings are
in findings.json beside this script. Publish with capabilities
{db: {}, user: {}, comments: {composer_only: true}}; kr0's marks are in db
collection `verdicts`, one document per set id.
"""
import base64
import io
import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "../../../.."))


def uri(im, h=None, q=82):
    im = im.copy()
    if h and im.height > h:
        im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "WEBP", quality=q)
    return "data:image/webp;base64," + base64.b64encode(b.getvalue()).decode()


def key(im, lo):
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            if m >= lo and max(r, g, b) - m < 18:
                px[x, y] = (r, g, b, 0)
    return im


SETS = [
    ("guided-sunburst", "Guided run · GPT Image 2.5 Sunburst", "out-sunburst.png", 4, 2, None, 0, "f-sunburst", 4,
     "job_XhfS2HRf4pxaKXWdADgw1gnh", "asset_y35Km3h5VjCbwQ5y4RjbvjKv"),
    ("guided-gemini", "Guided run · Gemini 3.1 Flash", "out-gemini.png", 4, 2, 200, 0, "f-gemini", 20,
     "job_2iyW5XGJBuG1yqhHVvkaw6tS", "asset_FKp7qn8dEkP72HbejDYM2yES"),
    ("run-iso-r4", "Baseline · run-iso round 4 (direct GPT Image 2, Oct 28)",
     os.path.join(REPO, "art/metr0niks/characters/tim-o/sprites/run-iso/sheet.webp"), 4, 3, 232, 8, "f-r4", 13,
     "job_VGqqTkUoHcHQGdX7Q8Frg9VM", "asset_kdh2N3yXxVt36jbjy1J7i6Lm"),
]


def main():
    work, out = sys.argv[1], sys.argv[2]
    p = lambda f: f if os.path.isabs(f) else os.path.join(work, f)
    sets = []
    for sid, label, sheet, c, r, lo, inset, fdir, cu, job, asset in SETS:
        m = json.load(open(p(f"{fdir}/metrics.json")))
        S = Image.open(p(sheet))
        S = key(S, lo) if lo else S.convert("RGBA")
        cw, ch = S.width // c, S.height // r
        raw = [S.crop((i % c * cw + inset, i // c * ch + inset, i % c * cw + cw - inset, i // c * ch + ch - inset))
               for i in range(c * r)]
        fr = [Image.open(p(f"{fdir}/frame-{i + 1:02d}.png")) for i in range(c * r)]
        sets.append(dict(id=sid, label=label, cu=cu, job=job, asset=asset,
                         metrics={k: v for k, v in m.items() if k != "rows"},
                         heights=[x["height"] for x in m["rows"]],
                         aligned=[uri(f, 320) for f in fr], raw=[uri(x, 320) for x in raw],
                         sheet=uri(Image.open(p(sheet)).convert("RGB"), 520, 78)))
    refs = dict(turnaround=uri(Image.open(p("four-view.png")).convert("RGB"), 360),
                guide=uri(Image.open(p("guide.png")).convert("RGB"), 520),
                wf_run=uri(Image.open(p("wf-run.png")).convert("RGB"), 360))
    data = json.dumps(dict(sets=sets, refs=refs)).replace("</", "<\\/")
    findings = open(os.path.join(HERE, "findings.json")).read().replace("</", "<\\/")
    page = open(os.path.join(HERE, "template.html")).read()
    open(out, "w").write(page.replace("__DATA__", data).replace("__FINDINGS__", findings))


if __name__ == "__main__":
    main()
