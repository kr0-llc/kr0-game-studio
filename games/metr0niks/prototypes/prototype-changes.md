# Metr0niks prototype changes

Oct 25, 2026 · updated Oct 28, 2026 · @kr0 · kept by the producer

What `prototypes/prototype.html` (the voxel prototype, prototype 1) and `simulations/sim.js` must change to match the [GDD](../gdd.md) and [TDD](../tdd.md). Sections 1 and 7 were done on Oct 27, 2026; the rest is not done. Section 18 (the Oct 28 fun pass) waits on kr0. Line numbers are for the files as of Oct 25, 2026 (P = `prototypes/prototype.html`, S = `simulations/sim.js`) and have shifted since the Oct 27 removals. Values marked **new** are numbers the GDD sets that the prototype doesn't have yet; each says whether kr0 has accepted it (GDD-D18, D20 and D23 values were accepted on Oct 26 as starting values; the revive values are Proposed). The ink prototype (`prototype-ink.html`, prototype 2) is separate and not covered here (GDD-D32).

## 1. Remove Gauntlet (done Oct 27)

Decision: Excursion is the only mode (GDD-D17, confirmed by kr0 on Oct 26, GDD-D29).

- Delete the Gauntlet button and its note (P:407, 409), the `gauntletBtn` wiring (P:1878, 1889, 1905) and the start-a-campaign-from-Gauntlet path.
- Remove the `mode` value `"gauntlet"` everywhere: `newSim` (P:506), the HUD label (P:1242), the campaign save and `curCampaign` (P:1266, 1269), the garage mode label (P:1424), co-op host and welcome messages (P:1612, 1739, 1757, 1761), the console hook (P:2078) and Continue (P:1903).
- Remove the banking branch on death (P:702 and P:1767) and `deathScreen`'s Gauntlet case (P:705 to 707).
- In `simulations/sim.js`: drop the `mode` option and the Gauntlet branch of `lossCheck` (S:5, 30, 250, 893 to 895), the `sim.mode` getter (S:1148) and the `mode` field of the campaign save (S:1165, 1176, 1199). Keep decoding old saves by ignoring a `mode` field.
- Done: all of the above. `Campaign.make` keeps its three-argument signature and ignores the old mode argument, and the client no longer sends `mode` to the room server. The room server (private `kr0/blackletter-chronos`) was not checked; if it still sends a `mode` or banks scrap on a death, the client now ignores both.

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

Decision: input is locked and mechs take no damage during the shot (GDD-D20, confirmed by kr0 on Oct 26, GDD-D29).

- While `sim.state` is `"drop"` and `introTicks > 0`, ignore `setInput` and skip damage to mechs (S:1067, 1136). The renderer keeps drawing the camera pan.

## 5. Collapse shadows above the low-health vignette

- Draw the vignette (P:1215 to 1219) before the collapse footprints (P:1056 to 1060) and the pod markers (P:1094 to 1110), or draw those again over it.

## 6. Co-op level

Decision: the room plays the host's campaign (GDD-D31, accepted Oct 27; replaces the lower-of-two-levels rule of GDD-D14).

- The host already builds `newSim` from its own level and seed; keep that.
- The guest must stop adopting the room's campaign as its own: on the `garage` message (and the local-test equivalent) the guest takes only its own player entry (build, owned, scrap, wear, upgrades) and keeps its own `CAMP.level` and `CAMP.seed` in its save. The level shown in the guest's garage and HUD during the room is the host's.
- On a death the guest's save is not reset; only the host's is.
- The room server, in the private `kr0/blackletter-chronos` repo, must send the guest's player entry without overwriting the guest's level. Not checked from here.

## 7. Remove touch controls (done Oct 27)

Decision: the platform is PC with keyboard and mouse only (GDD-D22, confirmed by kr0 on Oct 26 over the Oct 22 mobile request, GDD-D29).

- Delete the touch UI: floating twin sticks, the ARM, DASH and Q buttons, the pause and fullscreen buttons, portrait handling and the touch auto-detection (P:323, 334, 1953 to 2049, 2058), the `?touch=1` flag and the touch zoom floor (P:599).
- Done: all of the above, plus the touch rows of the controls table, the touch CSS and the phone web-app meta tags. The page no longer blocks pinch zoom.

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

- **New (proposed, GDD-D24):** `T.coop = { revivePrice: 40, reviveArmor: 0.3 }`. Section 2 deletes `T.level.revive`, so the revive armor lives here.
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

## 18. Fun pass (waiting on kr0, not started)

Decisions: GDD-D35 to GDD-D45, all Proposed ([record](../decisions/2026-10-28-fun-pass.md)). Nothing here is to be built until kr0 accepts the decision it comes from. When one is accepted, its rules go into `simulations/sim.js` first, so both prototypes get them (GDD-D32); the ink prototype's brief lists any it can't show yet.

- **New `T` keys (proposed):** `chain {max:4, step:0.2, decay:12, atbAt4:0.25}`, `stagger {time:1.0, taken:0.5}`, `redline {cap:130, armorPerHeat:0.5, lockPer10:1}`, `overtime {choose:6, drops:2, bonus:0.25}`, `contract {scrap:20}`, `collapse.scaleHp:true`, `demolition:0.5`, `crossfire {window:2, dmg:0.5, scrap:0.5, after:3}`, `pods.odds [0.35,0.30,0.20,0.15]`, `bands [10,20,30,40]`, enemy blocks for `scuttler`, `bulwark`, `wrecker`, `elite`, and the six blueprint parts in `PARTS` with a band field.
- **Sim events** for the new sounds, voice lines, stamps and callouts (chain step and break, stagger, Redline start and end, contract progress and completion, Overtime prompt and call, Crossfire, crushed count per collapse).
- **Garage:** the next level preview (band, condition, contract) and "New" marks on blueprint parts.
- **Save:** a campaign field for the highest level ever reached, kept on a death and a new campaign, and lifetime records. Old codes load with it set to their current level.
- **Hazard props:** container stacks, gantry cranes and slag vats in `MAP`, placed by the level design work.
- **Presentation:** hit-stop on the struck enemy only, never on `sim.step()`.

