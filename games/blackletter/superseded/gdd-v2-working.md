# Blackletter: Chronos, Game Design Document

Oct 21, 2026 · @kr0

## 0. Document info

| | |
| --- | --- |
| Status | First draft, revised by the gdd-designer pass of 2026-10-21; awaiting kr0's review |
| Owner | kr0 (design director). Section owners are in the table below |
| Last updated | 2026-10-21 |
| Sources of truth | The rulebook of record is `docs/blackletter_chronos_gdd.md` in the repo. Every number here comes from `src/tuning.js` at tuning v2.14.6 unless a row says otherwise |
| Related docs | [Pitch](pitch.md) · [TDD](tdd.md) · [Open questions](open-questions.md) · [Critique](gdd-critique.md) · [GDD decisions](gdd-decisions.md) · [TDD decisions](tdd-decisions.md) |

**Section owners (proposed)**

| Section | Owns | Reviews |
| --- | --- | --- |
| Executive summary, pillars, non-goals | kr0 | All |
| Game mechanics, Systems, Content | Systems designer | AI designer, QA |
| AI architecture | AI designer | Systems designer |
| Modes, UX, accessibility | UX designer (TBD) | Player researcher |
| Experience targets | Player researcher | kr0 |
| Production | kr0 | Engineering |

### Changelog

| Date | Change | Why | Decided by |
| --- | --- | --- | --- |
| 2026-10-21 | Added this Document info block, the glossary and the References appendix | No status, owner, changelog or term list existed | gdd-designer pass; kr0 to confirm |
| 2026-10-21 | Renamed Overview to Executive summary; grouped Core loop, A minute of play and Controls under Game mechanics; renamed Opponents and AI to AI architecture | Match the course's required section names without changing content | gdd-designer pass; kr0 to confirm |
| 2026-10-21 | Wrote the core loop as a numbered list beside the diagram | The diagram is lost in Markdown and some PDF exports | gdd-designer pass |
| 2026-10-21 | Added "A minute of play" walkthrough and a Controls and HUD section with TBDs | The doc never showed play from the player's seat | gdd-designer pass; UX to fill TBDs |
| 2026-10-21 | Pillars: added *A wager of nerve* from the Pitch; kept *Gothic martial realism* (five pillars) | GDD and Pitch disagreed; the Wager traced to no pillar | Proposed, kr0 to decide (GDD-D1) |
| 2026-10-21 | Added Non-goals, drawn from rules already in the doc | None were stated | Proposed, kr0 to decide (GDD-D2) |
| 2026-10-21 | Added a pace-scaling rule with TBDs | Several numbers named no pace | Systems designer to confirm (GDD-D3) |
| 2026-10-21 | Combat as numbered steps plus a worked example | Dense paragraph; odds were hard to read | gdd-designer pass |
| 2026-10-21 | Added sources-and-sinks table; flagged deployment and Morale-restore gaps | Economy edges undefined | gdd-designer pass |
| 2026-10-21 | Wager edge cases and stalemate listed as open questions | Undefined rules | gdd-designer pass |
| 2026-10-21 | AI architecture: three agents (difficulty folded into Sebastion), rows rewritten as what the player sees | "Difficulty" was listed as an agent; some rows described computation | gdd-designer pass (GDD-D4) |
| 2026-10-21 | Experience targets: marked the Grand Tactical length as missing its target; flagged the v2.12 measurement as stale | Contradiction with tuning v2.14.6 | gdd-designer pass |
| 2026-10-21 | Added Content at a glance, Accessibility, Production with a proposed cut line, and a course submission map | Missing sections | Cut line proposed, kr0 to decide (GDD-D5) |
| 2026-10-21 | Filled in from kr0's answers (checked against `src/tuning.js` and `src/engine.js`): the two-pace table, Wager bid clamping, deployment in the Cathedral Zone, the seven trait definitions, the even-nodes stall | Closes Q1, Q4, Q7 and most of Q3; Q2 becomes decision GDD-D6 | kr0 |
| 2026-10-21 | Code pass against the repo (`kr0/blackletter-chronos` at 0a27c17, tuning v2.14.6): answered Q3, Q5, Q6, Q8; filled Controls and HUD and Accessibility; added faction and unit names, opening gauges, Exorcism and Prayer details, the 3D battleground; re-measured match length and the duel triangle | The code is the rulebook's test; the doc had TBDs the code already answers | gdd-designer pass, from code |
| 2026-10-21 | Logged GDD-D7: the setting pillar says "medieval" but the card art shows rifles and jump packs | Art and pillar disagree | Proposed, kr0 to decide |
| 2026-10-21 | Moved the `/experimental/atb` route out of Modes | Implementation detail; belongs in the TDD | gdd-designer pass (TDD-D1) |

### Open questions raised by this revision

The full tracker is [Open questions](open-questions.md). This revision adds:

| # | Question | Owner |
| --- | --- | --- |
| Q1 | ~~Which numbers scale with pace?~~ Answered: see the pace table in Systems | kr0 |
| Q2 | What ends a battle that stalls at even node counts? Nothing does today. Logged as decision GDD-D6 and in Open questions | kr0 |
| Q3 | ~~Wager bids and the frozen clock~~ Answered: bids are clamped; while frozen, nothing moves (see the Wager) | kr0, code |
| Q4 | ~~Where do recruits deploy?~~ Answered: your Cathedral Zone | kr0 |
| Q5 | ~~Does anything restore Morale?~~ Answered: no, Morale only falls | code |
| Q6 | ~~Chapel and Holy Surge; blocked Exorcism pushes~~ Answered: see Terrain and Miracles | code |
| Q7 | ~~Definitions of the seven unit traits~~ Answered: see the Glossary | kr0 |
| Q8 | ~~Controls, keyboard-only play, screen-reader support~~ Answered: see Controls and HUD, Accessibility | code, HUD spec |
| Q9 | Semester cut line (see Production) | kr0 |
| Q10 | Does the setting pillar need rewording to match the art (GDD-D7)? | kr0 |

### Glossary

| Term | Meaning |
| --- | --- |
| ATB gauge | Each unit's Active Time Battle bar. It fills in real time; when full the unit is *ready* |
| Ready unit | A unit with a full gauge, waiting in the Action Queue for an order. It never loses its action |
| Action Queue | The list of ready units, in the order they became ready |
| Initiative (INIT) | How fast a unit's gauge fills; also decides who strikes first in a skirmish |
| Pace | Grand Tactical (default, about 14 min) or Snappy (about 8 min). Changes rates and durations, never dice, stats or costs |
| Clock speed | 1×, 2× or 3×. Changes real time only |
| Muster | The pre-battle screen: choose pace, read how a battle is won, see Sebastion's difficulty |
| Prep | Secret placement of the three starting units |
| Node | A capturable point: the Reliquary or a Fortress |
| Reliquary | The central node: Tithes, Fervor and the Holy Surge blessing for its holder |
| Fortress | A node that pays Tithes and gives cover |
| Cathedral Zone | Your deployment zone: the two back rows of your half (one row on boards under 15 hexes). Sanctuary: no one there can strike or be struck or hold ground, and a unit that leaves can't come back |
| Tithes (₮) | Money. Earned only from nodes. Spent on recruits and upgrade cards |
| Fervor | Faith, capped at 100. Earned in combat, at the Reliquary and when behind. Spent on Miracles and merges |
| Morale | Each side's life total, starting at 20. At 0 the army collapses |
| Bleed | The steady Morale loss of the side holding fewer nodes |
| Miracle | One of three Fervor-paid powers every warband has: Challenge Morale, Prayer, Exorcism |
| Secret Wager | The sealed Morale bid opened by Challenge Morale |
| Blessing | An army-wide buff (45 s Snappy, 75 s Grand Tactical) won in a Wager: Cut Them Down, Hold the Line, Holy Surge |
| Upgrade card | A permanent unit card bought for 6₮ by a ready unit; two at most per unit. "Refit" means buying one |
| Recruit | Buying a new Tier 1 unit with Tithes |
| Trinity Merge | Fusing three same-kind, same-tier units into one of the next tier |
| Tier | A unit's rank, 1 to 3 (Tier 2 Zealot, Tier 3 Arch-Zealot). Tier 2 and 3 exist only through merges |
| Supply cap | At most 8 living units per side |
| Order of the Sun, Crimson Vanguard | The two hosts: blue (Player I, south) and red (Player II, north). Each unit has a flavour name per host, for example the Sun's Templar Halberdier and the Vanguard's Crimson Flailman are both Choppers |
| Zealot, Arch-Zealot | Tier 2 and Tier 3 units, made by Trinity Merges |
| Long range | 7 to 12 hexes: −1 HIT |
| Tab, Auto | Tab selects your next ready unit; the Auto toggle does it after every order |
| Extinction | Losing because a side has no field units for 30 s (50 s at Grand Tactical) |
| Melee (Charge) | Chopper trait. If it survives a ranged attack and can reach the attacker, it charges free and strikes on contact (the Retaliation Charge) |
| Braced | Chopper trait. Always strikes back at adjacent attackers, even against Hit and Run |
| Hit and Run | Jumper trait. When it charges, a target that isn't Braced can't strike back |
| Flank | Jumper trait. +1 attack die if another friendly unit touches the target |
| Trackless | Jumper trait. Ignores Mire and Mine Fields it passes through, though not its start or end hex |
| Suppressing Fire | Shooter trait. Each unsaved hit drains 10% of the target's gauge and pins it, so it can't Retaliation Charge |
| Volley Weapon | Shooter trait. −2 HIT against adjacent targets, attacking or striking back |

## 1. Executive summary

Blackletter: Chronos is a slow real-time tactics game on a hex battlefield, where each unit acts when its Active Time Battle (ATB) gauge fills and armies win by holding ground until the enemy's Morale breaks. It adapts the *Blackletter* tabletop wargame for desktop and phone browsers.

**What makes it fun.** You always know who acts next, and you never lose a turn by being slow, so every order is a considered bet about ground: which node to take, which to hold and which to let go. The Secret Wager adds a poker moment on top, where you can buy a blessing with your own life total.

### Pillars

- **Grand tactics over reflexes.** The clock runs, but slowly: a good decision beats a fast click, and a ready unit never loses its action.
- **Ground is the score.** Pressure comes from the map: more nodes held means steady income and a steady drain on the enemy's Morale.
- **A wager of nerve.** The Secret Wager turns Morale into a sealed bid for a blessing. Bidding high can win the clash and lose the war. *(Added from the Pitch, GDD-D1.)*
- **Gothic martial realism.** Armored holy orders, reliquaries and siege machinery. No high fantasy and no undead; Miracles are acts of faith and discipline.
- **An illuminated manuscript as interface.** Blackletter type, woodcut terrain and Roman Missal ornament.

### Non-goals (proposed, GDD-D2)

- **No reflex play.** No queued orders, standing orders or automatic attacks; every action is a direct order to a ready unit.
- **No kill-count victory.** Killing units helps only through ground and Fervor.
- **No cheating AI.** No difficulty gets extra information or better dice.
- **No high fantasy, undead or spellcasting.** Miracles are acts of faith and discipline.

### Audience and platforms

- **Who:** tabletop wargamers, tactics-RPG players who know Final Fantasy's ATB, and buyers of gothic art games. It also has to work for phone players, RTS players, low-vision keyboard players and Spanish speakers, the seven player personas used in testing.
- **Platforms:** desktop and phone browsers.
- **Languages:** English and Latin American Spanish.

### Win and loss conditions

| Condition | Trigger | Result |
| --- | --- | --- |
| Morale Collapse | A side's Morale (starts at 20) reaches 0, from node bleed or its own Wager bid (a bid can do this only when Morale is a whole number) | That side loses; both at 0 in the same instant is a draw |
| Extinction | A side has no living field units, and its Extinction timer (30 s Snappy, 50 s Grand Tactical) runs out before it deploys one | That side loses; both timers ending together is a draw |

**Known gap: a battle can stall (GDD-D6).** Bleed runs only while one side leads on nodes. With counts even (for example 2 to 2 with one neutral or contested node on a 5-node board) nothing drains Morale, and there is no time limit or tiebreak. Only a Wager, a wipe-out or a new lead breaks it. The simulator stops matches at 20 minutes, but that is a test limit, not a rule. Decision pending: a late-match bleed or a sudden-death node.

## 2. Game mechanics

### Core loop

A match runs muster, prep, then one battle cycle repeated until a side breaks. The cycle has no turns: every unit runs its own gauge, so the player is always reading which unit is next and where it should go.

[embedded content: core loop · muster, prep, then the battle cycle]

1. **Muster.** Pick the pace and read how a battle is won.
2. **Prep, in secret.** Place a Chopper, a Jumper and a Shooter.
3. **The bell rings. A gauge fills.**
4. **Order the ready unit:** move, attack, buy an upgrade card, or hold.
5. **Take and hold nodes.** The side with fewer nodes bleeds Morale.
6. **Earn** Tithes from nodes and Fervor from fighting and the Reliquary.
7. **Spend:** recruit, refit, merge, or cast a Miracle (including the Secret Wager).
8. **Repeat from 3** until one side's Morale reaches 0.

Holding ground pays twice: Tithes and Fervor make the warband stronger, and the node lead drains the enemy's Morale every second.

### A minute of play

*Derived from the rules below, at Snappy pace on the default board.*

The bell rings and your Jumper is already ready: every army opens with its Jumpers' gauges full, Choppers at 55% and Shooters at 30%. You send it six hexes toward the Reliquary, and watch it cross hex by hex; it starts counting toward capture the moment it touches the node, even mid-move. Sebastion's Shooter is on its way too. Your Chopper is ready next; you march it beside the Jumper so you will have more units touching the node. Eight seconds later the Reliquary turns your colour and Tithes start ticking up. On the far side, Sebastion holds one Fortress to your Reliquary, so neither side bleeds yet, but each Reliquary tick adds Fervor. When your Shooter comes up you hold it on a hill, so its next volley gets an extra die. Fervor passes 10, and you weigh a Wager: a 4-Morale bid could buy Hold the Line for the fight at the Reliquary, but it is 4 of your 20.

### Controls and HUD

From the HUD spec (`docs/hud_and_ui_design_specification.md` §5b, §10) and the code.

| Action | Mouse and keyboard | Touch |
| --- | --- | --- |
| Select a ready unit | Click it, or Tab for the next ready unit (Auto does this after each order) | Tap it |
| Move | Click a gold hex (M arms Move) | Tap a gold hex; hold to preview the march, lift to send |
| Attack or charge | A, then click a reticled enemy; or right-click the enemy | Long-press the unit for the action ring, swipe to Attack, tap the target |
| Upgrade, merge | U opens the Armory; G merges | Ring petals: Upgrade (left), Merge (up-left) |
| Recruit | Click a Recruit button, then a lit hex of your Cathedral Zone | The same, in the Recruit tab on phones |
| Miracles | 1 Challenge, 2 Prayer, 3 Exorcism; press again or Enter to cast | Miracle tiles |
| Secret Wager | ← → bid, 1–3 blessing, Enter seals | The seal's − / + buttons and slider |
| Pause, clock speed | Space; 1× / 2× / 3× in the top bar | Pause button; speed buttons |
| Inspect | Hover a unit or hex | Long-press an enemy or an empty hex |

**What the screen shows.** The top bar holds both hosts' Morale with a bleed chip (*▼ 3.0/min*) on the side that is behind, one pip per node in board order, the clock and the speed. Below the board: the Action Queue (ready units first, with how long each has waited), Recruit (Tithes and income) and Miracles (Fervor). A unit panel shows the selected unit's card, stats and orders. Hovering an enemy in Attack mode opens a forecast with the odds, modifiers and whether it can strike back. The Chronicle logs the battle. On a phone the panels become five tabs: Units, Orders, Miracles, Recruit, Log.

**Nudges.** A ready unit left idle for 25 s pulses and a hint names Tab and Auto. When the enemy starts taking your node, a banner names your nearest ready unit (J selects it). At 2× or 3×, two idle units drop the clock back to 1×. Leaving the app pauses the battle.

## 3. Systems

### Time: the ATB clock

Each unit's gauge fills at a rate set by its Initiative. At the default Grand Tactical pace a unit is ready every 25 s (Initiative 4) to 50 s (Initiative 2); at Snappy, every 16 to 31 s. A full unit joins the Action Queue and keeps its action until ordered. Gauges don't fill while a unit is moving. Every move and attack is a direct order to a ready unit: no queued orders, no standing orders, no automatic attacks.

- **Pace presets.** Grand Tactical (default, about 14 minutes) runs the battle at about 0.6 of Snappy (about 8 minutes).
- **Clock speed.** 1×, 2× or 3×, changing real time only.
- **Pause.** Against Sebastion or on one screen, pause any time and still give orders (active pause). Online between two people, each side gets one 1-minute tactical pause, then pauses need the other's consent.

**Pace scaling (GDD-D3).** Grand Tactical overrides these Snappy values (`PACE_PRESETS` in `src/tuning.js`). Elsewhere in this doc, a single value is the Snappy one unless it says otherwise.

| Value | Snappy | Grand Tactical |
| --- | --- | --- |
| Gauge fill, per INIT point | 1.6 %/s | 1.0 %/s |
| Time to ready (INIT 4 to INIT 2) | 16 to 31 s | 25 to 50 s |
| March step (base, per hex) | 1.6 s | 2.6 s |
| Node income | 0.08 ₮/s | 0.05 ₮/s |
| Reliquary Fervor | 0.33/s (+1 every 3 s) | 0.2/s |
| Underdog Fervor, per node behind | 0.15/s | 0.09/s |
| Morale bleed, one-node lead | 0.05/s | 0.03/s |
| Prep | 45 s | 60 s |
| Capture a neutral node | 8 s | 13 s |
| Neutralise an enemy node | 10 s | 16 s |
| Purchase cooldown | 3 s | 5 s |
| Extinction timer | 30 s | 50 s |
| Prayer's heal | over 12 s | over 20 s |
| Blessings | 45 s | 75 s |
| Friendly-pass wait | 8 s | 13 s |

Unchanged by pace: all dice, stats and costs, Wager bids and their 20 s window, and the pause rules.

### Space: movement, terrain and sight

Units walk real hex paths at 3.2 s per hex (Move 3) to 1.6 s (Move 6) at Snappy pace. At Grand Tactical the base march step rises from 1.6 s to 2.6 s (see the pace table). A moving unit occupies the hex it is crossing: it can be shot there and counts for capture there. Line of sight is a straight hex line, blocked by Dense Forest.

### Combat: the skirmish

**The dice rule:** roll a d6 and add the modifier; 7 or more succeeds, and a natural 1 always fails.

1. The striker rolls its ATK in dice, each with its HIT modifier.
2. The target rolls a save for each hit, with its DEF modifier.
3. Each unsaved hit removes DMG in HP.
4. If the defender can reach the attacker, it strikes back. The higher Initiative strikes first; the attacker wins ties.

Modifiers: strikes at 7 hexes or more take −1 HIT. A Chopper that survives a ranged attack may make a free Retaliation Charge. Unit traits (Glossary) change steps 1 and 4.

**Worked example (derived from the rules).** A Shooter (ATK 4, HIT +3, DMG 2) fires at a Chopper (DEF +3, HP 11). Each die hits on 4+ (50%); each hit is saved on 4+ (50%). Expect 1 unsaved hit, 2 HP. Each unsaved hit also drains 10% of the Chopper's gauge and pins it (Suppressing Fire), so a hit Chopper can't Retaliation Charge. It needs about five volleys to fall, unless it closes the gap, where the Shooter's Volley Weapon costs it −2 HIT.

### Economy and conquest

- **Income comes only from nodes.** Each held, uncontested node pays 0.08 Tithes a second. Each side starts with 10 Tithes.
- **Capture.** The side with more units touching a node (on it or adjacent) neutralises an enemy node in 10 s and captures a neutral one in 8 s. Equal numbers contest it: it yields nothing and doesn't move.
- **Cathedral Zones** are sanctuary: a unit there can't strike or be struck, holds no ground, and can never come back once it leaves.
- **Purchases** (recruit, upgrade, merge) share a 3-second cooldown. The supply cap is 8 living units.
- **Deployment.** Starters (during prep) and recruits are placed on a free hex of your own Cathedral Zone. Pick the unit, then a lit hex. With no choice made (keyboard, Sebastion, old logs), the recruit takes the free hex closest to the board's centre.

**Sources and sinks**

| Resource | Sources | Sinks | Limits |
| --- | --- | --- | --- |
| Tithes (₮) | 0.08/s (0.05 at Grand Tactical) per held, uncontested node; 10 at start | Recruit (Chopper 12, Jumper 14, Shooter 14); upgrade card 6 | Supply cap 8 units |
| Fervor | +2 per HP dealt; +1 per HP taken; +1 every 3 s on the Reliquary; +0.15/s per node behind | Challenge Morale 10; Prayer 15; Exorcism 25; Trinity Merge 10 | Cap 100 |
| Morale | None: Morale never rises | Bleed while behind on nodes; your own Wager bid | Starts at 20; 0 loses |

### Morale bleed and comebacks

The side holding fewer nodes bleeds Morale: 0.05 a second for a one-node lead at Snappy pace, each further node adding half the one before (0.075 for two, 0.0875 for three). The side behind captures 25% faster and earns 0.15 extra Fervor a second per node behind. In the match simulator, the Morale lead changed hands 1.9 times per battle with these levers and 1.4 times without.

### Morale Challenge: the Secret Wager

For 10 Fervor, either side freezes the clock and both seal a bid of 0 to 10 Morale. Both lose what they bid. The higher bidder picks a blessing it doesn't hold, for its whole army for 45 s (75 s at Grand Tactical); a tie gives nothing. Online between people the bid window is 20 s; against Sebastion it is untimed. A side holding all three blessings can't call one.

**Bid limits.** The highest bid is 10 or the whole part of your Morale, whichever is lower: with 7.9 Morale you can bid at most 7, and below 1.0 only 0. A larger number is cut down to that limit, and a bid not sealed in time counts as 0. Because fractions are never bid, a bid takes you to 0 only when your Morale is a whole number.

**While the clock is frozen** nothing moves: gauges, marches, capture and every timer stop, and blessing time doesn't count. Against Sebastion the clock stays frozen on the reveal until you resume.

### Fervor and Miracles

Fervor (capped at 100) comes from dealing damage (+2 per HP), taking damage (+1 per HP), holding the Reliquary (+1 every 3 s) and being behind on nodes. It pays for the three Miracles every warband is granted (Challenge Morale, Prayer, Exorcism) and for merges.

### Army escalation

- **Trinity Merge.** Three units of one kind and tier, within 2 hexes, fuse for 10 Fervor into one unit of the next tier: ×3 max HP, +2 ATK, +1 DMG, +1 DEF. Tier 3 is the cap.
- **Upgrades.** A ready unit spends its action and 6 Tithes to take a card; at most 2 cards per unit, no duplicates.

## 4. Content

### Content at a glance

| Type | Count |
| --- | --- |
| Unit kinds | 3 (Chopper, Jumper, Shooter), each in 3 tiers |
| Upgrade cards | 6 (3 for any unit, 1 per unit kind) |
| Terrain types | 6 |
| Node types | 2 (Reliquary, Fortress), plus Cathedral Zones |
| Blessings | 3 |
| Miracles | 3, the same for every warband |
| Battlefield sizes | 4, generated |
| Hosts | 2 (Order of the Sun, Crimson Vanguard), each with its own unit names |
| AI commanders | 1 (Sebastion), 3 difficulties |
| Coach tips | 6, over the first three practice battles |
| Modes | 4, plus the experimental 3D view |

### Units (Tier 1)

| Unit | Role | INIT | MOVE | RNG | ATK | HIT | DEF | DMG | HP | Cost | Traits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chopper | Melee bruiser | 3 | 3 | 1 | 3 | +3 | +3 | 1 | 11 | 12₮ | Melee (Charge), Braced |
| Jumper | Flanker | 4 | 6 | 1 | 4 | +3 | +2 | 1 | 8 | 14₮ | Hit and Run, Flank, Trackless |
| Shooter | Ranged suppression | 2 | 3 | 8 | 4 | +3 | +2 | 2 | 8 | 14₮ | Suppressing Fire, Volley Weapon |

Tier 2 and 3 stats follow the Trinity Merge rule. Trait definitions are in the Glossary.

The intended triangle is Jumper beats Shooter, Shooter beats Chopper, Chopper beats Jumper, with the favoured side winning 65 to 80% of duels. Two legs hold (Jumper 77.5%, Chopper 78.3%). The Shooter vs Chopper leg is broken: the Chopper wins 68.3% (400 duels, tuning v2.14.6, re-run 2026-10-21).

### Upgrade cards (6₮ each, two per unit)

| Card | Who | Change |
| --- | --- | --- |
| Heavy | Any | HP +2, ATK +1, MOVE −1 |
| Elite | Any | HIT +1, HP +1 |
| Horde | Any | HP +5, ATK +1, DEF −1 |
| Steadfast | Shooter | RNG +1, MOVE −1; +1 HIT when it hasn't moved since its last action |
| Devastator | Chopper | HP −2, DMG +1 |
| Raider | Jumper | INIT +1, HIT +1, MOVE +1 |

### Terrain

| Terrain | Effect |
| --- | --- |
| Open ground | None |
| Dense Forest | Blocks sight; units inside are seen only from adjacent hexes; +1 cover |
| Mire | Costs 2 movement |
| Mine Field | Entering or leaving rolls 3d6; 2 HP lost per 6 |
| Hill | Attacking from a hill: +1 attack die against a target not on a hill |
| Chapel | Friendly units on or next to it fill gauges 20% faster. Adds to Holy Surge: both together make gauges fill 50% faster |

### Nodes and blessings

- **Fortress.** +0.08 Tithes a second and +1 cover for its occupant.
- **Reliquary.** +0.08 Tithes a second, +1 Fervor every 3 s, and Holy Surge for the holder.
- **Blessings** (won in a Wager, 45 s). Holy Surge from the Reliquary and from a Wager is one effect, not two: Cut Them Down (+2 HIT, targets save at −1), Hold the Line (+3 to saves), Holy Surge (gauges 30% faster).

### Miracles

| Miracle | Fervor | Effect |
| --- | --- | --- |
| Challenge Morale | 10 | Opens a Secret Wager |
| Prayer | 15 | The two units that have been ready longest give up their turns; every other unit gains 50% gauge, and every unit heals 10 HP over 12 s |
| Exorcism | 25 | A ready unit spends its action to pick a point within 4 hexes. Every enemy within 2 hexes of it is driven 2 hexes straight away, clearing a node and breaking a capture. Marching enemies halt first. A push stops at the board's edge, an occupied hex or a Cathedral Zone; units in sanctuary are untouched. No damage, but a push onto a Mine Field rolls |

### Battlefields

Generated, point-symmetric hex boards: 11, 15, 21 (default) or 25 hexes across, with 3, 5, 5 or 7 nodes. An odd node count means someone holds the majority whenever every node is owned; contested or neutral nodes can still leave sides even, and an even split can stall the battle (see Win and loss conditions). The experimental 3D view has its own battleground: 81 hexes across (radius 40), five nodes 19 to 20 hexes apart, with rivers, fords and roads.

## 5. AI architecture: opponents and in-match agents

The player fights another person or **Sebastion, Abbot of the Ashlands**. Three in-match agents shape what they face. This section covers what the player experiences; how each is built is in the [TDD](tdd.md).

| Agent | What the player sees it do |
| --- | --- |
| **Sebastion**, the computer commander | Sends each unit toward a node worth fighting for, races for the Reliquary early, keeps Choppers beside his Shooters, and takes the fight he expects to win. He recruits until he fields 5 units, then refits. He calls a Wager at most once every 2 minutes, never when you are below 10 Morale, and bids what the blessing is worth to him. |
| **Counsel**, the referee's adviser | In the Game Master view, shows Sebastion's top three options for any selected unit, so a learner or referee can see why a move is good. |
| **The Coach**, the tutor | In the first three practice battles, opens six tips at the moment they matter, pausing the clock while each is open, and keeps Recruit and Miracles veiled until their tip. It holds Sebastion back from contested nodes until you capture one or 120 s pass. |

**Sebastion's difficulty levels**

| Level | What you notice |
| --- | --- |
| Easy | Hesitates 8 to 22 s at the start, often takes a Fortress before the Reliquary, issues orders slowly (one every 2.5 s), picks a second-best move about half the time, never buys upgrade cards, and calls Wagers and Miracles less often. |
| Normal | Answers your moves almost at once (within a quarter second) and rarely wastes a move. |
| Hard | Reacts faster still, moves several units at once, and builds a 7-unit warband before refitting. |

**Fairness rule.** Sebastion sees only what his seat may see: never the player's sealed bid or hidden prep placements. He gives orders through the same commands as a player, and his strength comes from attention, not information. No level gets extra information or better dice.

**Why he isn't a language model.** He has to answer within a quarter second, many times a minute, and replay identically. So all three agents are plain code: a match costs no tokens and any battle can be replayed exactly. Model calls happen only around the match (see TDD).

**Known gap.** Across six rounds of synthetic playtests, every persona lost the opening node race to Normal Sebastion, 42 battles of 42. Playtest 3 with people should tell whether Normal is too strong for a first match or the agents were simply slow.

## 6. Modes, onboarding and experience targets

### Modes

| Mode | Who | Notes |
| --- | --- | --- |
| Practice vs Sebastion | One player, in the browser | Coached for the first three battles; pause and active pause allowed |
| Online vs Sebastion | One player; the server plays him | Same pause rules as practice |
| Online, two players | Invite code | Pace and speed locked in the lobby; one tactical pause each; auto-pause on disconnect, forfeit claim after 3 minutes |
| Game Master | One screen, both warbands | Hand-off screen for sealed bids; counsel overlay; Sebastion can command either side or both |
| Experimental 3D view | One player vs Sebastion, desktop only | Same rules on an 81-hex battleground with prep, Miracles, the Armory and the Wager. **Wait mode** stops the clock whenever one of your units is ready. Odds shown as percentages instead of dice |

### Onboarding

The muster opens with a three-step summary: place your warband, take and hold nodes, spend Fervor. The Coach then teaches six beats in the first battle: the pace, take a node, hold more than they do, strike, recruit, spend Fervor. A full rules sheet (Rules of War) and a Card Codex are available at any time. This is Chapter I of a tutorial; Chapters II to VI are scripted (`docs/tutorial_script.md`) but not built. Before a battle, local players can also change starting Tithes and Morale, prep time, capture time, readiness speed and node income in Settings.

### Accessibility

- **No colour-only cues.** Nodes are diamonds (Fortresses) and a circle (the Reliquary); contested nodes are dashed; the two host colours were checked for colour-vision deficiency.
- **Keyboard-only play.** Every order has a key. While an order is armed, the arrow keys move a hex cursor, `,` and `.` jump between valid targets, Enter sends and Esc cancels.
- **Screen readers.** The hex cursor announces the hex, its terrain and its occupant in a live region, and other live regions announce events such as pushes and deaths. A full screen-reader audit hasn't been done.
- **Text size.** Normal or Large in Battle settings: Large makes interface text 20% bigger and board labels 25% bigger, with an 11 px floor that becomes 13 px.
- **Reduced motion.** The board honours the system's reduced-motion setting.
- **Time.** Pause and active pause let anyone take as long as they need against Sebastion.
- **Touch.** Targets are at least 44 px, with one hex of tolerance around each unit.
- **Languages.** English and Latin American Spanish.

### Experience targets

| Target | Measure | Now |
| --- | --- | --- |
| A battle lasts 8 to 12 minutes | Self-play sweeps | 9.9 ± 1.1 min at Snappy (on target) and 14.5 ± 1.2 min at Grand Tactical (**the default misses the target**). 24 paired seeds each, tuning v2.14.6, re-run 2026-10-21; no battle hit the 40-minute cap |
| First meaningful order within 60 s | Persona rubric, First minutes | 4.0 of 5 |
| State readable at a glance | Persona rubric, Legibility | 4.0 of 5 |
| Every input answers | Persona rubric, Control and feedback | 3.5 of 5 |
| Decisions feel like they matter | Persona rubric, Depth and agency | 3.2 of 5 |
| Wants a rematch | Persona rubric, Fun and pull | 3.2 of 5 |
| No colour-only cue, targets at least 44 px on touch | Persona rubric, Accessibility | 3.4 of 5 |

The weakest persona scores are Pace (3.0), Depth (3.2) and Fun (3.2), and those are the ones human playtests most need to confirm.

## 7. Production

### Milestones

| Milestone | State |
| --- | --- |
| Playable 2D build with four modes, Sebastion and the Coach | Done (dev site); 544 tests pass |
| Six rounds of synthetic playtests | Done |
| Playtest 3 with real players | Next |
| Real-device performance budget for phones and iPad | Open |
| Experimental 3D view | Playable locally on desktop: battleground, prep, Miracles, Armory, Wager. Not yet: online play, phones, final unit art |

### Semester cut line (proposed, GDD-D5)

- **Ships:** the 2D board, all four modes, Sebastion at three difficulties, the Coach, and balance fixes from Playtest 3.
- **Does not ship this semester:** the 3D view, authored maps, warband-chosen Miracles, ranked or tournament rules.

### Risks

Tracked in [Open questions](open-questions.md). The top three: Normal Sebastion may be too strong for a first match; pace scores lowest of all rubrics; the Shooter vs Chopper leg is broken.

## Appendix A: references

- [Pitch](https://claude.ai/artifact/6K9kGsC9QjUM47LxcgBcda), with the card art and the muster screen
- [TDD](https://claude.ai/artifact/TXbyfkKFiWf4wEpVSC6g4K): architecture, agents, token budget, API constraints
- [Open questions](https://claude.ai/artifact/EFixfSV8SjVhMSHVSMDx3i)
- Playable build: [blackletter-kr0nos-dev.web.app](https://blackletter-kr0nos-dev.web.app) (private, behind Google sign-in)

## Appendix B: course submission map (Assignment #01)

| Required section | Where it is |
| --- | --- |
| Executive Summary | §1 |
| Game Mechanics | §2, with the rules in §3 and §4 |
| AI Architecture | §5 |
| Technical Strategy (agent roles, token budget, API constraints) | The TDD's Agent architecture and Token budget sections. **Gaps:** the 13 studio roles are counted but not named; the development token budget is missing (TDD-D2, TDD-D3) |
