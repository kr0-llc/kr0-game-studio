# Metr0niks GDD

Oct 20, 2026 · @kr0

## Overview

Metr0niks is an isometric voxel mech brawler. You drive and shoot in real time, fire heavy weapons on an ATB timing hit, and tear down the city for scrap that rebuilds your mech between matches.

**Pillars**

- **Every part is a tradeoff.** Each part changes weight, heat or power, so building your mech changes how it moves and fights.
- **The city is a weapon.** Pillars, overpasses and vats are as deadly as your guns.
- **Real-time driving, timed heavy hits.** Movement and light guns never pause; heavy weapons reward a well-timed press.

**Scope:** single-player Excursion and Gauntlet first, on one map (Overpass Sector 4), on PC with keyboard and mouse. All play is online; multiplayer comes later.

**Non-goals (first version):** no multiplayer, no story, no map damage that carries between matches, no procedural maps.

**Accessibility:** options to widen the Perfect timing window and to auto-release timing rings, plus remappable keys. Window sizes are TBD.

## Core loop

&#91;embedded content: core loop · 5 steps, 1 failure path\]

A match runs garage, drop in, waves, boss, extract. Dying at any point sends you back to the garage with none of that match's scrap.

## Run rules

A match is an excursion of 5 waves on one map. It ends when you clear wave 5 or your mech is destroyed. Rules marked proposed are waiting on a decision in the open questions doc.

- **Waves:** each excursion is 5 waves. Bosses come on waves 3 and 5. This is the only place the wave structure is defined.
- **Extract:** clearing wave 5 extracts you and banks your scrap. Leaving early counts as a loss.
- **Lose condition:** the mech is destroyed when its health runs out.
- **On death:** you lose all scrap from the match. Parts you own are never lost.
- **Starter mechs:** basic loadouts that are free and can't be lost, so a player with 0 scrap can always deploy.

**Gauntlet:** the same waves with no penalty for losing. You keep your scrap and take no damage that needs repair. Gauntlet doesn't progress your mech.

**Durability:** at the end of an excursion, a share of the damage taken (TBD%) becomes durability damage. It lowers max health, heat tolerance and other stats until you repair it in the garage.

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
| Miss or ring closes | 50% | Reduced | Full cost |

**Heat**

- Light shots, heavy shots, jump-jets and energy parts all add heat; heat drains over time.
- At 100%, the mech overheats: weapons and thrusters shut down for 3 seconds and it vents damaging steam.

**Tunables** (starting values for tuning; TBD = not set yet)

| Tunable | Value |
| --- | --- |
| ATB base fill time | 6 s (TBD) |
| Timing ring duration | 1.0 s (proposed) |
| Perfect window | TBD |
| Good window | TBD |
| Heat per light shot | TBD |
| Heat per heavy shot | TBD |
| Heat drain per second | TBD |
| Overheat lockout | 3 s |

**Edge cases**

- **Two heavy weapons ready:** only one timing ring runs at a time; the second heavy weapon waits until the first ring resolves.
- **Overheat during a ring:** the ring cancels and counts as a Miss.
- **Arm disabled mid-charge or mid-ring:** that weapon's ATB charge and any running ring are lost.

## Mech building

A mech is a frame with six slots. Every part adds to five stats, and damage can disable whole regions mid-match.

| Stat | What it controls |
| --- | --- |
| Power | Weapon damage and how fast ATB bars fill |
| Armor | The mech's health; at 0 the mech is destroyed |
| Speed | Top speed and acceleration, before weight |
| Weight | Total mass: slows movement, turning and torso tracking |
| Heat | How fast you heat up, and how much headroom you have |

**Slots:** Core, Arm-R, Arm-L, Shoulder, Legs, Reactor.

**Damage regions:** the mech has three regions: left weapon, right weapon and legs. A region that takes enough damage is disabled for the rest of the match. A disabled weapon stops firing and its weight is removed, so the mech gets faster; disabled legs impair movement. Speed always follows weight.

Base values and formulas for each stat are TBD.

**Edge cases**

- **Health reaches 0:** the mech is destroyed.
- **Weapon region disabled:** its ATB charge and any running ring are lost, and its weight is removed.
- **Legs disabled:** movement is impaired; the speed penalty is TBD.

## Parts list

The starting pool is twelve parts. Heavy weapons fire on ATB, other weapons and abilities work in real time, and plating is passive.

| Slot | Part | Fires on | What it does | Tradeoff |
| --- | --- | --- | --- | --- |
| Arm | Minigun (starter) | Real time | Fast light rounds while held | Low structural damage; steady heat |
| Arm | Shotgun | Real time | Wide close-range blast | Weak beyond close range |
| Arm | Plasma cutter | Real time | Ignores armor and melts supports | Fills heat fast |
| Arm | Bunker-buster cannon | ATB | Slow shells that punch through 3 layers of concrete | Recoil shoves you back 2 m; torso turns 25% slower |
| Arm | Hydraulic pile-bunker | ATB | Melee spike that launches mechs through walls and knocks off double scrap | Zero range; 1.5 s retraction if you miss |
| Arm | Industrial mag-winch | Real time | Cable that pulls you to walls or yanks pillars out | Pulling a heavier mech drags you to it instead |
| Shoulder | Twin-pod siege mortar | ATB | Arcing shells over buildings to collapse rooftops | Can't hit within 15 m; pods explode if shot |
| Shoulder | Cryo-vent heatsink | Real time | Passive cooling; Q vents a freezing blast that slows enemies | Takes the shoulder slot from a weapon |
| Legs | Vectored jump-jets | Real time | Vertical burst onto rooftops or over rubble | Each jump adds 40% heat |
| Legs | Bulldozer siege treads | Real time | Crush rubble at full speed; immune to recoil and knockback | No dash; turning in place takes twice as long |
| Core | Ablative slag-plating | Passive | Thick steel plates around torso and joints | 30% slower |
| Reactor | Reactor (tiered) | Passive | Sets speed and thrust time in the air; higher tiers give more | Higher tiers cost more scrap |

**Rarity:** parts come in five tiers: white, green, blue, purple and orange. Higher tiers have better stats and cost more scrap. Stat values per tier are TBD.

**In the prototype (Oct 22, 2026):** the garage sells 21 parts; prices are in banked scrap and rarity uses three tiers for now (common, rare, epic). The ten added on Oct 22 are below. Where they differ from the table above: the mag-winch fires on the left arm's ATB bar and timing ring rather than in real time; the siege mortar is a Q-key shoulder active on a 7 s recharge with a 4 m minimum range (the 32-cell map is too small for 15 m); and the cryo vent's Q blast is its own part (Cryo flash-vent), so the passive heatsink stays as it was.

| Slot | Part | Rarity · cost | What it does | Tradeoff |
| --- | --- | --- | --- | --- |
| Arm-R | Plasma cutter | Rare · 45 | Short torch (about 5 m) that ignores loader armor and does 4x voxel damage | Fills heat fast |
| Arm-R | Rail rifle | Epic · 110 | 34 damage slug every 1.1 s that passes through every bot in line and up to 3 soft voxels | Very hot per shot; heavy |
| Arm-L | Industrial mag-winch | Rare · 55 | ATB cable, 8 m (10 m on Perfect): reels bots in, yanks a roof sniper off its perch, Perfect on a pillar tears its base out | A wall or a heavy loader reels you in instead |
| Shoulder | Twin-pod siege mortar | Epic · 100 | Q lobs two arcing shells onto the cursor; 3x3x3 voxel blast plus splash | 4 m minimum range; 7 s recharge; adds heat |
| Shoulder | Cryo flash-vent | Rare · 40 | Q dumps all heat, even during a lockout, and freezes bots within 4 m (60% slower for 3 s) | 10 s recharge; no passive weapon |
| Shoulder | Salvage magnet | Common · 20 | Scrap cubes fly to you from 7 m instead of 3 | Uses the shoulder slot |
| Legs | Strider servo-legs | Rare · 50 | +14 speed; dash recharges in 0.7 s and adds half the heat | 10 less armor |
| Core | Composite frame | Common · 15 | Lighter (weight -12) and faster (+10 speed) | 15 less armor |
| Core | Nanite repair core | Epic · 95 | After 3 s without damage, repairs 2 armor per second | Weight and heat |
| Reactor | Cold-fusion cell | Epic · 140 | Power +20 and speed +6 with heat -12 | The most expensive part |

## Garage and drop pods

The garage is the only place your build changes for good. Drop pods are one-use boosts inside a match.

**Garage (between matches only)**

- Spend scrap on parts, stat upgrades, higher-tier weapons and repairs, and fit parts to slots.
- Every change shows its effect on the five stats before you confirm. Durability damage from excursions shows here until you repair it.
- In an excursion, scrap only counts once you extract; if your mech dies, you lose all the scrap from that match. Gauntlet has no such loss.

**Drop pods (in the arena)**

- At least one pod lands every wave, at a random time. A marker and countdown show where it will land. Touching it applies its effect, then the pod disappears.
- Effects last for the current match at most.
- Enemy mechs grab pods too, so every pod is a race.

| Pod | Effect |
| --- | --- |
| Field repair | Restore 40% armor |
| Overclock | ATB bars fill twice as fast for 15 s |
| Coolant flood | Heat locked at 0 for 10 s |
| Bolt-on plate | Temporary armor that sheds first |

**Edge cases**

- **Player and enemy touch a pod in the same frame:** the player gets it (proposed).
- **Pod buried by a collapse:** the pod is destroyed with no effect (proposed).
- **Overclock during a running ring:** speeds up the next ATB fill only; the ring's timing doesn't change.

## Economy

Scrap is the only currency. All values are TBD.

| Scrap source | Amount |
| --- | --- |
| Patrol bot | TBD |
| Heavy loader | TBD |
| Vault or power relay | TBD |
| Armored transport (Overpass Sector 4) | TBD |
| Pile-bunker kill | Double that enemy's scrap |

| Scrap sink | Cost | Repeatable |
| --- | --- | --- |
| Buy a part (higher rarity costs more) | TBD per tier | No |
| Repair durability damage | TBD | Yes |
| Stat upgrade | TBD per level | Yes |
| Higher-tier weapon | TBD per tier | Yes |

- Scrap dropped as cubes must be picked up; cubes buried under a collapse pop up onto the rubble.
- Repairs and upgrades keep scrap useful once every part is owned.

## Destruction and environment

The map is built from voxels, and anything resting on something else can fall.

- **Supports:** pillars, beams and crane chains hold up the structures above them. Break enough supports and everything above collapses.
- **Environmental kills:** a collapse damages everything under it. A cheap mech can beat an upgraded one by dropping a road on it.
- **Terrain reshaping:** heavy weapons carve trenches and punch new doorways, so cover and flanking routes change every match. Damage stays until the match ends.
- **Scrap from the city:** high-value targets like vaults and power relays burst into scrap cubes when destroyed.
- **Readable danger:** falling structures cast a shadow on the ground before they land, so players can dash clear.

## Enemies and AI

Enemies come in waves, with bosses on waves 3 and 5 (see Run rules).

| Enemy | Role |
| --- | --- |
| Patrol bot | Light, common; the main source of early scrap |
| Heavy loader | Slow, armored; hauls ore and drops extra scrap |
| Bounty boss | First version has one fixed boss: an ultra-light sniper that jumps across rooftops |

**Drop pod rule:** an enemy goes for a pod when the pod is closer than the player, or when its own armor is below 50%.

**Collapses:** enemies break supports on purpose to drop structures on the player. The falling shadow gives the player time to dash clear.

## Maps

Overpass Sector 4 is the first map; the other two come later.

| Map | Layout | Destruction hook | Scrap hotspot |
| --- | --- | --- | --- |
| Overpass Sector 4 (first) | Slum streets under a six-lane highway overpass | Break two pillars in a row and 40 m of road falls on everyone below | Armored transports on the highway; knock them off to spill scrap below |
| The Smelting Yards (later) | Warehouses, cranes and raised slag vats | Shoot vat chains to flood alleys with molten slag; ambient heat makes energy weapons overheat 20% faster | Heavy loaders hauling ore through the furnace room |
| Neon Financial Plaza (later) | Open courtyard, four glass towers, an underground garage | Towers lean and fall, turning a sniper map into close-range rubble | Bank vaults in the basement; blast through the street to drop in |

### Zones (prototype, 22 Oct)

A map is cut into zones along its landmark, and a campaign opens them one level at a time. Overpass Sector 4 has three: the Underpass (level 1), the Freight Yard (opens on level 2) and Smelter Row (opens on level 3); from level 4 the whole sector is one battlefield. A sealed zone is walled off by a blast shutter across the street, drawn dark with its name on it, and nothing spawns there.

Opening a zone is the drop-in of that level: both mechs land, nothing spawns for 5.5 s, the camera leaves the mechs, pulls back over the sealed zone, the shutter falls into debris at 2.6 s, the zone lights up, and the camera returns before wave 1 begins. Both players watch the same shot because it runs on the simulation clock. Enemies, loaders, drop pods and sniper perches only use open zones, so the fight spreads out as the campaign goes on. Numbers: `T.zone` in sim.js.

## Game modes

Excursion is the main mode and the only one that progresses your mech; Gauntlet is a no-penalty alternative. All modes are online.

| Mode | Players | How it works | When |
| --- | --- | --- | --- |
| Excursion | 1 vs AI | 5 waves, bosses on 3 and 5; extract to keep your scrap, die or leave early and lose it | First version |
| Gauntlet | 1 vs AI | The same waves with no penalty for losing: no scrap lost, no damage to repair | First version |
| Draft Duel | 1v1 | Best of 5, 90-second rounds; both see each other's buys and get new scrap between rounds | After single-player |
| Scrap Rush | 1v1 or 2v2 plus AI | Farm neutral AI for scrap, or bulk up and raid the other side's drop pods | After single-player |
