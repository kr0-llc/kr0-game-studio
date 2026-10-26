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

Decision: input is locked and mechs take no damage during the shot (GDD-D4 and the zone rules).

- While `sim.state` is `"drop"` and `introTicks > 0`, ignore `setInput` and skip damage to mechs (S:1067, 1136). The renderer keeps drawing the camera pan.

## 5. Collapse shadows above the low-health vignette

- Draw the vignette (P:1215 to 1219) before the collapse footprints (P:1056 to 1060) and the pod markers (P:1094 to 1110), or draw those again over it.

## 6. Co-op level

Decision: co-op plays at the lower of the two players' levels (GDD-D14).

- The host picks `min(host level, guest level)` for `newSim`. The guest's `ready` message (P:1816) needs to carry its level. The relay server picks the level for online rooms (see section 8).

## 7. Disconnects: rejoin within 60 s

Decision: rejoin window, the mech holds (GDD-D10). **New:** window 60 s.

- Today a partner who leaves calls `dropPlayer` (P:1580 to 1583, S:1133) and a lost connection returns you to the menu (P:1737, 1778 to 1785).
- Needed: the server keeps the match for 60 s; the absent mech stays put, takes no damage and can't act; in single-player the match pauses; a rejoining client gets a full snapshot (the voxel state is already sent to a late joiner, P:1592 to 1599, S:`snapshot(true)`); after 60 s the player counts as destroyed.
- This needs the room server, which is in the private `kr0/blackletter-chronos` repo (`server/metr0niks.js`).

## 8. Always-online single-player

Decision: the first version stays always-online (GDD-D5).

- Single-player runs fully in the browser today, with the save in `localStorage` as a campaign code (P:1255 to 1285). It needs the server for accounts and saves, and validation of extract and death results on the server (TDD Save data).
- Server work in `kr0/blackletter-chronos`; the browser keeps the same fields.

## 9. Touch controls

The decided platform is PC with keyboard and mouse. The prototype also has touch controls: floating twin sticks, ARM, DASH and Q buttons, a fullscreen button and portrait handling (P:1953 to 2049, 2058). Either remove them or add touch to the decided platform; the GDD doesn't describe them.

## 10. Smaller text and menu fixes

- The death screen hint mentions pasting a campaign code, but the paste box only feeds the co-op host (P:388, 1800 to 1803). Add a single-player paste box or change the hint.
- The wave-5 boss bar still says "Bounty sniper"; keep it, since the GDD uses the same name.

## 11. Checked, nothing to change

These GDD statements already match the prototype: the controls table, the dimetric camera and cutaway fade, the 35% vignette, the ATB and ring values, heat rules (every grade costs the same heat, an overheat during a ring adds none, the flash-vent ends a lockout, Overclock doubles every fill), the 21 parts and prices, two pod types and the pod rules, the wave table, level scaling, zones and drop-in timing for levels 2 and 3, death resetting the campaign to level 1, and co-op partner-down behaviour.
