# Dropfront GDD

Oct 20, 2026 · @kr0

## Overview

This document defines how Dropfront plays: its loop, systems, cards and rules. The pitch, the build plan (TDD) and open questions each have their own tab. Values marked *proposed* are untested; the [prototype](https://claude.ai/artifact/UZXJnMj6NDnuH5UEUUS5sP) uses them unless noted.

**Design goals**

- **Every turn is a trade.** Energy is short. Squads, tactics, gear and drop-ins all compete for it.
- **Short bursts, big stakes.** A drop-in lasts 20 seconds and can flip the match.
- **Gear for the situation.** Play gear cards to equip your hero, up to 2 at a time. Discard one to make room for what the next fight needs.
- **A match lasts 5 to 8 minutes.** Long enough to cycle the deck several times, short enough for one more. 8:00 is a hard cap.

**Setting:** a dieselpunk war. Rival armies fight over an industrial outpost with trench-era weapons, armored walkers and bombers.

**Changelog**

| Date | Change | Why |
| --- | --- | --- |
| Oct 20 | Title Dropfront; dieselpunk setting; Orbital strike renamed Bomber run | Settled in the open questions review |
| Oct 20 | Gear equips when played, 2 in play, discard to swap; no locker or pick screen | Gear works like normal cards in play |
| Oct 20 | Map runs at 25% during drop-ins; regroup cut to 20s | Leaving the map should cost a little |
| Oct 20 | Enemy commander plays a full mirror of your tactic cards | It should play the same game as you |
| Oct 20 | Win at 2000 with an 8:00 real-time cap | Drop-ins pushed matches past 8 minutes |
| Oct 20 | Enemy squads are free on a timer; its energy pays for tactics and its champion | Its energy couldn't cover a squad every 5 seconds |
| Oct 20 | Edge-case rules: ties, overflow enemies, player death, no gear | Gaps found in design review |
| Oct 20 | Enemy champion can drop into fights | Make the enemy play the same game as you |
| Oct 20 | Points renamed Watchtower, Quarry, Foundry, Refinery, Docks | Original names were borrowed |
| Oct 20 | Pitch, TDD and open questions split into their own tabs | Keep the GDD to rules |

## Core loop

A match runs in real time for 5 to 8 minutes, with a command turn every 15 seconds of map time.

&#91;embedded content: core loop · 6 steps\]

1. **Command turn.** Discard what's left in your hand, draw 5 and refill to 3 energy. Unspent energy is lost.
2. **Spend.** Play squads and tactics on points, equip gear on your hero, or scrap cards for +1 energy each.
3. **Map runs.** Bots walk the roads, fight at points and move capture meters. The enemy commander sends squads, plays tactics and drops its champion into fights.
4. **Drop in.** Any point with enemies on it can be dropped into for 2 energy. You fight for 20 seconds with your equipped gear while the map runs at 25% speed. Your hero then regroups for 20 seconds.
5. **Resolve.** Survivors go back to the point. Clear every enemy and the point is yours and locked for 10 seconds.

## Systems

### Winning

- Each owned point scores **2 resources per second** of map time. The first side to **2000** wins.
- **Time limit:** at **8:00** of real time (drop-ins included), the higher score wins.
- **Ties:** if both sides pass 2000 on the same tick, or the scores are equal at 8:00, whoever holds more points wins. If that is also tied, the next point to change owner decides it.
- **Expected length (proposed, to be checked by the headless runner):**

| Points held by the leader | Map time to 2000 | Real time with about 6 drop-ins |
| --- | --- | --- |
| 5 | 3:20 | 4:50 |
| 4 | 4:10 | 5:40 |
| 3 | 5:33 | 7:03 |
| 2 or fewer | Over 8:00 | Time limit decides |

### Map and capture

- One map with five points: **Watchtower**, **Quarry**, **Foundry** (center), **Refinery** and **Docks**. Eight roads connect them, and each side has a home base off the map's edge.
- Each point has a capture meter from -100 (enemy) to +100 (you). One side alone on a point moves the meter at 10 plus 3 per bot each second. With both sides there, it moves 2 per second for each bot of difference, toward the bigger side.
- At +100 or -100 the point is owned. It turns neutral when the meter crosses 0.
- **Locked** means the meter can't move. Bots still fight there.

### Bots and combat

- Squads spawn at home and walk to their target at 55 units per second (heavies walk at 42). The map is 800 by 500 units.
- When both sides are on a point, each side builds up losses at 0.11 per enemy bot per second. A bot dies each time a side's total reaches 1.0.
- Heavies deal double losses while defending a point you own. They die after your rifle bots at that point.
- You never control bots directly. Cards are the only way to steer them.

### Energy and drop-in limits

- You get 3 energy each turn. Unspent energy is lost. Overclock (+2) and 2 scraps can raise one turn to **7 at most**.
- During a drop-in the map runs at **25% speed**, so the battle keeps moving while you fight.
- After a drop-in your hero **regroups for 20 seconds** of map time (40 if you went down).

### Enemy commander

- **Squads are free.** Every 4 to 6 seconds it sends 2 to 3 bots. It scores each point: defend owned points under attack, take neutral ones, hit your weak ones, prefer what's close. A little randomness keeps it from being predictable. Feint makes it chase the point you choose for 8 seconds.
- **Energy.** It gains 3 energy per turn (cap 6) and spends it on tactics and champion drop-ins.
- **Tactics.** It plays a full mirror of your tactic cards (Feint, Rally, Hold the line, Flare, Sabotage, Overclock) from its own deck. Each one shows on the map for 2 seconds so you can read it.
- **Champion drop-in** (2 energy). It drops its champion into a point it owns with 3 or more of your bots on it, or a point it's attacking whose meter is at neutral or better for it. Earliest drop: 0:45.
- **On the map,** the champion counts as 4 bots at that point for 20 seconds and can't be killed there.
- **If you drop into that point,** you fight the champion: 15 HP, faster than bots, and 2 gear the commander picks at the start of the match.
- **Ramp-up.** After 3:00 of map time its squads get one bot bigger. After 5:00 it sends a second squad with each decision.

**Champion edge cases**

- Beaten means its HP reaches 0. It then can't drop in again for 30 seconds.
- If it survives your drop-in, it stays on the map until its 20 seconds run out, then rests for 10.
- Its 20-second timer runs on map time, so it slows to 25% during your drop-ins.
- Only one champion is on the map at a time, and it can't drop into the point you're fighting at.

### Drop-in firefight

- **Gear:** you fight with whatever gear is equipped (0 to 2 pieces). There is no pick screen.
- **Arena:** top-down, four cover walls, and a capture circle in the middle. It lasts 20 seconds while the map runs at 25%.
- **Base rifle:** 1 damage, about 6 shots per second, range about 500 units. Bots have 3 HP and you have 10.
- **Who fights:** up to 6 of your bots and 8 enemies from that point, plus the champion if it's there. Bots that arrive at the point during the fight wait outside.
- **The fight ends** when time runs out, when every enemy in the arena is down, or when you go down.

**Outcomes**

| Result | Effect on the point |
| --- | --- |
| Every enemy down, none left outside the arena | Yours, locked for 10 seconds |
| Every enemy down, some left outside (over 8) | Meter moves 50 your way; the rest stay |
| Time runs out, you're on the capture circle | Meter moves 25 your way |
| Time runs out elsewhere | No change; survivors go back |
| You go down | Survivors go back; 40-second regroup |

## Cards

There are three card types. Squads put bots on the map, tactics bend the battle, and gear unlocks tools for your hero.

### Gear: equip, discard to swap

- Playing a gear card **equips** it on your hero. It stays in play, out of your hand and deck, until you discard it.
- Up to **2** gear can be in play. With 2 equipped, discard one before playing another.
- **Discarding** equipped gear is free and can be done any time on the command map, never during a drop-in. It goes to your discard pile and comes back when the deck reshuffles.
- Both equipped gear are active in every drop-in.
- Equipping gear thins your deck, so squads and tactics come up more often.
- Between matches, all gear returns to your deck.

### Scrap for energy

- Scrap any card in your hand for **+1 energy**, up to **2 scraps per turn**. Scrapped cards go to the discard pile.
- Scrapping turns a dead hand into a drop-in. Two scraps take you to 5 energy, enough for a drop-in and a Reinforcement wave in the same turn.

### Starter deck (17 cards)

| Card | Cost | Type | Effect | Target |
| --- | --- | --- | --- | --- |
| Rifle squad (x3) | 1 | Squad | Send 3 bots | Any point |
| Rushers | 1 | Squad | 2 bots appear instantly | A point connected by road to one you hold |
| Heavy squad | 2 | Squad | Send 2 heavies; they deal double losses while defending | Any point |
| Sniper nest | 2 | Squad | +1 bot; kills 1 enemy bot every 1.5s on squads within 140 units | A point you hold |
| Reinforcement wave | 3 | Squad | 6 bots appear instantly | A point you hold |
| Feint | 0 | Tactic | Enemy commander chases this point for 8s | Any point |
| Rally | 1 | Tactic | Your bots on connected points march here | Any point |
| Hold the line | 1 | Tactic | Freeze the capture meter for 10s | A fought-over point |
| Flare | 1 | Tactic | Draw 2 | None |
| Sabotage | 2 | Tactic | Point stops scoring for 20s | An enemy point |
| Overclock | 1 | Tactic | +2 energy next turn; exhausts | None |
| Shotgun | 2 | Gear | Your gun fires a 5-pellet close-range blast | Equip |
| Jump pack | 1 | Gear | 3 dashes per drop-in; kills recharge one | Equip |
| Medic drone | 1 | Gear | Heal 1.2 HP per second while on the capture circle | Equip |
| Bomber run | 3 | Gear | Once per drop-in: mark an area that is bombed 2s later | Equip |

*Exhausts* means the card leaves your deck for the rest of the match.

## Run structure and controls

### Run

- A run is 3 matches, at most 24 minutes. Lose a match and the run ends.
- After each win, draft 1 of 3 cards from a pool of **20** (proposed) into your deck.
- The champion's gear comes from the same 4 gear you can unlock.
- **Per-match ramp (proposed):** match 2 squad timer -0.5s and +1 bot per squad; match 3 the same again, and the champion gets 20 HP.

### Controls

| Action | Mouse and keyboard | Touch |
| --- | --- | --- |
| Play a card | Click the card, then a highlighted point. Number keys 1 to 9 pick cards in hand order | Tap the card, then the point |
| Equip gear | Click a gear card (with 2 equipped, discard one first) | Same with taps |
| Discard equipped gear | Click the gear in your loadout bar, then confirm | Same with taps |
| Scrap a card | Right-click the card, or hover it and press X | Long-press the card |
| Drop in | Click a point marked Drop in | Tap the point |
| Move, aim, shoot | WASD, mouse, hold left click | Hold where you want to go; you fire automatically |
| Dash (Jump pack) | Space | Double-tap |
| Bomber run | Q, then click the target | Tap its loadout slot, then the target |
| Cancel or pause | Esc or the Pause button | The Pause button |

## Art, audio and UI

- **Look:** a dark war table with a dieselpunk feel: riveted steel, oil stains, stencil type. Flat shapes, blue for you, red for the AI, amber for anything you can act on (drop-in prompts, energy, contested points). There are no character sprites on the map, only dots and rings.
- **Drop-ins:** the same flat style, zoomed in. You're a pointed blue arrow, bots are discs with HP bars, and walls are solid blocks. Hit-stop and screen shake carry the punch.
- **Type:** a condensed display face for names and numbers, and a plain sans for card text.
- **UI:** the score race and turn timer at the top, the map in the middle, then the loadout bar and hand at the bottom. A card's valid targets light up as soon as you hover it.
- **Audio:** a ticking clock in the last 3 seconds of a turn, distinct chimes for a capture and a loss, and a short drum hit on drop-in. No music in the first release.

## Glossary

| Term | Meaning |
| --- | --- |
| Champion | The enemy commander's hero. Drops into fights like you do |
| Drop in | Fight personally at a point for 20 seconds |
| Equipped | A gear card in play on your hero, up to 2 |
| Exhaust | The card leaves your deck for the rest of the match |
| Locked | A point whose meter can't move for 10 seconds |
| Map time | Match time that runs at full speed on the map and 25% during drop-ins |
| Regroup | Your hero's 20-second wait between drop-ins |
| Scrap | Discard a card from hand for +1 energy, 2 per turn |
