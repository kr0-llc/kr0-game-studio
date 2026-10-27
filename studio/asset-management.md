# Asset management

Last updated: 27 October 2026 · Owner: technical-artist, approved by kr0

Art outgrows git. The repo reached about 90 MB of art in four days, and one character from the [design workflows](design-workflows.md) is about 60 MB of masters. So full-resolution art lives in Google Drive, and the repo keeps small previews plus a manifest that says where each master is and where it came from.

## Where art lives

| What | Where | Notes |
| --- | --- | --- |
| Raw generations and rejected takes | Scenario (team `team_pG6MaimfJd9b9PTLYKkYR7fQ`, project `proj_T9sfQEQPZ2s4yoHgggBe1fAE`) | Never copied out unless picked. |
| Full-resolution masters (picked art, human art, source files, audio masters, video) | Google Drive, **kr0 Studio Art** folder | On kr0's PC: `G:\My Drive\kr0 Studio Art\` (Drive for Desktop, cache on `F:\Drive`). Folder id `1iVORk00_AenkNM9nvlEOIwv2nkVG49L4`. |
| Previews, boards, prompts, manifests, and small files a prototype loads | Repo, `art/<game>/` | The repo stays light enough to clone in every session. |

### Drive layout

```
kr0 Studio Art/
  README.txt
  _inbox/                 new files waiting to be graded and filed
  _catalog/               grades, tags and provenance (written by the asset grading app)
    catalog.json          current state of every asset
    events.jsonl          append-only history of every grade, tag and provenance change
  blackletter/  dropfront/  dual-tech/  metr0niks/
    <same paths as art/<game>/ in the repo>, e.g. characters/<character>/sheet.png
    _retired/             art taken out of use (never deleted)
```

A master and its preview share a path: `kr0 Studio Art/metr0niks/characters/scrapper/sheet.png` in Drive, `art/metr0niks/characters/scrapper/sheet.jpg` in the repo.

## What goes in the repo

- **Previews:** JPG or WebP, at most 1600 px on the long edge, normally under 500 KB.
- **Runtime files a prototype loads** (sprites, atlases, audio), if each is under 1 MB. Bigger ones are masters.
- **Text:** prompts, boards, READMEs, `manifest.jsonl`.
- **Not in the repo:** any single file over 1 MB, raw Scenario outputs, rejected takes, PSD/Krita/Blender sources, video over 1 MB. These go to Drive.

Art already in the repo stays where it is. Git history is not rewritten. When a game next touches its art folder, its large files are copied to Drive and given manifest rows. A repo copy is only replaced by a preview after kr0 agrees, because the studio never deletes art.

## Provenance

Every master has a record, so we can always answer: where was this made, by whom or what, from what, and at what cost. The record format is shared by the Drive catalog and the repo manifest.

| Field | Meaning |
| --- | --- |
| `id` | `scn:<scenario asset id>` for Scenario assets, otherwise `file:<path relative to kr0 Studio Art, forward slashes>` |
| `game` | `blackletter`, `dropfront`, `dual-tech`, `metr0niks`, or `studio` |
| `origin` | `synthetic` (AI-generated), `human` (drawn or made by a person), `hybrid` (a person edited AI output, or AI edited a person's work), `unknown` |
| `creator` | The person, or the agent role (for example `art-director`) that made or picked it |
| `tool`, `model` | For example `Scenario` and `GPT Image 2.5 Sunburst`; `Krita` for hand work |
| `workflowId`, `jobId` | Scenario workflow and job, when there is one |
| `parentIds` | Ids of the assets it was made from (reference art, the sheet a turnaround came from) |
| `prompt` | The prompt or brief, or a path to `art/<game>/prompts/...` |
| `sourceUrl` | Where it came from, if outside the studio |
| `createdAt` | ISO 8601 time |
| `costCU` | Scenario credits spent |
| `license` | `studio-owned` for our own work; otherwise the licence and its holder |
| `c2pa` | `true` if the file carries a C2PA content-credentials manifest |
| `sha256` | Checksum of the master |
| `drivePath` | Path relative to `kr0 Studio Art` |
| `grade` | `up`, `down` or empty (not graded) |
| `tags` | Lowercase words with hyphens, reused from the catalog's existing tags where one fits |
| `notes` | Anything else |

Rules:

1. **No master without a record.** An asset with `origin: unknown` can't be shipped in a game or on the site until someone fills it in.
2. **Human and synthetic are never blurred.** If a person touched AI output, or the other way round, the origin is `hybrid`, and `notes` says what was done.
3. **Grades and tags change only through the catalog** (the asset grading app writes `events.jsonl`), so every change has a history.

## The repo manifest

Each game has `art/<game>/manifest.jsonl`: one JSON object per line, one line per asset that is graded `up` and used by the game. Each line is the record above plus `previewPath`, the preview's path in the repo. The asset grading app exports it from the catalog. Commit it on a branch like any other change.

## Moving new art in

1. New art lands in `kr0 Studio Art/_inbox/`, or stays in Scenario.
2. kr0 grades it in the asset grading app (thumbs up or down, tags, provenance).
3. Picked art is filed to `<game>/<path>` in Drive, and the app exports its manifest rows.
4. A web-size preview goes to `art/<game>/<path>` in the repo, with the manifest, on a branch with a pull request.

Agents in cloud sessions can't see `G:\`. They read the catalog and manifest, create small files through the Google Drive connector, and leave large masters in Scenario for kr0's machine to pull into Drive.
