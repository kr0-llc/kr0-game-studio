# Metr0niks open questions

Oct 20, 2026 · @kr0

## Decided so far

Most questions are now answered. The GDD and TDD reflect every decision up to 2026-10-20; the 2026-10-25 decisions come from the [GDD review](reviews/SYNTHESIS.md) and are not in the GDD yet.

| Date | Decision |
| --- | --- |
| 2026-10-20 | The game is named Metr0niks |
| 2026-10-20 | Timing ring: press a heavy weapon's or ability's button to start the ring, release at the right time |
| 2026-10-20 | Drop pods: a marker and countdown show where one will land; at least one per wave, at a random time |
| 2026-10-20 | Light weapons: minigun, plasma cutter and shotgun |
| 2026-10-20 | Reactors come in tiers and set speed and thrust time in the air |
| 2026-10-20 | Rarity tiers: white, green, blue, purple, orange. Higher tiers have better stats and cost more scrap |
| 2026-10-20 | Scrap is the only currency |
| 2026-10-20 | PC only, keyboard and mouse only for now |
| 2026-10-20 | Building damage is permanent for the whole match |
| 2026-10-20 | The camera doesn't react to damage; low health shows warning colors and darkness creeping in from the screen edges |
| 2026-10-20 | Damage disables regions (left weapon, right weapon, legs). A disabled weapon's weight is removed, and speed follows weight |
| 2026-10-20 | The mech is destroyed when its health runs out |
| 2026-10-20 | Enemies break supports on purpose |
| 2026-10-20 | Scrap buys parts, stat upgrades, higher-tier weapons and repairs |
| 2026-10-20 | Starter mechs have basic loadouts; a player with 0 scrap can always deploy |
| 2026-10-20 | Bosses on waves 3 and 5; leaving an excursion early counts as a loss |
| 2026-10-20 | After an excursion, part of the damage becomes durability damage that lowers max health and heat tolerance until repaired in the garage |
| 2026-10-20 | Mechs progress only in excursions and are tied to the player's account |
| 2026-10-20 | All play is online: single-player Excursion and Gauntlet first, multiplayer after |
| 2026-10-20 | Art is made by AI agents and approved by the owner |
| 2026-10-20 | Deferred: engine choice, voxel scale, minimum PC spec, time budget |
| 2026-10-20 | Each match is an excursion that ends after 5 waves |
| 2026-10-20 | New Gauntlet mode: losing costs nothing, with no scrap lost and no damage to repair |
| 2026-10-20 | The pitch page is the pitch only: no production plan |
| 2026-10-20 | Enemy mechs can grab drop pods too |
| 2026-10-20 | If your mech dies, you lose all the scrap from that match |
| 2026-10-20 | Garage between matches only; drop pods give temporary boosts or heals, then disappear |
| 2026-10-20 | Hybrid combat: real-time movement and light weapons, ATB timing hits for heavy weapons |
| 2026-10-20 | Single-player against AI first, on one map; PvP later |
| 2026-10-25 | Co-op (two player mechs) ships in the first version; "no multiplayer" leaves the non-goals (GDD review, issue 1) |
| 2026-10-25 | The first version stays always-online; the GDD must state why and define disconnects (GDD review, issue 4) |
| 2026-10-25 | ~~Zones are an account unlock: extracting opens the next zone for good, never lost on death (GDD review, D3)~~ Superseded the same day: see the level-reset decision below |
| 2026-10-25 | Gauntlet is practice: its scrap never banks; rewards are mastery goals and test-driving unowned parts (GDD review, D1) |
| 2026-10-25 | No cash-out after the wave-3 boss; scrap stays all-or-nothing until extract (GDD review, D2) |
| 2026-10-25 | Durability stays in the first version, with a floor (details to define) (GDD review, D5) |
| 2026-10-25 | Metr0niks is a PvP mech game shipping a co-op PvE stage first; Draft Duel and Scrap Rush are the destination (GDD review, issue 4) |
| 2026-10-25 | Disconnect mid-excursion: the player can rejoin within a window and the mech holds until they do (GDD review, issue 2) |
| 2026-10-25 | Every mech can ram for melee damage, so losing both arm weapons never leaves it helpless (GDD review, adversarial-qa F3) |
| 2026-10-25 | A disabled weapon's weight still comes off, but the speed gain is capped below a healthy build's and the HUD explains it (GDD review, D4) |
| 2026-10-25 | Durability floor: starter parts repair free; other parts take durability damage, and repair cost rises with the part's tier (GDD review, D5) |
| 2026-10-25 | Damage regions are deferred: the first version keeps one armor pool, as prototyped. The ram fallback and the capped weight gain wait with them (prototype reconciliation) |
| 2026-10-25 | Bosses: the same sniper on waves 3 and 5; wave 5 is a harder variant on the wrecked skyline (GDD review, D6) |
| 2026-10-25 | Excursion is the story mode. Dying in an Excursion resets the campaign to level 1 (parts and scrap stay), so zones reopen as you climb again; this is what the prototype does (prototype reconciliation) |
| 2026-10-25 | Gauntlet also resets to level 1 |
| 2026-10-25 | Co-op Excursion plays at the lower of the two players' levels |

## Design questions

Only tuning questions are left.

- [ ] What share of excursion damage becomes durability damage, and how much scrap does a repair cost?
- [ ] How much does disabled legs slow the mech?
- [ ] Which multiplayer mode comes first after Excursion and Gauntlet?

## Technical questions

The engine and voxel scale are deferred; the online backend is new and needed for accounts.

- [ ] Godot 4 or Unity? Deferred.
- [ ] Voxel size and chunk size to match the concept art? Deferred.
- [ ] Which backend handles accounts, mech data and online play?

## Scope and production questions

- [ ] How AI-made voxel art moves from concept to the game. Deferred.
