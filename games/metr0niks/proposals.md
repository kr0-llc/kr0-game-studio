# Metr0niks proposals

Oct 28, 2026 · @kr0 · Kept out of the [GDD](gdd.md) on kr0's instruction (GDD-D55)

The GDD holds only rules. This file holds everything else: ideas and options that aren't adopted, and open calls. When kr0 adopts one, it moves into the GDD with a row in the [decision history](gdd-decisions.md) and comes off this list. Numbers aren't listed here: every number in the GDD is a starting value for the sweep ([tuning history](tuning-history.md)).

## 1. Signed off

kr0 approved these on Oct 28 with the GDD-D55 round, so they are GDD rules now and off this list. Kept here for one round so the change is easy to see.

| Rule | What the GDD says | GDD section | Decision |
| --- | --- | --- | --- |
| Kill credit | A kill belongs to the last mech that damaged the enemy within 3 s, or to the mech that broke the chunk whose collapse killed it; kills from events an enemy started belong to nobody | Excursion rules | GDD-D48 |
| Damage order | Shield check, then base × power ÷ 100 × upgrade × grade × 1.5 if staggered × armor resistance, rounded once | Combat | GDD-D48 |
| Revive | The survivor pays 40 scrap (scaled by level) at the end of waves 1 to 4; the partner returns with 30% armor | Co-op | GDD-D24 |
| Victory button | Starts a new climb at level 1, keeping every part, upgrade, blueprint and banked scrap | Excursion rules | GDD-D24 |
| Typing a seed | Only at level 1, and only for that climb | Excursion rules, Seed | GDD-D25, GDD-D49 |
| Repair order | One Repair button repairs worn parts in slot order and skips a part the scrap can't cover | Durability | GDD-D28 |
| Which enemy each zone brings | Freight Yard Scuttlers, Smelter Row Bulwark, Glass Quarter Wrecker, Terminus Yard Elites (kr0 accepted enemies by zone; the pairing is Claude's) | Excursion rules, Zone threats | GDD-D40 |
| Boss roster and the Warden | Bounty sniper, Sniper pair and Juggernaut drawn per level; the Warden's riders, barrage, stomp and legs (kr0 asked for variety and a big boss with snipers; the roster is Claude's) | Enemies and AI | GDD-D51 |
| Report layout | The wave report strip and the excursion report's count-up, chart and highlights | Match stats | GDD-D50 |

## 2. Ideas not adopted

### Economy

From the [economy options](decisions/2026-10-28-economy-options.md). kr0 chose call-in supplies and trimmed income (GDD-D54, GDD-D55). Still on the shelf:

- **Weapon mods at Mk III (option C):** a Mk III weapon buys one of three sidegrade mods that change a verb, not a number. The best long-term answer to "what is scrap for?", and the most design work. Suggested for after the zone enemies ship.
- **Cosmetics (option D):** paint, decals, a nameplate. Needs art the pipeline doesn't have yet (GDD-D46).
- **Salvage contracts (option E):** cut a blueprint's price by killing its zone's enemy a set way.
- **Heat levels after victory (option G):** start a climb with chosen modifiers for a scrap multiplier and a record. Only useful paired with a sink.

### "What makes it fun"

The GDD keeps it TBD (GDD-D27); kr0 said on Oct 28 to leave it for now. The draft line from the [fun pass record](decisions/2026-10-28-fun-pass.md):

> Bringing the city down on a crowd, landing the heavy hit on the beat, and deciding, with a full wallet, whether to push one more wave.

### Content

- **Convoy condition:** a scrap truck crosses the map on wave 2 and pays out if stopped. Raised by the [fun pass critique](feedback/synthetic/2026-10-28-fun-pass-critique.md) as a sector condition that changes a decision; not added.

## 3. Open calls

- **Wave density on the larger map:** the level design work scales the map 1.5× (216 × 48 m), so the same enemy counts cover about 2.25× the floor. Options: raise the level-1 counts, add a co-op multiplier, or let the sweep decide. The sweep plan covers it (tuning history).
- **Art styles in Settings during the voxel focus:** the GDD still offers Blockout, Cinematic and Ink, but only the voxel look is being built (GDD-D46). Keep all three in Settings, or show only Blockout until the renderer work starts? Blackout's night look needs only the voxel look either way.
- **Desert rock music trial (GDD-D34):** a third music direction for the ink prototype, which is paused as a look study (GDD-D46).

- **Phones (GDD-D58, Proposed Oct 29):** the [mobile UI lab](prototypes/mobile-ui-lab.md) has four playable touch layouts. kr0 tries them and picks one: drop phones again (GDD-D29 stands), keep phones as a second platform with one layout, or go phone-first. Adopting phones also needs a phone garage and menus, a left-handed mirror, and possibly analog legs in sim.js (the legs read 8-way WASD today).

## 4. Dropped, for the record

Not proposals any more; listed so they aren't suggested again without a decision.

- **Rerolls** of the next level's contract or condition: removed by kr0 on Oct 28 (GDD-D55).
- **Co-op Crossfire** (GDD-D44): rejected by kr0 on Oct 28.
- **Threat bands** (GDD-D39 first draft): replaced by enemies tied to zones (GDD-D40).
- **Redline on the light gun** (GDD-D36 first draft): replaced by the Redline vent shoulder part.
- **Hot hands contract and Magnet fault condition:** replaced by Close shave and Loose pillars.
- **Checkpoints every 10 levels:** break "lose the run, keep the garage".
