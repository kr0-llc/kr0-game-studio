# Blackletter: Chronos, GDD critique

2026-10-21 · gdd-designer critique pass · source: [live GDD](https://claude.ai/artifact/PGTiFxJAx7wZ2ZNwzNMfxZ) (rev 11), read with the [Pitch](pitch.md), [TDD](tdd.md) and [Open questions](open-questions.md)

## Summary

The GDD is unusually concrete: real numbers, real win conditions, a fair-play rule for the AI and measured experience targets. What it lacks is the frame around the rules: there is no written core loop (only a diagram, which vanishes in any export), no picture of a minute of play, no glossary for a dozen invented terms, and no document info, non-goals or production section. **Most important fix: write the core loop as a list of player verbs and add a short moment-to-moment walkthrough**, because both the team and the course rubric look for them first.

## Critical: blocks building the game

- **[Core loop] The loop exists only as an embedded diagram.** The Markdown export shows `[embedded content: core loop ...]` and a PDF export may too. → Add a numbered list under the diagram: *Muster → place in secret → wait for a gauge → order the ready unit → take or hold a node → earn Tithes and Fervor → recruit, refit or cast → repeat until a side's Morale hits 0.*
- **[Systems] Pace scaling is ambiguous.** Gauge times are given for both paces, movement and Morale bleed only "at Snappy pace" ("slower at Grand Tactical" has no number), and Tithes, capture times, the Extinction timer, blessing length and the purchase cooldown name no pace at all. Two engineers would build two different Grand Tactical games. → Add one rule stating which numbers scale with pace and by how much, and mark the rest TBD (Systems designer).
- **[Content: Units] Seven unit traits are named but never defined:** Charge, Braced, Hit and Run, Flank, Trackless, Suppressing Fire, Volley Weapon. Only the Retaliation Charge is explained. → One line each in a glossary, copied from the rulebook of record.
- **[Win conditions] Stalemate is not handled.** Bleed needs a node lead. Contested and neutral nodes can leave both sides even (for example 2 to 2 with one contested on a 5-node board), and nothing then moves Morale. There is no time limit. → State whether a battle can stall and what ends it (time cap, sudden death, escalating bleed), or log it as an open question.

## Important: will cause rework or confusion

- **[Pillars] The GDD and the Pitch disagree.** The Pitch has *A wager of nerve*; the GDD has *Gothic martial realism* instead. In the GDD the Secret Wager, a signature system, traces to no pillar. → Use one set of pillars in both. Proposed: keep all five (they are distinct and each decides something).
- **[Overview] There are no non-goals.** Several are implied by the rules (no queued or standing orders, no kill-count victory, no AI that sees hidden information, no high fantasy). → State them so they can settle debates.
- **[Experience targets] The default pace misses its own target.** Target is "8 to 12 minutes" while Grand Tactical, the default, runs about 14. The row also cites "sim at tuning v2.12" while the doc says its numbers are v2.14.6. → Flag the miss in the table and re-run or date the measurement.
- **[Systems: Wager] Edge cases are missing.** Can a side bid more Morale than it holds, and does bidding to 0 lose the battle on the spot (the win table implies yes)? What happens to gauges and moving units while the clock is frozen? → Answer or log.
- **[Systems: Economy] Deployment is undefined.** Recruits appear somewhere, and Extinction depends on "deploying" one, but no rule says where or how fast. Morale has only sinks; say explicitly whether anything ever restores it. → Add a sources-and-sinks table for Tithes, Fervor and Morale.
- **[Opponents and AI] "Difficulty" is listed as an agent, and some rows describe computation, not play.** "Looks every 0.25 s" and "takes a lesser option half the time" are how he is built; the player notices "answers your moves almost at once" and "about half his moves are second-best". → Keep three agents (Sebastion, Counsel, the Coach), fold difficulty into Sebastion, and rewrite the rows in what the player sees.
- **[UX] No controls, HUD or player journey.** The doc never says how a player selects a ready unit, gives an order or reads the Action Queue, on desktop or touch. Accessibility is one target row, while the audience names low-vision keyboard players. → Add Controls and HUD sections (owner: UX), an Accessibility list, and mark unknowns TBD.
- **[Production] Missing.** Playtest 3, the phone performance budget and the 3D view are milestones in the Pitch and Open questions but not in the GDD, and there is no cut line for what ships. → Add milestones, a proposed cut line and a link to the risks in Open questions.

## Polish: clarity, scanning, structure

- **[Document info] Missing status, owner, changelog, open-questions link and glossary.** Add them at the top.
- **[Combat] One dense paragraph.** Turn it into numbered steps and add one worked example so the dice read as odds.
- **[Content] No count summary.** Add a "content at a glance" table (3 units × 3 tiers, 6 cards, 6 terrains, 2 node types, 3 blessings, 3 Miracles, 4 board sizes).
- **[Overview] Implementation detail in the opening paragraph** (`docs/…`, `src/tuning.js`) and in Modes (`/experimental/atb`). → Move to a "Sources of truth" line in Document info and to the TDD.
- **[References] No links** to the Pitch, TDD, Open questions, card art or the playable build. → Add an appendix.
- **[Terms] "Refit", "recruit", "upgrade" and "take a card" are used for overlapping actions.** Pick one verb per action and put it in the glossary.

## Strengths

- Rules come with real values from one tuning file, and the doc names its version.
- Both win conditions and both draw cases are stated.
- The fairness rule for Sebastion is clear and testable.
- Experience targets are tied to measures and current scores.
- Known problems (the opening node race, the broken Shooter vs Chopper leg) are stated plainly instead of hidden.

## Course rubric (Assignment #01), what this pass also fixes

The class needs Executive Summary, Game Mechanics, AI Architecture and Technical Strategy sections. The GDD covers the first three under other names, and Technical Strategy lives in the TDD. The improved GDD uses the required names where they fit the content and adds a submission map. Two gaps it cannot close alone, both in the TDD: the 13 studio roles are counted but never named, and the development token budget (agents building the game) is missing, though the runtime budget is solid. A grade with the gdd-course-evaluator skill should follow once the PDF is put together.

## Open questions for the team

1. Which numbers scale with pace, and by how much?
2. Can a battle stall when nodes are even, and what ends it?
3. Can a Wager bid exceed the bidder's Morale? Does a bid that reaches 0 lose immediately?
4. Where do recruits deploy, and how long does it take?
5. Does anything ever restore Morale?
6. Do the Chapel bonus and Holy Surge stack?
7. Which five pillars, or four, are final?
8. What is the semester cut line?
