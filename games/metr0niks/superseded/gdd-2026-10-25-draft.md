# Metr0niks GDD

Updated Oct 25, 2026 · @kr0 · Previous version: [superseded/gdd-2026-10-20.md](superseded/gdd-2026-10-20.md)

This version applies kr0's decisions of Oct 25 ([open questions](open-questions.md)) and the current prototype (`prototype.html`, `sim.js`). Anything the prototype doesn't do yet is listed in the last section.

## Overview

Metr0niks is an isometric voxel mech brawler. You drive and shoot in real time, fire heavy weapons on an ATB timing hit, and tear down the city for scrap that rebuilds your mech between matches. It is a PvP mech game; its first version is a single-player and co-op PvE stage that builds the economy and the garage that PvP will use.

**Pillars**

- **Every part is a tradeoff.** Each part changes weight, heat or power, so building your mech changes how it moves and fights.
- **The city is a weapon.** Pillars, overpasses and vats are as deadly as your guns.
- **Real-time driving, timed heavy hits.** Movement and light guns never pause; heavy weapons reward a well-timed press.

**Scope:** Excursion (single-player or two-player co-op) and Gauntlet first, on one map (Overpass Sector 4), on PC with keyboard and mouse. All play is online; PvP modes come after.

**Why online (proposed):** progression is tied to the player's account on a server, so co-op and later PvP share one economy and an edited local save can't carry into PvP. Disconnects are handled in Run rules.

**Non-goals (first version):** no PvP, no story, no map damage that carries between matches, no procedural maps.

**Accessibility:** options to widen the Perfect timing window and to auto-release timing rings, plus remappable keys. Window sizes are TBD.

## Core loop

&#91;embedded content: core loop · 5 steps, 1 failure path\]

A match runs garage, drop in, waves, boss, extract. Dying at any point sends you back to the garage with none of that match's scrap and the campaign back at level 1.

## Run rules

An excursion is 5 waves on one map. It ends when you clear wave 5 or your mech is destroyed. Excursion is the game's main mode and can be played alone or with one partner. Rules marked proposed are waiting on a decision in the open questions doc.

- **Waves:** each excursion is 5 waves. Bosses come on waves 3 and 5. This is the only place the wave structure is defined.
- **Levels:** each excursion is one campaign level, from 1 to 50. Extracting opens the next level. Per level above 1, enemy count rises 25%, enemy health 15%, enemy damage 15% and scrap drops 10% (prototype values).
- **Zones:** a level decides how much of the map is open (see Maps).
- **Extract:** clearing wave 5 extracts you and banks your scrap. There is no cash-out earlier: scrap is all-or-nothing until you extract. Leaving early counts as a loss.
- **Lose condition:** the mech is destroyed when its armor runs out.
- **On death:** you lose all scrap from the match and the campaign goes back to level 1. Parts and scrap you banked are never lost.
- **Starter mechs:** basic loadouts that are free and can't be lost, so a player with 0 scrap can always deploy.

**Co-op:** two players share one excursion and one map. If one mech is destroyed, the other fights on; the excursion is lost only when both are down. A mech that was down returns on the next level with 30% armor (prototype value). Co-op plays at the lower of the two players' levels.

**Disconnects:** a disconnect is not leaving early. The player can rejoin within a window (length TBD) and their mech holds in place until they do. If the window runs out, the player is treated as down.

**Gauntlet:** practice. It uses the same waves with no penalty for losing: no damage to repair, and the scrap you collect never banks. Rewards are mastery goals and test-driving parts you don't own (details TBD). Gauntlet starts at level 1 and goes back to level 1 when you lose. Gauntlet doesn't progress your mech.

**Durability:** a share of the damage taken in an excursion (TBD%) becomes durability damage. It lowers max armor, heat tolerance and other stats of the damaged parts until you repair it in the garage. Starter parts repair free. Other parts cost scrap to repair, and the cost rises with the part's rarity tier.

**Progression:** mechs progress only in excursions and are tied to the player's account.

## Controls and camera

A high-angle isometric twin-stick: the legs and the torso are controlled separately, so you can retreat while aiming forward.

| Input (keyboard and mouse) | Action |
| --- | --- |
| WASD | Leg direction: momentum, turn radius, traction |
| Mouse | Torso rotation and elevation; heavy weapons slow how fast it tracks |
| Left mouse button | Right arm weapon |
| Right mouse button | Left arm weapon |
| Q | Shoulder mount or utility |
| Space | Locomotion ability: dash, jump-jet or siege anchor |

- **Camera:** locked 45° isometric angle. Zoom is set by your build when you drop in (light builds see more) and never reacts to damage. Low health shows warning colors and darkness creeping in from the screen edges.
- **Cutaway:** buildings between the camera and your mech cut away in a voxel cross-section, so you never lose your chassis.
- **Verticality:** aiming at upper floors tilts the torso up to hit support beams or rooftop snipers.
- **Timing press:** press and hold a heavy weapon's or ability's button to start its timing ring, then release at the right time.

## Combat

Combat runs on two layers: light weapons fire in real time, heavy weapons charge on an ATB bar and land on a timing hit. Movement never stops for either.

**Light weapons (real time)**

- Fire freely while held; each shot adds heat.
- Light weapons: minigun, plasma cutter, shotgun.

**Heavy hardpoints (ATB)**

- Each heavy weapon has its own ATB bar that fills over time.
- When full, press and hold the weapon's button to start a timing ring that shrinks toward a target ring. Release to lock it.
- You keep driving and aiming while the ring runs.

| Timing result | Damage | Structural damage | Heat |
| --- | --- | --- | --- |
| Perfect | 200% (critical) | Bonus: cores extra voxels | Normal |
| Good | 100% | Normal | Normal |
| Miss or ring closes | 50% | Reduced | Normal |

**Heat**

- Light shots, heavy shots, jump-jets and energy parts all add heat; heat drains over time.
- At 100%, the mech overheats: weapons and thrusters shut down for 3 seconds and it vents damaging steam.
- Every timing result costs the same heat. A Miss never costs extra.

**Tunables** (starting values for tuning; TBD = not set yet)

| Tunable | Value |
| --- | --- |
| ATB base fill time | 6 s (TBD) |
| Timing ring duration | 1.0 s (proposed) |
| Perfect window | 5% of the ring's start radius (prototype) |
| Good window | 18% of the ring's start radius (prototype) |
| Heat per light shot | Minigun 3.2 (prototype); others per part |
| Heat per heavy shot | Pile-bunker 28 (prototype) |
| Heat drain per second | 20 (prototype) |
| Overheat lockout | 3 s |

**Edge cases**

- **Two heavy weapons ready:** only one timing ring runs at a time; the second heavy weapon waits until the first ring resolves.
- **Overheat during a ring:** the ring cancels and counts as a Miss. It adds no further heat and doesn't lengthen the lockout.
- **Venting during a lockout:** the Cryo flash-vent dumps all heat and ends the lockout at once.

## Mech building

A mech is a frame with six slots. Every part adds to five stats.

| Stat | What it controls |
| --- | --- |
| Power | Weapon damage and how fast ATB bars fill |
| Armor | The mech's health; at 0 the mech is destroyed |
| Speed | Top speed and acceleration, before weight |
| Weight | Total mass: slows movement, turning and torso tracking |
| Heat | How fast you heat up, and how much headroom you have |

**Slots:** Core, Arm-R, Arm-L, Shoulder, Legs, Reactor.

**Damage regions (deferred):** the first version has one armor pool. Disabling the left weapon, right weapon or legs mid-match is not in the first version. When regions return, three decisions come with them: a disabled weapon's weight comes off but the speed gain is capped below a healthy build's and the HUD explains it; every mech can ram for melee damage so losing both arms never leaves it helpless; and the shoulder slot gets a damage rule.

Base values are in the parts list. Formulas that combine the five stats into movement, damage and heat numbers are partly TBD.

**Edge cases**

- **Armor reaches 0:** the mech is destroyed.
- **Weight:** speed follows weight, `1 / (1 + 0.004 × (weight − 100))` in the prototype.
- **Bulldozer treads and collapses:** treads have no dash, so a falling shadow has to give them enough time to walk clear. The shadow's lead time is set for the slowest legal build (proposed).

## Parts list

The garage sells 21 parts. Rarity has three tiers: common, rare and epic. Higher tiers cost more scrap and repair for more. Heavy weapons fire on ATB, other weapons and abilities work in real time, and plating is passive. Every part is a change to the five stats plus a tradeoff; stat values are the prototype's.

| Slot | Part | Rarity · cost | Stat change | What it does and what it costs you |
| --- | --- | --- | --- | --- |
| Arm-R | Minigun (starter) | Common · 0 | weight +14 | Fast stream of light rounds. Heats up quickly; low structural damage |
| Arm-R | Shotgun | Rare · 25 | power +10, weight +18, heat +15 | Six pellets, one every 0.55 s. Devastating up close, weak past it; each shot is hot |
| Arm-R | Plasma cutter | Rare · 45 | power +5, weight +12, heat +20 | Torch of about 5 m; ignores loader armor and melts walls and pillars four times faster than bullets. Fills heat fast |
| Arm-R | Rail rifle | Epic · 110 | power +15, weight +22, speed −4, heat +15 | One 34-damage slug every 1.1 s through every bot in line and thin walls. Very hot per shot |
| Arm-L | Pile-bunker (starter) | Common · 0 | weight +14 | ATB melee spike that launches enemies; double scrap on a kill. Zero range; 1.5 s retraction on a Miss |
| Arm-L | Bunker-buster cannon | Rare · 90 | power +20, weight +34, speed −5, heat +10 | ATB shell, 70 damage, blasts through walls. Recoil shoves you back 2 m; torso turns 25% slower |
| Arm-L | Industrial mag-winch | Rare · 55 | weight +16 | ATB cable, 8 m (10 m on Perfect): reels bots in, yanks a roof sniper off its perch, tears out a pillar's base on Perfect. A wall or a heavy loader reels you in instead |
| Shoulder | Cryo-vent heatsink | Rare · 30 | weight +8, heat −33 | Passive cooling: heat drains 50% faster. Uses the shoulder slot |
| Shoulder | Twin-pod siege mortar | Epic · 100 | power +5, weight +24, speed −4, heat +10 | Q lobs two shells onto the cursor every 7 s; blasts rooftops and splashes bots. 4 m minimum range |
| Shoulder | Cryo flash-vent | Rare · 40 | weight +10, heat −15 | Q dumps all heat, even in a lockout, as a freezing blast that slows bots within 4 m for 3 s. 10 s recharge; no passive weapon |
| Shoulder | Salvage magnet | Common · 20 | weight +6 | Scrap cubes fly to you from 7 m instead of 3. Uses the shoulder slot |
| Legs | Vectored jump-jets (starter) | Common · 0 | weight +8 | Space dashes in your drive direction; each dash adds heat |
| Legs | Bulldozer siege treads | Rare · 70 | armor +25, speed −8, weight +38 | Immune to recoil and shove. No dash; turns 2x slower |
| Legs | Strider servo-legs | Rare · 50 | armor −10, speed +14, weight +2 | Dash recharges in 0.7 s and adds half the heat. Thinner armor |
| Core | Composite frame | Common · 15 | armor −15, speed +10, weight −12 | Lighter and faster, with less armor |
| Core | Ablative slag-plating | Rare · 80 | armor +60, speed −20, weight +40 | About 30% slower |
| Core | Nanite repair core | Epic · 95 | weight +10, heat +8 | After 3 s without damage, repairs 2 armor per second |
| Reactor | Reactor Mk1 (starter) | Common · 0 | weight +4 | Standard reactor |
| Reactor | Reactor Mk2 | Rare · 60 | power +15, speed +6, weight +8, heat +10 | More power and ATB fill. Runs hotter |
| Reactor | Reactor Mk3 | Epic · 120 | power +30, speed +12, weight +14, heat +22 | Top power and speed. Heavy; runs hot |
| Reactor | Cold-fusion cell | Epic · 140 | power +20, speed +6, weight +10, heat −12 | Nearly Mk3 power that runs cool. The most expensive part |

Base stats are power 100, armor 100, speed 100, weight 60 (the starter parts bring weight to 100) and heat 100. Mortar: the old spec's 15 m minimum range was cut to 4 m because the 32-cell prototype map is too small for it.

## Garage and drop pods

The garage is the only place your build changes for good. Drop pods are one-use boosts inside a match.

**Garage (between matches only)**

- Spend scrap on parts and repairs, and fit parts to slots. Stat upgrades and higher-tier weapons are not in the first version: tiers are the only upward track.
- Every change shows its effect on the five stats before you confirm. Durability damage from excursions shows here until you repair it.
- In an excursion, scrap only counts once you extract; if your mech dies, you lose all the scrap from that match. Gauntlet scrap never banks.

**Drop pods (in the arena)**

- At least one pod lands every wave, at a random time. A marker and countdown show where it will land. Touching it applies its effect, then the pod disappears.
- Effects last for the current match at most.
- Enemy mechs grab pods too, so every pod is a race.

| Pod | Effect |
| --- | --- |
| Field repair | Restore 40% armor |
| Overclock | ATB bars fill twice as fast for 15 s |
| Coolant flood | Heat locked at 0 for 10 s (not in the prototype yet) |
| Bolt-on plate | Temporary armor that sheds first (not in the prototype yet) |

**Edge cases**

- **Player and enemy touch a pod in the same frame:** the player gets it (proposed).
- **Pod buried by a collapse:** the pod is destroyed with no effect (proposed).
- **Overclock during a running ring:** the running ring is unaffected; every ATB fill during the 15 s is doubled.

## Economy

Scrap is the only currency. Part prices are the prototype's; every other value is TBD.

| Scrap source | Amount |
| --- | --- |
| Patrol bot | TBD |
| Heavy loader | TBD |
| Vault or power relay | TBD |
| Armored transport (Overpass Sector 4) | TBD |
| Pile-bunker kill | Double that enemy's scrap |

| Scrap sink | Cost | Repeatable |
| --- | --- | --- |
| Buy a part (higher rarity costs more) | 15 to 140 in the prototype | No |
| Repair durability damage | Free for starter parts; other parts cost more at higher tiers (TBD) | Yes |

- Scrap dropped as cubes must be picked up; cubes buried under a collapse pop up onto the rubble.
- Repairs keep scrap useful once every part is owned.
- Extraction is not instant: pick up scrap cubes before you finish wave 5, since cubes still on the floor go to the nearest mech when the wave clears.

## Destruction and environment

The map is built from voxels, and anything resting on something else can fall.

- **Supports:** pillars, beams and crane chains hold up the structures above them. Break enough supports and everything above collapses.
- **Environmental kills:** a collapse damages everything under it. A cheap mech can beat an upgraded one by dropping a road on it.
- **Terrain reshaping:** heavy weapons carve trenches and punch new doorways, so cover and flanking routes change every match. Damage stays until the match ends.
- **Scrap from the city:** high-value targets like vaults and power relays burst into scrap cubes when destroyed.
- **Readable danger:** falling structures cast a shadow on the ground before they land, so players can dash clear. Shadows and pod markers always draw on top of the low-health vignette and the cutaway.

## Enemies and AI

Enemies come in waves, with bosses on waves 3 and 5 (see Run rules).

| Enemy | Role |
| --- | --- |
| Patrol bot | Light, common; the main source of early scrap |
| Heavy loader | Slow, armored; hauls ore and drops extra scrap |
| Bounty boss | First version has one fixed boss: an ultra-light sniper that jumps across rooftops. It appears on waves 3 and 5; wave 5 is a harder variant of the same fight, played on a skyline you have wrecked |

**Drop pod rule:** an enemy goes for a pod when the pod is closer than the player, or when its own armor is below 50%.

**Collapses:** enemies break supports on purpose to drop structures on the player. The falling shadow gives the player time to dash clear.

## Maps

Overpass Sector 4 is the first map; the other two come later.

| Map | Layout | Destruction hook | Scrap hotspot |
| --- | --- | --- | --- |
| Overpass Sector 4 (first) | Slum streets under a six-lane highway overpass | Break two pillars in a row and 40 m of road falls on everyone below | Armored transports on the highway; knock them off to spill scrap below |
| The Smelting Yards (later) | Warehouses, cranes and raised slag vats | Shoot vat chains to flood alleys with molten slag; ambient heat makes energy weapons overheat 20% faster | Heavy loaders hauling ore through the furnace room |
| Neon Financial Plaza (later) | Open courtyard, four glass towers, an underground garage | Towers lean and fall, turning a sniper map into close-range rubble | Bank vaults in the basement; blast through the street to drop in |

### Zones

A map is cut into zones along its landmark, and a level decides which are open. Overpass Sector 4 has three: the Underpass (level 1), the Freight Yard (opens on level 2) and Smelter Row (opens on level 3); from level 3 the whole sector is one battlefield. A sealed zone is walled off by a blast shutter across the street, drawn dark with its name on it, and nothing spawns there. When you die, the campaign returns to level 1 and the zones close again.

Opening a zone is the drop-in of that level: the mech (or mechs, in co-op) lands, nothing spawns for 5.5 s, the camera leaves the mechs, pulls back over the sealed zone, the shutter falls into debris at 2.6 s, the zone lights up, and the camera returns before wave 1 begins. Input is locked and mechs can't be damaged during the shot (proposed). Enemies, loaders, drop pods and sniper perches only use open zones, so the fight spreads out as you climb the levels. Numbers: `T.zone` in sim.js.

## Game modes

Excursion is the game's main mode and the only one that progresses your mech. Gauntlet is practice. All modes are online. PvP modes come after the first version; the first version's economy and garage are built for them.

| Mode | Players | How it works | When |
| --- | --- | --- | --- |
| Excursion | 1 or 2 (co-op) vs AI | 5 waves, bosses on 3 and 5; extract to keep your scrap and open the next level; die or leave early and lose the match's scrap and drop back to level 1 | First version |
| Gauntlet | 1 or 2 vs AI | Practice on the same waves: no scrap banked, no damage to repair; starts at level 1 and resets to it on a loss | First version |
| Draft Duel | 1v1 | Best of 5, 90-second rounds; both see each other's buys and get new scrap between rounds | After the first version |
| Scrap Rush | 1v1 or 2v2 plus AI | Farm neutral AI for scrap, or bulk up and raid the other side's drop pods | After the first version |

## Prototype status (Oct 25, 2026)

What the GDD says that `prototype.html` and `sim.js` don't do yet:

- **Always-online single player:** the prototype runs single-player offline in the browser, with saves in `localStorage` and a copyable campaign code. Only co-op uses the server.
- **Disconnects:** a partner who leaves or drops is destroyed. There is no rejoin window.
- **Gauntlet:** a Gauntlet loss banks its scrap and doesn't reset to level 1. No mastery goals or test-driving parts.
- **Durability:** the prototype carries one armor pool between levels with a 30% floor and repairs 3 armor per scrap. Per-part durability with free starter repairs is not built.
- **Pods:** only Field repair and Overclock exist.
- **Zone drop-in:** input isn't locked during the shot.
- **Collapse shadows:** drawn under the red low-health vignette.
- **Heat and timing:** every result already costs the same heat, an overheat during a ring adds none, the flash-vent already ends a lockout, and Overclock already doubles every fill. The GDD now matches.
- **Wave 5 boss variant:** the prototype spawns the same sniper on waves 3 and 5 with no variant.
