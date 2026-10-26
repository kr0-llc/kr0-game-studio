# Handoff prompt: push the Metr0niks GDD branch and finish the GDD

Oct 26, 2026 · for the next agent · written by Claude for kr0 · Earlier version: [Oct 25](superseded/handoff-gdd-prompt-2026-10-25.md)

Start the next session with `kr0/kr0-game-studio` selected and GitHub connected (https://claude.ai/connect-github, with the Claude GitHub App installed on the repo), so the agent can push. Paste everything below the line into its first message.

---

You are taking over the Metr0niks GDD for kr0 Game Studio. kr0 is the only decision maker: you propose and draft; kr0 approves. Your session can write to GitHub; the sessions before you could not.

## 1. First job: get the work into the repo

The work sits on branch `claude/metr0niks-gdd-review`: 19 commits ahead of `main`, never pushed. Its only copy is the private sync artifact **Metr0niks Repo Sync: https://claude.ai/artifact/Ti35254yyvzkEC8L7VeyUv**, which holds every changed text file at its repo path plus `sync/metr0niks-gdd-review.patch.txt` (one patch for all commits).

1. Check whether `origin/claude/metr0niks-gdd-review` already exists (`git fetch origin` then `git branch -r`). If it does, compare it with the patch before doing anything and ask kr0 if they differ.
2. Read the patch with the Artifact tool (`action: "read"`, `url` above, `path: "sync/metr0niks-gdd-review.patch.txt"`). From an up-to-date `main`: `git checkout -b claude/metr0niks-gdd-review`, then `git am <saved patch>`. One whitespace warning is expected. The patch was tested on `main` at 56b2ccd. If `main` has moved and `git am` fails, stop and tell kr0; don't resolve conflicts by guessing.
3. Check the result: `git log --oneline origin/main..HEAD` shows 19 commits, the newest about the Oct 26 critique, research and this handoff. `git diff --stat origin/main` touches about 30 files, all text.
4. Ask kr0 before pushing ("May I push `claude/metr0niks-gdd-review` and open a pull request to `main`?"). On yes: `git push -u origin claude/metr0niks-gdd-review`, then open the pull request. Use the repo's PR template if one exists. The body summarises the Metr0niks GDD rewrite, the decisions GDD-D1 to GDD-D28, the TDD and companion files, the reviews and the research, and lists what's still waiting on kr0 (section 4). End the body with the attribution lines your session gives you.
5. Once the branch is pushed, the repo is the source of truth again. Update `INDEX.md` to say the sync artifact is retired. Don't delete the artifact unless kr0 asks. Commit further work to the same branch and push it.

## 2. Read first, in this order

1. `studio/README.md`, `studio/ways-of-working.md` (sections 1, 4, 8, 11) and `studio/simulation-and-tuning.md`. Follow them.
2. `studio/gdd-template.md` and `studio/skills/gdd-designer/SKILL.md`.
3. `games/metr0niks/gdd.md`.
4. `games/metr0niks/gdd-decisions.md` (newest first; GDD-D23 to D28 are from Oct 26) and `open-questions.md`.
5. `games/metr0niks/feedback/synthetic/2026-10-26-gdd-critique.md`: the latest critique, with fixes not yet applied.
6. `games/metr0niks/research/mech-games-2026-10-26.md`: mech-game design research. Its suggestions are not decisions.
7. `games/metr0niks/prototype-changes.md`, `tdd.md`, `tdd-decisions.md`, `tuning-history.md`.
8. `sim.js` (the rules; `T` at the top holds every tunable) and `prototype.html` are the ground truth for what the game does today. Read big files by section.

## 3. Where things stand

- The GDD describes one mode, Excursion (single-player or two-player co-op), on one map, with five pillars, an audio section, content counts, player journey and menus, a glossary and links.
- kr0 accepted every earlier proposal on Oct 26 (GDD-D18, D20, D23) and decided victory at level 50, a paid co-op revive, a settable seed, the pillars and audio (GDD-D24 to D26).
- **TBDs:** target audience and player fantasy stay TBD on kr0's instruction (GDD-D27); those are the only TBDs allowed. Production milestones and pricing don't belong in the GDD.
- **Still Proposed:** the revive price (40 × the level's scrap factor) and 30% revive armor, what the victory button does, the level-1-only seed change, and repair in slot order.
- The prototype is unchanged on purpose. Don't edit `prototype.html` or `sim.js`; changes the GDD needs go in `prototype-changes.md` (sections 1 to 16).

## 4. What's waiting on kr0, in this order

Ask one decision at a time, with 2 to 4 options and a recommendation. Write nothing before kr0 says yes to the draft or the summary ("May I write this to …?").

1. **Fixes from the Oct 26 critique, proposed as one change set.** These are corrections to the document, with no new rules:
   - the boss spawn contradiction (Wave pacing should cover bots and loaders only);
   - the pillar "a collapse hits you as hard as it hits them" (collapses deal 80 to enemies and 40 to mechs);
   - inline "(proposed, GDD-Dxx)" tags;
   - one Repair button in slot order;
   - "What makes it fun: TBD (kr0)" and the header's TBD count;
   - timing windows in seconds from `sim.js` (Perfect ±0.086 s around 1.0 s, Good ±0.31 s, auto-Miss at 1.31 s), with the px sizes kept as a presentation note;
   - the TDD drift (ring "to 0", Perfect radius for every heavy weapon, collapse scrap, the cut-off line, Godot listed as "Choice", header date, TDD-D1 and D5 wording);
   - the stale open-questions rows, the INDEX rows, the prototype-changes header, `T.level.revive` in sections 2 and 12, and the tuning-history baseline wording.
2. **Co-op campaign ownership** (critical): which save a room uses, what the guest keeps, what each player's save gets on extract, death and leaving, how "the lower of the two levels" works, who sees victory. The room server is in the private `kr0/blackletter-chronos`; ask kr0 whether you may read it.
3. **Late-game intent:** is level 50 meant to be reachable at the current scaling (level-50 wave 4 has 80 bots and 27 loaders at 8.35× health)? What is scrap for once every part and upgrade is owned? Should collapse damage scale with level?
4. **Edge cases:**
   - a death during the 1.4 s extract wait;
   - reviving a partner who left;
   - both mechs dying on the wave-clear tick;
   - a second Overclock (refreshes, doesn't stack);
   - Field repair at full armor;
   - when wave 1 starts;
   - whether enemies collect scrap or cubes expire;
   - what "roof loot" means;
   - showing the survivor's own wallet and the revive price.

   Most have a prototype answer; propose those for approval.
5. **The death screen's retry code:** it restores the pre-death level when a co-op host pastes it. Keep it as a deliberate retry, or remove it?
6. **The Proposed values** listed in section 3.
7. **Optional, kr0's call:** polish from the critique (split Excursion rules, rename the "Drop in" uses, glossary rows, the heat formula as a formula, move TDD-level numbers out); and the six-reviewer method (`https://github.com/GixGosu/gdd-review-kit`) on the finished GDD.

For every change, update in the same commit: `gdd.md`, `gdd-decisions.md` (a new entry with options and why), `tdd.md` and `tdd-decisions.md` if architecture changes, `open-questions.md`, `tuning-history.md` if a value changes, `prototype-changes.md` if the prototype must change, and `INDEX.md`. Move any replaced version to `superseded/`; never delete.

## 5. Rules for everything you write

- Write Metr0niks and kr0 with a zero. Where the name is styled (HTML, slides, artifacts) the 0 is pink: `kr<span class="r0">0</span>`.
- Ask before writing and before pushing, opening or merging anything. A skipped question is not a yes. Commit to the branch as needed; nothing reaches `main` except through a pull request kr0 approves.
- Reports state observations against targets, never verdicts ("approved", "balanced", "ready").
- Commit messages end with the attribution lines your session gives you.

## 6. Rendered copies for kr0

These read-only artifacts still show the Oct 25 versions. Refresh each at its own link once the open fixes are in, so kr0 reviews once: GDD https://claude.ai/artifact/M7D1pXj1xeQyX9vYJYiFHV · TDD https://claude.ai/artifact/VHJnkAA6kdJxgtKfNBHyzL · GDD decisions https://claude.ai/artifact/5Mws5MsJf4ENVboy7oLvpK · TDD decisions https://claude.ai/artifact/5TSyxBaZUB6im3cortUZp · Tuning history https://claude.ai/artifact/3AqJDeyT2zR1QuF3YeYgcH · Open questions https://claude.ai/artifact/GiijGDuKnfrDYHZznM1UQ3 · Prototype changes https://claude.ai/artifact/Kbn6RRsq423U6hFKCAsHPG · Index https://claude.ai/artifact/3GzNKKEvRePsbruLfWMzPy

## 7. Done means

- The branch is pushed and a pull request is open, with kr0's approval.
- `gdd.md` contradicts neither itself nor `sim.js`, except for the items in `prototype-changes.md`. The only TBDs are the ones kr0 asked for.
- Every rule from a decision traces to a GDD-D entry, and every Proposed entry is accepted, changed or listed as open.
- The TDD, decision histories, open questions, tuning history and index agree with the GDD.
- Your final message says what changed, what's waiting on kr0 and what you couldn't check.
