# GDD template

Last updated: 23 October 2026 · Owner: game-designer

The default outline for every studio GDD, taken from the [GDD designer skill](skills/gdd-designer/SKILL.md). Drop sections that don't apply and add ones the game needs. Mark unknown values `TBD (owner)` and proposed ones `proposed`.



```
0) Document info
   - Status / last updated / owner
   - Changelog (date, change, reason, decided by)
   - Open questions
   - Glossary (once needed)

1) Overview
   - One-sentence pitch (elevator pitch, one paragraph max for the vision)
   - What makes it fun
   - Target audience
   - Platforms
   - Player fantasy
   - Design pillars (3–5)
   - Non-goals

2) Core gameplay
   - Core loop (short list, e.g. explore → fight → loot → upgrade → repeat)
   - Secondary / meta loops
   - Controls summary
   - Win / lose conditions
   - Game modes

3) Systems (rules, numbers, constraints, edge cases)
   - Movement
   - Combat
   - Progression
   - Economy
   - AI
   - Difficulty and balancing notes

4) Content (with explicit counts)
   - Levels / maps
   - Characters / classes
   - Enemies
   - Items
   - Narrative beats

5) UX and UI
   - Player journey (flow)
   - Wireframes / UI flows (link or describe)
   - HUD requirements
   - Menus
   - Accessibility

6) Production
   - Milestones
   - Risks and unknowns
   - Dependencies

7) Marketing and monetization
   - Positioning
   - Competitors / comparables
   - Pricing / business model

Appendix: references (art, video, prototypes, linked docs)
```

For each system, prefer this shape:

```
### <System name>
Purpose: which pillar / loop step this serves
Rules: bullet list of how it works
Values: table of tunables (placeholder values marked TBD with an owner)
Edge cases: what happens when ... 
Interactions: other systems it touches
Open questions:
```

Every GDD links to its pitch, TDD, open questions, tuning history and decision histories at the bottom, and to its art in `art/<name>/`.
