# Metr0niks GDD

Updated Oct 26, 2026 · @kr0 · Earlier versions: [Oct 20](superseded/gdd-2026-10-20.md), [Oct 25 draft](superseded/gdd-2026-10-25-draft.md)

This GDD describes one mode, Excursion, as the prototype plays it plus kr0's decisions of Oct 25 and 26 ([decision history](gdd-decisions.md)). The prototype changes those decisions need are in [prototype changes](prototype-changes.md). Dimensions are in metres; one map cell is one metre.

## Overview

Metr0niks is an isometric voxel mech brawler. You drive and shoot in real time, fire a heavy weapon on an ATB timing hit, and tear down the city for scrap that rebuilds your mech between matches.

**Pillars**

- **Every part is a tradeoff.** Each part changes weight, heat, power, armor or speed, so building your mech changes how it moves and fights.
- **The city is a weapon.** Pillars and overpasses are as deadly as your guns.
- **Real-time driving, timed heavy hits.** Movement and light guns never pause; the heavy arm weapon rewards a well-timed press.

**Scope:** Excursion, single-player or two-player co-op, on one map (Overpass Sector 4), on PC with keyboard and mouse. Single-player runs in the browser; co-op runs through an online room.

**Non-goals:** no PvP, no other game modes, no touch controls, no accounts or server-held saves, no rejoining a match, no story, no map damage that carries between matches, no procedural maps.

**Look:** three art styles that change only how the game looks: Blockout (default), Cinematic and Ink.

## Core loop

Garage, drop in, five waves with a boss on waves 3 and 5, extract. Extracting banks the match's scrap and opens the next level. Dying loses the match's scrap and sends the campaign back to level 1.

## Excursion rules

An excursion is five waves on one map. It ends when you clear wave 5 or every mech is destroyed. Excursion is the game's only mode and the main one.

- **Waves:** each excursion is 5 waves: 3 bots; 4 bots and 1 loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, 1 loader and the boss. Bosses come on waves 3 and 5. This is the only place the wave structure is defined.
- **Wave pacing:** enemies drop in one every 0.8 s, the boss first, then loaders, then bots. A wave is clear when its queue is empty and no enemy is left; the next wave starts after a 3 s breather.
- **Levels:** each excursion is one campaign level, from 1 to 50. Per level above 1, bot and loader counts rise 25%, enemy health 15%, enemy damage 15% and scrap drops 10%. The boss count does not change.
- **Zones:** level 1 opens the Underpass only, level 2 also opens the Freight Yard, level 3 and up open the whole sector (see Map).
- **Extract:** 1.4 s after wave 5 clears you extract automatically. Scrap cubes still on the floor go to the nearest mech. Your scrap is banked and the next level opens. There is no cash-out earlier: scrap is all-or-nothing until you extract. Leaving early counts as a loss.
- **Armor:** every level starts with every mech at full armor.
- **Lose condition:** a mech is destroyed when its armor reaches 0. The excursion is lost when every mech is destroyed.
- **On death:** you lose all scrap from the match and the campaign goes back to level 1. Parts you own and scrap you banked are never lost. Durability damage is not applied on a death.
- **Starter mechs:** the starter build (minigun, pile-bunker, vectored jump-jets, Reactor Mk1) is free and can't be lost, so a player with 0 scrap can always deploy.
- **Progression:** mechs progress only in excursions. Your build, owned parts, scrap, wear and level are saved in the browser as one campaign code, which you can copy from the garage.

**Co-op:** two players share one excursion and one map; the host is player 1 (orange) and the guest player 2 (cyan). If one mech is destroyed, the other fights on, and the dead player's camera follows the survivor. Co-op plays at the lower of the two players' levels. Each mech keeps its own scrap wallet from the cubes it picks up. Co-op never pauses.

**Leaving a co-op room:** if a partner leaves or loses connection, their mech is destroyed and the other player fights on alone. The room closes when the excursion ends. In the garage, a player whose partner left can drop in alone.

**Durability:** when you extract, each fitted part that is not a starter part gains wear equal to 10% of the armor your mech lost in the excursion, divided by its max armor (so losing 100 armor on a 100-armor mech adds 10% wear to every such part). Wear cuts every stat change that helps you (more power, armor or speed, less weight or heat) by that percentage; stat changes that cost you, and special abilities, stay as they are. Starter parts never wear and always repair free. Repairing another part costs its price times its wear times 25% for common parts, 50% for rare and 75% for epic.

## Controls and camera

A high-angle isometric twin-stick: the legs and the torso are controlled separately, so you can retreat while aiming forward.

| Input (keyboard and mouse) | Action |
| --- | --- |
| WASD or arrow keys | Leg direction (screen-relative): momentum, turn radius, traction |
| Mouse | Torso aim, independent of the legs; weight and some parts slow how fast it tracks |
| Left mouse button (hold) | Right-arm light gun |
| Right mouse button (press, hold, release) | Left-arm heavy weapon: starts its timing ring, release to fire |
| Q | Shoulder active, if one is fitted |
| Space | Dash in your drive direction (or leg facing if standing) |
| Esc | Pause (single-player only; the window losing focus also pauses) |
| Enter or R | Press the main button of an open overlay |

- **Camera:** a fixed 2:1 dimetric isometric view that follows the mech with an 18% lean toward the aim point. It zooms with the window size, not with the build, and never reacts to damage. Screen shake follows hits and collapses.
- **Low health:** below 35% armor the armor bar turns red and a dark red vignette creeps in from the screen edges, up to 75% opacity at 0%. Collapse shadows and pod markers always draw on top of the vignette.
- **Cutaway:** voxels in front of the mech inside an ellipse around it draw at 16% opacity, so you never lose your chassis.
- **Aiming at height:** the aim point follows the first solid wall face under the cursor, up to about 2 m, and snaps to an enemy under the cursor. That snap is how you target the rooftop sniper. There is no free torso pitch.
- **HUD:** armor, heat (or "locked" with seconds), dash, the arm weapon's charge state, the shoulder active's cooldown, overclock time, level, wave, enemies left (or the countdown to the next wave), the match's scrap, enemies downed and a boss bar. A cursor ring shows heat and ATB charge, and the timing ring shows during a press.
- **Menus:** the title card shows the controls for your build, Continue (when you're past level 1), Drop in (opens the garage) and the co-op row.

## Combat

Combat runs on two layers: the right-arm light gun fires in real time, the left-arm heavy weapon charges on an ATB bar and lands on a timing hit. Movement never stops for either.

**Light weapons (real time, left mouse)**

- Fire while held; each shot adds heat. Damage is multiplied by power ÷ 100 and by the weapon's upgrade level (see Weapon upgrades). The same holds for heavy weapons and shoulder actives.
- Light weapons: minigun, shotgun, plasma cutter, rail rifle.

**Heavy weapons (ATB, right mouse)**

- The pile-bunker, bunker-buster cannon and mag-winch share one ATB bar. It fills in 6 s divided by power ÷ 100 (doubled while overclocked).
- When full, press and hold the right mouse button to start the timing ring: it shrinks from a 72 px radius toward a 30 px target ring over 1 s. Release to lock it. If you hold past the ring closing (about 1.3 s), it fires as a Miss.
- You keep driving and aiming while the ring runs.

| Timing result | Window (share of the 72 px start radius, around the target) | Damage | Structural damage | Heat |
| --- | --- | --- | --- | --- |
| Perfect | within 5% | 200% | Bonus: wider and two voxels deep | 28 |
| Good | within 18% | 100% | Normal | 28 |
| Miss or ring closes | outside 18% | 50% | Reduced | 28 |

- After any shot the weapon extends for 0.12 s. After a Miss the pile-bunker and mag-winch retract for 1.5 s: they can't re-arm and the torso turns at half speed. The bunker-buster has no retract on a Miss.

**Shoulder actives (real time, Q)**

- The siege mortar and the flash-vent use no timing ring. Each has a cooldown: the mortar 7 s (recharges faster with power), the flash-vent 10 s.

**Heat**

- Heat runs 0 to 100. Light shots, the heavy weapon, the mortar and dashes add heat; heat drains at 20 per second at the base heat stat.
- Every heat gain is multiplied by 1 + (heat stat − 100) ÷ 200 below 100, or ÷ 100 above it. Drain is 20 × (1 + (100 − heat stat) × 0.015), never below 40% of 20.
- At 100 the mech overheats for 3 s: light guns, dashes and the mortar lock, a running ring cancels as a Miss, and heat falls to 0 over the lockout. The Cryo flash-vent ends a lockout at once.

**Tunables**

| Tunable | Value |
| --- | --- |
| Tick | 1/60 s |
| ATB base fill time | 6 s |
| Timing ring | 1 s, 72 px start, 30 px target |
| Perfect and Good windows | 5% and 18% of the start radius |
| Timing multipliers | 2, 1, 0.5 |
| Heat per heavy shot | 28 |
| Minigun heat per shot | 3.2 |
| Dash | 12 m/s for 0.15 s, 1.3 s cooldown, 10 heat |
| Heat drain per second | 20 |
| Overheat lockout | 3 s |
| Structural share of bullet damage | 50% |

**Edge cases**

- **Overheat during a ring:** the ring cancels and counts as a Miss, the bar empties and the arm retracts for 1.5 s. It adds no further heat.
- **Venting during a lockout:** the Cryo flash-vent sets heat to 0 and ends the lockout.
- **Pressing while charging, locked out or retracting:** nothing fires and the HUD shows the state.

## Mech building

A mech is a frame with six slots: Core, Arm-R, Arm-L, Shoulder, Legs and Reactor. The frame sets the base stats and every part changes them. There are no raw stat upgrades: a mech gets stronger by fitting different parts and by upgrading its weapons (see Weapon upgrades).

| Stat | What it controls |
| --- | --- |
| Power | Damage of every weapon, ATB fill speed and mortar recharge, as power ÷ 100 |
| Armor | The mech's health: 100 × armor ÷ 100; at 0 the mech is destroyed |
| Speed | Top speed (4.4 m/s at 100) and acceleration (26 at 100), before weight |
| Weight | Slows speed, acceleration and turning by 1 ÷ (1 + 0.004 × (weight − 100)) |
| Heat | How fast you heat up and how fast you cool, as in Combat |

- **Base stats:** power 100, armor 100, speed 100, weight 60 and heat 100. The starter parts bring weight to exactly 100, so the starter mech lands on the baselines.
- **Turning:** legs turn at 7 and the torso at 11 radians per second, scaled by weight. Siege treads halve both and the bunker-buster cuts torso turning by 25%.
- **Armor:** one pool per mech. The Nanite repair core restores 2 armor per second after 3 s without damage.
- **Legs and ability:** the legs set the dash. Vectored jump-jets dash in your drive direction. Siege treads have no dash and are immune to loader shoves and recoil.
- **Damage regions:** not part of the game. A mech has one armor pool and its weapons are never disabled.

### Weapon upgrades

Each weapon can be upgraded twice, from Mk I to Mk III, for scrap (GDD-D23, proposed values).

- **Weapons:** the four Arm-R guns, the three Arm-L heavy weapons, and the two shoulder actives (siege mortar and Cryo flash-vent): nine parts. The Cryo-vent heatsink and Salvage magnet deal no damage and have no levels.
- **Effect:** every level adds 10% of the weapon's damage to enemies, on top of power: Mk II deals 110% and Mk III 120%. Heat, rate of fire, range, cooldowns and damage to voxels don't change.
- **Ownership:** a part is bought at Mk I. Its level belongs to the owned part, so it stays when you swap the part out and back, and it is never lost, not on a death either. Starter weapons can be upgraded.
- **Wear:** wear doesn't reduce upgrade levels, and upgrade levels don't change a part's repair price.

| Rarity | Mk I to Mk II | Mk II to Mk III |
| --- | --- | --- |
| Common | 20 | 40 |
| Rare | 35 | 70 |
| Epic | 60 | 120 |

Upgrading all nine weapons to Mk III costs 1,005 scrap.

## Parts list

The garage sells 21 parts in three rarity tiers: common, rare and epic. Higher tiers cost more scrap and cost more to repair. Arm-R is the light gun on the left mouse button; Arm-L is the heavy weapon on the right.

| Slot | Part | Rarity · price | Stat change | What it does and what it costs you |
| --- | --- | --- | --- | --- |
| Arm-R | Minigun (starter) | Common · 0 | weight +14 | 11 shots a second, 4 damage, about 20 m range. Heats up quickly: 3.2 heat a shot lock it out after about 6.6 s of fire. Half damage to armored loaders |
| Arm-R | Shotgun | Rare · 25 | power +10, weight +18, heat +15 | Six pellets of 5 damage every 0.55 s, about 8 m range. Devastating up close, weak past it; 16 heat a shot. Half damage to loaders |
| Arm-R | Plasma cutter | Rare · 45 | power +5, weight +12, heat +20 | 14 shots a second, 3.2 damage, about 5 m range. Ignores loader armor and does four times the voxel damage. Fills heat fast |
| Arm-R | Rail rifle | Epic · 110 | power +15, weight +22, speed −4, heat +15 | One 34-damage slug every 1.1 s, about 31 m range, through every enemy in line and up to 3 voxels. 24 heat a shot |
| Arm-L | Pile-bunker (starter) | Common · 0 | weight +14 | ATB melee spike, 45 damage, in a short cone; knocks enemies back up to 3 m and a Perfect hit breaks barriers and containers. A Perfect kill drops double scrap. Zero range; 1.5 s retract on a Miss. Can't hit the rooftop sniper |
| Arm-L | Bunker-buster cannon | Rare · 90 | power +20, weight +34, speed −5, heat +10 | ATB shell, 70 damage, that blasts a 3×3×3 hole. Recoil shoves you back 2 m (not with treads); torso turns 25% slower |
| Arm-L | Industrial mag-winch | Rare · 55 | weight +16 | ATB cable, 8 m (10 m on Perfect), 20 damage: reels bots in, yanks the rooftop sniper off its perch, tears out a pillar's base on Perfect. A wall or a heavy loader reels you in instead |
| Shoulder | Cryo-vent heatsink | Rare · 30 | weight +8, heat −33 | Passive cooling. Uses the shoulder slot |
| Shoulder | Twin-pod siege mortar | Epic · 100 | power +5, weight +24, speed −4, heat +10 | Q lobs two shells onto the cursor every 7 s: 30 damage with 1.7 m splash and a 3×3×3 voxel blast each. Range 4 to 14 m; 18 heat |
| Shoulder | Cryo flash-vent | Rare · 40 | weight +10, heat −15 | Q dumps all heat, even in a lockout, and slows bots within 4 m to 40% speed for 3 s (8 damage). 10 s recharge; no passive weapon |
| Shoulder | Salvage magnet | Common · 20 | weight +6 | Scrap cubes fly to you from 7 m instead of 3. Uses the shoulder slot |
| Legs | Vectored jump-jets (starter) | Common · 0 | weight +8 | Space dashes in your drive direction; each dash adds 10 heat |
| Legs | Bulldozer siege treads | Rare · 70 | armor +25, speed −8, weight +38 | Immune to recoil and loader shoves. No dash; turns 2x slower |
| Legs | Strider servo-legs | Rare · 50 | armor −10, speed +14, weight +2 | Dash recharges in 0.7 s and adds half the heat. Thinner armor |
| Core | Composite frame | Common · 15 | armor −15, speed +10, weight −12 | Lighter and faster, with less armor |
| Core | Ablative slag-plating | Rare · 80 | armor +60, speed −20, weight +40 | About 30% slower |
| Core | Nanite repair core | Epic · 95 | weight +10, heat +8 | After 3 s without damage, repairs 2 armor per second |
| Reactor | Reactor Mk1 (starter) | Common · 0 | weight +4 | Standard reactor |
| Reactor | Reactor Mk2 | Rare · 60 | power +15, speed +6, weight +8, heat +10 | More power and ATB fill. Runs hotter |
| Reactor | Reactor Mk3 | Epic · 120 | power +30, speed +12, weight +14, heat +22 | Top power and speed. Heavy; runs hot |
| Reactor | Cold-fusion cell | Epic · 140 | power +20, speed +6, weight +10, heat −12 | Nearly Mk3 power that runs cool. The most expensive part |

## Garage and drop pods

The garage is the only place your build changes. Drop pods are one-use boosts inside a match.

**Garage (between matches only)**

- Buying a part pays its full price from your banked scrap and you own it for good. Swapping back to a part you own is free. There is no selling or refunds. Core and Shoulder can be left empty; the other slots always hold a part.
- The garage shows the five stats as bars with the selected part's change before you confirm, plus max armor, speed, damage, ATB fill time and cooling.
- It upgrades the selected weapon one level at a time and shows its level and the price of the next one.
- It shows each fitted part's wear and the scrap to repair it. Repair restores worn parts you can afford; starter parts repair free.
- The campaign code (your save) is shown in the garage and can be copied. Resetting the save wipes it after two clicks.
- In co-op the garage is shared: both players shop, then both press Drop in. The room's saved campaign replaces each player's local one.

**Drop pods (in the arena)**

- Each wave drops one pod, and a second with a 40% chance, at a random time 1.5 to 6 s into the wave, on an open cell at least 4 m from every living mech. A marker and a 3 s countdown show where it lands, then the crate falls.
- Touching a pod (within 0.7 m) applies its effect once and the pod disappears. Pods never expire.
- Any living mech can take a pod, the nearest first. Failing that, a patrol bot or a heavy loader that walks over one takes it. The boss can't.
- Patrol bots go for a pod when it is closer to them than to the nearest mech, or when their health is below 50%.
- Enemies that take a pod show a toast, so every pod is a race.

| Pod | Effect |
| --- | --- |
| Field repair | Restore 40% of the taker's max armor |
| Overclock | ATB bars fill twice as fast for 15 s; a bot that takes it fires twice as fast |

**Edge cases**

- **Player and enemy touch a pod in the same frame:** the player gets it.
- **Overclock during a running ring:** the running ring is unaffected; every ATB fill during the 15 s is doubled.

## Economy

Scrap is the only currency. One scrap cube is one scrap. Cubes must be picked up (0.55 m, pulled in from 3 m, 7 m with the Salvage magnet).

| Scrap source | Cubes |
| --- | --- |
| Patrol bot | 3 to 5 |
| Heavy loader | 8 to 10 |
| Bounty sniper | 12 (18 on wave 5) |
| Collapse landing | 2 to 4, when the fallen piece has more than 6 voxels |
| Perfect pile-bunker kill | Double that bot's cubes |

Every source is multiplied by 1 + 0.10 × (level − 1) and rounded.

| Scrap sink | Cost | Repeatable |
| --- | --- | --- |
| Buy a part | 15 to 140 by part (see Parts list) | No |
| Upgrade a weapon | 20 to 120 by rarity and level (see Weapon upgrades) | Twice per weapon |
| Repair a worn part | Price × wear × 25%, 50% or 75% by rarity; free for starter parts | Yes |

- Roof loot drops to street level.
- Weapon upgrades and repairs keep scrap useful once every part is owned.

## Destruction and environment

The map is built from voxels, and anything resting on something else can fall.

- **Supports:** voxels group into 4×4×4 chunks. A chunk breaks into debris when it loses 20% of its voxels. Pillars and buildings hold up what is above them; deck spans never hold each other up.
- **Collapse:** after a chunk breaks, anything no longer connected to the ground falls as one piece. Break one pillar and the deck is cantilevered; break two neighbours and the span between them falls.
- **Warning:** a loose piece creaks for 0.9 s and its ground footprint shades red before it falls. Shadows always draw above the low-health vignette.
- **Landing:** a collapse deals 80 damage to every bot under it and 40 to every mech, at any level. Landing voxels may stay as rubble, which blocks walking and can be shot away, or break into debris and scrap cubes.
- **Terrain reshaping:** heavy weapons carve trenches and punch new doorways, so cover and flanking routes change every match. Damage stays until the match ends.
- **Shooting structures:** bullets put half their damage into voxels. The plasma cutter does four times that; the pile-bunker, bunker-buster and mortar carve larger holes.

## Enemies and AI

| Enemy | Stats | Behaviour |
| --- | --- | --- |
| Patrol bot | 60 health, 2.4 m/s, sees 10 m, range 6.5 m | Patrols between street cells, engages on sight or when hurt: fires a 7-damage orb every 1.25 s, strafes and backs off when close, gives up after 3 s unseen. Drops in from 9 m, landing for 10 damage |
| Heavy loader | 160 health, 1.3 m/s, armored | Patrols, hunts on sight, stops within 2.2 m and tells for 0.5 s, then charges for up to 1 s at 5 m/s in a straight line, plowing barriers and containers: 22 damage and a 1.5 m shove. Does not shoot. Half damage from bullets |
| Bounty sniper | 180 health, sees 15 m | Perches on a roof edge and fires an 18-damage orb every 2.2 s after a 0.6 s tell. Jumps to a new perch every 6 to 9 s, or after 1.5 s without sight. If the voxel under it is destroyed it falls: a fall of 1.5 m or more costs 60 health and a 2 s stun |

- **Bosses:** the same sniper appears on waves 3 and 5. The wave-5 sniper has 1.5 times the health, fires every 1.5 s instead of 2.2 s and drops 18 scrap cubes. Its perches are the roofs you have left standing.
- **Level scaling:** counts, health, damage and scrap grow with the level (see Excursion rules).
- **Structures:** enemies don't aim at supports. Only the heavy loader's charge damages the map, plowing through barriers, windows and containers.
- **Pods:** see Garage and drop pods.

## Map

Overpass Sector 4 is the only map: a voxel grid 80 m long, 32 m wide and 8 m high, with an indestructible perimeter wall.

- **The overpass:** a six-lane road deck 5 m up, one voxel thick, runs the full length on ten 2×2 concrete pillars at x = 3, 11, 19, 27, 35, 43, 51, 59, 67 and 75. Dropping a span puts the road on whoever is below.
- **Streets:** 47 buildings (2 to 5 m high), 16 barriers and 14 containers fill the streets; all of it can be shot apart.
- **Hook:** break two pillars in a row and the 8 m of road between them falls on everyone below.

### Zones

The map is cut into three zones along its length, each walled off by an indestructible blast shutter until it opens: the Underpass (x 0 to 31), the Freight Yard (x 32 to 55) and Smelter Row (x 56 to 79). Level 1 opens the Underpass, level 2 adds the Freight Yard, level 3 and up open all three. A sealed zone is drawn dark with its name, and nothing spawns there. Enemies, pods and sniper perches only use open zones, so the fight spreads out as you climb levels. When you die, the campaign returns to level 1 and the zones close again.

Opening a zone is the drop-in of that level: the mechs land, nothing spawns for 5.5 s, the camera leaves the mechs and pulls back over the sealed zone, the shutter falls into debris at 2.6 s, the zone lights up, and the camera returns before wave 1 begins. Input is locked and mechs take no damage during the shot. Levels 1 and 4 and up have no drop-in shot.
