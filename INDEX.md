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
| GDD (gallery title "Scrap-Breaker GDD"; the artifact is the Oct 20 version) | `games/metr0niks/gdd.md` (Oct 27 update; earlier versions in `games/metr0niks/superseded/`: `gdd-2026-10-20.md`, `gdd-2026-10-26.md`, `gdd-2026-10-27.md`) | https://claude.ai/artifact/XBYfrT2AvabsFNsYTJudsq | Rewritten Oct 25, 2026: Excursion only, matches the prototype plus kr0's decisions. Oct 26: weapon upgrades, pillars, audio, victory, co-op revive, seed, corrections against the prototype (GDD-D23 to D28); earlier Oct 26 draft in `superseded/gdd-2026-10-26-draft.md`. Oct 27: Oct 26 critique fixes (GDD-D33) and the co-op campaign block: the host owns it (GDD-D31). Oct 28: fun pass folded in (GDD-D35 to D50; kr0 answered round 1 the same day: combo, Overtime, contracts, conditions, enemies by zone, new seed per climb and match stats accepted, Redline became a shoulder item, Crossfire dropped; round 3: 5 levels, boss roster and the Warden, multi-kill text, host leaving ends the room; round 4: rerolls removed, income trimmed, polished to rules only with open items in `proposals.md`, GDD-D55); the Oct 27 version is `superseded/gdd-2026-10-27.md`. Three TBDs on kr0's instruction (audience, player fantasy, what makes it fun, GDD-D27); every number is a starting value for the sweep |
| TDD (gallery title "Scrap-Breaker TDD"; the artifact is the Oct 20 version) | `games/metr0niks/tdd.md` (Oct 28 update; earlier versions in `games/metr0niks/superseded/`: `tdd-2026-10-20.md`, `tdd-2026-10-26.md`, `tdd-2026-10-27.md`) | https://claude.ai/artifact/XbGJLgDdqYtnVLmsZyrnge | Updated Oct 26, 2026; Oct 27: Oct 26 critique fixes; Oct 28: fun pass architecture (TDD-D9 to D17), then rewritten to cover the whole GDD with four open questions; architecture choices Proposed (TDD decision history) |
| GDD decision history | `games/metr0niks/gdd-decisions.md` | none | New (Oct 25, 2026); GDD-D23 to D30 added Oct 26, GDD-D31 to D34 on Oct 27, GDD-D35 to D55 (fun pass) on Oct 28, D44 rejected; GDD-D57 (tuning pass 1) on Oct 29; D17, D18, D20, D22, D23, D29, D31, D32 and D33 accepted or applied; revive price, victory button, seed limit, repair order and the desert rock music trial (D34) Proposed |
| Prototype changes (what the prototype must change to match the GDD and TDD) | `games/metr0niks/prototypes/prototype-changes.md` | none | New (Oct 25, 2026); sections 10 to 16 added Oct 26; sections 1 (Gauntlet), 4 (drop-in lock) and 7 (touch removal) confirmed by kr0 Oct 26; sections 1 and 7 done Oct 27, the rest not done; section 18 (level design, done Oct 28); section 19 (fun pass) added Oct 28, approved by kr0, not built |
| Handoff prompt for the next agent: push the branch, open the pull request, finish the GDD | `games/metr0niks/artifacts/handoff-gdd-prompt.md` (Oct 25 version in `games/metr0niks/superseded/handoff-gdd-prompt-2026-10-25.md`) | none | Rewritten Oct 26, 2026 for an agent that can push. Its first job (push the branch, open the pull request) is done: the work arrived as a git bundle and is in the repo, so the private sync artifact (https://claude.ai/artifact/Ti35254yyvzkEC8L7VeyUv) is retired and kept, not deleted. Sections 2 to 4 still apply, except item 1 of section 4 (the critique fixes, done Oct 27) and the "prototype is unchanged" note (Gauntlet and touch were removed Oct 27) |
| Fun pass record: where the fun is thin, eleven proposals (GDD-D35 to D45) with pillar, cost and build order, a draft "what makes it fun" line | `games/metr0niks/decisions/2026-10-28-fun-pass.md` | none | New (Oct 28, 2026); round 2 records kr0's answers of Oct 28 |
| Fun pass implementation plan: ten phases from the headless runner to the sweep, with what each changes in sim.js and the prototype and how it's checked | `games/metr0niks/decisions/2026-10-28-fun-pass-implementation-plan.md` | none | New (Oct 28, 2026); kr0 approved the fun pass the same day; nothing built yet |
| Metr0niks proposals: ideas not adopted, open calls, dropped ideas | `games/metr0niks/proposals.md` | none | New (Oct 28, 2026, GDD-D55); rules awaiting sign-off were approved by kr0 the same day |
| Economy options: seven ways to keep scrap meaningful, from the games in research/, with a recommendation (call-in supplies plus rerolls) | `games/metr0niks/decisions/2026-10-28-economy-options.md` | none | New (Oct 28, 2026); kr0 chose call-ins and trimmed income (GDD-D54), then dropped rerolls and trimmed further (GDD-D55); options C, D, E and G kept in `proposals.md` |
| Fun pass critique (gdd-designer skill, critique mode, of GDD-D35 to D45) | `games/metr0niks/feedback/synthetic/2026-10-28-fun-pass-critique.md` | none | New (Oct 28, 2026); 4 critical, 10 important, 8 polish findings; applied Oct 28 after kr0's answers |
| GDD critique (gdd-designer skill, critique mode) | `games/metr0niks/feedback/synthetic/2026-10-26-gdd-critique.md` | none | New (Oct 26, 2026); corrections applied Oct 27 (GDD-D33); co-op campaign decided (GDD-D31); late-game, edge-case and polish items still open |
| Tim-o animation review: kr0's comments (Oct 28, 2026) | `games/metr0niks/feedback/human/2026-10-28-tim-o-animation-review.md` | https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8 | New (Oct 28, 2026): jetpack closest, idle/run/dash off-model, one height per character, puppet parts sheet rejected |
| Tim-o animation review (the six PR #7 sprite sets, frame by frame; puppet vs frame-by-frame dash) | `games/metr0niks/feedback/synthetic/2026-10-28-tim-o-animation-review.md` | https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8 | Rounds 2 to 4 done (Oct 28, 2026); waiting on kr0's marks |
| Tim-o animation coverage: every move and facing the game needs against what exists; walking away from the camera needs back-view parts (Oct 28, 2026) | `art/metr0niks/characters/tim-o/animation-coverage.md` | https://claude.ai/artifact/34bv3u8XC7SwX124pWuEC8 | New (Oct 28, 2026); waiting on kr0 for the back-view parts sheets |
| Tim-o item parts: 17 puppet parts for the garage items (arms, shoulder modules, cores, reactor packs, strider and tread legs) on parts sheet v2.1 (Oct 28, 2026) | `art/metr0niks/characters/tim-o/items/` (prompts: `art/metr0niks/prompts/tim-o-items-v1.txt`) | https://claude.ai/artifact/4GQ6VMSMCErCZNDhBn6uN5 | New (Oct 28, 2026); waiting on kr0 |
| Pivot Bench: kr0 places pivot and joint marks on Tim-o v2.1 and the ink enemy parts, with a live rig preview; marks are saved for Claude to apply | `games/metr0niks/artifacts/pivot-bench/` (README, page source, build script) | https://claude.ai/artifact/3mHrUSYnuyBu1uvzrdpaPZ | New (Oct 28, 2026); waiting on kr0's marks |
| Level design: Overpass Sector 4 as five sectors with one landmark each (water tower, gantry crane, slag gallery, billboard, and the Terminus Yard arena for a big boss), a breakdown of every section, pacing by level band and what the GDD still needs | `games/metr0niks/level-design.md` (map built in `simulations/sim.js`, checked by `simulations/map-check.js`; screenshots `art/metr0niks/screenshots/level-0*.jpg`) | https://claude.ai/artifact/X8y8t7nd96zwL1BeCetdzC | New (Oct 28, 2026); concept A + B landmarks picked by kr0 and built into the voxel prototype; grown to five sectors the same day, then scaled 1.5× for two players; merged (PR #12) and written into the GDD Map section (GDD-D56) |
| Ink prototype level design: the same five zones drawn for the ink look (shanty market, container yard with gantry crane, furnace canyons with slag gallery, glass towers with billboard, the Terminus Yard boss arena), one zone per level, landmarks that collapse, what needs kr0 | `games/metr0niks/level-design-ink.md` (layout in `prototypes/ink-zones.js`; screenshots `art/metr0niks/screenshots/ink-zone-*.jpg`) | https://claude.ai/artifact/ETZ496Qek391MmFmMonbY4 (level design page) | New (Oct 28, 2026); waiting on kr0 |
| Level concepts for the voxel prototype: three ways to make the zones look and play differently (districts, landmarks, street shapes), with layouts on the sim grid, a checker and a concept page | `games/metr0niks/research/level-concepts/` (`README.md`, `levels.html`, `concepts.js`, `check.js`) | https://claude.ai/artifact/X8y8t7nd96zwL1BeCetdzC | New (Oct 28, 2026); kr0 picked A + B landmarks, built in `level-design.md` |
| Mech-game design research (principles, mechanics, pitfalls, audio, sources) | `games/metr0niks/research/mech-games-2026-10-26.md` | none | New (Oct 26, 2026); suggestions, not decisions |
| Action Sprite Studio runs: every input, prompt and setting of the 18 Tim-o runs of Oct 26 recovered from Scenario, what they show (the LLM step dropped our frame plans), eight workflow fixes and a proposed run-record rule | `games/metr0niks/research/2026-10-29-action-sprite-studio-runs.md` (records: `art/metr0niks/prompts/tim-o-sprites-workflow-runs-2026-10-26.txt` and `.jsonl`, `tim-o-sprites-{run,jetpack,explode}-side.txt`, `action-sprite-studio-brief-v1.txt`, `-v2.txt`) | none | New (Oct 29, 2026); workflow fixes and the rule wait on kr0 |
| TDD decision history | `games/metr0niks/tdd-decisions.md` | none | New (Oct 25, 2026); all Proposed; TDD-D1 and D5 wording fixed Oct 27; TDD-D9 to D17 added Oct 28 |
| Tuning history (Simulation section and prototype baseline) | `games/metr0niks/tuning-history.md` | none | New (Oct 25, 2026); weapon-upgrade sweep planned Oct 26; baseline wording fixed Oct 27; fun pass sweeps Oct 28 (pilot v1 and v2); first change logged Oct 29 (tuning pass 1, GDD-D57) |
| Headless game simulation (loaded by the prototype, also runs in Node) | `games/metr0niks/simulations/sim.js` | none | The prototypes load it from `../simulations/sim.js` |
| Headless runner, scripted pilot and rules check (phase 0 of the fun pass plan) | `games/metr0niks/simulations/run.js`, `pilot.js`, `rules-check.js`; records in `games/metr0niks/tuning-runs/` | none | New (Oct 28, 2026); baseline in the tuning history |
| Open questions (gallery title "Scrap-Breaker open questions") | `games/metr0niks/open-questions.md` | https://claude.ai/artifact/MUiquZomvsgbswqEjYxt4v | Imported Oct 21 (the artifact is the Oct 20 version); updated through Oct 27, 2026 with the decision table, backlog and open design questions |
| Playable prototype (drive, shoot, patrol bots, small Overpass Sector 4 map) | `games/metr0niks/prototypes/prototype.html` | https://storage.googleapis.com/kr0-game-studio-site/play/metr0niks/index.html | New (Oct 21, 2026); prototype 1 (voxel), kept separate from the ink prototype (GDD-D32). Oct 27: touch controls and Gauntlet removed (GDD-D29). The published copy at studio-site/static/play/metr0niks/index.html in kr0/blackletter-chronos predates this and is now labelled prototype 1 on the site. Oct 29: tuned build 10 published as site prototype 2 at https://storage.googleapis.com/kr0-game-studio-site/play/metr0niks/prototype-2/index.html (kr0/blackletter-chronos PR #6) |
| Ink prototype: art style C as 2D cut-out puppets, three enemy types, collapsing buildings, Scenario music and sound effects; IK legs, cast ink shadows, chunked building damage and ground decals (loads `simulations/sim.js` and `art/metr0niks/ink-proto/`) | `games/metr0niks/prototypes/prototype-ink.html` (zones in `ink-zones.js`) | https://claude.ai/artifact/79WTMgYErJNqwFX5NsL64f | Updated Oct 28, 2026 (five zones, levels 1 to 5); exploration, GDD-D30 and D34 Proposed |
| Mechanics lab: each weapon, part swap, pod, pickup, collapse and enemy tested on its own, with measured vs expected numbers (drives the voxel prototype in a frame) | `games/metr0niks/prototypes/mechanics-lab.html` (brief: `mechanics-lab.md`) | https://claude.ai/artifact/Qo6kYZiogKtJvp1RWsRrWu | New (Oct 28, 2026) |
| Item lab (ink prototype): every garage part in sim.js drawn on Tim-o's v2.1 puppet; equip, aim, fire, compare stats, share a build link | `games/metr0niks/prototypes/item-lab.html` (brief: `item-lab.md`) | https://claude.ai/artifact/4GQ6VMSMCErCZNDhBn6uN5 | New (Oct 28, 2026); waiting on kr0 |
| Ink prototype brief: how the art is made, the renderer, the audio made so far (and the desert rock set still to make), what the full game still needs, decisions for kr0 | `games/metr0niks/prototypes/ink-prototype.md` | none | Updated Oct 27, 2026 |
| Garage lab: the prototype's garage with every part unlocked, an icon sheet of all parts, and a turntable preview of each on the mech | `games/metr0niks/prototypes/garage-lab.html` (brief: `mechanics-lab.md`) | https://claude.ai/artifact/HBuDjHHiJpf8ryi83MrhoY | New (Oct 28, 2026) |
| Units lab: every enemy (patrol bot, heavy loader, Bounty sniper), each behaviour on demand, slow motion and frame stepping, live state and stats | `games/metr0niks/prototypes/unit-lab.html` (brief: `mechanics-lab.md`) | https://claude.ai/artifact/RuT6CYGxtQHcLJRh13KyxT | New (Oct 28, 2026) |
| Ink enemy lab and animation review: every enemy in the ink prototype (gunner bot, heavy loader, jumper boss) with idle or live AI, one-button behaviours, slow motion and frame step, range rings, live state, atlas parts, how each differs from sim.js, and the GDD enemies not built yet (drives the ink prototype in a frame); a review view with a frame player for every enemy animation, every sprite part with its joints, and Keep/Fix/Redo/Drop marks and comments | `games/metr0niks/prototypes/ink-enemy-lab.html` (brief: section "Enemy lab" in `ink-prototype.md`) | https://claude.ai/artifact/LTWL3mvLoqTcVmSd8oudZH | New (Oct 28, 2026) |
| Ink enemy animation review, first pass: findings for every animation and part of the three ink enemies (synthetic; kr0's marks are on the published lab) | `games/metr0niks/feedback/synthetic/2026-10-28-ink-enemy-animation-review.md` | https://claude.ai/artifact/LTWL3mvLoqTcVmSd8oudZH#review | New (Oct 28, 2026); waiting on kr0's marks |
| Ink prototype brief: how the art is made, the renderer, the audio made so far (and the desert rock set still to make), what the full game still needs, decisions for kr0 | `games/metr0niks/prototypes/ink-prototype.md` | none | Updated Oct 28, 2026 |
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
| Design workflows: Scenario character sheet, turnaround and action-sprite workflows; cut-out puppet route (section 4); animation review after every animation run (Oct 28, 2026); Scenario MCP and skills; gemini-creative plugin | `studio/design-workflows.md` |
| Asset management: kr0 Studio Art Drive folder for masters, repo previews and manifest, provenance record | `studio/asset-management.md` |
| MCP servers and plugins for Claude Code sessions on this repo (Scenario MCP; gemini-creative plugin) | `.mcp.json`, `.claude/settings.json` |
| GDD designer skill | `studio/skills/gdd-designer/SKILL.md` |
| Draft project instructions (awaiting kr0's approval) | `studio/project-instructions-draft.md` |

## Art (by game)

| Game | Folder | What's there |
| --- | --- | --- |
| Blackletter | `art/blackletter/` | Cards, illustrations, battle sprites, brand masks, concept art, screenshots (see `README.md`) |
| Dual Tech | `art/dual-tech/` | Art board (`board/index.html`), three styles (`prototype/`, `pitch/`, `glass/`), `prompts/`, Python drawing kits in `source/` |
| Metr0niks | `art/metr0niks/` | Art board (`board/index.html`), styles (`prototype/`, `pitch/`, `ink/`), prototype `themes/`, `prompts/`, zone-unlock and ink-prototype `screenshots/` (renderer shots `ink-05`, `ink-06` added Oct 27, 2026); ink prototype sheets, sprite atlas and audio in `ink-proto/`, atlas builder and Scenario script in `source/`; Tim-o reference mech (sheet, turnaround, cutaway poster, cut-out, garage mock-up) from kr0's Scenario "metr0niks" collection in `characters/tim-o/` (added Oct 26, 2026) |
| Dropfront | none yet | The core loop diagram lives in `games/dropfront/gdd.pdf` |

## Tools (shared by every game)

| Tool | Folder | Status |
| --- | --- | --- |
| What belongs in `tools/` | `tools/README.md` | Current |
| `chronos-sim`: simulation and tuning platform for every game | `tools/chronos-sim/` | Not built yet |
| chronos-sim project plan | `tools/chronos-sim/project-plan.md` | Draft, awaiting kr0's review |
| `asset-desk`: local app to grade, tag and trace the provenance of studio art (Drive folder, repo art, Scenario library) | `tools/asset-desk/` | Version 0.1, awaiting kr0's review |
| asset-desk feature list | `tools/asset-desk/FEATURES.md` | Draft, awaiting kr0's review |
| `scenario-run-record`: writes the run record (inputs, prompt each model received, hidden graph inputs, settings, job and asset ids, cost) for any Scenario job | `tools/scenario-run-record/` | Version 0.1 (Oct 29, 2026) |

## Site

kr0's game portfolio site: the source and deploy scripts are in `site/` (deploy from `site/gcp/`). `site/ways-of-working.md` is the published copy; edit `studio/ways-of-working.md` and copy it over.

## Notes
- Markdown exports drop embedded diagrams and images; they show as `[embedded content: …]` or `[image: …]` placeholders (Dropfront core loop, Metr0niks core loop and architecture, Blackletter pitch images, core loop and architecture).
- Dual Tech and Dropfront tabs are PDF exports; the GDD PDF includes its concept art. Run `pdftotext` to get plain text.
- Blackletter has the full seven-document set plus a prototype. For the other games, tuning history and GDD/TDD decision history are not separate files yet; the Dropfront GDD has a changelog. Metr0niks now has the full seven-document set apart from a standalone pitch document (the pitch is `pitch-and-firing-range/index.html`).
