# Metr0niks open questions

Oct 20, 2026 · updated Oct 26, 2026 · @kr0

## Decided so far

Most questions are now answered. The GDD reflects every decision below as of 2026-10-25 (they come from the [GDD review](feedback/synthetic/gdd-review-2026-10-25/SYNTHESIS.md) and the [prototype reconciliation](feedback/synthetic/gdd-review-2026-10-25/prototype-reconciliation.md)). The TDD was updated the same day; its architecture choices are Proposed in the [TDD decision history](tdd-decisions.md).

| Date | Decision |
| --- | --- |
| 2026-10-20 | The game is named Metr0niks |
| 2026-10-20 | Timing ring: press a heavy weapon's or ability's button to start the ring, release at the right time |
| 2026-10-20 | Drop pods: a marker and countdown show where one will land; at least one per wave, at a random time |
| 2026-10-20 | ~~Light weapons: minigun, plasma cutter and shotgun~~ Changed: the rail rifle is a fourth light weapon (GDD parts list) |
| 2026-10-20 | Reactors come in tiers and set speed and thrust time in the air |
| 2026-10-20 | ~~Rarity tiers: white, green, blue, purple, orange. Higher tiers have better stats and cost more scrap~~ Superseded: three tiers, common, rare and epic (GDD-D16) |
| 2026-10-20 | Scrap is the only currency |
| 2026-10-20 | PC only, keyboard and mouse only for now |
| 2026-10-20 | Building damage is permanent for the whole match |
| 2026-10-20 | The camera doesn't react to damage; low health shows warning colors and darkness creeping in from the screen edges |
| 2026-10-20 | ~~Damage disables regions (left weapon, right weapon, legs). A disabled weapon's weight is removed, and speed follows weight~~ Superseded: deferred (GDD-D12) |
| 2026-10-20 | The mech is destroyed when its health runs out |
| 2026-10-20 | ~~Enemies break supports on purpose~~ Superseded: dropped (GDD-D19) |
| 2026-10-20 | ~~Scrap buys parts, stat upgrades, higher-tier weapons and repairs~~ Changed: scrap buys parts, weapon upgrade levels and repairs; no stat upgrades (GDD-D23) |
| 2026-10-20 | Starter mechs have basic loadouts; a player with 0 scrap can always deploy |
| 2026-10-20 | Bosses on waves 3 and 5; leaving an excursion early counts as a loss |
| 2026-10-20 | After an excursion, part of the damage becomes durability damage that lowers max health and heat tolerance until repaired in the garage |
| 2026-10-20 | ~~Mechs progress only in excursions and are tied to the player's account~~ Changed: saved in the browser as a campaign code (GDD-D21) |
| 2026-10-20 | ~~All play is online: single-player Excursion and Gauntlet first, multiplayer after~~ Superseded: GDD-D17 and GDD-D21 |
| 2026-10-20 | Art is made by AI agents and approved by the owner |
| 2026-10-20 | Deferred: engine choice, voxel scale, minimum PC spec, time budget |
| 2026-10-20 | Each match is an excursion that ends after 5 waves |
| 2026-10-20 | ~~New Gauntlet mode: losing costs nothing, with no scrap lost and no damage to repair~~ Superseded: no Gauntlet (GDD-D17) |
| 2026-10-20 | The pitch page is the pitch only: no production plan |
| 2026-10-20 | ~~Enemy mechs can grab drop pods too~~ Changed: patrol bots and heavy loaders grab pods (GDD) |
| 2026-10-20 | If your mech dies, you lose all the scrap from that match |
| 2026-10-20 | Garage between matches only; drop pods give temporary boosts or heals, then disappear |
| 2026-10-20 | Hybrid combat: real-time movement and light weapons, ATB timing hits for heavy weapons |
| 2026-10-20 | ~~Single-player against AI first, on one map; PvP later~~ Changed: single-player and co-op, Excursion only (GDD-D4, GDD-D17) |
| 2026-10-25 | Co-op (two player mechs) ships in the first version; "no multiplayer" leaves the non-goals (GDD review, issue 1) |
| 2026-10-25 | ~~The first version stays always-online; the GDD must state why and define disconnects (GDD review, issue 4)~~ Superseded: server features are in the backlog (GDD-D21) |
| 2026-10-25 | ~~Zones are an account unlock: extracting opens the next zone for good, never lost on death (GDD review, D3)~~ Superseded the same day: see the level-reset decision below |
| 2026-10-25 | ~~Gauntlet is practice: its scrap never banks; rewards are mastery goals and test-driving unowned parts (GDD review, D1)~~ Superseded the same day: Excursion is the only mode |
| 2026-10-25 | No cash-out after the wave-3 boss; scrap stays all-or-nothing until extract (GDD review, D2) |
| 2026-10-25 | Durability stays in the first version; the rules are GDD-D18 (GDD review, D5) |
| 2026-10-25 | ~~Metr0niks is a PvP mech game shipping a co-op PvE stage first~~ The PvP wording was dropped with the other modes (GDD-D17) |
| 2026-10-25 | ~~Disconnect mid-excursion: the player can rejoin within a window and the mech holds until they do (GDD review, issue 2)~~ Superseded: rejoin is in the backlog (GDD-D21) |
| 2026-10-25 | Every mech can ram for melee damage, so losing both arm weapons never leaves it helpless (GDD review, adversarial-qa F3) |
| 2026-10-25 | A disabled weapon's weight still comes off, but the speed gain is capped below a healthy build's and the HUD explains it (GDD review, D4) |
| 2026-10-25 | Durability floor: starter parts repair free; other parts take durability damage, and repair cost rises with the part's tier (GDD review, D5) |
| 2026-10-25 | Damage regions are deferred: the first version keeps one armor pool, as prototyped. The ram fallback and the capped weight gain wait with them (prototype reconciliation) |
| 2026-10-25 | Bosses: the same sniper on waves 3 and 5; wave 5 is a harder variant on the wrecked skyline (GDD review, D6) |
| 2026-10-25 | Excursion is the game's main mode, played single-player or co-op; it is not called "story mode", since other modes may come later. Dying in an Excursion resets the campaign to level 1 (parts and scrap stay), so zones reopen as you climb again; this is what the prototype does (prototype reconciliation) |
| 2026-10-25 | ~~Gauntlet also resets to level 1~~ Superseded: no Gauntlet |
| 2026-10-25 | Co-op Excursion plays at the lower of the two players' levels |
| 2026-10-25 | Excursion is the only game mode. Gauntlet, Draft Duel and Scrap Rush are removed from the GDD, TDD and prototype (GDD-D17) |
| 2026-10-25 | The GDD has no TBDs: values come from the prototype, and what the prototype lacks is dropped or given a number (GDD-D18 to GDD-D20) |
| 2026-10-25 | Server features go to the backlog: rejoin, accounts and server-held saves, online single-player (GDD-D21) |
| 2026-10-25 | No touch controls: PC with keyboard and mouse only (GDD-D22) |
| 2026-10-26 | Accepted: wear and repair numbers and armor refill (GDD-D18), wave-5 boss, drop-in lock and co-op level (GDD-D20), weapon upgrade values (GDD-D23) |
| 2026-10-26 | Extracting level 50 wins the campaign with a victory screen; a co-op partner is revived at the end of a wave for a scrap price paid by the survivor, and takes wear (GDD-D24) |
| 2026-10-26 | The campaign seed can be set (GDD-D25) |
| 2026-10-26 | Five new pillars and a synthwave audio section (GDD-D26) |
| 2026-10-26 | Audience and player fantasy stay TBD; production milestones and pricing are not in the GDD (GDD-D27) |
| 2026-10-26 | GDD corrected against the prototype and its gaps filled (GDD-D28) |
| 2026-10-26 | Scrap buys parts, weapon upgrades (Mk I to Mk III, nine weapons including the shoulder actives) and repairs; no raw stat upgrades (GDD-D23). Upgrade values are starting values for a sweep |

## Design questions

Values that need sweeps (the wear share, the repair rates and the weapon upgrade values of GDD-D23) are in the [tuning history](tuning-history.md).

Still Proposed in the [decision history](gdd-decisions.md): the revive price and the 30% revive armor, what the victory button does (GDD-D24), limiting seed changes to level 1 (GDD-D25) and repair in slot order (GDD-D28).

- [ ] Target audience and player fantasy: TBD in the GDD on kr0's instruction (GDD-D27).
- [ ] Where production milestones live, since they are not part of the GDD (GDD-D27). The producer's documents and the phases in ways of working section 5 are the candidates.
- [ ] The death screen offers the campaign code from before the run, and pasting it as a co-op host restores that level, which gets around the reset on death. Keep it as a deliberate retry, or remove it? (Prototype changes section 9 currently suggests adding a single-player paste box.)
- [ ] What makes it fun: the GDD's overview has no paragraph on it yet. The mech-game research of Oct 26 may feed it.

## Backlog: dropped from the GDD, to bring back only by decision

These were in the Oct 20 GDD or later drafts and have no counterpart in the prototype (GDD-D17, GDD-D19):

- Draft Duel (1v1, best of 5) and Scrap Rush (1v1 or 2v2 plus AI), and PvP in general.
- Gauntlet as a practice mode.
- Damage regions: disabling the left arm, right arm or legs, with the ram fallback and the capped weight gain that came with them (GDD-D11, GDD-D12).
- Accessibility options: widen the Perfect window and auto-release timing rings. Remappable keys.
- The overheat steam damage zone.
- The Smelting Yards and Neon Financial Plaza maps; armored transports, vaults and power relays.
- The Coolant flood and Bolt-on plate pods.
- Free torso pitch for aiming at upper floors.
- Enemies that break supports on purpose.
- Server features: rejoining a match within a window with the mech held (and the match paused in single-player), accounts and server-held saves, an online requirement for single-player, and server validation of results (GDD-D21). They need the room server in the private `kr0/blackletter-chronos` repo.
- Touch controls (GDD-D22).

## Technical questions

The engine and voxel scale are deferred.

- [ ] Godot 4 or Unity? Deferred.
- [ ] Voxel size and chunk size to match the concept art? Deferred.

## Scope and production questions

- [ ] How AI-made voxel art moves from concept to the game. Deferred.
