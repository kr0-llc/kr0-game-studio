# Studio index

Imported 2026-10-21 from files kr0 downloaded and uploaded (the claude.ai links live in another organization and can't be read from this project). Reorganized 2026-10-23 into `games/`, `art/` and `studio/`. Paths are relative to the studio root (`/mnt/project-files/`).

## Dual Tech
A short JRPG where every attack ends in a timing hit, and each hero's hit feels different.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| Pitch (tab of the Dual Tech GDD doc, 3 pages) | `games/dual-tech/pitch.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| GDD (tab, 13 pages, with concept art) | `games/dual-tech/gdd.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| TDD (tab, 4 pages) | `games/dual-tech/tdd.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| Open questions (tab, 2 pages) | `games/dual-tech/open-questions.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| Playable prototype: Golem Fight | `games/dual-tech/prototype-golem-fight.html` | https://claude.ai/artifact/9WAVtVwq9AzWUXC2852yDx | Imported |
| Early pitch page (SUPERSEDED by the Pitch tab) | `games/dual-tech/superseded/early-pitch-page.html` | https://claude.ai/artifact/CeFhzMDWCksHCHQbKoHs2k | Imported |

## Metr0niks (formerly Scrap-Breaker)
An isometric voxel mech brawler: real-time driving and shooting, heavy weapons on an ATB timing hit, and scrap salvage with extraction.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| Pitch and firing-range prototype (with 3 concept art images) | `games/metr0niks/pitch-and-firing-range/index.html` (+ `art/`) | https://claude.ai/artifact/TgLkPWgZdjqbAj7vNQXHdb | Imported (from zip) |
| GDD (gallery title "Scrap-Breaker GDD") | `games/metr0niks/gdd.md` | https://claude.ai/artifact/XBYfrT2AvabsFNsYTJudsq | Imported |
| TDD (gallery title "Scrap-Breaker TDD") | `games/metr0niks/tdd.md` | https://claude.ai/artifact/XbGJLgDdqYtnVLmsZyrnge | Imported |
| Headless game simulation (loaded by the prototype, also runs in Node) | `games/metr0niks/sim.js` | none | Keep next to `prototype.html` |
| Open questions (gallery title "Scrap-Breaker open questions") | `games/metr0niks/open-questions.md` | https://claude.ai/artifact/MUiquZomvsgbswqEjYxt4v | Imported |
| Playable prototype (drive, shoot, patrol bots, small Overpass Sector 4 map) | `games/metr0niks/prototype.html` | https://storage.googleapis.com/kr0-game-studio-site/play/metr0niks/index.html | New (Oct 21, 2026); source of truth is studio-site/static/play/metr0niks/index.html in kr0/blackletter-chronos |
| GDD review (six-reviewer board, method from GixGosu/gdd-review-kit): one file per reviewer, plus `SYNTHESIS.md` after round 3 | `games/metr0niks/reviews/` | none | In progress (Oct 25, 2026): rounds 1 and 2 done |

## Dropfront (formerly Basin Command)
A capture-point battle you run with a hand of cards, then drop in yourself for short firefights.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| GDD (tab of the doc titled "Basin Command GDD", 9 pages) | `games/dropfront/gdd.pdf` (also `games/dropfront/gdd.md`) | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF keeps the core loop diagram; Markdown is the same text) |
| Pitch (tab, 2 pages) | `games/dropfront/pitch.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| TDD (tab, 5 pages) | `games/dropfront/tdd.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| Open questions (tab, 1 page, all 13 settled) | `games/dropfront/open-questions.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| Playable prototype ("Dropfront Prototype"; simulation-tested only) | `games/dropfront/prototype.html` | https://claude.ai/artifact/UZXJnMj6NDnuH5UEUUS5sP | Imported |
| Early pitch and prototype "Basin Command" (SUPERSEDED) | `games/dropfront/superseded/basin-command-early-pitch-and-prototype.html` | https://claude.ai/artifact/VirxreyhLp1Y9NNcMqumXv | Imported |

## Blackletter: Chronos
A slow real-time tactics game on a hex battlefield: each unit acts when its ATB gauge fills, and armies win by holding ground until the enemy's Morale breaks. Rewritten 2026-10-21 in the studio's seven-document format from the experimental build's rules (tuning v2.14.6); the experimental project itself is not the product.

| Document | File | Status |
| --- | --- | --- |
| Pitch | `games/blackletter/pitch.md` | Current |
| GDD | `games/blackletter/gdd.md` | Current; changelog inside |
| TDD (agent roster, 44.1M-token budget, API constraints, semester scope) | `games/blackletter/tdd.md` | Current |
| Open questions | `games/blackletter/open-questions.md` | Current |
| Tuning history | `games/blackletter/tuning-history.md` | Current; baseline v2.14.6 plus planned stories |
| GDD decision history | `games/blackletter/gdd-decisions.md` | GDD-D1 to D9; Proposed until kr0 accepts |
| TDD decision history | `games/blackletter/tdd-decisions.md` | TDD-D1 to D6; Proposed until kr0 accepts |
| Playable prototype (one battle vs Sebastion, Snappy pace) | `games/blackletter/prototype.html` (also live at the studio site, `play/blackletter/index.html`) | Current |
| Concept art (key art, Sebastion, units, wager table) and card art | `art/blackletter/concept/`, `art/blackletter/` (see `art/blackletter/README.md`) | Current |
| Screenshots of the experimental build and the prototype | `art/blackletter/screenshots/` | Current |
| Earlier exports and working files (GDD rev 11, pitch, TDD, GDD v2, critique) | `games/blackletter/superseded/` | Superseded |

Studio site page: https://storage.googleapis.com/kr0-game-studio-site/index.html#blackletter

**Canonical copy:** on 2026-10-23 kr0 picked these studio files over the old repo `kr0/blackletter-chronos`. The repo's 3.0.0 and 4.0.0 rules are being merged in here, and the repo is left as it is.

## Studio (rules for every game)

| Document | File |
| --- | --- |
| Studio guide: layout, how work runs, where things go | `studio/README.md` |
| Ways of working (crew, chain of command, phases, token budgets) | `studio/ways-of-working.md` |
| GDD template | `studio/gdd-template.md` |
| Simulation and tuning standard | `studio/simulation-and-tuning.md` |
| Brand rules (r0 styling) | `studio/brand.md` |
| Art style guides per game | `studio/art-style-guides.md` |
| GDD designer skill | `studio/skills/gdd-designer/SKILL.md` |
| Draft project instructions (awaiting kr0's approval) | `studio/project-instructions-draft.md` |

## Art (by game)

| Game | Folder | What's there |
| --- | --- | --- |
| Blackletter | `art/blackletter/` | Cards, illustrations, battle sprites, brand masks, concept art, screenshots (see `README.md`) |
| Dual Tech | `art/dual-tech/` | Art board (`board/index.html`), three styles (`prototype/`, `pitch/`, `glass/`), `prompts/`, Python drawing kits in `source/` |
| Metr0niks | `art/metr0niks/` | Art board (`board/index.html`), styles (`prototype/`, `pitch/`, `ink/`), prototype `themes/`, `prompts/`, zone-unlock `screenshots/` |
| Dropfront | none yet | The core loop diagram lives in `games/dropfront/gdd.pdf` |

## Tools (shared by every game)

| Tool | Folder | Status |
| --- | --- | --- |
| What belongs in `tools/` | `tools/README.md` | Current |
| `chronos-sim`: simulation and tuning platform for every game | `tools/chronos-sim/` | Not built yet |
| chronos-sim project plan | `tools/chronos-sim/project-plan.md` | Draft, awaiting kr0's review |

## Site

kr0's game portfolio site: the source and deploy scripts are in `site/` (deploy from `site/gcp/`). `site/ways-of-working.md` is the published copy; edit `studio/ways-of-working.md` and copy it over.

## Notes
- Markdown exports drop embedded diagrams and images; they show as `[embedded content: …]` or `[image: …]` placeholders (Dropfront core loop, Metr0niks core loop and architecture, Blackletter pitch images, core loop and architecture).
- Dual Tech and Dropfront tabs are PDF exports; the GDD PDF includes its concept art. Run `pdftotext` to get plain text.
- Blackletter has the full seven-document set plus a prototype. For the other games, tuning history and GDD/TDD decision history are not separate files yet; the Dropfront GDD has a changelog and the Metr0niks open questions has a decisions table.
