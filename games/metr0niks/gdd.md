# Metr0niks GDD

Updated Oct 28, 2026 · @kr0 · Earlier versions: [Oct 20](superseded/gdd-2026-10-20.md), [Oct 25 draft](superseded/gdd-2026-10-25-draft.md), [Oct 26 draft](superseded/gdd-2026-10-26-draft.md), [Oct 26](superseded/gdd-2026-10-26.md), [Oct 27](superseded/gdd-2026-10-27.md)

This GDD describes one mode, Excursion, as the prototype plays it plus kr0's decisions of Oct 25 to 27 ([decision history](gdd-decisions.md)). The prototype changes those decisions need are in [prototype changes](prototypes/prototype-changes.md). Dimensions are in metres; one map cell is one metre. Three items are TBD on kr0's instruction (GDD-D27): target audience, player fantasy and what makes it fun. Everything else has a value; values kr0 has not accepted yet are tagged "(proposed, GDD-Dxx)" where they appear.

The Oct 28 fun pass (GDD-D35 to GDD-D53) adds combo and stagger, the Redline vent, Overtime, contracts and sector conditions on every level, an enemy per zone, zone hazards, six blueprint parts, two pods, feel and feedback with multi-kill text, a 5-level campaign, kill credit and a damage order, a new seed per climb, match stats, a boss roster with the Warden, and a host leaving ending the room. kr0 settled the rules over three rounds on Oct 28: accepted rules say "GDD-Dxx", and numbers still to be swept say "proposed"; Crossfire (GDD-D44) was dropped. The economy is still open ([economy options](decisions/2026-10-28-economy-options.md)). Why, the pillar each serves and the build order are in the [fun pass record](decisions/2026-10-28-fun-pass.md), and the review is in the [fun pass critique](feedback/synthetic/2026-10-28-fun-pass-critique.md). The prototypes don't have any of it yet.

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

- **Match:** garage, drop in, five waves with a boss on waves 3 and 5, then extract or push into Overtime for more (GDD-D37). Extracting banks the match's scrap and opens the next level. Dying loses the match's scrap and sends the campaign back to level 1. Each level carries an optional contract for bonus scrap (GDD-D38). After every wave and at the end of the match you see how you did (GDD-D50).
- **Campaign:** climb from level 1 to level 5 (GDD-D47). Each level opens a new zone, and each zone brings its own enemy (GDD-D40). Every level has its own sector condition and contract, drawn fresh for each climb (GDD-D39, GDD-D49). Bosses vary by level, and level 5 ends with the Warden, a big boss carrying snipers (GDD-D51). Extracting level 5 wins the campaign. Between matches, spend banked scrap on parts, weapon upgrades and repairs. Clearing a zone's level for the first time unlocks new parts for good (GDD-D42). A death restarts the climb on a new seed with everything you own (GDD-D49).

## Excursion rules

An excursion is five waves on one map. It ends when you clear wave 5 (or Overtime) or every mech is destroyed. Excursion is the game's only mode and the main one.

- **Waves:** each excursion is 5 waves: 3 bots; 4 bots and 1 loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, 1 loader and the boss. Bosses come on waves 3 and 5; which boss comes is drawn per level (see Boss roster, GDD-D51). Zone enemies take some of these slots once their zone is open (see Zone threats). Overtime is wave 4 of the level plus one loader, with no boss (GDD-D37). Sector conditions change some waves (see Sector conditions). This list, Zone threats and Sector conditions together are the only places the wave structure is defined.
- **Wave pacing:** enemies drop in one every 0.8 s, the boss first, then loaders and Bulwarks, then Wreckers, then bots, then Scuttler packs (a pack lands together). Each loader and bot lands on an open street cell more than 10 m from every living mech when one can be found; a zone enemy prefers its home zone (see Zone threats); the boss lands as Boss placement (Enemies and AI) says. A wave is clear when its queue is empty and no enemy is left; the next wave starts after a 3 s breather.
- **Levels:** each excursion is one campaign level, from 1 to 5 (GDD-D47, accepted 2026-10-28; was 50). Per level above 1, a value grows by a fixed share of its level-1 value: bot and loader counts by 25% (rounded), enemy health by 15%, enemy damage by 15% and scrap drops by 10% (rounded). So level L has 1 + 0.25 × (L − 1) times the level-1 count. The boss count does not change.
- **Zones:** each level opens one more zone: level 1 the Underpass, level 2 the Freight Yard, level 3 Smelter Row, level 4 the Glass Quarter, level 5 the Terminus Yard, so level 5 plays the whole sector (see Map; five zones per kr0's level design pick, built in PR #12).
- **Zone threats** (GDD-D40; the zone pairing is proposed): each zone brings one enemy type. Once a zone is open, its enemy joins the waves of every level and prefers to land inside that zone, so each district has its own fight. A zone enemy takes the place of the enemies listed, and its count grows with the level like the enemies it replaces.

  | Zone (opens at level) | Brings | Takes the place of | Blueprints, unlocked the first time you extract that level (level 5: on victory) |
  | --- | --- | --- | --- |
  | Underpass (1) | Patrol bots, heavy loaders, the sniper | — | None |
  | Freight Yard (2) | Scuttler packs | 2 bots, in waves 2, 4 and 5 | Arc caster |
  | Smelter Row (3) | Bulwark | 1 loader, in waves 4 and 5 | Redline vent, Seismic hammer |
  | Glass Quarter (4) | Wrecker | 1 bot, in waves 2 and 4 | Breach charges |
  | Terminus Yard (5) | Elites | One bot or loader in every wave (Overtime included) becomes an Elite | Overdrive core, Grav-skids |

- **Extract:** when wave 5 clears, a prompt gives you 6 s to choose Extract (Enter or R) or Overtime (F) (GDD-D37). If nobody chooses, you extract. On extract, scrap cubes still on the floor go to the nearest living mech, your scrap is banked and the next level opens. There is no cash-out earlier: scrap is all-or-nothing until you extract. Leaving early, including closing the game mid-match, counts as a death.
- **Overtime** (GDD-D37, accepted 2026-10-28; values proposed): a sixth wave after the usual 3 s breather (see Waves). Cubes still on the floor when you call it stay where they are. While it runs, every scrap drop counts double. Clearing it extracts you automatically and adds 25% to all match scrap, rounded, before it is banked. Dying in Overtime is a normal death: all match scrap is lost and the campaign goes back to level 1. Big risk, big reward. One Overtime per excursion. In co-op the host chooses and the guest sees the prompt; calling Overtime runs the partner revive check at the end of wave 5 as at the end of waves 1 to 4.
- **Contracts** (GDD-D38, accepted 2026-10-28; values proposed): every level draws one contract from the climb's seed (see Seed), so each climb brings new ones; no two levels of a climb share a contract. The garage shows it before you drop in and the HUD tracks it. Completing it adds 20 scrap × (1 + 0.10 × (level − 1)), rounded, to the completing mech's match scrap at once, so a death still loses it; in co-op each mech that is alive at that moment gets the full amount. A contract that can't be done on that level (Clean sweep under Cold front, Eviction or Crush when that level has no sniper or no span) is not drawn. Failing one costs nothing. Contract kills follow Kill credit.

  | Contract | Do this in one excursion |
  | --- | --- |
  | Crush | Kill 3 or more enemies with one collapse |
  | Bring it down | Drop 2 overpass spans |
  | Eviction | Knock the sniper off its perch twice |
  | Full combo | Reach a ×4 combo |
  | Clean sweep | Take every pod that drops (at least 5) |
  | Untouchable | Clear wave 3 losing less than 20% of max armor |
  | Close shave | Extract with less than 15% of max armor |
  | Blitz | Clear waves 1 and 2 within 75 s of wave 1 starting |
  | Wrecking crew | Destroy 400 voxels |
  | Repo man | Kill 2 enemies that took a pod |

- **Sector conditions** (GDD-D39, accepted 2026-10-28; list proposed): every level draws one condition from the climb's seed, so each climb brings new ones and no two levels of a climb share one. Level 1 draws only from the milder ones (Reinforced, Heat wave, Cold front, Scrap storm, Pod rain), so a new player's first match stays readable. The garage shows the next level's condition beside its contract, so you can build for it; the drop-in announces it and the HUD shows its icon.

  | Condition | Effect for the whole excursion |
  | --- | --- |
  | Brittle city | Chunks break at 12% of voxels lost instead of 20% |
  | Reinforced | Chunks break at 30% instead of 20%; collapse scrap doubles |
  | Loose pillars | Every pillar's lowest chunk starts having lost 15% of its voxels, one or two hits from breaking |
  | Heat wave | Heat drains 30% slower |
  | Cold front | Heat drains 30% faster; only one pod per wave |
  | Scrap storm | Scrap drops +30%; every wave adds one bot |
  | Blackout | Night: enemies see 30% less far; you see the street lit within 12 m of your mech, plus muzzle flashes, blasts and slag |
  | Pod rain | Two pods every wave; patrol bots go for a pod at any health |
  | Sniper's nest | Each boss wave brings one extra Bounty sniper (with the Warden, a fourth rider) |

- **Kill credit** (proposed, GDD-D48): a kill belongs to the last mech that damaged the enemy within 3 s, or to the mech that broke the chunk whose collapse, topple or spill killed it. Kills by events an enemy started (a Wrecker charge, a Scuttler blast, an enemy's Strike beacon) belong to nobody: they still drop the demolition bonus but count for no combo, contract or stat. Scrap stays physical: the cubes go to whoever picks them up.
- **Victory:** extracting level 5 wins the campaign and shows a victory screen (GDD-D24, level cap GDD-D47). Its button starts a new climb at level 1 with every part, upgrade, blueprint and banked scrap kept (proposed, GDD-D24).
- **Armor:** every level starts with every mech at full armor.
- **Lose condition:** a mech is destroyed when its armor reaches 0. The excursion is lost when every mech is destroyed.
- **On death:** you lose all scrap from the match and the campaign goes back to level 1 on a new seed, saved at once. Parts you own, weapon upgrades, blueprints and scrap you banked are never lost. No wear is applied on a death.
- **Starter mechs:** the starter build (minigun, pile-bunker, vectored jump-jets, Reactor Mk1) is free and can't be lost, so a player with 0 scrap can always deploy.
- **Progression and saving** (save fields for blueprints and records accepted with GDD-D42): mechs progress only in excursions. The save is one campaign code, kept in the browser and copyable from the garage. It holds your build, owned parts, upgrade levels, wear, banked scrap, the level and the climb's seed (and whether the seed was typed), the highest level you have ever extracted (which decides blueprints), and lifetime records (see Player journey). It is written at once on every extract, death, purchase, repair and upgrade. An older code without the new fields loads with its highest level set to its current level and empty records.
- **Seed** (GDD-D49, accepted 2026-10-28): every climb has its own seed, which decides where enemies land, pod times and types, contracts, sector conditions, which enemy becomes an Elite and other random draws; the map itself never changes. A new campaign, a restart after a death and the restart after a victory each draw a new random seed. At level 1 the garage shows the seed and lets you type a different one, a whole number from 1 to 2,147,483,000 (GDD-D25), to replay or share a climb; a typed seed is used for that climb only. In co-op the room plays the host's seed.

**Co-op:** two players share one excursion and one map; the host is player 1 (orange) and the guest player 2 (cyan). There is no friendly fire: player weapons, the mortar and the flash-vent only hurt enemies, and only collapses hurt mechs from your own side. Co-op plays the host's campaign (GDD-D31, see Co-op campaign). Each mech keeps its own scrap wallet from the cubes it picks up. Co-op never pauses.

**Partner down and revive** (GDD-D24, proposed values): if one mech is destroyed, the other fights on, and the dead player's camera follows the survivor.

- When a wave (1 to 4) clears and the survivor's match wallet holds the revive price, the survivor pays it and the destroyed mech returns beside the survivor with 30% of its max armor. If the wallet is short, the partner stays down and the check repeats at the end of the next wave.
- The revive price is 40 scrap at level 1, scaled with the level like scrap drops: 40 × (1 + 0.10 × (level − 1)), rounded.
- No revive happens after wave 5; the excursion extracts instead. If the host calls Overtime, the check runs at the end of wave 5 too, and never after Overtime (GDD-D37).
- A mech that is down when the team extracts still banks the scrap it picked up. Revived or not, its fitted parts take wear on extract like any mech's, counting the damage it took before it was destroyed.

**Leaving a co-op room:** if a partner leaves or loses connection, their mech is destroyed and the other player fights on alone. The room closes when the excursion ends. In the garage, a player whose partner left can drop in alone.

**Co-op campaign** (GDD-D31): the host owns the room's campaign. This replaces "the lower of the two players' levels" (GDD-D14, GDD-D20).

- The room plays the host's campaign: the host's level, seed and open zones. The guest brings their own build, owned parts, upgrade levels and banked scrap.
- On extract, the host's campaign advances one level. Each player banks the scrap they picked up into their own save, and wear goes on each player's own parts. The guest's own campaign level and seed don't change.
- On a death (every mech destroyed), the host's campaign goes back to level 1. The guest loses their match scrap; the guest's own level doesn't change.
- A guest who leaves mid-match loses their match scrap and nothing else. A host who leaves mid-match ends the room for both (GDD-D52): the host's leaving counts as a death for the host's campaign, the guest loses their match scrap and nothing else, and both return to the title screen.
- Victory: extracting the host's level 5 (GDD-D47) wins the host's campaign. Both players see the victory screen; only the host's campaign restarts.

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
| Left mouse button (hold) | Right-arm light gun |
| Right mouse button (press, hold, release) | Left-arm heavy weapon: starts its timing ring, release to fire |
| Q | Shoulder active, if one is fitted (the siege mortar, Cryo flash-vent, Breach charges or Redline vent) |
| Space | Dash in your drive direction (or leg facing if standing) |
| Esc | Pause (single-player only; the window losing focus or the tab being hidden also pauses) |
| Enter or R | Press the main button of an open overlay; after wave 5, extract now |
| F | After wave 5, call Overtime (GDD-D37; the host only, in co-op) |

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

**Combo and stagger** (GDD-D35, accepted 2026-10-28 as "combo"; values proposed)

- **Combo:** a counter from ×1 to ×4 shown beside the heat bar, and on the cursor ring only while it is ×2 or more. Each Perfect raises it by one, up to ×4. A Good holds it. A Miss, a ring that closes, a ring cancelled by an overheat, or 12 s without a heavy shot drops it back to ×1. Destruction doesn't break it.
- **Combo reward:** an enemy credited to you (see Kill credit) while your combo is ×2, ×3 or ×4 drops 20%, 40% or 60% more scrap (see Economy for how bonuses combine). At ×4 your ATB fills 25% faster. In co-op each player has their own combo.
- **Stagger:** a Perfect staggers every enemy it hits for 1.0 s. A staggered enemy stops moving, can't fire, charge or jump, loses any tell in progress, and takes 50% more damage from every source. Stagger stacks with knockback: a Perfect pile-bunker hit knocks the enemy back 3 m and leaves it staggered where it lands. A staggered loader's charge stops. A staggered sniper's shot is cancelled and its jump timer pauses.

**Damage order** (proposed, GDD-D48)

Every hit on an enemy is worked out in this order, then rounded once at the end:

1. **Blocked?** A Bulwark's shield blocks the whole hit if it arrives within 60° of its front (see Enemies and AI). Nothing below applies.
2. **Base damage** of the weapon, shell, blast or collapse (see Parts list and Destruction).
3. **× power ÷ 100**, for player weapons and shoulder actives only. Collapses, hazards and pod strikes ignore power.
4. **× upgrade level:** 1.0, 1.1 or 1.2 for Mk I, II or III.
5. **× timing grade:** 2, 1 or 0.5 for a heavy weapon's Perfect, Good or Miss; 1 for everything else.
6. **× 1.5 if the enemy is staggered.**
7. **× armor resistance:** 0.5 for the minigun and shotgun against loaders and a Bulwark's body, and for the Arc caster against loaders; 1 otherwise.

Collapse, hazard and pod-strike damage to enemies scales with the level instead (see Destruction). Damage to mechs is the enemy's base damage × (1 + 0.15 × (level − 1)) × 1.25 for an Elite, then rounded; power, upgrades and grades don't apply. Speed multipliers stack the same way: an ATB bar fills in 6 s ÷ (power ÷ 100) ÷ 2 under Overclock ÷ 1.25 at a ×4 combo.

**Shoulder actives (real time, Q)**

- The siege mortar and the flash-vent use no timing ring. Each has a cooldown: the mortar 7 s (recharges faster with power), the flash-vent 10 s. Breach charges and the Redline vent work the same way (see Parts list).

**Heat**

- Heat runs 0 to 100. Light shots, the heavy weapon, the mortar and dashes add heat; heat drains at 20 per second at the base heat stat.
- Every heat gain is multiplied by 1 + (heat stat − 100) ÷ 200 below 100, or ÷ 100 above it. Drain is 20 × (1 + (100 − heat stat) × 0.015), never below 40% of 20.
- At 100 the mech overheats for 3 s: light guns, dashes and the mortar lock, the heavy weapon can't start a ring, a running ring is cancelled, and heat falls to 0 over the lockout. The Cryo flash-vent ends a lockout at once.
- **Redline** (GDD-D36, changed 2026-10-28: a Q power from the Redline vent shoulder part; values proposed): press Q to go into Redline for 5 s. Nothing locks during Redline: guns, dashes and rings all work, and heat can climb past 100 up to 130. Every point of heat above 100, net of drain, costs 0.5 armor; that counts as damage taken for wear and for Untouchable, but not for the Nanite core's "3 s without damage". Q also works during a lockout: it ends the lockout and starts Redline, the clutch use. When Redline ends with heat above 100, the mech locks out for 3 s plus 1 s for every 10 heat above 100; at 100 or below nothing happens. The vent then recharges for 14 s. The heat bar glows white-hot and the cockpit voice calls it. Because it uses the shoulder slot, it never combines with the flash-vent or the mortar.

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
| Combo (proposed, GDD-D35) | ×1 to ×4; drops after 12 s without a heavy shot; scrap +20% per step above ×1; ATB +25% at ×4 |
| Stagger (proposed, GDD-D35) | 1.0 s; +50% damage taken |
| Redline vent (proposed, GDD-D36) | 5 s; cap 130 heat; 0.5 armor per heat above 100, net of drain; lockout 3 s + 1 s per 10 heat above 100 if it ends above 100; 14 s recharge |

**Edge cases**

- **Redline at low armor:** Redline can destroy your own mech. Armor never stops it; the low armor alarm and the cockpit voice warn you (proposed, GDD-D36).
- **Perfect on a staggered enemy:** the stagger restarts at 1.0 s; it never adds up (proposed, GDD-D35).
- **Overclock at a ×4 combo:** the two speed-ups multiply (see Damage order) (proposed, GDD-D48).
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
- **Blueprints** (GDD-D42): six parts are not in the garage at first. The first time you extract level 2, 3, 4 or 5, in any climb, the parts of the zone that level opened (see Zone threats) are added to the garage for good, so each part arrives with the enemy it answers. You still buy them with scrap. A death, a new campaign or a victory restart never removes a blueprint. The save keeps the highest level you have ever extracted.

### Weapon upgrades

Each weapon can be upgraded twice, from Mk I to Mk III, for scrap (GDD-D23).

- **Weapons:** the four Arm-R guns, the three Arm-L heavy weapons, and the two shoulder actives (siege mortar and Cryo flash-vent): nine parts. The Cryo-vent heatsink and Salvage magnet deal no damage and have no levels. The blueprints add three more (GDD-D42): the Arc caster, the Seismic hammer and Breach charges, for twelve.
- **Effect:** every level adds 10% of the weapon's damage to enemies, on top of power: Mk II deals 110% and Mk III 120%. Heat, rate of fire, range, cooldowns and damage to voxels don't change.
- **Ownership:** a part is bought at Mk I. Its level belongs to the owned part, so it stays when you swap the part out and back, and it is never lost, not on a death either. Starter weapons can be upgraded.
- **Wear:** wear doesn't reduce upgrade levels, and upgrade levels don't change a part's repair price.

| Rarity | Mk I to Mk II | Mk II to Mk III |
| --- | --- | --- |
| Common | 20 | 40 |
| Rare | 35 | 70 |
| Epic | 60 | 120 |

Upgrading all nine weapons to Mk III costs 1,005 scrap; with the three blueprint weapons, 1,395 (GDD-D42).

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

**Blueprint parts** (GDD-D42): unlocked by zone (see Mech building), then bought like any part. With them the garage holds 27 parts.

| Slot | Part | Zone · rarity · price | Stat change | What it does and what it costs you |
| --- | --- | --- | --- | --- |
| Arm-R | Arc caster | Freight Yard · Rare · 65 | power +5, weight +14, heat +18 | A bolt every 0.4 s, 9 damage, about 12 m range, that jumps to up to 2 more enemies within 4 m for 6 damage each. Built for Scuttler packs. Half damage to loaders; does no damage to voxels. 6 heat a bolt |
| Shoulder | Redline vent | Smelter Row · Rare · 50 | weight +8, heat +5 | Q: 5 s of Redline (see Heat), usable during a lockout to end it. 14 s recharge. Pairs with hot builds and the Overdrive core; costs you the mortar or flash-vent |
| Arm-L | Seismic hammer | Smelter Row · Epic · 115 | power +10, weight +30, speed −6, heat +12 | ATB ground slam: 50 damage to every enemy within 3 m (4 m on a Perfect). A Perfect also staggers everything it hits, topples container stacks within 4 m and shakes a sniper whose perch is within 10 m off it. Zero range; 1.5 s retract on a Miss |
| Shoulder | Breach charges | Glass Quarter · Rare · 60 | weight +10, heat +5 | Q throws a sticky charge onto the surface under the cursor, up to 10 m; Q again sets off every charge you have placed. Each deals 40 damage within 2 m and removes the voxels within 2 m of it, so a pillar takes two or three charges. Holds 2 charges, each back after 8 s. 8 heat a throw |
| Core | Overdrive core | Terminus Yard · Epic · 100 | armor −10, weight +8 | Below 35% armor: power +30 and heat drains 50% faster. A comeback core for players who live on the edge |
| Legs | Grav-skids | Terminus Yard · Rare · 55 | armor −5, speed +8, weight +6 | Hover drive: slides wider through turns, holds 2 dashes that recharge 1.6 s each, 8 heat a dash, and takes half damage and half heat from slag. Rubble still blocks it. Loader shoves push you 50% further |

## Garage and drop pods

The garage is the only place your build changes. Drop pods are one-use boosts inside a match.

**Garage (between matches only)**

- Buying a part pays its full price from your banked scrap and you own it for good. Swapping back to a part you own is free. There is no selling or refunds. Core and Shoulder can be left empty; the other slots always hold a part.
- The garage shows the five stats as bars with the selected part's change before you confirm, plus max armor, speed, damage, ATB fill time and cooling.
- It upgrades the selected weapon one level at a time and shows its level and the price of the next one.
- It shows each fitted part's wear and the scrap to repair it, and one Repair button that follows the Durability rules; starter parts repair free.
- **Next level preview** (proposed, GDD-D38, GDD-D39): the garage shows the level you are about to play, the zones and zone enemies in it, its sector condition and its contract, so you can fit parts for them before you drop in. A part newly unlocked as a blueprint is marked "New".
- The campaign code (your save) is shown in the garage and can be copied. At level 1 the garage also shows the climb's seed and lets you type one (see Seed, GDD-D49). Resetting the save wipes it after two clicks.
- In co-op the garage is shared: both players shop, then both press Drop in. The room plays the host's campaign; each player's own save receives only their scrap and wear (see Co-op campaign).

**Drop pods (in the arena)**

- Each wave drops one pod, and a second with a 40% chance, at a random time 1.5 to 6 s into the wave, on an open cell at least 4 m from every living mech. Each pod is Field repair or Overclock with equal chance (with GDD-D43: Field repair 50%, Overclock 20%, Scrap cache 15%, Strike beacon 15%, so heals don't get rarer as fights get harder). A marker and a 3 s countdown show where it lands, then the crate falls. A pod whose time comes after its wave is already clear never drops.
- Touching a pod (within 0.7 m) applies its effect once and the pod disappears. Pods never expire.
- Any living mech can take a pod, the nearest first. Failing that, a patrol bot or a heavy loader that walks over one takes it. The boss can't.
- Patrol bots go for a pod when it is closer to them than to the nearest mech, or when their health is below 50%. Loaders take a pod only by walking over it.
- Enemies that take a pod show a toast, so every pod is a race.

| Pod | Effect |
| --- | --- |
| Field repair | Restore 40% of the taker's max armor |
| Overclock | ATB bars fill twice as fast for 15 s; a patrol bot that takes it fires twice as fast; a loader that takes it gains nothing |
| Scrap cache (GDD-D43) | 12 scrap cubes, scaled with the level, burst out within 2 m of the mech that takes it. An enemy that takes it glows gold and carries the cache: it drops those cubes as well as its own when it dies |
| Strike beacon (GDD-D43) | 1.5 s after a mech takes it, four shells land in a line from that mech toward its cursor, at 3, 6, 9 and 12 m: each deals 40 damage within 2 m (scaled with the level like collapse damage, GDD-D41) and blasts a 3×3×3 hole, and they never hurt mechs. If an enemy takes it, the line is aimed from that enemy at the nearest mech, lands after a 2 s warning drawn on the ground, and hits mechs for 20 and enemies for 40 |

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
| Scrap cache pod (GDD-D43) | 12 | Yes |
| Overtime (GDD-D37) | Every drop doubled during Overtime, then +25% of all match scrap on clearing it | Yes |
| Combo kill (proposed, GDD-D35) | +20%, +40% or +60% at ×2, ×3, ×4 | Yes |
| Collapse or hazard kill (GDD-D41) | +50% | Yes |

Sources that scale are multiplied by 1 + 0.10 × (level − 1) and rounded.

**How kill bonuses combine** (proposed): an enemy's cubes = base cubes × the level scale × 2 for a Perfect pile-bunker kill × 2 in Overtime × 3 for an Elite × (1 + the combo and the collapse or hazard percentages added together), rounded once at the end. The doublings multiply; the percentages add. Kills credited to nobody (see Kill credit) get the collapse or hazard bonus but no combo bonus.

| Scrap sink | Cost | Repeatable |
| --- | --- | --- |
| Buy a part | 15 to 140 by part (see Parts list) | No |
| Upgrade a weapon | 20 to 120 by rarity and level (see Weapon upgrades) | Twice per weapon |
| Repair a worn part | Price × wear × 25%, 50% or 75% by rarity, rounded up; free for starter parts | Yes |
| Revive a co-op partner | 40 × (1 + 0.10 × (level − 1)), rounded, from the survivor's match scrap | Yes |

- Roof loot drops to street level.
- Weapon upgrades and repairs keep scrap useful once every part is owned. The fun pass adds more scrap than it adds things to buy; the options are in [economy options](decisions/2026-10-28-economy-options.md), waiting on kr0.

## Destruction and environment

The map is built from voxels, and anything resting on something else can fall.

- **Supports:** voxels group into 4×4×4 chunks. A chunk breaks into debris once it has lost more than 20% of its voxels. Pillars and buildings hold up what is above them; deck spans never hold each other up.
- **Collapse:** after a chunk breaks, anything no longer connected to the ground falls as one piece. Break one pillar and the deck is cantilevered; break two neighbours and the span between them falls.
- **Warning:** a loose piece creaks for 0.9 s and its ground footprint shades red before it falls. Shadows always draw above the low-health vignette.
- **Landing:** a collapse deals 80 damage to every enemy under it and 40 to every mech, at any level. With GDD-D41 the damage to enemies scales with enemy health, 80 × (1 + 0.15 × (level − 1)), so a span drop still kills a bot at the last level; damage to mechs stays 40. Enemies still dropping in and a sniper on a roof are not hit. Landing voxels at street level may stay as rubble, which blocks walking and can be shot away; the rest breaks into debris. A piece of more than 6 voxels also scatters 2 to 4 scrap cubes.
- **Terrain reshaping:** heavy weapons carve trenches and punch new doorways, so cover and flanking routes change every match. Damage stays until the match ends.
- **Shooting structures:** see Damage to structures. The plasma cutter does four times the voxel damage; the pile-bunker, bunker-buster and mortar carve larger holes.
- **Demolition bonus** (GDD-D41): an enemy killed by a collapse, a toppled stack, a dropped container or slag drops 50% more scrap, and a "CRUSHED" callout counts the kills from one event (see Economy).

**Hazard props** (GDD-D41). Each zone has one kind of prop that turns the city on whoever is near it. How many there are and where they stand is set by the level design.

| Prop | Zone | Rule |
| --- | --- | --- |
| Overpass spans | Underpass (and the whole map) | As today: break two neighbouring pillars and the span falls |
| Container stacks | Freight Yard | Containers, single or stacked up to 3 high, follow the support rule: destroy or plow the bottom container and the ones above fall as a collapse, with the usual warning and landing damage |
| Gantry crane | Freight Yard | A frame 6 m high holding one container on its hook over the yard. The hook is above the 2 m aim height, so you bring it down from the ground: break all four of its legs (any leg still standing holds the frame up, like a pillar under a cantilevered deck) and the frame and its container fall as a collapse after the 0.9 s warning, onto whatever is under them. Once per crane per excursion |
| Slag vat | Smelter Row | A 2×2 m vat on a leg frame in the street or on the 3 m slag gallery. Break its support and it falls as a collapse; where it lands it spills a 4×4 m pool of molten slag for 8 s. The pool deals 25 damage a second to enemies and 10 to mechs, and adds 15 heat a second to a mech standing in it. Grav-skids take half its damage and heat. Slag lights the street during Blackout |
| Billboard | Glass Quarter | The district's landmark on two legs. Break both legs and it falls as a collapse after the 0.9 s warning. Once per excursion |

## Enemies and AI

| Enemy | Stats | Behaviour |
| --- | --- | --- |
| Patrol bot | 60 health, 2.4 m/s, sees 10 m, range 6.5 m | Patrols between street cells, engages on sight or when hurt: fires a 7-damage orb about every 1.25 s (±15%), strafes and backs off when close, gives up after 3 s unseen. Drops in from 9 m, landing for 10 damage on a mech within 1.2 m |
| Heavy loader | 160 health, 1.3 m/s, sees 10 m, armored | Patrols between two points, hunts on sight, stops within 2.2 m and tells for 0.5 s, then charges for up to 1 s at 5 m/s in a straight line, plowing barriers, windows and containers: 22 damage and a 1.5 m shove. Recovers for 0.8 s and can't charge again for 1.5 s. Does not shoot. Half damage from minigun and shotgun |
| Bounty sniper | 180 health, sees 15 m | Perches on a roof edge and fires an 18-damage orb every 2.2 s after a 0.6 s tell. Jumps to a new perch every 6 to 9 s, or after 1.5 s without sight. If the voxel under it is destroyed it falls: a fall of 1.5 m or more costs 60 health and a 2 s stun |
| Scuttler (GDD-D40; Freight Yard; values proposed) | 18 health, 5 m/s, sees 12 m; comes in packs of 4 | Small drone that runs straight at the nearest mech, flashes for 0.4 s within 1.2 m, then explodes: 10 damage within 1.5 m to mechs and enemies alike, and a 1-voxel hole. Shot down, it explodes where it is. Knocked into another enemy, it explodes on contact. Can't take pods |
| Bulwark (GDD-D40; Smelter Row; values proposed) | 220 health, 1.6 m/s, sees 10 m, turns at 1.2 radians a second | A loader with a riot shield facing its walk. The shield blocks all damage arriving within 60° of its front, except the rail rifle's slug, collapses, slag and blasts landing behind it. At 3 m it bashes: 15 damage and a 2 m shove, then 2 s before it bashes again. A Perfect from the front breaks the shield for 5 s and staggers it, and the hit's damage goes through; a Perfect from behind staggers it as usual. Slow to turn, so one mech holds its attention while the other flanks |
| Wrecker (GDD-D40; Glass Quarter; values proposed) | 90 health, 2.8 m/s, sees 8 m | Keeps more than 8 m from every mech. Walks to the pillar or building chunk nearest a mech that is at least 8 m from every mech (with none, it holds back and repositions), and plants a charge over 2.5 s; any damage restarts the plant. The charge (20 health, a blinking marker and countdown) goes off 4 s later and destroys its chunk, which can start a collapse. Shooting the charge sets it off early. A Wrecker killed mid-plant drops its charge, which goes off 2 s later where it lies |
| Elite (GDD-D40; Terminus Yard; values proposed) | Double health, +25% damage | One bot or loader per wave, picked by the seed, with gold trim. Drops triple scrap and a Field repair or Overclock pod where it dies |

- **Bosses** (GDD-D51; roster accepted 2026-10-28, values proposed): each level draws its wave-3 and wave-5 bosses from the climb's seed, so the boss waves change between levels and climbs. Level 1's wave 3 is always the Bounty sniper, to teach it. A wave-5 boss is the harder variant: 1.5 times the health and attacks 30% faster (the sniper fires every 1.5 s instead of 2.2 s and drops 18 cubes). Level 5's wave 5 is always the Warden.

  | Boss | Waves | What it is |
  | --- | --- | --- |
  | Bounty sniper | 3 or 5, levels 1 to 4 | As above: one sniper hopping between perches on the roofs you have left standing in open zones |
  | Sniper pair | 3 or 5, levels 2 to 4 | Two snipers, each with two thirds of the sniper's health and 9 cubes, who never perch within 8 m of each other and fire in turn, so one is always telling |
  | Juggernaut | 3 or 5, levels 3 to 5 | A boss loader: 450 health, armored like a loader, 1.8 m/s. Its charge runs up to 2 s and plows through buildings and pillar chunks as well as barriers, so it can bring a span down on you or on itself. A Perfect stagger stops a charge. 20 cubes |
  | The Warden | 5, level 5 only | The big boss of the Terminus Yard, below |

- **The Warden** (GDD-D51, proposed values): a four-legged command walker with a 6×6 m body 5 m up, built for the Terminus Yard's open sky. It walks at 0.8 m/s, has 1,500 health and drops 60 cubes.
  - **Snipers on its back:** three platforms each carry a Bounty sniper (180 health, normal fire and tell). While any rider is up, the Warden takes half damage. Killing a rider, or breaking its platform (150 health), drops the sniper to the street with the usual fall damage and stun.
  - **Barrage:** every 8 s it calls four shells in a line toward a mech, drawn on the ground 2 s before they land: 20 damage each to mechs, 40 to enemies, and a 3×3×3 hole.
  - **Below 50% health:** it drops a Scuttler pack from its belly every 15 s, and stomps a mech standing under it: 0.8 s tell, then 25 damage within 3 m.
  - **Legs:** four legs, 300 health each, that take full damage and ignore the riders' cover. Breaking a leg staggers it for 2 s and slows it by 25%. Breaking all four brings it down as a collapse: it takes 400 damage, can't move or stomp for the rest of the fight, and takes 50% more damage. Anything under it takes collapse damage.
  - It can't be staggered by a Perfect; only leg breaks stagger it. It never takes pods.
- **Boss placement:** a sniper boss arrives on a roof edge 8 to 16 m from a random living mech, preferring one with a line of sight to it. A sniper that fell, or that finds no roof, fights from the street and jumps back to a roof within 10 m when its jump timer runs out and one exists.
- **Level scaling:** counts, health, damage and scrap grow with the level (see Excursion rules).
- **Structures:** enemies don't aim at supports. Only the heavy loader's charge damages the map, plowing through barriers, windows and containers. With GDD-D40 (proposed) the Wrecker aims at supports on purpose and Scuttler blasts chip voxels; this brings back "enemies that break supports on purpose" from the backlog (GDD-D19).
- **Stagger:** see Combo and stagger (GDD-D35). Scuttlers die to any Perfect; a Bulwark is staggered by any Perfect that isn't blocked by its shield, and a Perfect into the shield breaks it.
- **Sector conditions:** Blackout and Sniper's nest change enemies for one excursion (see Excursion rules).
- **Boss placement for the others:** the Juggernaut lands like a loader; the Warden walks in from the far end of the Terminus Yard during the wave's drop-in.
- **Pods:** see Garage and drop pods.

## Map

Overpass Sector 4 is the only map: a voxel grid 80 m long, 32 m wide and 8 m high, with an indestructible perimeter wall.

- **The overpass:** a six-lane road deck 5 m up, one voxel thick, runs the full length on ten 2×2 concrete pillars at x = 3, 11, 19, 27, 35, 43, 51, 59, 67 and 75. Dropping a span puts the road on whoever is below.
- **Streets:** 47 buildings (2 to 5 m high), 16 barriers and 14 containers fill the streets; all of it can be shot apart.
- **Hook:** break two pillars in a row and the 8 m of road between them falls on everyone below.

### Zones

The map is cut into three zones along its length, each walled off by an indestructible blast shutter until it opens: the Underpass (x 0 to 31), the Freight Yard (x 32 to 55) and Smelter Row (x 56 to 79). Level 1 opens the Underpass, level 2 adds the Freight Yard, level 3 and up open all three. A sealed zone is drawn dark with its name, and nothing spawns there. Enemies, pods and sniper perches only use open zones, so the fight spreads out as you climb levels. When you die, the campaign returns to level 1 and the zones close again.

Opening a zone is the drop-in of that level: the mechs land, nothing spawns for 5.5 s, the camera leaves the mechs and pulls back over the sealed zone, the shutter falls into debris at 2.6 s, the zone lights up, and the camera returns before wave 1 begins. Input is locked and mechs take no damage during the shot. Levels 1 and 4 and up have no drop-in shot.

**Zone identity** (GDD-D40, GDD-D41): each zone has its own enemy (see Zone threats) and hazard prop (see Destruction and environment), so the zones play differently: the Underpass is about dropping spans, the Freight Yard about Scuttlers among toppling stacks and the crane, Smelter Row about Bulwarks and slag, the Glass Quarter about Wreckers and the billboard, and the Terminus Yard is the open-sky arena where the Elites fight. The layout of each zone, and where its props stand, is being designed in the level design work and will be written here once kr0 picks a concept.

## Content counts

| Content | Count |
| --- | --- |
| Modes | 1 (Excursion, single-player or two-player co-op) |
| Maps | 1 (Overpass Sector 4), 5 zones |
| Campaign levels | 5, one per zone (GDD-D47; was 50) |
| Bosses | 4: Bounty sniper, Sniper pair, Juggernaut, the Warden (GDD-D51) |
| Waves per excursion | 5 (bosses on waves 3 and 5) |
| Enemy types | 6 plus Elites: patrol bot, heavy loader, Bounty sniper with a wave-5 variant, and one per zone with GDD-D40: Scuttler, Bulwark, Wrecker, Elites |
| Parts | 21 in 6 slots (4 starter parts free), 3 rarity tiers; 27 with the 6 blueprint parts (GDD-D42) |
| Upgradable weapons | 9, with 2 upgrade levels each; 12 with the blueprints (GDD-D42) |
| Drop pods | 2 (Field repair, Overclock); 4 with Scrap cache and Strike beacon (GDD-D43) |
| Zone threats | 4 (Freight Yard to Terminus Yard, GDD-D40) |
| Sector conditions | 9 (GDD-D39) |
| Contracts | 10 (GDD-D38) |
| Match stats | About 15 per player per wave (GDD-D50) |
| Hazard props | 5 kinds: overpass spans, container stacks, gantry cranes, slag vats, the billboard (GDD-D41) |
| Art styles | 3 (Blockout, Cinematic, Ink); only the voxel build is being developed for now (GDD-D46) |
| Music cues and sound effects | 7 music cues, about 40 effects (see Audio); 8 cues, about 55 effects and 10 cockpit voice lines with the fun pass (GDD-D45) |
| Story and narrative beats | 0 (non-goal) |

## Player journey and menus

Title → garage → drop in → five waves → extract, or Overtime then extract (garage, next level) or death (garage, level 1) → … → level 5 extract (victory).

- **Title:** the game's name, the controls for your build, your banked scrap, and these buttons:
  - **Continue campaign · Level N**, shown when the campaign is past level 1. It opens the garage at that level.
  - **Drop in**, which opens the garage for a campaign at level 1. Past level 1 it reads **New campaign** and resets the level to 1, keeping parts, upgrades and banked scrap.
  - **Settings**.
  - **Play with a friend:** host a room or join one with a room code. A host can paste a campaign code to resume it.
  - **Records** (GDD-D45): the highest level you have ever reached, best combo, spans dropped, contracts completed and Overtimes cleared, across every campaign.
- **Garage:** see Garage and drop pods. Drop in starts the level.
- **In match:** the HUD shows armor, heat (or "locked" with seconds), dash, the arm weapon's charge state, the shoulder active's cooldown, overclock time, level, wave, enemies left (or the countdown to the next wave), the match's scrap (the team's total in co-op), enemies downed and a boss bar. A cursor ring shows heat and ATB charge, and the timing ring shows during a press. With the fun pass: the combo beside the heat bar (and on the cursor ring at ×2 or more), the contract and its progress, the sector condition's icon, the Redline glow on the heat bar, the wave report in each breather, and a 6 s Extract or Overtime prompt after wave 5. Toasts announce waves, pods, collapses, zones and partner events. A Settings button sits on the HUD.
- **Pause (single-player only):** Esc, opening Settings, the window losing focus or the tab being hidden pause the match; the overlay's button resumes.
- **Extracted:** the excursion report (see Match stats) and a Garage button that opens the next level.
- **Overtime prompt** (GDD-D37): after wave 5, two buttons, Extract (Enter or R) and Overtime (F), with a 6 s countdown that extracts when it runs out.
- **Campaign over:** the excursion report with the match scrap shown as lost, the level you reached, and a New campaign button that opens the garage at level 1 on a new seed.
- **Victory:** after extracting level 5: the campaign is won, with a button that starts a new campaign (see Excursion rules).
- **Settings:** art style (Blockout, Cinematic, Ink), music volume and effects volume, saved on this device.

### Match stats

The simulation counts what each player does, wave by wave (GDD-D50, accepted 2026-10-28; layout proposed). The same numbers go into each run's metrics record, so the tuning runner and the player see the same data.

| Stat | Counted per player, per wave |
| --- | --- |
| Kills | By enemy type, and by source: light gun, heavy weapon, shoulder, collapse or hazard, pod strike (see Kill credit) |
| Damage dealt | To enemies, and to the city in voxels destroyed |
| Damage taken | By source: enemies, collapses, slag, Redline |
| Timing | Perfects, Goods and Misses; best combo |
| City | Spans dropped, stacks and props brought down, most kills from one collapse |
| Multi-kills | Doubles, triples, quadruples and DEVASTATINGs |
| Pods | Taken, stolen by enemies, and stolen back (Repo man) |
| Scrap | Picked up, by source: kills, collapses, pods, contract, Overtime bonus |
| Heat | Overheats and seconds in Redline |
| Time | Seconds to clear the wave |

- **Wave report:** during each 3 s breather, a strip under the wave-clear toast shows that wave's kills, damage dealt and taken, Perfects and scrap. The game never pauses for it.
- **Excursion report** (on Extracted and Campaign over):
  - **Scrap count-up:** this match's scrap counts up line by line (kills, collapses, pods, contract, Overtime bonus), then is added to your banked total, which counts up from what you had before the match to the new total. On a death, the match scrap counts down to zero and is marked lost.
  - **Contract:** done or failed, with its progress (for example "Bring it down: 1 of 2 spans").
  - **Sector condition:** the one this level had.
  - **Chart:** one bar pair per wave (damage dealt and damage taken) with a line for scrap picked up; in co-op each player has their own colour.
  - **Highlights:** best combo, best multi-kill, most kills from one collapse, Perfects, spans dropped and time per wave.
  - In co-op both players see both columns.

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
| Boss layer | Waves 3 and 5 while the boss is alive | Combat loop plus a lead and harder drums |
| Warden theme (GDD-D51) | Level 5, wave 5 | Its own track: the main theme slowed and heavy, rising a step each time a leg breaks |
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

**Fun pass sounds** (GDD-D45)

| Group | Sound | Plays when |
| --- | --- | --- |
| Heavy weapons | Combo step (rising pitch per step), combo broken | A Perfect raises the combo; it drops to ×1 |
| Heavy weapons | Stagger crack | A Perfect staggers an enemy |
| Mech | Redline whine and hiss | Redline starts; Redline ends in its lockout |
| Enemies | Scuttler skitter, flash and pop | A pack moves; one is about to explode; it explodes |
| Enemies | Bulwark shield block, bash, shield break | A shot hits the shield; it bashes; a Perfect breaks the shield |
| Enemies | Wrecker charge plant beep, charge blast | A charge is being planted or counting down; it goes off |
| World | Container topple, crane collapse, slag spill and sizzle | A stack falls; the crane comes down; a vat falls and its pool burns |
| Pods | Scrap cache burst, strike beacon whistle | A cache opens; a strike line is about to land |
| Match | Contract complete, Overtime called, report count-up ticks, multi-kill stings (four rising stings, DEVASTATING the biggest) | A contract is done; the host calls Overtime; the excursion report counts scrap; a multi-kill lands |

**Cockpit voice** (GDD-D45): a short, dry synthesized voice, mixed like a warning. Ten lines: "Heat critical" (80 heat), "Redline", "Armor critical" (35%), "Pod inbound", "Pod lost" (an enemy took one), "Sniper on the roof" (boss lands), "Span unstable" (a pillar holding a span has lost a chunk), "Charge planted" (Wrecker), "Contract complete" and "Overtime". It never speaks more than once every 3 s, and warnings win.

**Feel** (GDD-D45): presentation only, the simulation never pauses, so co-op stays in step.

- **Hit-stop:** on a Perfect, the impact effect freezes for 60 ms, the struck enemy flashes white, and the camera punches in 4% and back. The enemy itself never freezes, so it never jumps when the effect ends.
- **Grade stamps:** PERFECT, GOOD or MISS stamps at the impact point, in the art style's lettering, with the combo number beside a Perfect.
- **Callouts:** "SPAN DOWN" when a span falls and "CRUSHED ×N" for the kills from one collapse or hazard.
- **Multi-kills** (GDD-D53): kills credited to one mech (see Kill credit) within 1.5 s of each other, or in one event, raise combat text over that mech: **DOUBLE KILL** (2), **TRIPLE KILL** (3), **QUADRUPLE KILL** (4) and **DEVASTATING** (5 or more), each bigger and louder than the last. The count keeps climbing while kills keep landing within 1.5 s. In co-op each player has their own. Multi-kills are counted in the match stats, and the best one is an excursion highlight.

## Glossary

| Term | Meaning |
| --- | --- |
| Excursion | One match: five waves on the map at one campaign level |
| Campaign | The climb from level 1 to 5 (GDD-D47), saved as one campaign code |
| Warden | The level-5 big boss, a walker carrying three snipers (GDD-D51) |
| Multi-kill | Two or more kills credited to one mech within 1.5 s (GDD-D53) |
| Climb | One run from level 1 until a death or a victory; each climb has its own seed (GDD-D49) |
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
| Combo | The ×1 to ×4 counter raised by Perfects (GDD-D35) |
| Stagger | The 1.0 s after a Perfect when an enemy can't act and takes more damage (GDD-D35) |
| Redline | 5 s from the Redline vent when heat can pass 100 at the cost of armor (GDD-D36) |
| Kill credit | Which mech a kill counts for (GDD-D48) |
| Match stats | The per-wave numbers shown in the wave report and excursion report (GDD-D50) |
| Overtime | The optional sixth wave after wave 5 (GDD-D37) |
| Contract | A level's optional goal for bonus scrap (GDD-D38) |
| Zone threat | The enemy type a zone brings into the waves once it is open (GDD-D40) |
| Sector condition | A level's rule change, drawn from its seed (GDD-D39) |
| Elite | A gold-trimmed enemy with double health, from the Terminus Yard (GDD-D40) |
| Blueprint | A part unlocked for good by first extracting the level that opens its zone (GDD-D42) |
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
