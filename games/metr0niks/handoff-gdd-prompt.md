# Handoff prompt: finalize the Metr0niks GDD

Oct 25, 2026 · for the next agent · written by Claude for kr0

Paste everything below the line into the next agent's first message.

---

You are taking over the Metr0niks GDD for kr0 Game Studio. The goal of this session is to finalize `games/metr0niks/gdd.md` so it is ready to drive the next phase of development (technical setup, then pre-production, per `studio/ways-of-working.md` section 5). kr0 is the only decision maker. You propose and draft; kr0 approves.

## Read first, in this order

1. `studio/README.md`, then `studio/ways-of-working.md` (sections 1, 4, 8 and 11) and `studio/simulation-and-tuning.md`. Follow them.
2. `studio/gdd-template.md` and `studio/skills/gdd-designer/SKILL.md`: the outline and the review standard a GDD is held to.
3. `games/metr0niks/gdd.md`: the document you are finalizing.
4. `games/metr0niks/gdd-decisions.md` and `games/metr0niks/open-questions.md`: every decision, its status and its reason. Statuses marked Proposed are waiting on kr0.
5. `games/metr0niks/prototype-changes.md`: what the prototype must change to match the GDD. The GDD is ahead of the prototype on purpose.
6. `games/metr0niks/tdd.md`, `tdd-decisions.md` and `tuning-history.md`: keep these consistent with any GDD change.
7. `games/metr0niks/reviews/SYNTHESIS.md` and `reviews/prototype-reconciliation.md`: what a six-reviewer pass found on an earlier GDD and how it was resolved.

Read big files by section (find headings with Grep, then Read ranges). `prototype.html` and `sim.js` are the ground truth for what the game does today; `sim.js` is the rules, `T` at the top is every tunable.

## Where things stand

- The GDD describes one mode, Excursion (single-player or two-player co-op), on one map. It has no TBDs. Every number is either from `sim.js` or is a value the decision history marks Proposed (GDD-D18 durability and repair rates, GDD-D20 wave-5 boss values).
- Dropped on kr0's instruction and listed in the open-questions backlog: Gauntlet, Draft Duel, Scrap Rush, damage regions, accessibility options, remappable keys, the overheat steam zone, later maps, two pods, server features (rejoin, accounts, server-held saves, online single-player) and touch controls.
- The prototype is unchanged. Do not edit `prototype.html` or `sim.js`. Any change the GDD needs from them goes into `prototype-changes.md`.
- Branch `claude/metr0niks-gdd-review` holds 15 local commits and has not been pushed: the session had no GitHub write access. Keep committing to it. Do not open a pull request, push, deploy, create repos or delete files without asking kr0. The repo is public at `github.com/kr0/kr0-game-studio`; `kr0/blackletter-chronos` (the room server) is private and not readable.
- Private artifact copies of every document exist for kr0's review (links below). The repo is the source of truth; do not treat an artifact as newer than the repo.

## What to do

1. **Read the GDD against the template.** List what a GDD for this game still lacks (for example player journey, a glossary, content counts, UX flows, a production or scope section, open questions) and what is thin. Propose, do not fill by inventing: every addition must come from the prototype, a decision or an answer from kr0.
2. **Check the GDD against the prototype once more, independently.** Read `sim.js` and the relevant parts of `prototype.html` yourself and report any statement that is wrong. Do not rely on `reviews/prototype-reconciliation.md`, which was written for an earlier version.
3. **Settle the Proposed items with kr0.** Ask one decision at a time with options. The open ones: the wear and repair numbers (GDD-D18), the wave-5 boss values and the zone drop-in lock (GDD-D20), the parts and sinks cut (GDD-D16), and the choice to refill armor every level.
4. **Look for rules a developer would have to guess.** Walk the GDD as an implementer: for every rule, can it be built without asking? Report gaps as questions, not as new rules.
5. **Optional review pass.** If kr0 wants it, run the six-reviewer method again (`https://github.com/GixGosu/gdd-review-kit`: independent review, cross-examination, moderator synthesis) on the finished GDD, reading only the GDD. The earlier run is in `games/metr0niks/reviews/`.
6. **Update every affected document in the same change:** `gdd.md`, `gdd-decisions.md` (a new entry for each decision, with options and why), `tdd.md` and `tdd-decisions.md` if architecture changes, `open-questions.md`, `tuning-history.md` if a value changes, `prototype-changes.md` if the prototype must change, and `INDEX.md`. Move any replaced version to `superseded/`; never delete.

The `design-system` skill in `studio/skills/design-system/` is for authoring one system section by section. It depends on files that are not in the repo (`references/`, `hooks/yaml-helper.sh`, `.claude/docs/`), so it can't run yet. Work the same way by hand: question, options, decision, draft, approval, write.

## Rules that apply to everything you write

- Write Metr0niks and kr0 with a zero. Wherever the name is styled (HTML, slides, artifacts), the 0 is pink: `kr<span class="r0">0</span>`. Plain text and file names keep the zero with no colour.
- Make changes on a branch. Do not keep a second copy of any document or art outside the repo.
- Agents ask before writing: show the draft or a summary and ask "May I write this to <file>?" A skipped question is not a yes.
- Agents commit to the working branch as needed (ways of working section 4). Commit messages end with the attribution lines your session gives you.
- Reports state observations against targets and never verdicts such as "approved" or "balanced".
- No TBDs in the GDD. If a rule needs a value nobody has, ask kr0; if kr0 can't answer, put the question in `open-questions.md` and keep the rule out of the GDD.

## Done means

- `gdd.md` has no TBDs and no statement that contradicts `sim.js`, except the decisions listed in `prototype-changes.md`.
- Every GDD rule that came from a decision traces to a `GDD-D` entry; every Proposed entry is either accepted, changed or listed as open for kr0.
- The TDD, decision histories, open questions, tuning history and index agree with the GDD.
- All work is committed on the branch, and you tell kr0 what changed, what is waiting on them and what you could not check.

## Artifacts (private, for kr0)

- GDD https://claude.ai/artifact/M7D1pXj1xeQyX9vYJYiFHV
- TDD https://claude.ai/artifact/VHJnkAA6kdJxgtKfNBHyzL
- GDD decisions https://claude.ai/artifact/5Mws5MsJf4ENVboy7oLvpK
- TDD decisions https://claude.ai/artifact/5TSyxBaZUB6im3cortUZp
- Tuning history https://claude.ai/artifact/3AqJDeyT2zR1QuF3YeYgcH
- Open questions https://claude.ai/artifact/GiijGDuKnfrDYHZznM1UQ3
- Prototype changes https://claude.ai/artifact/Kbn6RRsq423U6hFKCAsHPG
- Index https://claude.ai/artifact/3GzNKKEvRePsbruLfWMzPy
