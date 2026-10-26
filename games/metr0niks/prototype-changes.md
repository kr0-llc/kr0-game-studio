# Metr0niks prototype changes

Oct 25, 2026 · @kr0 · kept by the producer

What `prototype.html` and `sim.js` must change to match the [GDD](gdd.md) and [TDD](tdd.md). Nothing here has been done. The prototype is unchanged; line numbers are for the files as of Oct 25, 2026 (P = `prototype.html`, S = `sim.js`). Values marked **new** are numbers the GDD sets that the prototype doesn't have yet; kr0 hasn't approved them.

## 1. Remove Gauntlet

Decision: Excursion is the only mode (GDD-D17).

- Delete the Gauntlet button and its note (P:407, 409), the `gauntletBtn` wiring (P:1878, 1889, 1905) and the start-a-campaign-from-Gauntlet path.
- Remove the `mode` value `"gauntlet"` everywhere: `newSim` (P:506), the HUD label (P:1242), the campaign save and `curCampaign` (P:1266, 1269), the garage mode label (P:1424), co-op host and welcome messages (P:1612, 1739, 1757, 1761), the console hook (P:2078) and Continue (P:1903).
- Remove the banking branch on death (P:702 and P:1767) and `deathScreen`'s Gauntlet case (P:705 to 707).
- In `sim.js`: drop the `mode` option and the Gauntlet branch of `lossCheck` (S:5, 30, 250, 893 to 895), the `sim.mode` getter (S:1148) and the `mode` field of the campaign save (S:1165, 1176, 1199). Keep decoding old saves by ignoring a `mode` field.

## 2. Per-part durability replaces the carried armor

Decision: durability stays; starter parts repair free; other parts cost more at higher tiers (GDD-D9, GDD-D18). The GDD also makes armor refill every level.

- Remove the carried armor: `ARMOR` and everything that reads it (P:491, 506, 664, 1256, 1259, 1271, 1274, 1366 to 1374, 1425 to 1426, 1816, 2069 to 2070), the `armor` option and its handling (S:1138 to 1139), the 30% floor (`T.level.revive`, S:80, 564) and `T.repairCost` (S:81). The `armor` and per-mech armor detail in the extract event and in `Campaign.advance` go too.
- Save format: replace `armor` in each campaign player with `wear`, an object of part id to a number from 0 to 1. Validation rejects unknown ids, values outside 0 to 1, and wear on starter parts. Old saves load with no wear.
- Track the damage each mech takes in an excursion (a running total of armor lost, before pod heals) and send it in the extract event for each mech.
- **New:** `T.durability = { share: 0.10, repair: { common: 0.25, rare: 0.5, epic: 0.75 } }`. On extract, each fitted non-starter part gains `share × damageTaken ÷ maxArmor` wear, capped at 1. On a death, no wear is applied.
- `statsOf` and `deriveStats` take the wear: every stat change that helps (power, armor or speed above 0, weight or heat below 0) is multiplied by `1 − wear`; every other change and every hook stays as it is.
- Garage: show each fitted part's wear and its repair price (`ceil(price × wear × rate)`); one Repair button repairs every worn part the wallet can afford; starter parts are never listed as worn. The stat preview uses worn values.

## 3. Wave-5 boss variant

Decision: the same sniper on waves 3 and 5, harder on wave 5 (GDD-D13).

- **New:** in `newBoss` (S:631), when `run.wave` is the last wave, health ×1.5, `fireEvery` 1.5 s instead of 2.2 s, and scrap 18 instead of 12.

## 4. Zone drop-in: lock input and damage

Decision: input is locked and mechs take no damage during the shot (GDD-D20).

- While `sim.state` is `"drop"` and `introTicks > 0`, ignore `setInput` and skip damage to mechs (S:1067, 1136). The renderer keeps drawing the camera pan.

## 5. Collapse shadows above the low-health vignette

- Draw the vignette (P:1215 to 1219) before the collapse footprints (P:1056 to 1060) and the pod markers (P:1094 to 1110), or draw those again over it.

## 6. Co-op level

Decision: co-op plays at the lower of the two players' levels (GDD-D14).

- The host picks `min(host level, guest level)` for `newSim`. The guest's `ready` message (P:1816) needs to carry its level. The room server, in the private `kr0/blackletter-chronos` repo, picks the level for online rooms.

## 7. Remove touch controls

Decision: the platform is PC with keyboard and mouse only (GDD-D22).

- Delete the touch UI: floating twin sticks, the ARM, DASH and Q buttons, the pause and fullscreen buttons, portrait handling and the touch auto-detection (P:323, 334, 1953 to 2049, 2058), the `?touch=1` flag and the touch zoom floor (P:599).

## 8. Leaving a co-op room

The GDD says a partner who leaves or loses connection has their mech destroyed and the other player fights on. The prototype already does this (P:1580 to 1583, S:1133); nothing to change.

## 9. Smaller text and menu fixes

- The death screen hint mentions pasting a campaign code, but the paste box only feeds the co-op host (P:388, 1800 to 1803). Add a single-player paste box or change the hint.
- The wave-5 boss bar still says "Bounty sniper"; keep it, since the GDD uses the same name.

## 10. Weapon upgrade levels

Decision: scrap buys parts, weapon upgrades and repairs; no raw stat upgrades (GDD-D23).

- **New:** `T.upgrade = { levels: 2, dmg: 0.10, cost: { common: [20, 40], rare: [35, 70], epic: [60, 120] } }`. Weapons are the parts with a `gun`, `pile` or `q` hook: minigun, shotgun, plasma, rail, pile, buster, winch, mortar, vent.
- Save format: each campaign player gets `up`, an object of part id to level 0 to 2 (0 = Mk I). Validation rejects unknown ids, non-weapons, ids not owned and levels outside 0 to 2. Old saves load with every weapon at Mk I.
- `create` takes each mech's upgrade levels next to its build. Damage to enemies from that weapon is multiplied by `1 + dmg × level`: light shots (S:719), the heavy weapon (S:771, 789, 810), the mortar (S:840) and the flash-vent (S:850). Voxel damage, heat, rates and cooldowns are unchanged.
- Garage: show the selected weapon's level and an Upgrade button with the next price; buying pays from banked scrap. Show the level on the slot tile. Wear and the repair price ignore the level.
- Co-op: the guest's `ready` message (P:1816) carries its upgrade levels.

## 11. Level 50 victory

Decision: extracting level 50 wins the campaign (GDD-D24).

- On the extract event at `T.level.max`, show a Victory overlay instead of Extracted. Its button runs `newCampaign()` and opens the garage. `Campaign.advance` (S:1212) already clamps the level at 50.

## 12. Co-op revive and wear for a downed partner

Decision: GDD-D24.

- **New:** `T.coop = { revivePrice: 40, reviveArmor: 0.3 }` (use `T.level.revive` for the armor if it stays).
- In `updateWave` (S:556 to 558), when a wave below the last clears and one mech is down: if the survivor's `scrap` wallet holds `round(revivePrice × lvm("scrap"))`, take it from that wallet (and from `sim.scrap`), set the downed mech's hp to `reviveArmor × maxHp` beside the survivor, reset its heat, ATB and timers, and emit a toast and an event for audio.
- The damage-taken total of section 2 keeps counting across the revive; the extract event sends it for every mech, alive or not, and wear applies to all of them. A downed mech's wallet already banks at extract (S:564).

## 13. Settable seed

Decision: GDD-D25.

- Garage: at level 1, show the campaign seed in a number field (1 to 2,147,483,000; `Campaign.validate` already enforces the range). Changing it updates `CAMP.seed` and saves. Hidden or read-only past level 1.

## 14. Death and leaving save the reset at once

Decision: the GDD's death reset (GDD-D14, GDD-D28). Today an Excursion death doesn't write the save; the reset happens only on "New campaign", so reloading after a death or mid-match offers Continue at the same level.

- On the `dead` event, call `newCampaign()` (P:706) before showing the screen.
- When a match starts (`start()`, P:1634), save the campaign marked as in a match; on load, a save still marked in a match is treated as a death (level 1). Clear the mark on extract.

## 15. Audio

Decision: GDD-D26. The prototype has no audio.

- Add the music cues and the essential sound effects in the GDD's Audio section, driven by sim events (add events where the sim has none: ATB ready, ring start, grade, overheat, dash, footsteps can come from the renderer). Settings gets music and effects volume, saved like the art style.

## 16. Corrections in the GDD, nothing to change

GDD-D28 changed GDD text to match the prototype (collapse scrap, timing grades, Perfect knockback, overheat during a ring, screen shake, bot fire timing, mortar falloff, Overclock on loaders, level scaling, pods, spawns, boss placement, friendly fire, voxel damage and power, menus). The prototype stays as it is for these.

## 17. Checked, nothing to change

These GDD statements already match the prototype: the controls table, the dimetric camera and cutaway fade, the 35% vignette, the ATB and ring values, heat rules (every grade costs the same heat, an overheat during a ring adds none, the flash-vent ends a lockout, Overclock doubles every fill), the 21 parts and prices, two pod types and the pod rules, the wave table, level scaling, zones and drop-in timing for levels 2 and 3, death resetting the campaign to level 1, and co-op partner-down behaviour.
