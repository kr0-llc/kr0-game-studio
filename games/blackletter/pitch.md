# Blackletter: Chronos

Oct 21, 2026 · @kr0 · Pitch

**A tabletop general's war, on a real clock.** Command the Order of the Sun, a warband of armoured holy soldiers, across a hex battlefield where every unit acts the moment its gauge fills. Break the enemy by holding ground, not by clicking faster.

![The Chopper, Jumper and Shooter cards](../../art/blackletter/cards/units/chopper.png)

*The three unit cards, from the Blackletter tabletop art: [Chopper](../../art/blackletter/cards/units/chopper.png), [Jumper](../../art/blackletter/cards/units/jumper.png), [Shooter](../../art/blackletter/cards/units/shooter.png).*

## The game in thirty seconds

1. **Place** three soldiers in secret: a Chopper, a Jumper and a Shooter.
2. **Wait for the bell.** Each unit's gauge fills in real time. A full gauge means it is ready, and it waits for your order as long as it takes.
3. **Take the ground.** Stand on the Reliquary and the Fortresses to earn Tithes and drain the enemy's Morale every second.
4. **Gamble your nerve.** Spend 10 Fervor to call a Secret Wager. Both commanders seal a Morale bid, both pay it, and the higher bid wins a 75-second blessing for its army.
5. **Spend your faith.** Fervor also buys Prayer (15), Exorcism (25) and a three-unit merge (10).
6. **Break them.** At 0 Morale an army collapses. A battle takes about 14 minutes.

## What makes it fun

**What makes it fun.** You always know who acts next, and you never lose a turn by being slow, so every order is a considered bet about ground: which node to take, which to hold and which to give up. The Secret Wager adds a poker moment on top, where you can buy a blessing with your own life total.

## Why it's different

| Pillar | What the player feels |
| --- | --- |
| **Grand tactics over reflexes** | A unit is ready every 25 to 33 seconds. A ready unit never loses its turn, so the game rewards reading the field, and you can pause any time against the AI and still give orders. |
| **Ground is the score** | No kill counter decides the battle. Holding more nodes bleeds the enemy's Morale continuously, so every march is a question of which ground to take, hold or give up. |
| **A wager of nerve** | The Secret Wager turns Morale, your life total, into a sealed poker bid for a blessing. Bidding high can win the clash and lose the war. |
| **Gothic martial realism** | Armoured holy orders with halberds, rifles and jump packs. No high fantasy and no undead; Miracles are acts of faith and discipline. |
| **An illuminated manuscript at war** | Blackletter type, woodcut terrain and Roman Missal ornament, over a d6 rules core taken from a real tabletop game. |

## Who it's for

- **Tabletop wargamers** who miss their weekly game and want rules they can read and trust.
- **Tactics-RPG players** raised on Final Fantasy's ATB who want to see who acts next.
- **Gothic-art devotees** of Blasphemous and Darkest Dungeon, who buy a game for its world.

It plays in the browser on desktop and phone, in English and Latin American Spanish. A match is short enough for a lunch break and slow enough to play one-handed on a phone.

**Sebastion, Abbot of the Ashlands**, is the computer commander. He races you for the Reliquary, keeps his Choppers beside his Shooters and calls a Wager when a blessing is worth his Morale. He plays by the same rules as you: he never sees your sealed bid or your hidden starting positions. Easy, Normal and Hard change how closely he pays attention, never what he knows. You can also fight a friend on one screen, with a hand-off for the sealed bids.

## Why we can build it

|  |  |
| --- | --- |
| Rules | Taken from the Blackletter tabletop game: three units, six upgrade cards, one dice rule. Small enough to balance by simulation |
| Prototype | A one-screen browser prototype plays a full battle against a simple Sebastion: [prototype.html](prototype.html) |
| Evidence | Self-play of these rules runs 14.5-minute battles over 24 seeded matches, and all three legs of the unit triangle sit in the 65 to 80% target in duels from 8 hexes ([tuning history](tuning-history.md)) |
| Runtime cost | Every in-match agent is plain code: zero tokens per match, and any battle replays exactly from its seed |
| Budget | 44.1M development tokens for a 15-week semester, with a 40% rework reserve ([TDD](tdd.md)) |

## Where to read more

[GDD](gdd.md) · [TDD](tdd.md) · [Open questions](open-questions.md) · [Tuning history](tuning-history.md) · [GDD decisions](gdd-decisions.md) · [TDD decisions](tdd-decisions.md) · [Art and screenshots](../../art/blackletter/README.md)
