# Blackletter: Chronos open questions

Oct 23, 2026 · @kr0

## Decided so far

The GDD and TDD reflect every decision below. The reasoning behind each is in the [GDD decision history](gdd-decisions.md) and the [TDD decision history](tdd-decisions.md).

| Date | Decision |
| --- | --- |
| 2026-10-21 | Blackletter gets the studio's seven documents, rewritten from the experimental build's rules at tuning v2.14.6 |
| 2026-10-21 | One pace for the game: a battle runs about 14 minutes. Dice, stats and costs never change with timing |
| 2026-10-21 | Five pillars: Grand tactics over reflexes, Ground is the score, A wager of nerve, Gothic martial realism, An illuminated manuscript as interface |
| 2026-10-21 | The setting is armoured holy orders with halberds, rifles and jump packs, matching the card art. No high fantasy, no undead |
| 2026-10-21 | Non-goals: no reflex play, no kill-count victory, no cheating AI |
| 2026-10-21 | Wager bids are clamped to 10 or the whole part of your Morale; the frozen clock stops everything |
| 2026-10-21 | Shooter INIT 3 restores Shooter beats Chopper; the free Retaliation Charge was not the cause |
| 2026-10-21 | A merged unit keeps the chosen unit's upgrade cards; the other two units' cards are lost |
| 2026-10-21 | Starters deploy on a free hex of your own Cathedral Zone |
| 2026-10-23 | This studio folder is the canonical design; the repo is the build and its docs are build notes |
| 2026-10-23 | Forward recruiting: a Fortress held unbroken for 75 s opens the hexes within 2 of it for recruits |
| 2026-10-23 | Interrupt: a unit struck on the march owes half a gauge, paid from its next fill |
| 2026-10-21 | Morale never rises. Prayer heals HP, not Morale |
| 2026-10-21 | Three in-match agents (Sebastion, Counsel, the Coach), all plain code. Difficulty is a property of Sebastion: attention, never information |
| 2026-10-21 | Semester cut line: 2D board, four modes, Sebastion ×3, the Coach, the Wager. No 3D view, authored maps, chosen Miracles or ranked rules |
| 2026-10-21 | Twelve named development agents and a 44.1M-token budget with a 40% rework reserve |
| 2026-10-21 | The prototype uses a late-match bleed (both sides bleed from 20:00) as a placeholder for the stall fix |

## Design questions

The first three are settled by the first human playtest, in sprint 3.

- [ ] Is Normal Sebastion too strong for a first match? Every synthetic persona lost the opening node race, 42 battles of 42. If people do too, Easy becomes the default for a first battle.
- [ ] Is the pace right? Self-play runs 14.5 minutes; the target is 12 to 16 (GDD-D14), but the RTS persona finds it slow and the phone persona finds it long. Sprint 1 sweeps gauge fill and bleed first, and re-measures battle length with the faster Shooter.
- [ ] Do decisions feel like they matter? Depth and Fun both score 3.2 of 5 with synthetic players, who don't yet see why they lost.
- [ ] Is the proposed late bleed (0.02/s from 20:00) the right stall fix, or a sudden-death node? Sprint 2 sweeps.
- [ ] Does Shooter INIT 3 still hold with Interrupt? The duel sweep that chose it ran at v2.14.6; Interrupt also helps shooters, so INIT 3 may now overshoot. Re-run the duel sweep on the build's 4.0.0 with INIT 3 before the build adopts it.
- [ ] The build still differs from this design in four places: it runs two paces (Snappy and Grand Tactical) and is adding pace buttons, it keeps Shooter INIT 2, it has no late bleed, and its main game is now the ATB field view rather than the 2D board in the semester cut line. Bring the build in line, or reopen the single-pace decision?
- [ ] The build's docs carry a third draft of the pillars (Command the field, Read every battle, Fortune favours the bold, An illuminated holy war). Keep the five here, or adopt that draft?
- [ ] Should warbands choose their Miracles before battle? Deferred past the semester.
- [ ] Should competitive online play restrict pausing and clock speed? Deferred to ranked rules.

## Technical questions

- [ ] What is the frame budget on a mid-range phone and an iPad? Set in sprint 2 with a real device.
- [ ] What would make Hard smarter, not just faster? Hard differs from Normal only in reaction speed and beats it 26 of 46. Needs new decision logic (lookahead on node races), not weights.
- [ ] How many tokens does a synthetic playtest round cost? Measured in sprint 1 and written into the tuning history.
- [ ] Which backend hosts online rooms after the semester?

## Scope and production questions

- [ ] Which concept art pieces go into the pitch? The key art and the Sebastion portrait are the likely pair.
- [ ] Does the course's capstone template need the GDD sections reordered? The GDD keeps Executive summary, Game mechanics, AI architecture and the TDD's Technical strategy under those names.
