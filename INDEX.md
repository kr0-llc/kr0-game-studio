# Studio index

Imported 2026-10-21 from files kr0 downloaded and uploaded (the claude.ai links live in another organization and can't be read from this project). Reorganized 2026-10-23 into `games/`, `art/` and `studio/`. On 2026-10-26 every game folder gained `research/`, `decisions/`, `simulations/`, `prototypes/`, `feedback/synthetic/`, `feedback/human/` and `artifacts/` (see `studio/README.md`); empty ones hold a `.gitkeep`. The same day, prototypes moved to `prototypes/`, `sim.js` to `simulations/`, the Metr0niks handoff prompt to `artifacts/` and the Metr0niks reviews to `feedback/synthetic/`. Paths are relative to the studio root (`/mnt/project-files/`).

## Dual Tech
A short JRPG where every attack ends in a timing hit, and each hero's hit feels different.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| Pitch (tab of the Dual Tech GDD doc, 3 pages) | `games/dual-tech/pitch.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| GDD (tab, 13 pages, with concept art) | `games/dual-tech/gdd.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| TDD (tab, 4 pages) | `games/dual-tech/tdd.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| Open questions (tab, 2 pages) | `games/dual-tech/open-questions.pdf` | https://claude.ai/artifact/WKgFyuThdjSNVyiPKTNBTQ | Imported (PDF export) |
| Playable prototype: Golem Fight | `games/dual-tech/prototypes/prototype-golem-fight.html` | https://claude.ai/artifact/9WAVtVwq9AzWUXC2852yDx | Imported |
| Early pitch page (SUPERSEDED by the Pitch tab) | `games/dual-tech/superseded/early-pitch-page.html` | https://claude.ai/artifact/CeFhzMDWCksHCHQbKoHs2k | Imported |

## Metr0niks (formerly Scrap-Breaker)
An isometric voxel mech brawler: real-time driving and shooting, heavy weapons on an ATB timing hit, and scrap salvage with extraction.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| Pitch and firing-range prototype (with 3 concept art images) | `games/metr0niks/prototypes/pitch-and-firing-range/index.html` (+ `art/`) | https://claude.ai/artifact/TgLkPWgZdjqbAj7vNQXHdb | Imported (from zip) |
| GDD (gallery title "Scrap-Breaker GDD"; the artifact is the Oct 20 version) | `games/metr0niks/gdd.md` (Oct 26 update; Oct 20 version in `games/metr0niks/superseded/gdd-2026-10-20.md`) | https://claude.ai/artifact/XBYfrT2AvabsFNsYTJudsq | Rewritten Oct 25, 2026: Excursion only, no TBDs, matches the prototype plus kr0's decisions. Oct 26: weapon upgrades, pillars, audio, victory, co-op revive, seed, corrections against the prototype (GDD-D23 to D28); a few values Proposed; earlier Oct 26 draft in `superseded/gdd-2026-10-26-draft.md` |
| TDD (gallery title "Scrap-Breaker TDD"; the artifact is the Oct 20 version) | `games/metr0niks/tdd.md` (Oct 26 update; Oct 20 version in `games/metr0niks/superseded/tdd-2026-10-20.md`) | https://claude.ai/artifact/XbGJLgDdqYtnVLmsZyrnge | Updated Oct 25, 2026; waiting on kr0 |
| GDD decision history | `games/metr0niks/gdd-decisions.md` | none | New (Oct 25, 2026); GDD-D23 to D29 added Oct 26; D17, D18, D20, D22 and D23 accepted; revive price, victory button, seed limit and repair order Proposed |
| Prototype changes (what the prototype must change to match the GDD and TDD) | `games/metr0niks/prototypes/prototype-changes.md` | none | New (Oct 25, 2026); sections 10 to 16 added Oct 26; sections 1 (Gauntlet), 4 (drop-in lock) and 7 (touch removal) confirmed by kr0 Oct 26; nothing done yet |
| Handoff prompt for the next agent: push the branch, open the pull request, finish the GDD | `games/metr0niks/artifacts/handoff-gdd-prompt.md` (Oct 25 version in `games/metr0niks/superseded/handoff-gdd-prompt-2026-10-25.md`) | none | Rewritten Oct 26, 2026 for an agent that can push. Its first job (push the branch, open the pull request) is done: the work arrived as a git bundle and is in the repo, so the private sync artifact (https://claude.ai/artifact/Ti35254yyvzkEC8L7VeyUv) is retired and kept, not deleted. Sections 2 to 4 still apply |
| GDD critique (gdd-designer skill, critique mode) | `games/metr0niks/feedback/synthetic/2026-10-26-gdd-critique.md` | none | New (Oct 26, 2026); fixes waiting on kr0 |
| Mech-game design research (principles, mechanics, pitfalls, audio, sources) | `games/metr0niks/research/mech-games-2026-10-26.md` | none | New (Oct 26, 2026); suggestions, not decisions |
| TDD decision history | `games/metr0niks/tdd-decisions.md` | none | New (Oct 25, 2026); all Proposed |
| Tuning history (Simulation section and prototype baseline) | `games/metr0niks/tuning-history.md` | none | New (Oct 25, 2026); weapon-upgrade sweep planned Oct 26; no changes logged yet |
| Headless game simulation (loaded by the prototype, also runs in Node) | `games/metr0niks/simulations/sim.js` | none | The prototypes load it from `../simulations/sim.js` |
| Open questions (gallery title "Scrap-Breaker open questions") | `games/metr0niks/open-questions.md` | https://claude.ai/artifact/MUiquZomvsgbswqEjYxt4v | Imported |
| Playable prototype (drive, shoot, patrol bots, small Overpass Sector 4 map) | `games/metr0niks/prototypes/prototype.html` | https://storage.googleapis.com/kr0-game-studio-site/play/metr0niks/index.html | New (Oct 21, 2026); source of truth is studio-site/static/play/metr0niks/index.html in kr0/blackletter-chronos |
| Ink prototype: art style C as 2D cut-out puppets, three enemy types, collapsing buildings, Scenario music and sound effects (loads `simulations/sim.js` and `art/metr0niks/ink-proto/`) | `games/metr0niks/prototypes/prototype-ink.html` | https://claude.ai/artifact/79WTMgYErJNqwFX5NsL64f | New (Oct 26, 2026); exploration, GDD-D30 Proposed |
| Ink prototype brief: how the art is made, the audio made so far, what the full game still needs, decisions for kr0 | `games/metr0niks/prototypes/ink-prototype.md` | none | New (Oct 26, 2026) |
| GDD review (six-reviewer board, method from GixGosu/gdd-review-kit): one file per reviewer, plus `SYNTHESIS.md` (round 3) and `prototype-reconciliation.md` | `games/metr0niks/feedback/synthetic/gdd-review-2026-10-25/` (moved from `reviews/` on Oct 26, 2026) | none | Review done (Oct 25, 2026): rounds 1–3; GDD changes waiting on kr0 |

## Dropfront (formerly Basin Command)
A capture-point battle you run with a hand of cards, then drop in yourself for short firefights.

| Document | File | Source link | Status |
| --- | --- | --- | --- |
| GDD (tab of the doc titled "Basin Command GDD", 9 pages) | `games/dropfront/gdd.pdf` (also `games/dropfront/gdd.md`) | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF keeps the core loop diagram; Markdown is the same text) |
| Pitch (tab, 2 pages) | `games/dropfront/pitch.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| TDD (tab, 5 pages) | `games/dropfront/tdd.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| Open questions (tab, 1 page, all 13 settled) | `games/dropfront/open-questions.pdf` | https://claude.ai/artifact/4sbxMoBmieuv5APbj5Gb4R | Imported (PDF export) |
| Playable prototype ("Dropfront Prototype"; simulation-tested only) | `games/dropfront/prototypes/prototype.html` | https://claude.ai/artifact/UZXJnMj6NDnuH5UEUUS5sP | Imported |
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
| Playable prototype (one battle vs Sebastion, Snappy pace) | `games/blackletter/prototypes/prototype.html` (also live at the studio site, `play/blackletter/index.html`) | Current |
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
| Design workflows: Scenario character sheet, turnaround and action-sprite workflows; Scenario MCP and skills; gemini-creative plugin | `studio/design-workflows.md` |
| Asset management: kr0 Studio Art Drive folder for masters, repo previews and manifest, provenance record | `studio/asset-management.md` |
| MCP servers and plugins for Claude Code sessions on this repo (Scenario MCP; gemini-creative plugin) | `.mcp.json`, `.claude/settings.json` |
| GDD designer skill | `studio/skills/gdd-designer/SKILL.md` |
| Draft project instructions (awaiting kr0's approval) | `studio/project-instructions-draft.md` |

## Art (by game)

| Game | Folder | What's there |
| --- | --- | --- |
| Blackletter | `art/blackletter/` | Cards, illustrations, battle sprites, brand masks, concept art, screenshots (see `README.md`) |
| Dual Tech | `art/dual-tech/` | Art board (`board/index.html`), three styles (`prototype/`, `pitch/`, `glass/`), `prompts/`, Python drawing kits in `source/` |
| Metr0niks | `art/metr0niks/` | Art board (`board/index.html`), styles (`prototype/`, `pitch/`, `ink/`), prototype `themes/`, `prompts/`, zone-unlock and ink-prototype `screenshots/`; ink prototype sheets, sprite atlas and audio in `ink-proto/`, atlas builder and Scenario script in `source/`; Tim-o reference mech (sheet, turnaround, cutaway poster, cut-out, garage mock-up) from kr0's Scenario "metr0niks" collection in `characters/tim-o/` (added Oct 26, 2026) |
| Dropfront | none yet | The core loop diagram lives in `games/dropfront/gdd.pdf` |

## Tools (shared by every game)

| Tool | Folder | Status |
| --- | --- | --- |
| What belongs in `tools/` | `tools/README.md` | Current |
| `chronos-sim`: simulation and tuning platform for every game | `tools/chronos-sim/` | Not built yet |
| chronos-sim project plan | `tools/chronos-sim/project-plan.md` | Draft, awaiting kr0's review |
| `asset-desk`: local app to grade, tag and trace the provenance of studio art (Drive folder, repo art, Scenario library) | `tools/asset-desk/` | Version 0.1, awaiting kr0's review |
| asset-desk feature list | `tools/asset-desk/FEATURES.md` | Draft, awaiting kr0's review |

## Site

kr0's game portfolio site: the source and deploy scripts are in `site/` (deploy from `site/gcp/`). `site/ways-of-working.md` is the published copy; edit `studio/ways-of-working.md` and copy it over.

## Notes
- Markdown exports drop embedded diagrams and images; they show as `[embedded content: …]` or `[image: …]` placeholders (Dropfront core loop, Metr0niks core loop and architecture, Blackletter pitch images, core loop and architecture).
- Dual Tech and Dropfront tabs are PDF exports; the GDD PDF includes its concept art. Run `pdftotext` to get plain text.
- Blackletter has the full seven-document set plus a prototype. For the other games, tuning history and GDD/TDD decision history are not separate files yet; the Dropfront GDD has a changelog. Metr0niks now has the full seven-document set apart from a standalone pitch document (the pitch is `pitch-and-firing-range/index.html`).
