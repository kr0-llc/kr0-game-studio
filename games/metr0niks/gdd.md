# Metr0niks GDD

Updated Oct 28, 2026 · @kr0 · Earlier versions: [Oct 20](superseded/gdd-2026-10-20.md), [Oct 25 draft](superseded/gdd-2026-10-25-draft.md), [Oct 26 draft](superseded/gdd-2026-10-26-draft.md), [Oct 26](superseded/gdd-2026-10-26.md), [Oct 27](superseded/gdd-2026-10-27.md)

This GDD describes one mode, Excursion, as the prototype plays it plus kr0's decisions of Oct 25 to 27 ([decision history](gdd-decisions.md)). The prototype changes those decisions need are in [prototype changes](prototypes/prototype-changes.md). Dimensions are in metres; one map cell is one metre. Three items are TBD on kr0's instruction (GDD-D27): target audience, player fantasy and what makes it fun. Everything else has a value; values kr0 has not accepted yet are tagged "(proposed, GDD-Dxx)" where they appear.

The Oct 28 fun pass (GDD-D35 to GDD-D45, all Proposed) adds the beat chain and stagger, Redline, Overtime, contracts, threat bands and sector conditions, three enemies and Elites, zone hazards, six blueprint parts, two pods, co-op Crossfire, and feel and feedback. Why, the pillar each serves and the build order are in the [fun pass record](decisions/2026-10-28-fun-pass.md). The prototypes don't have any of it yet.

## Overview

Metr0niks is an isometric voxel mech brawler. You drive and shoot in real time, fire a heavy weapon on an ATB timing hit, and tear down the city for scrap that rebuilds your mech between matches.

**Pillars** (GDD-D26)

- **Every part is a tradeoff.** Each part changes power, armor, speed, weight and heat, so a bigger gun makes you slower and hotter. Upgrades sharpen a weapon; they never add raw stats.
- **The city is a weapon.** Pillars, overpass spans and rubble are as deadly as your guns, and a collapse can hit you too.
- **Drive in real time, hit on the beat.** Movement and light guns never pause; the heavy weapon charges on its own and rewards a well-timed release.
- **Scrap only counts if you get out.** A match's scrap is banked only when you extract, and enemies race you for the drop pods that keep you alive.
- **Lose the run, keep the garage.** Dying sends the campaign back to level 1, but parts, upgrades and banked scrap stay, so every climb starts stronger.

**Scope:** Excursion, single-player or two-player co-op, on one map (Overpass Sector 4), on PC with keyboard and mouse. Single-player runs in the browser; co-op runs through an online room.

**Target audience:** TBD (kr0).

**Player fantasy:** TBD (kr0).

**What makes it fun:** TBD (kr0).

**Non-goals:** no PvP, no other game modes, no touch controls, no accounts or server-held saves, no rejoining a match, no story, no map damage that carries between matches, no procedural maps, no accessibility options or remappable keys in this version (backlog, GDD-D19). Production milestones and pricing are not part of this GDD (GDD-D27).

**Look:** three art styles that change only how the game looks: Blockout (default), Cinematic and Ink. The game is built in the voxel look first; rendering stays swappable so shaders, textures and animated models can replace it later without changing any rule, because the rules live in `sim.js` and the renderer only draws them (GDD-D46). The separate renderer is built later; until then the voxel build stays as it is.

## Core loop

- **Match:** garage, drop in, five waves with a boss on waves 3 and 5, then extract or push into Overtime for more (proposed, GDD-D37). Extracting banks the match's scrap and opens the next level. Dying loses the match's scrap and sends the campaign back to level 1. Each level carries an optional contract for bonus scrap (proposed, GDD-D38).
- **Campaign:** climb from level 1 to level 50. Each level adds enemies and scrap, levels 2 and 3 open new zones, and extracting level 50 wins the campaign. Every ten levels a new threat band adds an enemy type, and from level 4 each level has a sector condition that changes the rules for that match (proposed, GDD-D39, GDD-D40). Between matches, spend banked scrap on parts, weapon upgrades and repairs. Reaching a band for the first time unlocks new parts for good (proposed, GDD-D42). A death restarts the climb with everything you own.

## Excursion rules

An excursion is five waves on one map. It ends when you clear wave 5 or every mech is destroyed. Excursion is the game's only mode and the main one.

- **Waves:** each excursion is 5 waves: 3 bots; 4 bots and 1 loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, 1 loader and the boss. Bosses come on waves 3 and 5. Threat bands add to these waves (proposed, GDD-D40): from level 10, waves 2, 4 and 5 add one Scuttler pack of 4; from level 20, waves 4 and 5 add one Bulwark; from level 30, waves 2 and 4 add one Wrecker; from level 40, one bot or loader in every wave is an Elite. Band enemies don't scale in count with the level. Overtime (proposed, GDD-D37) is wave 4 of the level plus one loader, with no boss. This is the only place the wave structure is defined.
- **Wave pacing:** enemies drop in one every 0.8 s, the boss first, then loaders, then bots (band enemies, proposed: Bulwarks with the loaders, then Wreckers, then bots, then Scuttler packs, a pack landing together). Each loader and bot lands on an open street cell more than 10 m from every living mech when one can be found; the boss lands as Boss placement (Enemies and AI) says. A wave is clear when its queue is empty and no enemy is left; the next wave starts after a 3 s breather.
- **Levels:** each excursion is one campaign level, from 1 to 50. Per level above 1, a value grows by a fixed share of its level-1 value: bot and loader counts by 25% (rounded), enemy health by 15%, enemy damage by 15% and scrap drops by 10% (rounded). So level L has 1 + 0.25 × (L − 1) times the level-1 count. The boss count does not change.
- **Zones:** each level up to 5 opens one more zone: level 1 the Underpass, level 2 the Freight Yard, level 3 Smelter Row, level 4 the Glass Quarter, level 5 the Terminus Yard; level 5 and up play the whole sector (see Map; five zones per kr0's level design pick, built in PR #12).
- **Extract:** 1.4 s after wave 5 clears you extract automatically. Scrap cubes still on the floor go to the nearest living mech. Your scrap is banked and the next level opens. There is no cash-out earlier: scrap is all-or-nothing until you extract. Leaving early, including closing the game mid-match, counts as a death. With Overtime (proposed, GDD-D37) the 1.4 s becomes a 6 s choice, below.
- **Overtime** (proposed, GDD-D37): when wave 5 clears, a prompt gives you 6 s to choose Extract (Enter or R) or Overtime (F). If nobody chooses, you extract. Overtime starts a sixth wave after the usual 3 s breather (see Waves). While it runs, every scrap drop counts double. Clearing it extracts you automatically and adds 25% to all match scrap, rounded, before it is banked. Dying in Overtime is a normal death: all match scrap is lost and the campaign goes back to level 1. One Overtime per excursion. In co-op the host chooses and the guest sees the prompt; calling Overtime runs the partner revive check at the end of wave 5 as at the end of waves 1 to 4.
- **Contracts** (proposed, GDD-D38): each level draws one contract from the level's seed. The garage shows it before you drop in and the HUD tracks it. Completing it adds 20 scrap × (1 + 0.10 × (level − 1)), rounded, to the match scrap at once, so a death still loses it; in co-op each living mech gets the full amount. A contract that can't be done (Hot hands without Redline, Clean sweep under Cold front) is not drawn. Failing one costs nothing.

  | Contract | Do this in one excursion |
  | --- | --- |
  | Crush | Kill 3 or more enemies with one collapse |
  | Bring it down | Drop 2 overpass spans |
  | Eviction | Knock the sniper off its perch twice |
  | On the beat | Reach a ×4 beat chain |
  | Clean sweep | Take every pod that drops (at least 5) |
  | Untouchable | Clear wave 3 losing less than 20% of max armor |
  | Hot hands | Spend 3 s in Redline in total and live |
  | Blitz | Clear waves 1 and 2 within 75 s of wave 1 starting |
  | Wrecking crew | Destroy 400 voxels |
  | Repo man | Kill 2 enemies that took a pod |

- **Threat bands** (proposed, GDD-D39): the 50 levels fall into five bands. Each band adds an enemy to the waves (see Waves and Enemies and AI) and unlocks blueprints (see Mech building).

  | Band | Levels | Adds | Blueprints |
  | --- | --- | --- | --- |
  | I · Cleanup | 1 to 9 | Today's enemies | None |
  | II · Lockdown | 10 to 19 | Scuttler packs | Arc caster, Breach charges |
  | III · Meltdown | 20 to 29 | Bulwark | Seismic hammer, Grav-skids |
  | IV · Teardown | 30 to 39 | Wrecker | Overdrive core, Redline reactor |
  | V · Last Shift | 40 to 50 | Elites | None |

- **Sector conditions** (proposed, GDD-D39): from level 4, each level draws one condition from its seed. The garage shows the next level's condition beside its contract, so you can build for it; the drop-in announces it and the HUD shows its icon.

  | Condition | Effect for the whole excursion |
  | --- | --- |
  | Brittle city | Chunks break at 12% of voxels lost instead of 20% |
  | Reinforced | Chunks break at 30% instead of 20%; collapse scrap doubles |
  | Heat wave | Heat drains 30% slower |
  | Cold front | Heat drains 30% faster; only one pod per wave |
  | Scrap storm | Scrap drops +30%; every wave adds one bot |
  | Blackout | Night: enemies see 30% less far; you see the street lit within 12 m of your mech, plus muzzle flashes, blasts and slag |
  | Pod rain | Two pods every wave; patrol bots go for a pod at any health |
  | Sniper's nest | Wave 5 has two snipers, each with the wave-3 sniper's health |
  | Magnet fault | Scrap cubes are pulled in from 1 m (3 m with the Salvage magnet); scrap drops +25% |
- **Victory:** extracting level 50 wins the campaign and shows a victory screen (GDD-D24). Its button starts a new campaign at level 1 with every part, upgrade and banked scrap kept (proposed, GDD-D24).
- **Armor:** every level starts with every mech at full armor.
- **Lose condition:** a mech is destroyed when its armor reaches 0. The excursion is lost when every mech is destroyed.
- **On death:** you lose all scrap from the match and the campaign goes back to level 1, saved at once. Parts you own, weapon upgrades and scrap you banked are never lost. No wear is applied on a death.
- **Starter mechs:** the starter build (minigun, pile-bunker, vectored jump-jets, Reactor Mk1) is free and can't be lost, so a player with 0 scrap can always deploy.
- **Progression:** mechs progress only in excursions. Your build, owned parts, upgrade levels, scrap, wear, level and seed are saved in the browser as one campaign code, which you can copy from the garage.
- **Seed:** a campaign has a seed that decides where enemies land, pod times and types, and other random draws; the map itself never changes. A new campaign uses seed 7. The garage lets you type a different seed, a whole number from 1 to 2,147,483,000 (GDD-D25), only while the campaign is at level 1 (proposed, GDD-D25).

**Co-op:** two players share one excursion and one map; the host is player 1 (orange) and the guest player 2 (cyan). There is no friendly fire: player weapons, the mortar and the flash-vent only hurt enemies, and only collapses hurt mechs from your own side. Co-op plays the host's campaign (GDD-D31, see Co-op campaign). Each mech keeps its own scrap wallet from the cubes it picks up. Co-op never pauses.

**Partner down and revive** (GDD-D24, proposed values): if one mech is destroyed, the other fights on, and the dead player's camera follows the survivor.

- When a wave (1 to 4) clears and the survivor's match wallet holds the revive price, the survivor pays it and the destroyed mech returns beside the survivor with 30% of its max armor. If the wallet is short, the partner stays down and the check repeats at the end of the next wave.
- The revive price is 40 scrap at level 1, scaled with the level like scrap drops: 40 × (1 + 0.10 × (level − 1)), rounded.
- No revive happens after wave 5; the excursion extracts instead. If the host calls Overtime, the check runs at the end of wave 5 too, and never after Overtime (proposed, GDD-D37).
- A mech that is down when the team extracts still banks the scrap it picked up. Revived or not, its fitted parts take wear on extract like any mech's, counting the damage it took before it was destroyed.

**Crossfire** (proposed, GDD-D44): when an enemy is hit by both players' heavy weapons within 2 s, the second hit deals 50% more damage, and the enemy drops 50% more scrap if it dies within 3 s of that hit. The grade doesn't matter. A "CROSSFIRE" stamp shows on the enemy.

**Leaving a co-op room:** if a partner leaves or loses connection, their mech is destroyed and the other player fights on alone. The room closes when the excursion ends. In the garage, a player whose partner left can drop in alone.

**Co-op campaign** (GDD-D31): the host owns the room's campaign. This replaces "the lower of the two players' levels" (GDD-D14, GDD-D20).

- The room plays the host's campaign: the host's level, seed and open zones. The guest brings their own build, owned parts, upgrade levels and banked scrap.
- On extract, the host's campaign advances one level. Each player banks the scrap they picked up into their own save, and wear goes on each player's own parts. The guest's own campaign level and seed don't change.
- On a death (every mech destroyed), the host's campaign goes back to level 1. The guest loses their match scrap; the guest's own level doesn't change.
- A guest who leaves mid-match loses their match scrap and nothing else. A host who leaves mid-match: open question (see [open questions](open-questions.md)).
- Victory: extracting the host's level 50 wins the host's campaign. Both players see the victory screen; only the host's campaign restarts.

**Durability** (GDD-D18):

- When you extract, each fitted part that is not a starter part gains wear equal to 10% of the damage your mech took in the excursion, divided by its max armor. Damage counts when it is taken, even if a pod or the Nanite core heals it later. Losing 100 armor on a 100-armor mech adds 10% wear to every such part.
- Wear adds up across extracts and stops at 100%.
- Wear cuts every stat change that helps you (more power, armor or speed, less weight or heat) by that percentage; stat changes that cost you, special abilities and weapon upgrade levels stay as they are.
- Starter parts never wear and always repair free.
- Repairing a part restores it fully and costs its price × its wear × 25% for common parts, 50% for rare and 75% for epic, rounded up.
- The garage has one Repair button. It repairs worn fitted parts in slot order (Core, Arm-R, Arm-L, Shoulder, Legs, Reactor), and skips a part the banked scrap can't cover (proposed, GDD-D28).

## Controls and camera

A high-angle isometric twin-stick: the legs and the torso are controlled separately, so you can retreat while aiming forward.

| Input (keyboard and mouse) | Action |
| --- | --- |
| WASD or arrow keys | Leg direction (screen-relative): momentum, turn radius, traction |
| Mouse | Torso aim, independent of the legs; weight and some parts slow how fast it tracks |
| Left mouse button (hold) | Right-arm light gun; keep holding at 100 heat to go into Redline (proposed, GDD-D36) |
| Right mouse button (press, hold, release) | Left-arm heavy weapon: starts its timing ring, release to fire |
| Q | Shoulder active, if one is fitted |
| Space | Dash in your drive direction (or leg facing if standing) |
| Esc | Pause (single-player only; the window losing focus or the tab being hidden also pauses) |
| Enter or R | Press the main button of an open overlay; after wave 5, extract now |
| F | After wave 5, call Overtime (proposed, GDD-D37; the host only, in co-op) |

- **Camera:** a fixed 2:1 dimetric isometric view that follows the mech with an 18% lean toward the aim point. It zooms with the window size, not with the build. Taking damage never moves or zooms the camera. Screen shake comes from your own heavy shots, rail shots and mortar launches, blasts, a loader's charge hitting you, chunks breaking, collapses, pod landings and zone shutters falling.
- **Low health:** below 35% armor the armor bar turns red and a dark red vignette creeps in from the screen edges, up to 75% opacity at 0%. Collapse shadows and pod markers always draw on top of the vignette.
- **Cutaway:** voxels in front of the mech inside an ellipse around it draw at 16% opacity, so you never lose your chassis.
- **Aiming at height:** the aim point follows the first solid wall face under the cursor, up to about 2 m, and snaps to an enemy under the cursor. That snap is how you target the rooftop sniper. There is no free torso pitch.

## Combat

Combat runs on two layers: the right-arm light gun fires in real time, the left-arm heavy weapon charges on an ATB bar and lands on a timing hit. Movement never stops for either.

**Light weapons (real time, left mouse)**

- Fire while held; each shot adds heat. Damage is multiplied by power ÷ 100 and by the weapon's upgrade level (see Weapon upgrades). The same holds for heavy weapons and shoulder actives.
- Light weapons: minigun, shotgun, plasma cutter, rail rifle.

**Heavy weapons (ATB, right mouse)**

- The pile-bunker, bunker-buster cannon and mag-winch share one ATB bar. It fills in 6 s divided by power ÷ 100 (doubled while overclocked).
- When full, press and hold the right mouse button to start the timing ring. The ring reaches its target 1.0 s after the press. Release to lock it: the grade comes from how far the release is from 1.0 s. If you are still holding 1.31 s after the press, it fires as a Miss.
- You keep driving and aiming while the ring runs.

| Timing result | Release time after the press | Damage | Heat |
| --- | --- | --- | --- |
| Perfect | 1.0 s ± 0.086 s | 200% | 28 |
| Good | 1.0 s ± 0.31 s, outside Perfect | 100% | 28 |
| Miss or ring closes | earlier than 0.69 s, or still held at 1.31 s | 50% | 28 |

- **Presentation:** the ring is drawn shrinking from 72 px to a 30 px target ring at the default zoom. The windows above are times, so they hold at any zoom.

- **Pile-bunker by grade:** its voxel damage scales the same way (200%, 100%, 50%), and a Perfect also hits a wider strip and cores two voxels deep. It knocks enemies back 3 m on a Perfect, 1 m on a Good and not at all on a Miss.
- **Bunker-buster and mag-winch by grade:** the grade changes their damage to enemies only. The bunker-buster's blast always carves the same 3×3×3 hole. The mag-winch reaches 10 m instead of 8 m on a Perfect and tears out a pillar's base only on a Perfect.
- After any shot the weapon extends for 0.12 s. After a Miss the pile-bunker and mag-winch retract for 1.5 s: they can't re-arm and the torso turns at half speed. The bunker-buster has no retract on a Miss (an overheat is different, see Edge cases).

**Beat chain and stagger** (proposed, GDD-D35)

- **Chain:** a counter from ×1 to ×4 shown on the cursor ring. Each Perfect raises it by one, up to ×4. A Good holds it. A Miss, a ring that closes, a ring cancelled by an overheat, or 12 s without a heavy shot drops it back to ×1. Destruction doesn't break it.
- **Chain reward:** an enemy killed while your chain is ×2, ×3 or ×4 drops 20%, 40% or 60% more scrap (see Economy for how bonuses combine). At ×4 your ATB fills 25% faster. In co-op each player has their own chain.
- **Stagger:** a Perfect staggers every enemy it hits for 1.0 s. A staggered enemy stops moving, can't fire, charge or jump, loses any tell in progress, and takes 50% more damage from every source. Stagger stacks with knockback: a Perfect pile-bunker hit knocks the enemy back 3 m and leaves it staggered where it lands. A staggered loader's charge stops. A staggered sniper's shot is cancelled and its jump timer pauses.

**Shoulder actives (real time, Q)**

- The siege mortar and the flash-vent use no timing ring. Each has a cooldown: the mortar 7 s (recharges faster with power), the flash-vent 10 s.

**Heat**

- Heat runs 0 to 100. Light shots, the heavy weapon, the mortar and dashes add heat; heat drains at 20 per second at the base heat stat.
- Every heat gain is multiplied by 1 + (heat stat − 100) ÷ 200 below 100, or ÷ 100 above it. Drain is 20 × (1 + (100 − heat stat) × 0.015), never below 40% of 20.
- At 100 the mech overheats for 3 s: light guns, dashes and the mortar lock, the heavy weapon can't start a ring, a running ring is cancelled, and heat falls to 0 over the lockout. The Cryo flash-vent ends a lockout at once.
- **Redline** (proposed, GDD-D36): if the light-gun button is held when heat reaches 100, the mech goes into Redline instead of locking out. The light gun keeps firing and heat keeps climbing past 100, up to the Redline cap of 130; drain still runs. Every point of heat gained above 100 costs 0.5 armor (it counts as damage taken for wear). Everything an overheat locks, apart from the light gun, is locked during Redline, and a running ring is cancelled. Releasing the button, or reaching the cap, ends Redline in a lockout of 3 s plus 1 s for every 10 heat above 100 (6 s from the cap). The Cryo flash-vent ends Redline and its lockout at once. The heat bar glows white-hot and the cockpit voice calls it.

**Damage to structures**

- Every hit on a voxel puts half its damage into the voxel. Power scales voxel damage only for the light guns; heavy weapons and the mortar do the same voxel damage at any power, and upgrade levels never change voxel damage.

**Tunables**

| Tunable | Value |
| --- | --- |
| Tick | 1/60 s |
| ATB base fill time | 6 s |
| Timing ring | target at 1.0 s; auto-Miss at 1.31 s |
| Perfect and Good windows | ± 0.086 s and ± 0.31 s around 1.0 s |
| Timing multipliers | 2, 1, 0.5 |
| Heat per heavy shot | 28 |
| Minigun heat per shot | 3.2 |
| Dash | 12 m/s for 0.15 s, 1.3 s cooldown, 10 heat |
| Heat drain per second | 20 |
| Overheat lockout | 3 s |
| Structural share of damage | 50% |
| Beat chain (proposed, GDD-D35) | ×1 to ×4; drops after 12 s without a heavy shot; scrap +20% per step above ×1; ATB +25% at ×4 |
| Stagger (proposed, GDD-D35) | 1.0 s; +50% damage taken |
| Redline (proposed, GDD-D36) | cap 130 heat; 0.5 armor per heat above 100; lockout 3 s + 1 s per 10 heat above 100 |

**Edge cases**

- **Redline with the Cryo flash-vent:** Q works in Redline and ends it with no lockout (proposed, GDD-D36).
- **Redline at low armor:** Redline can destroy your own mech. Armor never stops it; the low armor alarm and the cockpit voice warn you (proposed, GDD-D36).
- **Perfect on a staggered enemy:** the stagger restarts at 1.0 s; it never adds up (proposed, GDD-D35).

- **Overheat during a ring:** the ring is cancelled and nothing fires: no damage, no heat. The bar empties and the arm retracts for 1.5 s, the bunker-buster included. The HUD shows it as a Miss.
- **Venting during a lockout:** the Cryo flash-vent sets heat to 0 and ends the lockout.
- **Pressing while charging, locked out or retracting:** nothing fires and the HUD shows the state.
- **Mortar target closer than 4 m:** nothing fires and the cooldown doesn't start.

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
- **Blueprints** (proposed, GDD-D42): six parts are not in the garage at first. The first time you reach level 10, 20 or 30 in any campaign, that band's two parts (see Threat bands) are added to the garage for good. You still buy them with scrap. A death, a new campaign or a victory restart never removes a blueprint. The save keeps the highest level you have ever reached.

### Weapon upgrades

Each weapon can be upgraded twice, from Mk I to Mk III, for scrap (GDD-D23).

- **Weapons:** the four Arm-R guns, the three Arm-L heavy weapons, and the two shoulder actives (siege mortar and Cryo flash-vent): nine parts. The Cryo-vent heatsink and Salvage magnet deal no damage and have no levels. The blueprints add three more (proposed, GDD-D42): the Arc caster, the Seismic hammer and Breach charges, for twelve.
- **Effect:** every level adds 10% of the weapon's damage to enemies, on top of power: Mk II deals 110% and Mk III 120%. Heat, rate of fire, range, cooldowns and damage to voxels don't change.
- **Ownership:** a part is bought at Mk I. Its level belongs to the owned part, so it stays when you swap the part out and back, and it is never lost, not on a death either. Starter weapons can be upgraded.
- **Wear:** wear doesn't reduce upgrade levels, and upgrade levels don't change a part's repair price.

| Rarity | Mk I to Mk II | Mk II to Mk III |
| --- | --- | --- |
| Common | 20 | 40 |
| Rare | 35 | 70 |
| Epic | 60 | 120 |

Upgrading all nine weapons to Mk III costs 1,005 scrap; with the three blueprint weapons, 1,395 (proposed, GDD-D42).

## Parts list

The garage sells 21 parts in three rarity tiers: common, rare and epic. Higher tiers cost more scrap and cost more to repair. Arm-R is the light gun on the left mouse button; Arm-L is the heavy weapon on the right.

| Slot | Part | Rarity · price | Stat change | What it does and what it costs you |
| --- | --- | --- | --- | --- |
| Arm-R | Minigun (starter) | Common · 0 | weight +14 | 11 shots a second, 4 damage, about 20 m range. Heats up quickly: 3.2 heat a shot lock it out after about 6.6 s of fire. Half damage to armored loaders |
| Arm-R | Shotgun | Rare · 25 | power +10, weight +18, heat +15 | Six pellets of 5 damage every 0.55 s, about 8 m range. Devastating up close, weak past it; 16 heat a shot. Half damage to loaders |
| Arm-R | Plasma cutter | Rare · 45 | power +5, weight +12, heat +20 | 14 shots a second, 3.2 damage, about 5 m range. Ignores loader armor and does four times the voxel damage. Fills heat fast |
| Arm-R | Rail rifle | Epic · 110 | power +15, weight +22, speed −4, heat +15 | One 34-damage slug every 1.1 s, about 31 m range, through every enemy in line and up to 3 voxels. Full damage to loaders. 24 heat a shot |
| Arm-L | Pile-bunker (starter) | Common · 0 | weight +14 | ATB melee spike, 45 damage, in a short cone; knocks enemies back (3 m on a Perfect), and a Perfect knock smashes them through walls, windows and barriers in the way. A Perfect kill drops double scrap. Zero range; 1.5 s retract on a Miss. Can't hit the rooftop sniper |
| Arm-L | Bunker-buster cannon | Rare · 90 | power +20, weight +34, speed −5, heat +10 | ATB shell, 70 damage to the enemy it hits, that blasts a 3×3×3 hole. Recoil shoves you back 2 m (not with treads); torso turns 25% slower |
| Arm-L | Industrial mag-winch | Rare · 55 | weight +16 | ATB cable, 8 m (10 m on Perfect), 20 damage: reels bots in, yanks the rooftop sniper off its perch, tears out a pillar's base on Perfect. A wall or a heavy loader reels you in instead |
| Shoulder | Cryo-vent heatsink | Rare · 30 | weight +8, heat −33 | Passive cooling. Uses the shoulder slot |
| Shoulder | Twin-pod siege mortar | Epic · 100 | power +5, weight +24, speed −4, heat +10 | Q lobs two shells onto the cursor every 7 s: each deals 30 damage at the centre falling to 15 at the edge of a 1.7 m splash, and blasts a 3×3×3 voxel hole. Range 4 to 14 m; 18 heat |
| Shoulder | Cryo flash-vent | Rare · 40 | weight +10, heat −15 | Q dumps all heat, even in a lockout, and slows enemies within 4 m to 40% speed for 3 s (8 damage). 10 s recharge; no passive weapon |
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

**Blueprint parts** (proposed, GDD-D42): unlocked by threat band (see Mech building), then bought like any part. With them the garage holds 27 parts.

| Slot | Part | Band · rarity · price | Stat change | What it does and what it costs you |
| --- | --- | --- | --- | --- |
| Arm-R | Arc caster | II · Rare · 65 | power +5, weight +14, heat +18 | A bolt every 0.4 s, 9 damage, about 12 m range, that jumps to up to 2 more enemies within 4 m for 6 damage each. Built for Scuttler packs. Half damage to loaders and Bulwark shields; does no damage to voxels. 6 heat a bolt |
| Shoulder | Breach charges | II · Rare · 60 | weight +10, heat +5 | Q throws a sticky charge onto the surface under the cursor, up to 10 m; Q again sets off every charge you have placed. Each deals 40 damage within 2 m and destroys the 4×4×4 chunk it sticks to. Holds 2 charges, each back after 8 s. Plant a pillar, wait for the crowd, drop the span. 8 heat a throw |
| Arm-L | Seismic hammer | III · Epic · 115 | power +10, weight +30, speed −6, heat +12 | ATB ground slam: 50 damage to every enemy within 3 m (4 m on a Perfect). A Perfect also staggers everything it hits, topples container stacks within 4 m and shakes a sniper within 6 m off its perch. Zero range; 1.5 s retract on a Miss |
| Legs | Grav-skids | III · Rare · 55 | armor −5, speed +8, weight +6 | Hover drive: slides wider through turns, holds 2 dashes that recharge 1.6 s each, 8 heat a dash, and floats over slag and rubble without harm. Loader shoves push you 50% further |
| Core | Overdrive core | IV · Epic · 100 | armor −10, weight +8 | Below 35% armor: power +30 and heat drains 50% faster. A comeback core for players who live on the edge |
| Reactor | Redline reactor | IV · Epic · 130 | power +25, speed +4, weight +12, heat +18 | Raises the Redline cap to 150 and halves its armor cost (proposed, GDD-D36). Runs hot; useless if you never redline |

## Garage and drop pods

The garage is the only place your build changes. Drop pods are one-use boosts inside a match.

**Garage (between matches only)**

- Buying a part pays its full price from your banked scrap and you own it for good. Swapping back to a part you own is free. There is no selling or refunds. Core and Shoulder can be left empty; the other slots always hold a part.
- The garage shows the five stats as bars with the selected part's change before you confirm, plus max armor, speed, damage, ATB fill time and cooling.
- It upgrades the selected weapon one level at a time and shows its level and the price of the next one.
- It shows each fitted part's wear and the scrap to repair it, and one Repair button that follows the Durability rules; starter parts repair free.
- **Next level preview** (proposed, GDD-D38, GDD-D39): the garage shows the level you are about to play, its threat band, its sector condition and its contract, so you can fit parts for them before you drop in. A part newly unlocked as a blueprint is marked "New".
- The campaign code (your save) is shown in the garage and can be copied. At level 1 the garage also shows the seed and lets you change it. Resetting the save wipes it after two clicks.
- In co-op the garage is shared: both players shop, then both press Drop in. The room plays the host's campaign; each player's own save receives only their scrap and wear (see Co-op campaign).

**Drop pods (in the arena)**

- Each wave drops one pod, and a second with a 40% chance, at a random time 1.5 to 6 s into the wave, on an open cell at least 4 m from every living mech. Each pod is Field repair or Overclock with equal chance (with GDD-D43, proposed: Field repair 35%, Overclock 30%, Scrap cache 20%, Strike beacon 15%). A marker and a 3 s countdown show where it lands, then the crate falls. A pod whose time comes after its wave is already clear never drops.
- Touching a pod (within 0.7 m) applies its effect once and the pod disappears. Pods never expire.
- Any living mech can take a pod, the nearest first. Failing that, a patrol bot or a heavy loader that walks over one takes it. The boss can't.
- Patrol bots go for a pod when it is closer to them than to the nearest mech, or when their health is below 50%. Loaders take a pod only by walking over it.
- Enemies that take a pod show a toast, so every pod is a race.

| Pod | Effect |
| --- | --- |
| Field repair | Restore 40% of the taker's max armor |
| Overclock | ATB bars fill twice as fast for 15 s; a patrol bot that takes it fires twice as fast; a loader that takes it gains nothing |
| Scrap cache (proposed, GDD-D43) | 12 scrap cubes, scaled with the level, burst out within 2 m of the mech that takes it. An enemy that takes it glows gold and carries the cache: it drops those cubes as well as its own when it dies |
| Strike beacon (proposed, GDD-D43) | 1.5 s after a mech takes it, four shells land in a line from that mech toward its cursor, at 3, 6, 9 and 12 m: each deals 40 damage within 2 m (scaled like collapse damage) and blasts a 3×3×3 hole, and they never hurt mechs. If an enemy takes it, the line is aimed from that enemy at the nearest mech, lands after a 2 s warning drawn on the ground, and hits mechs for 20 and enemies for 40 |

**Edge cases**

- **Player and enemy touch a pod in the same frame:** the player gets it.
- **Overclock during a running ring:** the running ring is unaffected; every ATB fill during the 15 s is doubled.

## Economy

Scrap is the only currency. One scrap cube is one scrap. Cubes must be picked up (0.55 m, pulled in from 3 m, 7 m with the Salvage magnet).

| Scrap source | Cubes | Scales with level |
| --- | --- | --- |
| Patrol bot | 3 to 5 | Yes |
| Heavy loader | 8 to 10 | Yes |
| Bounty sniper | 12 (18 on wave 5) | Yes |
| Collapse landing | 2 to 4, when the fallen piece has more than 6 voxels | No |
| Perfect pile-bunker kill | Double that enemy's cubes | Yes |
| Scuttler (proposed, GDD-D40) | 1 each | Yes |
| Bulwark (proposed, GDD-D40) | 10 to 12 | Yes |
| Wrecker (proposed, GDD-D40) | 6 to 8 | Yes |
| Elite (proposed, GDD-D40) | Triple that enemy's cubes | Yes |
| Contract (proposed, GDD-D38) | 20, into match scrap | Yes |
| Scrap cache pod (proposed, GDD-D43) | 12 | Yes |
| Overtime (proposed, GDD-D37) | Every drop doubled during Overtime, then +25% of all match scrap on clearing it | Yes |
| Beat chain kill (proposed, GDD-D35) | +20%, +40% or +60% at ×2, ×3, ×4 | Yes |
| Collapse or hazard kill (proposed, GDD-D41) | +50% | Yes |
| Crossfire kill (proposed, GDD-D44) | +50% | Yes |

Sources that scale are multiplied by 1 + 0.10 × (level − 1) and rounded.

**How kill bonuses combine** (proposed): an enemy's cubes = base cubes × the level scale × 2 for a Perfect pile-bunker kill × 2 in Overtime × 3 for an Elite × (1 + the beat chain, collapse or hazard, and Crossfire percentages added together), rounded once at the end. The doublings multiply; the percentages add.

| Scrap sink | Cost | Repeatable |
| --- | --- | --- |
| Buy a part | 15 to 140 by part (see Parts list) | No |
| Upgrade a weapon | 20 to 120 by rarity and level (see Weapon upgrades) | Twice per weapon |
| Repair a worn part | Price × wear × 25%, 50% or 75% by rarity, rounded up; free for starter parts | Yes |
| Revive a co-op partner | 40 × (1 + 0.10 × (level − 1)), rounded, from the survivor's match scrap | Yes |

- Roof loot drops to street level.
- Weapon upgrades and repairs keep scrap useful once every part is owned.

## Destruction and environment

The map is built from voxels, and anything resting on something else can fall.

- **Supports:** voxels group into 4×4×4 chunks. A chunk breaks into debris once it has lost more than 20% of its voxels. Pillars and buildings hold up what is above them; deck spans never hold each other up.
- **Collapse:** after a chunk breaks, anything no longer connected to the ground falls as one piece. Break one pillar and the deck is cantilevered; break two neighbours and the span between them falls.
- **Warning:** a loose piece creaks for 0.9 s and its ground footprint shades red before it falls. Shadows always draw above the low-health vignette.
- **Landing:** a collapse deals 80 damage to every enemy under it and 40 to every mech, at any level. With GDD-D41 (proposed) the damage to enemies scales with enemy health, 80 × (1 + 0.15 × (level − 1)), so a span drop still kills a bot at level 50; damage to mechs stays 40. Enemies still dropping in and a sniper on a roof are not hit. Landing voxels at street level may stay as rubble, which blocks walking and can be shot away; the rest breaks into debris. A piece of more than 6 voxels also scatters 2 to 4 scrap cubes.
- **Terrain reshaping:** heavy weapons carve trenches and punch new doorways, so cover and flanking routes change every match. Damage stays until the match ends.
- **Shooting structures:** see Damage to structures. The plasma cutter does four times the voxel damage; the pile-bunker, bunker-buster and mortar carve larger holes.
- **Demolition bonus** (proposed, GDD-D41): an enemy killed by a collapse, a toppled stack, a dropped container or slag drops 50% more scrap, and a "CRUSHED" callout counts the kills from one event (see Economy).

**Hazard props** (proposed, GDD-D41). Each zone has one kind of prop that turns the city on whoever is near it. How many there are and where they stand is set by the level design.

| Prop | Zone | Rule |
| --- | --- | --- |
| Overpass spans | Underpass (and the whole map) | As today: break two neighbouring pillars and the span falls |
| Container stacks | Freight Yard | Containers, single or stacked up to 3 high, follow the support rule: destroy or plow the bottom container and the ones above fall as a collapse, with the usual warning and landing damage |
| Gantry crane | Freight Yard | A frame 6 m high holding one container on its hook over the yard. The hook is above the 2 m aim height, so you bring it down from the ground: break all four of its legs (any leg still standing holds the frame up, like a pillar under a cantilevered deck) and the frame and its container fall as a collapse after the 0.9 s warning, onto whatever is under them. Once per crane per excursion |
| Slag vat | Smelter Row | A 2×2 m vat on a leg frame in the street or on the 3 m slag gallery. Break its support and it falls as a collapse; where it lands it spills a 4×4 m pool of molten slag for 8 s. The pool deals 25 damage a second to enemies and 10 to mechs, and adds 15 heat a second to a mech standing in it. Grav-skids float over it. Slag lights the street during Blackout |

## Enemies and AI

| Enemy | Stats | Behaviour |
| --- | --- | --- |
| Patrol bot | 60 health, 2.4 m/s, sees 10 m, range 6.5 m | Patrols between street cells, engages on sight or when hurt: fires a 7-damage orb about every 1.25 s (±15%), strafes and backs off when close, gives up after 3 s unseen. Drops in from 9 m, landing for 10 damage on a mech within 1.2 m |
| Heavy loader | 160 health, 1.3 m/s, sees 10 m, armored | Patrols between two points, hunts on sight, stops within 2.2 m and tells for 0.5 s, then charges for up to 1 s at 5 m/s in a straight line, plowing barriers, windows and containers: 22 damage and a 1.5 m shove. Recovers for 0.8 s and can't charge again for 1.5 s. Does not shoot. Half damage from minigun and shotgun |
| Bounty sniper | 180 health, sees 15 m | Perches on a roof edge and fires an 18-damage orb every 2.2 s after a 0.6 s tell. Jumps to a new perch every 6 to 9 s, or after 1.5 s without sight. If the voxel under it is destroyed it falls: a fall of 1.5 m or more costs 60 health and a 2 s stun |
| Scuttler (proposed, GDD-D40; band II) | 18 health, 5 m/s, sees 12 m; comes in packs of 4 | Small drone that runs straight at the nearest mech, flashes for 0.4 s within 1.2 m, then explodes: 10 damage within 1.5 m to mechs and enemies alike, and a 1-voxel hole. Shot down, it explodes where it is. Knocked into another enemy, it explodes on contact. Can't take pods |
| Bulwark (proposed, GDD-D40; band III) | 220 health, 1.6 m/s, sees 10 m, turns at 1.2 radians a second | A loader with a riot shield facing its walk. The shield blocks all damage arriving within 60° of its front, except the rail rifle's slug, collapses, slag and blasts landing behind it. At 3 m it bashes: 15 damage and a 2 m shove, then 2 s before it bashes again. A Perfect heavy hit breaks the shield for 5 s and staggers it. Slow to turn, so one mech holds its attention while the other flanks |
| Wrecker (proposed, GDD-D40; band IV) | 90 health, 2.8 m/s, sees 8 m | Keeps more than 8 m from every mech. Walks to the pillar or building chunk nearest a mech and plants a charge over 2.5 s; any damage restarts the plant. The charge (20 health, a blinking marker and countdown) goes off 4 s later and destroys its chunk, which can start a collapse. Shooting the charge sets it off early. A Wrecker killed mid-plant drops its charge, which goes off 2 s later where it lies |
| Elite (proposed, GDD-D40; band V) | Double health, +25% damage | One bot or loader per wave, picked by the seed, with gold trim. Drops triple scrap and a Field repair or Overclock pod where it dies |

- **Bosses:** the same sniper appears on waves 3 and 5. The wave-5 sniper has 1.5 times the health, fires every 1.5 s instead of 2.2 s and drops 18 scrap cubes. Its perches are the roofs you have left standing in open zones.
- **Boss placement:** it arrives on a roof edge 8 to 16 m from a random living mech, preferring one with a line of sight to it. A sniper that fell, or that finds no roof, fights from the street and jumps back to a roof within 10 m when its jump timer runs out and one exists.
- **Level scaling:** counts, health, damage and scrap grow with the level (see Excursion rules).
- **Structures:** enemies don't aim at supports. Only the heavy loader's charge damages the map, plowing through barriers, windows and containers. With GDD-D40 (proposed) the Wrecker aims at supports on purpose and Scuttler blasts chip voxels; this brings back "enemies that break supports on purpose" from the backlog (GDD-D19).
- **Stagger:** see Beat chain and stagger (proposed, GDD-D35). Scuttlers die to any Perfect; a Bulwark is staggered only when the Perfect breaks its shield.
- **Sector conditions:** Blackout and Sniper's nest change enemies for one excursion (see Excursion rules).
- **Pods:** see Garage and drop pods.

## Map

Overpass Sector 4 is the only map: a voxel grid 80 m long, 32 m wide and 8 m high, with an indestructible perimeter wall.

- **The overpass:** a six-lane road deck 5 m up, one voxel thick, runs the full length on ten 2×2 concrete pillars at x = 3, 11, 19, 27, 35, 43, 51, 59, 67 and 75. Dropping a span puts the road on whoever is below.
- **Streets:** 47 buildings (2 to 5 m high), 16 barriers and 14 containers fill the streets; all of it can be shot apart.
- **Hook:** break two pillars in a row and the 8 m of road between them falls on everyone below.

### Zones

The map is cut into three zones along its length, each walled off by an indestructible blast shutter until it opens: the Underpass (x 0 to 31), the Freight Yard (x 32 to 55) and Smelter Row (x 56 to 79). Level 1 opens the Underpass, level 2 adds the Freight Yard, level 3 and up open all three. A sealed zone is drawn dark with its name, and nothing spawns there. Enemies, pods and sniper perches only use open zones, so the fight spreads out as you climb levels. When you die, the campaign returns to level 1 and the zones close again.

Opening a zone is the drop-in of that level: the mechs land, nothing spawns for 5.5 s, the camera leaves the mechs and pulls back over the sealed zone, the shutter falls into debris at 2.6 s, the zone lights up, and the camera returns before wave 1 begins. Input is locked and mechs take no damage during the shot. Levels 1 and 4 and up have no drop-in shot.

**Zone identity** (proposed, GDD-D41): each zone has its own hazard prop (see Destruction and environment), so the three zones play differently: the Underpass is about dropping spans, the Freight Yard about toppling stacks and crane loads, Smelter Row about slag. The layout of each zone, and where its props stand, is being designed in the level design work and will be written here once kr0 picks a concept.

## Content counts

| Content | Count |
| --- | --- |
| Modes | 1 (Excursion, single-player or two-player co-op) |
| Maps | 1 (Overpass Sector 4), 5 zones |
| Campaign levels | 50 |
| Waves per excursion | 5 (bosses on waves 3 and 5) |
| Enemy types | 3 (patrol bot, heavy loader, Bounty sniper with a wave-5 variant); 6 plus Elites with GDD-D40 (proposed: Scuttler, Bulwark, Wrecker) |
| Parts | 21 in 6 slots (4 starter parts free), 3 rarity tiers; 27 with the 6 blueprint parts (proposed, GDD-D42) |
| Upgradable weapons | 9, with 2 upgrade levels each; 12 with the blueprints (proposed, GDD-D42) |
| Drop pods | 2 (Field repair, Overclock); 4 with Scrap cache and Strike beacon (proposed, GDD-D43) |
| Threat bands | 5 (proposed, GDD-D39) |
| Sector conditions | 9 (proposed, GDD-D39) |
| Contracts | 10 (proposed, GDD-D38) |
| Hazard props | 4 kinds: overpass spans, container stacks, gantry cranes, slag vats (proposed, GDD-D41) |
| Art styles | 3 (Blockout, Cinematic, Ink) |
| Music cues and sound effects | 7 music cues, about 40 effects (see Audio); 8 cues, about 55 effects and 10 cockpit voice lines with the fun pass (proposed, GDD-D45) |
| Story and narrative beats | 0 (non-goal) |

## Player journey and menus

Title → garage → drop in → five waves → extract, or Overtime then extract (garage, next level) or death (garage, level 1) → … → level 50 extract (victory).

- **Title:** the game's name, the controls for your build, your banked scrap, and these buttons:
  - **Continue campaign · Level N**, shown when the campaign is past level 1. It opens the garage at that level.
  - **Drop in**, which opens the garage for a campaign at level 1. Past level 1 it reads **New campaign** and resets the level to 1, keeping parts, upgrades and banked scrap.
  - **Settings**.
  - **Play with a friend:** host a room or join one with a room code. A host can paste a campaign code to resume it.
  - **Records** (proposed, GDD-D45): the highest level you have ever reached, best beat chain, spans dropped, contracts completed and Overtimes cleared, across every campaign.
- **Garage:** see Garage and drop pods. Drop in starts the level.
- **In match:** the HUD shows armor, heat (or "locked" with seconds), dash, the arm weapon's charge state, the shoulder active's cooldown, overclock time, level, wave, enemies left (or the countdown to the next wave), the match's scrap (the team's total in co-op), enemies downed and a boss bar. A cursor ring shows heat and ATB charge, and the timing ring shows during a press. With the fun pass (proposed): the beat chain on the cursor ring, the contract and its progress, the sector condition's icon, the Redline glow on the heat bar, and a 6 s Extract or Overtime prompt after wave 5. Toasts announce waves, pods, collapses, zones and partner events. A Settings button sits on the HUD.
- **Pause (single-player only):** Esc, opening Settings, the window losing focus or the tab being hidden pause the match; the overlay's button resumes.
- **Extracted:** the banked amount (each player's share in co-op) and a Garage button that opens the next level. With GDD-D45 (proposed) the amount counts up line by line (kills, contract, Overtime bonus), followed by an excursion card: Perfects, best chain, collapse kills, spans dropped and scrap by source.
- **Overtime prompt** (proposed, GDD-D37): after wave 5, two buttons, Extract (Enter or R) and Overtime (F), with a 6 s countdown that extracts when it runs out.
- **Campaign over:** the level you reached, the scrap you lost, and a New campaign button that opens the garage at level 1.
- **Victory:** after extracting level 50: the campaign is won, with a button that starts a new campaign (see Excursion rules).
- **Settings:** art style (Blockout, Cinematic, Ink), music volume and effects volume, saved on this device.

## Audio

Direction: synthwave and retrowave (GDD-D26). Music uses analog-style synth bass, gated reverb drums, arpeggiated leads and neon pads. Effects are chunky, mechanical and punchy with a synthetic edge: servo whine, heavy metal impacts and filtered sub-bass for big hits. Music follows the match state; effects carry the information the player needs.

**Mix rules**

- Warnings (the collapse creak, the loader tell, the sniper tell, overheat, low armor) always cut through the music and other effects.
- The timing ring's grade sounds play on release with no delay, so the timing hit feels exact.
- Rapid repeated sounds (minigun, plasma, scrap pickups, voxel hits) vary in pitch and are limited in how many play at once.
- In co-op, both mechs' sounds play; the partner's are slightly quieter.

**Music**

| Cue | Plays when | Direction |
| --- | --- | --- |
| Title and garage theme | Title and garage | Mid-tempo, warm pads and arpeggios; loops |
| Combat loop | Waves 1, 2 and 4 | Driving bass and gated drums; loops |
| Boss layer | Waves 3 and 5 while the sniper is alive | Combat loop plus a lead and harder drums |
| Breather | The 3 s between waves | Drums drop out, pads swell |
| Overtime layer (proposed, GDD-D37) | The Overtime wave | Combat loop doubled in tempo with a siren lead; ends in the extract sting |
| Extract sting | Extraction | Short rising major-key sting |
| Campaign over sting | Every mech destroyed | Short falling minor-key sting into silence |
| Victory theme | Victory screen | Full anthem version of the main theme |

**Essential sound effects (first pass)**

| Group | Sound | Plays when |
| --- | --- | --- |
| Mech | Footsteps: jump-jets, siege treads, strider legs | Moving; one set per legs part |
| Mech | Dash burst (jump-jets, strider legs) | A dash starts |
| Mech | Torso servo | The torso turns fast |
| Mech | Armor hit | The mech takes damage |
| Mech | Low armor alarm | Armor falls below 35% |
| Mech | Overheat alarm and lockout hiss | Heat reaches 100 |
| Mech | Cooled down | A lockout ends or the flash-vent clears it |
| Mech | Mech destroyed | A mech's armor reaches 0 |
| Mech | Partner down, partner revived | Co-op partner destroyed or revived |
| Light weapons | Minigun spin-up and fire loop | Left mouse held with the minigun |
| Light weapons | Shotgun blast | Each shotgun shot |
| Light weapons | Plasma cutter torch loop | Left mouse held with the plasma cutter |
| Light weapons | Rail rifle shot | Each rail shot |
| Heavy weapons | ATB ready | The bar fills |
| Heavy weapons | Timing ring running | The ring starts |
| Heavy weapons | Perfect, Good, Miss | The ring is released or closes |
| Heavy weapons | Pile-bunker strike and retract | Pile-bunker fires; retract after a Miss |
| Heavy weapons | Bunker-buster fire and shell blast | Shell fires; shell hits |
| Heavy weapons | Mag-winch cable fire and reel | Cable fires; something is pulled |
| Shoulder | Mortar launch and impact | Q fires the mortar; each shell lands |
| Shoulder | Flash-vent blast | Q fires the flash-vent |
| Enemies | Drop-in landing | An enemy lands |
| Enemies | Bot orb fire | A patrol bot fires |
| Enemies | Loader tell and charge | A loader tells, then charges |
| Enemies | Sniper tell and shot | The sniper aims, then fires |
| Enemies | Sniper jump, fall and stun | The sniper changes perch or falls |
| Enemies | Bot, loader and sniper destroyed | An enemy dies |
| World | Voxel hit and voxel break | A voxel is hit or removed |
| World | Chunk break | A chunk breaks into debris |
| World | Collapse creak | A loose piece starts its 0.9 s warning |
| World | Collapse impact | A piece lands (louder for bigger pieces) |
| World | Pillar down | A pillar's last ground chunk breaks |
| World | Zone shutter fall | A zone opens |
| Pods | Pod countdown and landing | A pod marker appears; the crate lands |
| Pods | Field repair, Overclock | A mech takes a pod |
| Pods | Enemy took a pod | An enemy takes a pod |
| Scrap | Scrap pickup | A cube is collected |
| Match | Wave start, boss wave, wave clear | Each wave starts or clears |
| Match | Extract, campaign over, victory | The match or campaign ends |
| Interface | Button, buy part, upgrade weapon, repair, can't afford | Menu and garage actions |

**Fun pass sounds** (proposed, GDD-D45)

| Group | Sound | Plays when |
| --- | --- | --- |
| Heavy weapons | Chain step (rising pitch per step), chain broken | A Perfect raises the chain; it drops to ×1 |
| Heavy weapons | Stagger crack | A Perfect staggers an enemy |
| Mech | Redline whine and hiss | Redline starts; Redline ends in its lockout |
| Enemies | Scuttler skitter, flash and pop | A pack moves; one is about to explode; it explodes |
| Enemies | Bulwark shield block, bash, shield break | A shot hits the shield; it bashes; a Perfect breaks the shield |
| Enemies | Wrecker charge plant beep, charge blast | A charge is being planted or counting down; it goes off |
| World | Container topple, crane collapse, slag spill and sizzle | A stack falls; the crane comes down; a vat falls and its pool burns |
| Pods | Scrap cache burst, strike beacon whistle | A cache opens; a strike line is about to land |
| Match | Contract complete, Overtime called, Crossfire | A contract is done; the host calls Overtime; a Crossfire lands |

**Cockpit voice** (proposed, GDD-D45): a short, dry synthesized voice, mixed like a warning. Ten lines: "Heat critical" (80 heat), "Redline", "Armor critical" (35%), "Pod inbound", "Pod lost" (an enemy took one), "Sniper on the roof" (boss lands), "Span unstable" (a span's last pillar is cracked), "Charge planted" (Wrecker), "Contract complete" and "Overtime". It never speaks more than once every 3 s, and warnings win.

**Feel** (proposed, GDD-D45): presentation only, the simulation never pauses, so co-op stays in step.

- **Hit-stop:** on a Perfect, the struck enemy and the impact effect freeze for 60 ms and the camera punches in 4% and back.
- **Grade stamps:** PERFECT, GOOD or MISS stamps at the impact point, in the art style's lettering, with the chain number beside a Perfect.
- **Callouts:** "SPAN DOWN" when a span falls and "CRUSHED ×N" for the kills from one collapse or hazard.

## Glossary

| Term | Meaning |
| --- | --- |
| Excursion | One match: five waves on the map at one campaign level |
| Campaign | The climb from level 1 to 50, saved as one campaign code |
| Level | The campaign step an excursion plays at; sets enemy counts, health, damage, scrap and open zones |
| Wave | One group of enemies; the next starts 3 s after it is cleared |
| Zone | One of three parts of the map, opened by level |
| Drop-in | The opening shot of a level that opens a zone |
| Extract | Ending an excursion by clearing wave 5; banks match scrap |
| Match scrap | Scrap picked up this excursion; lost on a death |
| Banked scrap | Scrap kept between excursions; spent in the garage |
| ATB | The heavy weapon's charge bar |
| Timing ring | The shrinking ring that grades a heavy shot Perfect, Good or Miss |
| Lockout | The 3 s after heat reaches 100 |
| Retract | The 1.5 s after a Miss when the pile-bunker or mag-winch can't re-arm |
| Wear | Durability damage on a part; cuts its helpful stat changes until repaired |
| Mk I, II, III | A weapon's upgrade level |
| Beat chain | The ×1 to ×4 counter raised by Perfects (proposed, GDD-D35) |
| Stagger | The 1.0 s after a Perfect when an enemy can't act and takes more damage (proposed, GDD-D35) |
| Redline | Firing the light gun past 100 heat at the cost of armor (proposed, GDD-D36) |
| Overtime | The optional sixth wave after wave 5 (proposed, GDD-D37) |
| Contract | A level's optional goal for bonus scrap (proposed, GDD-D38) |
| Threat band | A group of ten levels that adds an enemy type (proposed, GDD-D39) |
| Sector condition | A level's rule change, drawn from its seed (proposed, GDD-D39) |
| Elite | A gold-trimmed enemy with double health in band V (proposed, GDD-D40) |
| Blueprint | A part unlocked for good by reaching a threat band (proposed, GDD-D42) |
| Crossfire | Both co-op players' heavy weapons hitting one enemy within 2 s (proposed, GDD-D44) |
| Drop pod | A one-use boost that lands during a wave |
| Chunk | A 4×4×4 group of voxels that breaks as one |
| Span | The stretch of overpass deck between two pillars |
| Perch | A roof edge the sniper stands on |
| Seed | The number that decides a campaign's random draws |
| Campaign code | The save as text; copy it to keep or move a campaign |

## Links

- Pitch and firing range: [pitch-and-firing-range/index.html](prototypes/pitch-and-firing-range/index.html)
- [TDD](tdd.md) and [TDD decision history](tdd-decisions.md)
- [GDD decision history](gdd-decisions.md)
- [Fun pass record, Oct 28](decisions/2026-10-28-fun-pass.md)
- [Open questions](open-questions.md)
- [Tuning history](tuning-history.md)
- [Prototype changes](prototypes/prototype-changes.md)
- Prototype: [prototype.html](prototypes/prototype.html) with the rules in [sim.js](simulations/sim.js)
- Reviews: [feedback/synthetic/](feedback/synthetic/gdd-review-2026-10-25/SYNTHESIS.md)
- Art: `art/metr0niks/` (art board, styles, prompts, screenshots)
