# Metr0niks GDD critique, Oct 26

Oct 26, 2026 · reviewer: a separate Claude agent using the [GDD designer skill](../../../studio/skills/gdd-designer/SKILL.md) in critique mode · decides: kr0

Reviewed: `gdd.md` at commit "accept D18, D20, D23; victory, co-op revive, seed, pillars, audio", with `gdd-decisions.md`, `open-questions.md`, `tdd.md`, `tdd-decisions.md`, `tuning-history.md`, `prototype-changes.md`, `INDEX.md` and spot checks against `sim.js`. Read only. kr0's choices in GDD-D27 (audience and player fantasy TBD; milestones and pricing out of the GDD), the items in `prototype-changes.md`, the Proposed values and the backlog were not re-flagged.

The three critical findings were checked against `sim.js` by the session that commissioned the review, and hold. Nothing below has been applied yet; fixes wait on kr0 (see the [handoff prompt](../handoff-gdd-prompt.md)).

## Summary

The GDD can be checked against the prototype. Its numbers trace to decision IDs, and the arithmetic checked holds: 47 buildings and 16 barriers, weight 60 + 40 = 100, 1,005 scrap to take all nine weapons to Mk III, about 6.6 s of minigun fire before a lockout, and Ablative plating about 30% slower. What stops two engineers building the same game is co-op. The rules on whose save and which level a co-op room uses contradict each other, and the most important fix is one co-op campaign rule covering ownership, level, death and victory. A few rules also contradict each other across sections, and the companion files have drifted from the GDD.

## Critical: blocks building the game

- **[Excursion rules › Co-op; Garage] Who owns the save in co-op is undefined.** "Co-op plays at the lower of the two players' levels", but the Garage says "The room's saved campaign replaces each player's local one". If one campaign replaces both, there is no second level to take the lower of. Unanswered: is the guest's single-player progress overwritten? Whose level resets on a death, and on a partner leaving ("Leaving early… counts as a death")? Who sees the victory screen? `sim.js` `Campaign` holds both players in one save, so the code doesn't settle it. → Add a "Co-op campaign" block: which save the room uses, what the guest keeps locally, what each player's save receives on extract, death and leaving, and how the level is chosen.
- **[Excursion rules › Wave pacing vs Enemies › Boss placement] The boss's spawn point is stated twice and the two disagree.** Wave pacing: "the boss first… Each lands on an open street cell more than 10 m from every living mech". Boss placement: "on a roof edge 8 to 16 m from a random living mech". → Limit Wave pacing to bots and loaders and point the boss to Boss placement.
- **[Combat › Heavy weapons] The timing windows are given in screen pixels.** The core pillar is graded in px ("72 px radius… within 5%"), but zoom changes with window size (TDD: 0.9 to 2.4), so an engine rebuild can't reproduce the timing from pixels. The TDD also contradicts the GDD: "shrinks from its start radius to 0", where the GDD says 72 → 30 px over 1 s and closes at about 1.3 s. → State the windows in time, as `sim.js` gives them: Perfect is a release within ±0.086 s of 1.0 s, Good within ±0.31 s, and the ring fires a Miss on its own at 1.31 s. Keep px as a presentation note and fix the TDD.

## Important: will cause rework or confusion

- **[Excursion rules › Levels; Economy] The level-50 win and the economy don't add up as written.** At level 50, wave 4 has round(6 × 13.25) = 80 bots and 27 loaders, about 85 s of drop-ins alone. Enemy health is ×8.35 and orb damage about 58. Player damage tops out near 2× (power about 170 × Mk III 1.2), and collapse damage stays at 80 "at any level". A level-1 extract yields about 150 scrap (the reviewer's estimate from the GDD's tables). All part prices plus all upgrades total about 2,150, so every one-time sink is bought within a handful of mid-level extracts; after that only repairs and revives remain, and pillar 4 loses its weight. The tuning history has no target for either. → Add an intent line (expected level reached; whether level 50 is meant to be reachable) and a sentence on what scrap is for late in the campaign, or log both as open questions with an owner.
- **[Pillars vs Destruction › Landing] A pillar contradicts the rules.** "A collapse hits you as hard as it hits them", but collapses deal 80 to enemies and 40 to mechs. → "A collapse can hit you too", or change the values.
- **[Excursion rules, Garage] Proposed values are not marked inline.** Only the revive is tagged. The victory button (GDD-D24), the level-1 seed limit (GDD-D25) and repair in slot order (GDD-D28) read as settled, and the header's "everything else has a value" adds to that. → Tag each "(proposed, GDD-Dxx)".
- **[Durability; Garage] Repair one part or all is unclear.** "Repairing a part restores it fully" reads as per part; "works through the fitted parts in slot order… skips a part" only makes sense for one button. Prototype changes section 2 specifies one Repair button. → "One Repair button repairs worn parts in slot order; a part the banked scrap can't cover is skipped."
- **[Partner down and revive; HUD] The survivor can't see whether a revive is affordable.** The price comes from "the survivor's match wallet", but the HUD shows "the match's scrap (the team's total in co-op)". → Show each player's wallet and the revive price while a partner is down.
- **[Missing edge cases]** One line each for: a mech destroyed during the 1.4 s extract wait (the sim runs `updateWave` only in `play`, so the run is lost); whether a partner who left can be revived and charged for; both mechs going down on the tick the wave clears; a second Overclock while one is active (the sim refreshes it to 15 s, no stacking); Field repair taken at full armor (the pod is consumed); when wave 1 starts at levels 1 and 4+ (at once, no breather); whether enemies can collect scrap cubes and whether cubes expire; what "Roof loot drops to street level" refers to, since roof loot is never defined.
- **[Overview] No "What makes it fun" paragraph.** It is tracked in open questions but not marked TBD in the GDD, so the header's claim of two TBDs is inaccurate. → "What makes it fun: TBD (kr0)" until written.
- **[TDD vs GDD]** "Perfect hits use a larger removal radius" applies to every heavy weapon, but GDD-D28 limits it to the pile-bunker. Collapses break "into debris and scrap cubes", but the GDD keeps rubble and drops scrap only from pieces over 6 voxels. The collapse-warning line ends mid-sentence. The engine table lists Godot 4 as the "Choice" while the text says the choice is deferred. The header says "decisions of Oct 25" though it includes Oct 26. TDD-D5 still cites "a damage-spreading rule" no longer needed; TDD-D1 still cites "anti-cheat for PvP".
- **[open-questions.md] Stale "Decided" rows not struck through:** "heavy weapon's *or ability's* button" (shoulder actives have no ring); reactors set "thrust time in the air" (not in the GDD); durability "lowers max health and heat tolerance" (the rule cuts helpful stat changes); the ram and capped-weight rows (deferred); "The GDD has no TBDs" (superseded by GDD-D27).
- **[INDEX.md, prototype-changes.md, tuning-history.md]** INDEX says the GDD has "no TBDs" (GDD-D27 contradicts it), says the TDD was "Updated Oct 25" (the file says Oct 26) and marks open questions "Imported". The prototype-changes header still says the new values are ones "kr0 hasn't approved". Prototype changes section 2 deletes `T.level.revive` while section 12 reuses it "if it stays". The tuning baseline lists heavy heat as "pile-bunker 28" where every heavy shot costs 28, and lists "Wear per extract 0.10" as a target though it is a value.

## Polish: clarity, scanning, structure

- **[Excursion rules]** One section holds waves, levels, campaign, seed, co-op, revive, leaving and durability. → Split into Waves, Campaign and save, Co-op, and Durability and repair (repair next to Economy).
- **[Terminology]** "Drop in" names five things: the title button, the garage button, enemy spawns, the zone cinematic and drop pods. → "Zone reveal" for the cinematic, "Deploy" for the buttons. "Heat" is a stat (higher is worse) and a meter; "Armor" is a stat and the health pool; "Boss", "Bounty sniper" and "rooftop sniper" name one enemy. → Glossary rows for Heat stat, Armor and Boss.
- **[Combat › Heat]** "multiplied by 1 + (heat stat − 100) ÷ 200 below 100, or ÷ 100 above it" is hard to parse. → `gain × (1 + (H − 100) / (H < 100 ? 200 : 100))`.
- **[Controls, Parts list]** "Arm-R is the light gun on the left mouse button" traps readers. → One line explaining it.
- **[TDD material in the GDD]** "Tick 1/60 s", the px radii and the seed ceiling 2,147,483,000 belong in the TDD.
- **[Audio]** "About 40 effects" counts table rows; many rows hold several sounds. → Count sounds, or say "40 groups".
- **[Pods]** "Any living mech can take a pod, the nearest first" reads as an ordering rule. → "If several mechs touch it in one tick, the nearest gets it."
- **[Level scaling]** "(rounded)" → "rounded half up" (4.5 becomes 5).

## Strengths

- Decision IDs cited inline, so readers can trace why a rule exists.
- Edge-case blocks in Combat and Pods, a Content counts table, a glossary and a Links section.
- Non-goals are explicit and backed by a backlog.
- The parts table states each part's tradeoff in plain words, in line with pillar 1.
- Spot-checked numbers match `sim.js`: ring close at about 1.3 s, chunk break at 20%, the heat formulas, the wave table and the map counts.

## Open questions for the team

- In co-op, whose save is the room's? What does the guest keep, and whose level resets on a death or a leave?
- Is level 50 meant to be reachable with current scaling? Should collapse damage scale with level so "the city is a weapon" holds late in the campaign?
- What is scrap for once every part and upgrade is owned?
- Should the timing windows be defined in seconds, independent of zoom?
- Can a partner who left be revived, and charged for?
- With accessibility out of scope (GDD-D19), should colour-only cues (red vignette, orange and cyan players) at least go on the backlog list?
