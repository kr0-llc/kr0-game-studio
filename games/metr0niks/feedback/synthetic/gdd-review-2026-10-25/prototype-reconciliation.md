# Metr0niks GDD review: reconciliation with the prototype

25 October 2026 · Claude · Decides: kr0

The six reviewers read only the GDD. This file checks their findings, and kr0's decisions of 25 October (in [open-questions.md](../../../open-questions.md)), against what the prototype does today.

**Source checked.** `games/metr0niks/prototypes/prototype.html` and `games/metr0niks/simulations/sim.js` (moved there on 2026-10-26). Both are byte-identical to the deployed build at `storage.googleapis.com/kr0-game-studio-site/play/metr0niks/`. The co-op server (`server/metr0niks.js`, referenced by the prototype) lives in the private `kr0/blackletter-chronos` repo and wasn't checked.

This file reports observations only. Each gap is a choice for kr0: change the GDD to match the prototype, or change the prototype to match the decision.

---

## 1. What the prototype already has that the GDD doesn't say

These change how some findings read.

| Area | Prototype today | Effect on the review |
| --- | --- | --- |
| Campaign levels | Levels 1 to 50. Each level is one 5-wave excursion. Extracting advances the level and carries scrap and armor forward (`Campaign.advance`). | Answers "what is a level": **a level is an excursion** (issue 1). |
| Enemy scaling | Per level above 1: enemy count +25%, hp +15%, damage +15%, scrap drops +10% (`T.level`). | Answers systems-designer F6 ("no enemy scaling"), at least for the campaign. |
| Zones | Level 1 has the Underpass only. Levels 2 and 3 each open one more zone with the 5.5 s cinematic. Level 3 and up has the whole sector (`zone.open = min(3, level)`). | Zones open per level, not per wave. |
| Co-op | Two mechs. Online, a WebSocket relay to a room server that **runs the sim**: the server is authoritative, and guests predict only their own movement. There's also a local two-tab transport. | Feasibility-lead F1 was right that two-player networking exists. Player-psychologist and business-analyst corrected it, which was fair from the GDD alone, but the code shows it's real. |
| Partner down | If one mech dies, the other fights on. The run is lost only when both are down. A downed mech returns next level with 30% armor (`T.level.revive`). | Not in the GDD. |
| Saves | Campaign held in browser `localStorage` and a copyable "campaign code" (base64 JSON). No account. | Single-player progress isn't account-bound yet (see the always-online decision). |
| Armor carry and repair | Armor damage carries between levels. The garage repairs 3 armor per scrap. Extracting always carries at least 30% armor. | This is the prototype's version of durability: one armor pool, not per part, with a 30% floor. |

---

## 2. kr0's decisions against the prototype

| Decision (25 Oct) | Prototype today | Gap |
| --- | --- | --- |
| Co-op ships in the first version | Built: server-run sim, rooms, shared garage | **Matches.** The GDD's non-goals and Game modes still say no multiplayer. |
| Stay always-online | Single-player runs offline in the browser; only co-op uses the server. Saves are local. | **Gap.** Single-player needs the server and an account. |
| Zones are an account unlock, never lost on death | An excursion death ends the campaign: the **level resets to 1** (parts and scrap stay, armor resets to full), so zones close again. The death screen offers the code from the start of that level as a retry. | **Conflict.** Either death keeps the level (or at least the zones), or the decision changes. |
| Gauntlet is practice; its scrap never banks | Gauntlet death **banks** that match's scrap ("dying keeps your scrap and banks it"). Gauntlet uses the campaign level, with no mastery goals and no part test-drives. | **Conflict.** This is the exact farm the reviewers flagged. |
| No cash-out after wave 3 | None; scrap is all-or-nothing until extract | **Matches.** |
| Durability stays, with a floor | No per-part durability; armor carries with a 30% floor and repairs at 3 armor per scrap. | **Gap**, and depends on the floor wording still being confirmed (see section 4). |
| PvP mech game, PvE stage first | No PvP modes. Enemies are bots, loaders and the "Bounty sniper" boss. | Expected for this stage. The GDD's pitch lines stay as written. |
| Disconnect: rejoin, mech holds | Partner leaving (`bye`) or a dropped socket calls `dropPlayer`: **the mech is destroyed**. There's no rejoin. | **Conflict.** Needs rejoin plus a held mech, on the server. |
| Every mech can ram | No player ram; only heavy loaders ram. | **Gap:** new feature. |
| Disabled weapon weight comes off, capped gain | **No damage regions at all**: armor is one pool, and weapons are never disabled. | **Gap.** Regions (and so the cap, the both-arms-disabled case and the ram fallback's main purpose) aren't built. |

---

## 3. Review findings the prototype already settles or changes

| Finding | Prototype | Reading |
| --- | --- | --- |
| Rarity five tiers vs three (SD F5, BA F4/F5, FL F4) | Three tiers (common, rare, epic), 21 parts, all as stat changes (`d:{power,armor,speed,weight,heat}`) | The prototype table is the working one; systems-designer and business-analyst both recommended merging toward it. |
| Four vertical power tracks (SD F5) | There's one track: parts plus the Reactor Mk1 to Mk3 tiers. No stat upgrades and no higher-tier-weapon sink. | The prototype already has a single track. |
| Slag-plating "30% slower" as a flat percentage (SD F4) | `speed -20, weight +40`, with speed derived from weight (`1/(1+0.004·(weight−100))`) | The prototype uses the stat model; the GDD's 12-part table doesn't. |
| A Miss costs "Full cost" heat (PP F3, AQA F5.3) | Every grade adds the same heat (`T.pile.heat` 28) | Matches quick win 2. The GDD table is out of date. |
| Overheat during a ring adds more heat (AQA F5.2) | The ring cancels as a Miss and **adds no heat** | Matches quick win 2. |
| Overclock "next fill only" (AQA F5.1) | All fills are doubled for the 15 s | Matches quick win 2. |
| Cryo flash-vent against the lockout (AQA X4) | Venting sets heat to 0 **and ends the lockout** | Settled. The GDD needs the sentence. |
| Mortar minimum range 15 m vs 4 m (FL F2, SD) | `minR 4, maxR 14` | The prototype value; the GDD spec still says 15 m. |
| Low-health darkness hides collapse shadows (PP F5) | Below 35% armor, a red edge vignette (up to 75% opacity) draws **on top of** the collapse shadows | Quick win 3 is still open. |
| Same boss on waves 3 and 5 (NC F4) | `waves[2]` and `waves[4]` both spawn the one sniper boss | Still open (D6). |
| Pods (AQA X6) | Two pod types, repair and overclock. Enemies take pods by the GDD rule. | Unchanged. |

---

## 4. What's still open for kr0

1. **Durability floor wording.** The proposed reading: starter parts repair free, other parts take durability damage, and repair cost rises with tier. The prototype repairs one armor pool instead, so this would replace that system.
2. **The death reset against zones.** Keep the prototype's "death restarts the campaign at level 1", or make zone and level progress survive death, as decided?
3. **Gauntlet banking.** The prototype banks Gauntlet scrap on death. Under your decision, that has to stop.
4. **Disconnect and rejoin.** Server work in `kr0/blackletter-chronos`, which this session can't see.
5. **Damage regions.** The GDD has them, the prototype doesn't. The ram and weight-cap decisions assume they exist.
6. **The bosses (D6).** A different wave-3 encounter, or a wave-5 variant of the same boss?
