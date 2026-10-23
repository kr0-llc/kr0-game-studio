# Blackletter: Chronos, Game Design Document

Oct 21, 2026 · @kr0

## Overview

Blackletter: Chronos is a slow real-time tactics game on a hex battlefield, where each unit acts when its Active Time Battle (ATB) gauge fills and armies win by holding ground until the enemy's Morale breaks. It adapts the *Blackletter* tabletop wargame for desktop and phone browsers. The rulebook of record is `docs/blackletter_chronos_gdd.md` in the repo, and every number here comes from `src/tuning.js` at tuning v2.14.6.

### Pillars

- **Grand tactics over reflexes.** The clock runs, but slowly: a good decision beats a fast click, and a ready unit never loses its action.
- **Ground is the score.** Pressure comes from the map: more nodes held means steady income and a steady drain on the enemy's Morale.
- **Gothic martial realism.** Armored holy orders, reliquaries and siege machinery. No high fantasy and no undead; Miracles are acts of faith and discipline.
- **An illuminated manuscript as interface.** Blackletter type, woodcut terrain and Roman Missal ornament.

### Audience

Tabletop wargamers, tactics-RPG players who know Final Fantasy's ATB, and buyers of gothic art games. The game also has to work for phone players, RTS players, low-vision keyboard players and Spanish speakers, the seven player personas used in testing.

### Win conditions

| Condition | Trigger | Result |
| --- | --- | --- |
| Morale Collapse | A side's Morale (starts at 20) reaches 0, from node bleed or its own Wager bids | That side loses; both at 0 in the same instant is a draw |
| Extinction | A side has no living field units, and its 30-second Extinction timer runs out before it deploys one | That side loses; both timers ending together is a draw |

## Core loop

A match runs muster, prep, then one battle cycle repeated until a side breaks. The cycle has no turns: every unit runs its own gauge, so the player is always reading which unit is next and where it should go.

&#91;embedded content: core loop · muster, prep, then the battle cycle\]

Holding ground pays twice: Tithes and Fervor make the warband stronger, and the node lead drains the enemy's Morale every second.

## Systems

### Time: the ATB clock

Each unit's gauge fills at a rate set by its Initiative. At the default Grand Tactical pace a unit is ready every 25 s (Initiative 4) to 50 s (Initiative 2); at Snappy, every 16 to 31 s. A full unit joins the Action Queue and keeps its action until ordered. Gauges don't fill while a unit is moving. Every move and attack is a direct order to a ready unit: no queued orders, no standing orders, no automatic attacks.

- **Pace presets.** Grand Tactical (default, about 14 minutes) runs the battle at about 0.6 of Snappy (about 8 minutes).
- **Clock speed.** 1×, 2× or 3×, changing real time only.
- **Pause.** Against Sebastion or on one screen, pause any time and still give orders (active pause). Online between two people, each side gets one 1-minute tactical pause, then pauses need the other's consent.

### Space: movement, terrain and sight

Units walk real hex paths at 3.2 s per hex (Move 3) to 1.6 s (Move 6) at Snappy pace, slower at Grand Tactical. A moving unit occupies the hex it is crossing: it can be shot there and counts for capture there. Line of sight is a straight hex line, blocked by Dense Forest.

### Combat: the skirmish

The dice rule: roll a d6, add the modifier, succeed on 7 or more, and a natural 1 always fails. The striker rolls ATK dice with its HIT; the target saves each hit with its DEF; each unsaved hit removes DMG. If the defender can reach the attacker, it strikes back, the higher Initiative striking first and the attacker winning ties. Strikes at 7 hexes or more take −1 HIT. A Chopper that survives a ranged attack may make a free Retaliation Charge.

### Economy and conquest

- **Income comes only from nodes.** Each held, uncontested node pays 0.08 Tithes a second. Each side starts with 10 Tithes.
- **Capture.** The side with more units touching a node (on it or adjacent) neutralises an enemy node in 10 s and captures a neutral one in 8 s. Equal numbers contest it: it yields nothing and doesn't move.
- **Cathedral Zones** are sanctuary: a unit there can't strike or be struck, holds no ground, and can never come back once it leaves.
- **Purchases** (recruit, upgrade, merge) share a 3-second cooldown. The supply cap is 8 living units.

### Morale bleed and comebacks

The side holding fewer nodes bleeds Morale: 0.05 a second for a one-node lead at Snappy pace, each further node adding half the one before. The side behind captures 25% faster and earns 0.15 extra Fervor a second per node behind. In the match simulator, the Morale lead changed hands 1.9 times per battle with these levers and 1.4 times without.

### Morale Challenge: the Secret Wager

For 10 Fervor, either side freezes the clock and both seal a bid of 0 to 10 Morale. Both lose what they bid. The higher bidder picks a blessing it doesn't hold, for its whole army for 45 s; a tie gives nothing. Online between people the bid window is 20 s; against Sebastion it is untimed. A side holding all three blessings can't call one.

### Fervor and Miracles

Fervor (capped at 100) comes from dealing damage (+2 per HP), taking damage (+1 per HP), holding the Reliquary (+1 every 3 s) and being behind on nodes. It pays for the three Miracles every warband is granted (Challenge Morale, Prayer, Exorcism) and for merges.

### Army escalation

- **Trinity Merge.** Three units of one kind and tier, within 2 hexes, fuse for 10 Fervor into one unit of the next tier: ×3 max HP, +2 ATK, +1 DMG, +1 DEF. Tier 3 is the cap.
- **Upgrades.** A ready unit spends its action and 6 Tithes to take a card; at most 2 cards per unit, no duplicates.

## Content

### Units (Tier 1)

| Unit | Role | INIT | MOVE | RNG | ATK | HIT | DEF | DMG | HP | Cost | Traits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chopper | Melee bruiser | 3 | 3 | 1 | 3 | +3 | +3 | 1 | 11 | 12₮ | Melee (Charge), Braced |
| Jumper | Flanker | 4 | 6 | 1 | 4 | +3 | +2 | 1 | 8 | 14₮ | Hit and Run, Flank, Trackless |
| Shooter | Ranged suppression | 2 | 3 | 8 | 4 | +3 | +2 | 2 | 8 | 14₮ | Suppressing Fire, Volley Weapon |

The intended triangle is Jumper beats Shooter, Shooter beats Chopper, Chopper beats Jumper, with the favoured side winning 65 to 80% of duels. Two legs hold (77.5% and 78.3%). The Shooter vs Chopper leg is broken: the Chopper wins 66.8%.

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
| Mine Field | Entering rolls 3d6; 2 HP lost per 6 |
| Hill | +1 attack die against a target not on a hill |
| Chapel | Friendly units on or next to it fill gauges 20% faster |

### Nodes and blessings

- **Fortress.** +0.08 Tithes a second and +1 cover for its occupant.
- **Reliquary.** +0.08 Tithes a second, +1 Fervor every 3 s, and Holy Surge for the holder.
- **Blessings** (won in a Wager, 45 s): Cut Them Down (+2 HIT, targets save at −1), Hold the Line (+3 to saves), Holy Surge (gauges 30% faster).

### Miracles

| Miracle | Fervor | Effect |
| --- | --- | --- |
| Challenge Morale | 10 | Opens a Secret Wager |
| Prayer | 15 | Two ready units give up their turns; every other unit gains 50% gauge, and the warband heals 10 HP over 12 s |
| Exorcism | 25 | Every enemy within 2 hexes of a chosen point is driven 2 hexes away, clearing a node and breaking a capture |

### Battlefields

Generated, point-symmetric hex boards: 11, 15, 21 (default) or 25 hexes across, with 3, 5, 5 or 7 nodes. An odd node count means someone always holds the majority. Authored maps up to about 40 hexes long are planned for the experimental 3D view.

## Opponents and AI

The player fights another person or **Sebastion, Abbot of the Ashlands**, and three in-match agents shape what they face. How each is built is in the TDD; this section covers what the player experiences.

| Agent | What the player sees it do |
| --- | --- |
| **Sebastion** | Sends each unit toward a node worth fighting for, races for the Reliquary early, keeps Choppers beside his Shooters, and picks the attack with the best expected exchange. He recruits until he fields 5 units, then refits. He calls a Wager at most once every 2 minutes, never against a player below 10 Morale, and bids what a blessing is worth to him. |
| **Difficulty** | Easy hesitates 8 to 22 s at the start, often goes for a Fortress before the Reliquary, gives one order every 2.5 s, takes a lesser option half the time and never refits. Normal looks every 0.25 s. Hard looks every 0.1 s, gives up to 6 orders per look and builds a 7-unit warband before refitting. No level gets extra information or better dice. |
| **Counsel** | In the Game Master view, shows Sebastion's top three options for any selected unit, so a learner or referee can see why a move scores well. |
| **The Coach** | In the first three practice battles, opens six tips at the moment they matter, pausing the clock while each is open, and keeps Recruit and Miracles veiled until their tip. It holds Sebastion back from contested nodes until the player captures one or 120 s pass. |

**Fairness rule.** Sebastion sees only what his seat may see: never the player's sealed bid or hidden prep placements. He gives orders through the same commands as a player, and his strength comes from attention, not information.

**Known gap.** Across six rounds of synthetic playtests, every persona lost the opening node race to Normal Sebastion, 42 battles of 42. Playtest 3 with people should tell whether Normal is too strong for a first match or the agents were simply slow.

## Modes, onboarding and experience targets

### Modes

| Mode | Who | Notes |
| --- | --- | --- |
| Practice vs Sebastion | One player, in the browser | Coached for the first three battles; pause and active pause allowed |
| Online vs Sebastion | One player; the server plays him | Same pause rules as practice |
| Online, two players | Invite code | Pace and speed locked in the lobby; one tactical pause each; auto-pause on disconnect, forfeit claim after 3 minutes |
| Game Master | One screen, both warbands | Hand-off screen for sealed bids; counsel overlay; Sebastion can command either side or both |
| Experimental 3D view | One player vs Sebastion | `/experimental/atb`: same engine on a diorama map, FF7-style menus, odds shown as percentages instead of dice |

### Onboarding

The muster opens with a three-step summary: place your warband, take and hold nodes, spend Fervor. The Coach then teaches six beats in the first battle: the pace, take a node, hold more than they do, strike, recruit, spend Fervor. A full rules sheet and a Card Codex are available at any time.

### Experience targets

| Target | Measure | Now |
| --- | --- | --- |
| A battle lasts 8 to 12 minutes | Self-play sweeps | About 8 (Snappy) and 14 (Grand Tactical, the default), sim at tuning v2.12 |
| First meaningful order within 60 s | Persona rubric, First minutes | 4.0 of 5 |
| State readable at a glance | Persona rubric, Legibility | 4.0 of 5 |
| Every input answers | Persona rubric, Control and feedback | 3.5 of 5 |
| Decisions feel like they matter | Persona rubric, Depth and agency | 3.2 of 5 |
| Wants a rematch | Persona rubric, Fun and pull | 3.2 of 5 |
| No colour-only cue, targets at least 44 px on touch | Persona rubric, Accessibility | 3.4 of 5 |

The weakest persona scores are Pace (3.0), Depth (3.2) and Fun (3.2), and those are the ones human playtests most need to confirm.
