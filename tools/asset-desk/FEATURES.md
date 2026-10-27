# kr0 Asset Desk: feature list

Last updated: 27 October 2026 · Owner: tools-programmer, for kr0's review

A brainstorm of what a lightweight file explorer and asset grading app for the studio could do. **Built** items are in the first version (0.1). The rest are proposals, roughly in the order they'd pay off as the studio grows. kr0 picks what comes next.

## Grading

| Feature | Status |
| --- | --- |
| Thumbs up or down on any asset, one key each (`U`, `D`, `0` to clear), auto-advance to the next | Built |
| "To grade" queue as the default view, with a graded count | Built |
| Multi-select (`X`, shift-click) and bulk grade | Built |
| Grade history per asset (who, when, what changed) in an append-only log | Built |
| Push grade and tags back to Scenario as tags (`kr0-up`, `kr0-down`), on request per asset | Built, not yet tried against the live API |
| Side-by-side compare of two or four takes, pick a winner | Proposed |
| Reason codes on a thumbs down (off-model, wrong style, artefacts, wrong angle, background) so rejects teach the prompts | Proposed |
| Grade per use (good for the GDD, not for the game) rather than one grade | Proposed |
| Second reviewer and agreement view, once the studio has more than one person | Proposed |

## Tags

| Feature | Status |
| --- | --- |
| Free tags, normalised to lowercase-with-hyphens, autocomplete from every tag already used | Built |
| Suggested tags with one-key accept (`1` to `9`), ranked from: Scenario's own tags, the game, folder and file names, tags often used together, tags on nearby assets (same folder or same Scenario parent), recurring words in Scenario's auto-captions | Built |
| Tag cloud filter, bulk add tag | Built |
| Controlled vocabulary per game (characters, zones, states like `idle`, `run`), with synonyms merged | Proposed |
| AI tagging from the picture itself (Gemini or Scenario's captioning), offered as suggestions, never applied silently | Proposed |
| Rename or merge a tag everywhere | Proposed |
| Saved views ("Metr0niks Tim-o sprites, 👍, not in repo") | Proposed |

## Provenance

| Feature | Status |
| --- | --- |
| Origin: synthetic, human, hybrid or unknown, plus creator, tool, model, workflow, job, parent assets, prompt, source URL, created date, cost, licence, notes | Built |
| Filled in automatically from Scenario (model, job, parents, prompt text, author as person or API key) and from the file (PNG generator text, C2PA Content Credentials signer) | Built |
| Fields a person edits are marked and never overwritten by a later sync | Built |
| Bulk set origin (for example, a folder of commissioned human art) | Built |
| Lineage view: walk an asset's parents and children across Scenario and Drive | Proposed |
| Match a Drive file to its Scenario original by checksum or perceptual hash, so a downloaded copy inherits provenance | Proposed |
| Licence and release check before anything goes on the public site: every published asset needs a known origin and licence | Proposed |
| Write C2PA or XMP provenance into exported files | Proposed |
| Credits list per game generated from human-origin assets | Proposed |

## Explorer

| Feature | Status |
| --- | --- |
| One grid over the Drive folder, the repo's `art/` and the Scenario library, with a folder tree and counts | Built |
| Filters: grade, source, origin, game, folder, tag, free-text search over names, captions, prompts and notes | Built |
| Preview images, video and audio; keyboard navigation | Built |
| Export a manifest (JSON) of what's shown, for the repo | Built |
| Duplicate finder (same checksum or near-identical image) | Proposed |
| "Promote" an approved asset: copy it into the right `art/<game>/` folder in Drive and add it to the manifest | Proposed |
| Sprite sheet and frame-sequence viewer that plays frames as a loop | Proposed |
| Watch the Drive folder and pick up new files without a rescan | Proposed |
| Cost dashboard: Scenario credits spent per game, per character, per approved asset | Proposed |

## Scaling the studio

| Feature | Status |
| --- | --- |
| Catalog stored as plain JSON and JSONL in the Drive folder, so it syncs, has version history, and agents can read it | Built |
| Local-only server (127.0.0.1, refuses other hosts and cross-site requests) | Built |
| Agent hand-off: cloud sessions read the catalog through the Drive connector to find approved art by tag | Proposed |
| Several Scenario projects and teams | Proposed |
| Move the catalog to SQLite when it passes about 20,000 assets | Proposed |
| Hosted version with sign-in, if other people join the studio | Proposed (needs kr0's go-ahead before deploying) |
