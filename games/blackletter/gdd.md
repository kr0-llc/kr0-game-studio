# Blackletter: Chronos GDD

Oct 23, 2026 · @kr0 · Game Design Document

## 1. Overview

**Pitch.** A tabletop general's war on a real clock. Command a warband of armoured holy soldiers across a hex battlefield where every unit acts the moment its gauge fills, and break the enemy by holding ground, not by clicking faster.

**Player fantasy.** The general at the war table who reads the field, not the player who clicks fastest.

**Audience.** Tabletop wargamers, tactics-RPG players who know Final Fantasy's ATB, and buyers of gothic art games. The game also has to work for phone players, keyboard-only players and Spanish speakers.

**Platforms and languages.** Desktop and phone browsers. English and Latin American Spanish.

**Setting.** Two holy hosts, the **Order of the Sun** (blue, Player I, south) and the **Crimson Vanguard** (red, Player II, north), fight over the relics of a ruined cathedral country. Each unit kind has a flavour name per host: the Sun's Templar Halberdier and the Vanguard's Crimson Flailman are both Choppers.

### Design pillars

| Pillar | What it decides |
| --- | --- |
| **Grand tactics over reflexes** | The clock runs, but slowly. A good decision beats a fast click, and a ready unit never loses its action. |
| **Ground is the score** | Pressure comes from the map. More nodes held means steady income and a steady drain on the enemy's Morale. |
| **A wager of nerve** | The Secret Wager turns Morale into a sealed bid for a blessing. Bidding high can win the clash and lose the war. |
| **Gothic martial realism** | Armoured holy orders with halberds, rifles and jump packs, reliquaries and siege engines. No high fantasy and no undead; Miracles are acts of faith and discipline. |
| **An illuminated manuscript as interface** | Blackletter type, woodcut terrain and Roman Missal ornament. |

### Non-goals

- No reflex play: no queued orders, standing orders or automatic attacks. Every action is a direct order to a ready unit.
- No kill-count victory. Killing units helps only through ground and Fervor.
- No cheating AI. No difficulty gets extra information or better dice.

## 2. Core gameplay

### Core loop

A match runs muster, prep, then one battle cycle repeated until a side breaks. There are no turns: every unit runs its own gauge, so the player is always reading which unit is next and where it should go.

1. **Muster.** Choose the battlefield size and Sebastion's skill, and read how a battle is won.
2. **Prep, in secret.** Place a Chopper, a Jumper and a Shooter in your Cathedral Zone.
3. **A gauge fills.** The unit joins the Action Queue and waits.
4. **Order the ready unit:** move, attack, charge, or buy it an upgrade card. Or leave it waiting.
5. **Take and hold nodes.** The side with fewer nodes bleeds Morale.
6. **Earn** Tithes from nodes and Fervor from fighting and the Reliquary.
7. **Spend:** recruit, refit, merge, or cast a Miracle, including the Secret Wager.
8. **Repeat from 3** until one side's Morale reaches 0.

Holding ground pays twice: Tithes and Fervor make the warband stronger, and the node lead drains the enemy's Morale every second.

### A minute of play

*On the default 21-hex board.* The bell rings and your Jumper is already ready: every army opens with its Jumpers' gauges full, Choppers at 55% and Shooters at 30%. You send it six hexes toward the Reliquary and watch it cross hex by hex; it starts counting toward capture the moment it touches the node, even mid-move. Sebastion's Jumper is on its way too, so the node sits contested until your Chopper, ready next, arrives beside your Jumper and gives you the majority. Thirteen seconds later the Reliquary turns your colour and Tithes start ticking up. On the far side Sebastion holds one Fortress to your Reliquary, so neither side bleeds yet, but each Reliquary tick adds Fervor. When your Shooter comes up you hold it on a hill, so its next volley gets an extra die. Fervor passes 10, and you weigh a Wager: a 4-Morale bid could buy Hold the Line for the fight at the Reliquary, but it is 4 of your 20.

### Win and loss

| Condition | Trigger | Result |
| --- | --- | --- |
| Morale Collapse | A side's Morale (starts at 20) reaches 0, from node bleed or its own Wager bid | That side loses. Both at 0 in the same instant is a draw |
| Extinction | A side has no living field units, and its Extinction timer (50 s) runs out before it recruits one | That side loses. Both timers ending together is a draw |
| Leave Battle | A player leaves an online battle on purpose | Immediate forfeit; the opponent wins and the battle can't be resumed |
| Late bleed *(proposed)* | From 20:00 both sides bleed 0.02 Morale a second on top of any node bleed | Guarantees an end when node counts stay even |

### Controls

| Action | Mouse and keyboard | Touch |
| --- | --- | --- |
| Select a ready unit | Click it, or Tab for the next ready unit (Auto does this after each order) | Tap it |
| Move | Click a gold hex (M arms Move) | Tap a gold hex; hold to preview the march, lift to send |
| Attack or charge | A, then click a reticled enemy; or right-click the enemy | Long-press the unit for the action ring, swipe to Attack, tap the target |
| Upgrade, merge | U opens the Armory; G merges | Ring petals: Upgrade and Merge |
| Recruit | Click a Recruit button, then a lit hex of a recruit zone (Tab cycles zones) | The same, in the Recruit tab |
| Miracles | 1 Challenge, 2 Prayer, 3 Exorcism; press again or Enter to cast | Miracle tiles |
| Secret Wager | ← → bid, 1–3 blessing, Enter seals | The seal's − / + buttons and slider |
| Pause, clock speed | Space; 1× / 2× / 3× in the top bar | Pause button; speed buttons |
| Inspect | Hover a unit or hex | Long-press an enemy or an empty hex |

### Modes

| Mode | Who | Notes |
| --- | --- | --- |
| Practice vs Sebastion | One player, in the browser | Coached for the first three battles; pause and active pause allowed |
| Online vs Sebastion | One player; the server plays him | Same pause rules as practice |
| Online, two players | Invite code | Clock speed locked in the lobby; no orders while paused (see The clock) |
| Game Master | One screen, both warbands | Hand-off screen for sealed bids; Counsel overlay; Sebastion can command either side or both |

## 3. Systems

All times are battle-clock seconds unless marked real time. Clock speed (1×, 2×, 3×) changes how fast battle time passes, never the rules.

### Muster and prep

**Purpose:** The only choices before the first bell are the battlefield and where your three soldiers stand.

**Rules**

- **Muster.** Pick the battlefield size: 11, 15, 21 (default) or 25 hexes across. The size locks when the clock starts.
- **Prep.** No units are on the field. Each side places its three starters, a Chopper, a Jumper and a Shooter, on free hexes of its own Cathedral Zone: pick a unit, then a lit hex. A placed unit can be picked up and moved again until its commander presses **Ready for battle**.
- **Secret.** Both sides place at the same time and neither sees the other's starters until the battle begins.
- **Timer.** Prep lasts 60 s of running clock. When both sides are ready the battle starts at once; when the timer ends, any unplaced starter takes its default post, the free zone hexes nearest the centre, in the order Chopper, Jumper, Shooter. Sebastion places and readies straight away.
- **Nothing else happens in prep.** No gauges, income, capture or bleed; only placing, readying and the clock controls.
- Each side starts the battle with 10 Tithes, 20 Morale, 0 Fervor and the same three Miracles: Challenge Morale, Prayer and Exorcism.

**Edge cases**

- In a coached practice battle the prep clock waits until the player places a first starter or presses Ready.
- Before a local battle, Settings can change starting Tithes and Morale, prep time, capture time, readiness speed and node income. Online battles always use the defaults.

### The clock

**Purpose:** Grand tactics over reflexes. Lulls to read the map; no action lost to slowness.

**Rules**

- Each unit's gauge fills at its Initiative times the gauge rate, in % per second. At 100% the unit is **ready**: it joins the Action Queue and keeps its action until ordered. There is no order window.
- Only a ready unit that isn't moving can take an action. An order spends the action and empties the gauge.
- A gauge doesn't fill while its unit is moving.
- An effect that drains gauge (Suppressing Fire) can drop a ready unit below 100%; it leaves the queue until it refills.
- Opening gauges: Jumpers 100%, Choppers 55%, Shooters 30%, so the first order of every battle is a Jumper's.
- Chapels and Holy Surge speed up the fill; they don't change Initiative. Holy Surge from the Reliquary and from a Wager count once.
- The only actions taken without an order are free reactions: a strike back and a Retaliation Charge.

**Actions.** A ready unit takes one:

| Action | Who | Effect |
| --- | --- | --- |
| Move | Any | Walk a path of up to MOVE movement points |
| Attack | Any | Strike an enemy in range and line of sight |
| Charge | Melee units (RNG 1) | Move up to MOVE to a hex next to an enemy and strike it on arrival, as one action |
| Refit | Any | Buy an upgrade card (see Economy) |

Holding and taking nodes needs no order: units capture by standing there.

**Pause and clock speed**

| Where | Pause | Orders while paused | Clock speed |
| --- | --- | --- | --- |
| Practice, Game Master, online vs Sebastion | Anyone, any time | Yes (active pause) | Change any time |
| Online, two players | One 1-minute tactical pause each, alone; after that a pause needs the other's consent within 20 s and lasts until either resumes | No | Set by the match's creator, locked |

- **Active pause.** Move, Attack, Charge, Refit, Recruit and the Miracles can be ordered while paused. An attack or a Miracle resolves at once; a march sets off when the clock runs. A recruit appears at once, and its purchase cooldown runs only with the clock. A Trinity Merge needs the clock running. Sebastion never acts while paused.
- At 2× or 3×, two idle ready units drop the clock back to 1×.
- No pause can start during a Secret Wager.
- **Leaving the app** pauses a local battle. **Online,** a disconnect pauses the battle for both. The player who stayed sees a countdown and, after 3 minutes, may claim victory by forfeit; it is never automatic, and either player can resume once both are back.

**Values**

| Value | Amount |
| --- | --- |
| Gauge rate | 1.0 % per second per INIT point |
| Time to ready | 25 s at INIT 4, 33 s at INIT 3 |
| Chapel bonus | +20% fill |
| Holy Surge | +30% fill |
| Prep | 60 s |
| Tactical pause (online) | 1 minute of real time, once per side |
| Forfeit claim after a disconnect | 3 minutes of real time |

### Movement, terrain and sight

**Purpose:** Ground is the score. Marches are commitments the enemy can see.

**Rules**

- Units walk real hex paths. Each hex costs 1 movement point; Mire costs 2, and a unit can't enter Mire with fewer than 2 points left.
- A march step takes the base step × 6 / MOVE seconds per movement point: 5.2 s a hex at MOVE 3, 2.6 s at MOVE 6. Higher MOVE is both farther and faster.
- A moving unit occupies the hex it is crossing: it can be shot there and counts for capture there, not at its destination.
- **Interrupt.** A unit struck while it marches, and not destroyed, is caught on the march: it owes half a gauge of readiness. Its gauge is already empty in transit, so the debt is paid first from its next fill, and its next action takes 1.5 times as long. Debts cap at one full gauge however many strikes land. The march continues. Every resolved strike counts, ranged or melee, hit or miss, including a Retaliation Charge's crash; Mine Field damage and standing units don't. The forecast says so in words, the Chronicle logs it, and the unit's gauge shows the debt as a hatched segment.
- A path can't pass through another unit or into a hex another unit is moving to.
- **Interception.** If another unit moves into the next hex of a march, the marcher stops where it is and its action is spent. A march stopped before it leaves its first hex costs nothing, and the unit stays ready.
- **Making way.** If the next hex holds only a friendly unit passing through, the marcher waits up to 13 s for it to clear instead of stopping. A friend that stops there still blocks it.
- **Line of sight** is a straight centre-to-centre hex line. Any Dense Forest hex between the two units blocks it. A unit inside a forest sees and is seen only from adjacent hexes. Adjacent units always see each other.
- **Range bands.** Melee is 1 hex, Close 2 to 6, Long 7 to 12. Every strike at 7 hexes or more takes −1 HIT.

**Terrain**

| Terrain | Movement | Sight | Effect |
| --- | --- | --- | --- |
| Open ground | 1 | Clear | None |
| Dense Forest | 1 | Blocks; hides units inside | +1 save (Screen) to a unit inside |
| Mire | 2 | Clear | None |
| Mine Field | 1 | Clear | Entering it, or leaving after stopping in it, rolls 3d6; 2 HP lost per 6 |
| Hill | 1 | Clear | High Ground: +1 attack die against a target not on a hill |
| Chapel | 1 | Clear | Friendly units on or next to it fill gauges 20% faster |
| Fortress | 1 | Clear | +1 save (Bastion) to its occupant; a node |
| Reliquary | 1 | Clear | A node |

A forest is a hiding place: units inside can only be reached in melee, where the Screen save still applies. Trackless units (Jumpers) ignore Mire and Mine Fields they pass through, but still pay or roll for the hex they start or end in.

### The skirmish

**Purpose:** One dice rule a tabletop player can read and trust.

**The dice rule.** Roll a d6 and add the modifier; 7 or more succeeds, and a natural 1 always fails. Modifiers add up, and "+1" is always better.

| Total modifier | Succeeds on | Chance |
| --- | --- | --- |
| +0 or less | Never | 0% |
| +1 | 6 | 17% |
| +2 | 5+ | 33% |
| +3 | 4+ | 50% |
| +4 | 3+ | 67% |
| +5 or more | 2+ | 83% |

**Rules.** A skirmish is one attack plus every strike it provokes.

1. The striker rolls its ATK in dice, plus any bonus dice, each with its HIT modifier.
2. The target rolls one save for each hit, with its DEF modifier plus cover and blessings.
3. Each unsaved hit removes DMG in HP. At 0 HP the unit is destroyed.
4. If the defender can reach the attacker with its own RNG and line of sight, it strikes back. The higher Initiative strikes first; the attacker wins ties. A unit destroyed by the first strike does not strike back.

**Modifiers**

| Situation | Change |
| --- | --- |
| Strike at 7 hexes or more (Long) | −1 HIT |
| Shooter striking or striking back at an adjacent target (Volley Weapon) | −2 HIT |
| Steadfast unit that hasn't moved since its last action | +1 HIT |
| Attacking from a hill at a target not on a hill (High Ground) | +1 attack die |
| Jumper attacking a target another friendly unit touches (Flank) | +1 attack die |
| Target in Dense Forest or on a Fortress | +1 to saves |
| Cut Them Down blessing | +2 HIT; targets save at −1 |
| Hold the Line blessing | +3 to saves |

**Retaliation Charge.** A Chopper that survives an attack from beyond 1 hex charges the attacker at once if it is not pinned, not moving, and can reach a hex next to the attacker within its MOVE. The charge is free: it spends no gauge, moves twice as fast as a march, and strikes on contact as part of the same skirmish. If the attacker is out of reach, the Chopper holds its ground.

**Edge cases**

- A Jumper's charge can't be struck back unless the target is Braced (a Chopper).
- A unit in a Cathedral Zone can't strike or be struck.
- A push onto a Mine Field rolls the mine dice.

**Worked example.** A Shooter (ATK 4, HIT +3, DMG 2) fires at a Chopper (DEF +3, HP 11) 6 hexes away. Each die hits on 4+ (50%) and each hit is saved on 4+ (50%), so the volley averages 1 unsaved hit for 2 HP. That hit drains 10% of the Chopper's gauge and pins it. About a third of volleys (0.75⁴ ≈ 32%) do no damage and leave it unpinned. At 6 hexes the Chopper can't reach, so nothing follows; within 4 hexes, that third of volleys brings a free charge onto a Shooter that strikes back at −2 HIT.

### Nodes and conquest

**Purpose:** Ground is the score. Every march is a question of which ground to take, hold or give up.

**Rules**

- A node is the Reliquary or a Fortress. A unit **touches** a node if it stands on it or on one of its six neighbours.
- The side with more touching units works on the node, in two steps: it **neutralises** an enemy node (16 s), which then belongs to nobody, and **captures** a neutral node (13 s). A side that keeps its majority goes straight from one to the other, 29 s in all.
- A ring around the node fills in the attacker's colour. If the attacker loses its majority, the ring drains at the same rate. A node nobody touches stays as it is.
- **Underdog speed.** The side holding fewer nodes neutralises and captures 25% faster for each node it is behind.
- **Contested.** With equal numbers touching (at least one each), or while the enemy is neutralising it, a node keeps its holder but yields nothing, and a tie never moves its ring.
- **Cathedral Zones** are each side's two back rows (one row on boards under 15 hexes across). A zone is sanctuary: a unit there can't strike, be struck or be pushed, and holds no ground. A unit may move within and out of its own zone but can never re-enter once it leaves, and no enemy may ever enter. Recruits, refits and merges work inside it.
- **Deployment.** Recruits are placed on a free hex of a recruit zone: your own Cathedral Zone, or the ground around a Fortress you have held long enough (below). With no hex chosen, a recruit takes the free Cathedral Zone hex closest to the board's centre.
- **Forward recruiting.** A Fortress you hold becomes a recruit zone once you have held it unbroken for 75 s. The count pauses while the node is contested, and the zone is closed meanwhile; losing the node or having it neutralised resets the count, and a re-capture starts it afresh. The count is public, like the node's holder. The Reliquary never counts.
- A forward zone is every free hex within 2 of the Fortress that is not a node, a Mine Field or inside a Cathedral Zone, and not next to an enemy unit. Cost, purchase cooldown and supply cap are unchanged. A forward recruit stands in the open, not in sanctuary: it can strike and be struck at once. A refused placement says why in words (not held long enough, with the seconds left; contested; next to an enemy; and so on).

**Node effects**

| Node | Gives the holder while uncontested |
| --- | --- |
| Fortress | Node income; +1 save to its occupant |
| Reliquary | Node income; Reliquary Fervor; Holy Surge for every unit while held. This is not a won blessing and doesn't stack with one |

**Edge cases**

- A moving unit counts for capture on the hex it is crossing.
- A side with no units touching a node it holds keeps it until the enemy neutralises it.
- A forward zone that opens while an enemy stands beside some of its hexes offers only the others; the Cathedral Zone stays a recruit zone throughout.

### Morale

**Purpose:** The score and the stake. Ground is the score; a wager of nerve.

**Rules**

- Each side starts with 20 Morale. Morale never rises. It is a decimal, shown to one place.
- The side holding fewer nodes bleeds continuously. The first node of lead bleeds 0.03 a second; each further node adds half as much as the one before.
- Wager bids are paid from Morale, in whole numbers.
- Late bleed *(proposed)*: from 20:00 both sides bleed 0.02 a second on top of any node bleed.
- At 0 Morale the host collapses and loses.

**Values (Morale bleed)**

| Node lead | Bleed | 20 Morale gone in |
| --- | --- | --- |
| 1 | 1.8 a minute | about 11 minutes |
| 2 | 2.7 a minute | about 7½ minutes |
| 3 | 3.2 a minute | about 6¼ minutes |
| 5 | 3.5 a minute | about 5¾ minutes |

The first node is decisive; a rout bleeds less than twice a narrow lead, so the side being routed always has a window to answer.

**Edge cases**

- Both sides reaching 0 in the same instant is a draw.
- A Wager bid can take a side to 0 only when its Morale is a whole number, because fractions are never bid. If bids take a side to 0, the collapse resolves when the clock resumes.

### Economy

**Purpose:** Ground is the score. Income comes only from nodes, so the map is the economy.

**Sources and sinks**

| Resource | Sources | Sinks | Limits |
| --- | --- | --- | --- |
| Tithes (₮) | 0.05 a second per held, uncontested node; 10 at the start | Recruit (Chopper 12, Jumper 14, Shooter 14); upgrade card 6 | Supply cap 8 living units |
| Fervor | +2 per HP dealt; +1 per HP taken; 0.2 a second from the Reliquary; 0.09 a second per node behind | Challenge Morale 10; Prayer 15; Exorcism 25; Trinity Merge 10 | Cap 100 |
| Morale | None | Node bleed; Wager bids; late bleed | Starts at 20 |

Holding three nodes buys a unit roughly every 80 seconds. Units are dear on purpose: a battle is fought with a few units, and armies grow by taking ground.

**Rules**

- **Purchase cooldown.** Recruit, refit and merge share one 5 s cooldown per side. Combat and Miracles are not affected.
- **Refit.** A ready unit spends its action and 6₮ to take an upgrade card. At most 2 cards per unit, no duplicates. HP changes apply to both maximum and current HP, never below 1.
- **Trinity Merge.** A side action, not a unit order: no unit needs to be ready. Three units of one kind and tier, all within 2 hexes of the chosen unit and none of them marching, fuse for 10 Fervor into one unit of the next tier on the chosen unit's hex. The chosen unit merges with its two nearest eligible allies.
  - Each tier: ×3 max HP, +2 ATK, +1 DMG, +1 DEF. Tier 2 is a Zealot, Tier 3 an Arch-Zealot; Tier 3 is the cap.
  - Current HP is the three units' combined current HP, capped at the new maximum. The gauge is the average of the three.
  - Traits carry over. The chosen unit's upgrade cards carry over; the other two units' cards are lost.
  - The board links three mergeable units with a gold triangle.

**Edge cases**

- A contested node pays nothing.
- At the supply cap, Recruit is disabled until a unit dies.
- A merge counts as a purchase and needs the clock running.

### The Secret Wager

**Purpose:** A wager of nerve.

**Rules**

- **Calling.** Either side may call Challenge Morale for 10 Fervor while the clock runs. No unit needs to be ready. Only one Wager can be under way at a time, and a call that isn't allowed costs nothing.
- **Freeze.** The clock stops: gauges, marches, capture and every timer, and blessing time doesn't count.
- **Bids.** Both sides seal a bid of 0 to 10 Morale at the same time. The highest bid is 10 or the whole part of your Morale, whichever is lower; a larger number is cut down to that limit. Online between two people the window is 20 s of real time and a bid not sealed in time counts as 0. Against Sebastion and on one screen it is untimed. On one screen the bids are entered in turn behind a hand-off screen.
- **Reveal.** Both bids show at once, and both sides lose what they bid. A bid of 0 costs nothing.
- **Blessing.** The higher bidder's whole army gets a blessing it doesn't already hold, for 75 s from the moment the clock resumes. A tie gives nothing. Picking a held blessing, or none, gets one it doesn't hold instead. Blessings never stack or refresh.
- **All three held.** A side holding all three blessings can't call a Wager until one expires. Its opponent can still call one; if the blessed side wins, it gains nothing, but both sides still pay their bids.
- Against Sebastion the clock stays frozen on the reveal until the player resumes.

**Blessings**

| Blessing | Effect for 75 s |
| --- | --- |
| Cut Them Down | +2 HIT; the targets of those strikes save at −1 |
| Hold the Line | +3 to every save |
| Holy Surge | Gauges fill 30% faster |

A Wager is a short army-wide surge in a chosen direction: accuracy, armour or tempo. Call it just before a decisive clash, or to answer one. Challenging a fully blessed opponent is purely a Morale-drain play.

### Miracles

**Purpose:** Fervor turns fighting and faith into one decisive act.

| Miracle | Fervor | Needs | Effect |
| --- | --- | --- | --- |
| Challenge Morale | 10 | The clock running; no Wager under way; you don't hold all three blessings | Opens a Secret Wager |
| Prayer | 15 | 2 of your units in the Action Queue | The two that have been ready longest spend their actions. Every other friendly unit gains 50% gauge and is cleansed of gauge drain, and every friendly unit heals 10 HP over 20 s, never above its maximum. A new Prayer restarts the heal |
| Exorcism | 25 | A ready unit within 4 hexes of the chosen centre, and an enemy within 2 hexes of it | The ready unit spends its action. Every enemy within 2 hexes of the centre is driven 2 hexes straight away from it, halting any march first. A push stops at the board's edge or an occupied hex and never ends in a Cathedral Zone; units in sanctuary are untouched. No damage, but a push onto a Mine Field rolls. It clears a node and breaks a capture |

Every warband has the same three Miracles.

## 4. Content

| Type | Count |
| --- | --- |
| Unit kinds | 3, each in 3 tiers |
| Upgrade cards | 6 (3 for any unit, 1 per unit kind) |
| Terrain types | 6, plus the 2 node types |
| Blessings | 3 |
| Miracles | 3 |
| Battlefield sizes | 4, generated |
| Hosts | 2, each with its own unit names |
| AI commanders | 1, with 3 difficulties |
| Coach tips | 6, over the first three practice battles |
| Modes | 4 |

### Unit stats

| Stat | Meaning |
| --- | --- |
| INIT | Initiative: how fast the gauge fills, and who strikes first |
| MOVE | Movement points per move or charge; also march speed |
| RNG | The farthest a unit can attack or strike back, in hexes. RNG 1 is a melee unit, which can charge |
| ATK | Dice rolled per strike, never fewer than 1 |
| HIT | Added to each attack die |
| DEF | Added to each save die |
| DMG | HP removed by each unsaved hit |
| HP | Current and maximum health |

Stats change permanently only through upgrade cards and merges. Terrain, traits and blessings add modifiers to a single strike or move; they never change the printed stat.

### Units (Tier 1)

| Unit | Role | INIT | MOVE | RNG | ATK | HIT | DEF | DMG | HP | Cost | Traits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Chopper | Melee bruiser | 3 | 3 | 1 | 3 | +3 | +3 | 1 | 11 | 12₮ | Melee (Charge), Braced |
| Jumper | Flanker | 4 | 6 | 1 | 4 | +3 | +2 | 1 | 8 | 14₮ | Hit and Run, Flank, Trackless |
| Shooter | Ranged suppression | 3 | 3 | 8 | 4 | +3 | +2 | 2 | 8 | 14₮ | Suppressing Fire, Volley Weapon |

Costs price utility, range and mobility, not raw strength: the Chopper is cheapest because it has neither.

**Traits**

| Trait | Unit | Rule |
| --- | --- | --- |
| Melee (Charge) | Chopper | Makes the Retaliation Charge (see The skirmish) |
| Braced | Chopper | Always strikes back at adjacent attackers, even against Hit and Run |
| Hit and Run | Jumper | When it charges, a target that isn't Braced can't strike back |
| Flank | Jumper | +1 attack die if another friendly unit touches the target |
| Trackless | Jumper | Ignores Mire and Mine Fields it passes through, though not its start or end hex |
| Suppressing Fire | Shooter | Each unsaved hit drains 10% of the target's gauge. Any unsaved hit pins the target for that skirmish, so it can't Retaliation Charge |
| Volley Weapon | Shooter | −2 HIT against adjacent targets, attacking or striking back |

### The triangle

Jumper beats Shooter, Shooter beats Chopper, Chopper beats Jumper. The favoured side should win 65 to 80% of duels.

| Matchup | Why the favoured side wins | How the other fights back |
| --- | --- | --- |
| Jumper beats Shooter | MOVE 6 closes the gap in one or two actions. Hit and Run stops the Shooter striking back, and Volley Weapon cripples it in melee anyway | Keep a Chopper next to each Shooter as a Braced bodyguard; shoot the Jumper while it travels; fight from forests, which force melee |
| Shooter beats Chopper | 2-damage volleys hurt through DEF +3; Suppressing Fire drains and pins; range 8 outreaches the Chopper's 4-hex threat | Advance through forests to break sight; once within 4 hexes, a volley that fails to pin brings a free charge |
| Chopper beats Jumper | Braced answers every Jumper attack, and DEF +3 with 11 HP outlasts the Jumper's 8 | Flank with a second unit for +1 die; avoid Choppers and dive the back line |

**Expected damage per strike** (open ground, Close range)

| Striker → target | Shooter | Chopper | Jumper |
| --- | --- | --- | --- |
| Shooter | 2.67 | 2.00 | 2.67 |
| Shooter, adjacent (Volley Weapon) | 0.89 | 0.67 | 0.89 |
| Chopper | 1.00 | 0.75 | 1.00 |
| Jumper | 1.33 | 1.00 | 1.33 |

The Chopper deals least but lasts longest and strikes back at everything adjacent. The triangle comes from tempo and traits (who strikes first, who can strike back, who can reach whom), not from damage. In 400-duel sweeps from 8 hexes the three legs come out at 76%, 67% and 78%; from 6 or 12 hexes the Shooter still wins against the Chopper, but only 56% of the time ([tuning history](tuning-history.md)).

### Upgrade cards (6₮ each, two per unit)

| Card | Who | Change |
| --- | --- | --- |
| Heavy | Any | HP +2, ATK +1, MOVE −1 |
| Elite | Any | HIT +1, HP +1 |
| Horde | Any | HP +5, ATK +1, DEF −1 |
| Steadfast | Shooter | RNG +1, MOVE −1; +1 HIT on every strike while it hasn't moved since its last action. A move or charge loses the bonus until its next action that isn't a move |
| Devastator | Chopper | HP −2, DMG +1 |
| Raider | Jumper | INIT +1, HIT +1, MOVE +1 |

Cards never change what a unit is. No card gives a melee unit range, so Choppers and Jumpers always stay melee, and no combination reaches past the 12-hex Long band.

### Battlefields

Generated, point-symmetric hex boards, so both armies face a mirrored field. The Reliquary is always the centre hex; Fortresses sit in mirrored pairs on a ring around it, never next to a Cathedral Zone.

| Board (hexes across) | Nodes | Fortresses |
| --- | --- | --- |
| 11 | 3 | One in each half |
| 15 | 5 | One in each half, two on the centre line |
| 21 (default) | 5 | One in each half, two on the centre line |
| 25 | 7 | Two in each half, two on the centre line |

An odd node count means someone always holds the majority once every node is owned. At 21 across, a Shooter's range 8 against a Chopper's 4-hex threat leaves a real kiting band of 5 to 8 hexes, a Jumper crosses in one action the gap a Chopper needs three for, and Fortresses sit 5 hexes from the Reliquary, so taking one is a commitment. Use 15 for quick games and 25 for long marches.

## 5. AI: opponents and in-match agents

The player fights another person or **Sebastion, Abbot of the Ashlands**. Three in-match agents shape what they face. This section describes what the player experiences; how each is built is in the [TDD](tdd.md).

| Agent | What the player sees it do |
| --- | --- |
| **Sebastion**, the computer commander | Sends each unit toward a node worth fighting for, races for the Reliquary early, keeps Choppers beside his Shooters, and takes the fight he expects to win. He recruits until he fields 5 units, then refits; he recruits beside a Fortress he has held long enough when the fight there is not going against him, and otherwise in his Cathedral Zone. He likes striking a unit on the march, because it arrives late. He calls a Wager at most once every 2 minutes, never when you are below 10 Morale, and bids what the blessing is worth to him. |
| **Counsel**, the referee's adviser | In the Game Master view, shows Sebastion's top three options for any selected unit, so a learner or referee can see why a move is good. |
| **The Coach**, the tutor | In the first three practice battles, opens six tips at the moment they matter, pausing the clock while each is open, and keeps Recruit and Miracles veiled until their tip. It holds Sebastion back from contested nodes until you capture one or 120 s pass. |

**Sebastion's difficulty levels**

| Level | What you notice |
| --- | --- |
| Easy | Hesitates 8 to 22 s at the start, often takes a Fortress before the Reliquary, issues orders slowly (one every 2.5 s), picks a second-best move about half the time, never buys upgrade cards, and calls Wagers and Miracles less often. |
| Normal | Answers your moves almost at once (within a quarter second) and rarely wastes a move. |
| Hard | Reacts faster still, moves several units at once, and builds a 7-unit warband before refitting. |

**Fairness rule.** Sebastion sees only what his seat may see: never the player's sealed bid or hidden prep placements. He gives orders through the same commands as a player, never acts while the clock is paused, and his strength comes from attention, not information.

**How the agents play off each other.** The Coach is the only agent that touches another: it sets Sebastion's hold-back flag for the opening of a coached battle and clears it when the player takes a node. Counsel reads Sebastion's scoring and never writes to it. All three are plain code with no model calls, so a battle costs no tokens and replays exactly.

## 6. UX

### Player journey

Muster (battlefield size, Sebastion's skill, how a battle is won) → Prep (secret placement, with the prep timer) → Battle (the loop above) → Collapse or Extinction screen (the Chronicle, Morale and nodes over time, Muster again).

### HUD

- **Top bar:** both hosts' Morale to one decimal, with a bleed chip (*▼ 1.8/min* and *breaks in 11:06*) on the side that is behind; one pip per node in board order (diamonds for Fortresses, a circle for the Reliquary, dashed when contested); the clock and the speed.
- **Board:** units with gauge rings and HP bars; gold hexes for a legal move; reticles for legal targets; capture rings on nodes.
- **Below the board:** the Action Queue (ready units first, with how long each has waited), Recruit (Tithes and income), Miracles (Fervor), the selected unit's card and orders, and the Chronicle.
- **Attack forecast:** hovering an enemy in Attack mode shows the odds, the modifiers and whether it can strike back.
- **Phone:** the panels become five tabs: Units, Orders, Miracles, Recruit, Log.

**Nudges and alerts.** A ready unit left idle for 40 s pulses, and the first time a hint names Tab and Auto. When the enemy starts taking your node, a banner names your nearest ready unit. A one-time banner and a Morale pulse mark the moment the enemy leads by 2 nodes and the moment a side falls below 5 Morale.

### Onboarding

The muster opens with a three-step summary: place your warband, take and hold nodes, spend Fervor. The Coach then teaches six beats in the first battle: the clock, take a node, hold more than they do, strike, recruit, spend Fervor. A full rules sheet (Rules of War) and a Card Codex are available at any time.

### Accessibility

- **No colour-only cues.** Node shapes and dashes carry state; the two host colours are checked for colour-vision deficiency.
- **Keyboard-only play.** Every order has a key. While an order is armed, the arrow keys move a hex cursor, `,` and `.` jump between valid targets, Enter sends and Esc cancels.
- **Screen readers.** The hex cursor announces the hex, its terrain and its occupant in a live region; other live regions announce pushes and deaths.
- **Text size.** Normal or Large: Large makes interface text 20% bigger and board labels 25% bigger.
- **Reduced motion.** The board honours the system's reduced-motion setting.
- **Time.** Pause and active pause let anyone take as long as they need against Sebastion.
- **Touch.** Targets are at least 44 px, with one hex of tolerance around each unit.

### Look

- **Type:** Canterbury Gothic for headings, IM FELL English for body text.
- **Palette:** Carbon Black (#383431, #1A1A1A), Bright Snow (#FAFAFA), Deep Crimson (#6A0A18), Olive Wood (#906C3C) and a neutral stone grey.
- **References:** the Blackletter tabletop war manual, unit and upgrade cards, miniatures and illustrations, and the Roman Missal. See [Art and screenshots](../../art/blackletter/README.md).

### Experience targets

| Target | Measure |
| --- | --- |
| A battle lasts 12 to 16 minutes | Self-play sweeps, 24 paired seeds |
| Each duel leg won 65 to 80% by its favoured side | 400 duels per matchup |
| First meaningful order within 60 s | Playtest rubric, First minutes, 4 of 5 or better |
| State readable at a glance | Playtest rubric, Legibility, 4 of 5 |
| Decisions feel like they matter | Playtest rubric, Depth and agency, 4 of 5 |
| Wants a rematch | Playtest rubric, Fun and pull, 4 of 5 |
| No colour-only cue; targets at least 44 px on touch | Playtest rubric, Accessibility, 4 of 5 |

Where each target stands is in the [tuning history](tuning-history.md).

## Formulas

- **Gauge fill (% a second)** = INIT × 1.0 × (1 + Chapel bonus + Holy Surge bonus)
- **March (s a hex)** = 2.6 × 6 / MOVE × hex cost; halved for a Retaliation Charge
- **Interrupt debt** = 0.5 gauge per strike taken on the march, capped at 1 gauge, paid from the next fill
- **Die** succeeds on d6 + modifier ≥ 7; a natural 1 fails
- **Expected damage** = dice × P(hit) × (1 − P(save)) × DMG
- **Node income (₮ a second)** = 0.05 × held, uncontested nodes
- **Morale bleed (a second)** = 0.03 × (1 + 0.5 + 0.5² + …), one term per node of lead

## Glossary

| Term | Meaning |
| --- | --- |
| ATB gauge | Each unit's Active Time Battle bar. It fills in real time; when full the unit is *ready* |
| Action Queue | The list of ready units, in the order they became ready |
| Initiative (INIT) | How fast a unit's gauge fills; also decides who strikes first in a skirmish |
| Muster, Prep | The pre-battle screen; the secret placement of the three starting units |
| Node | A capturable point: the Reliquary or a Fortress |
| Touching | Standing on a node or next to it |
| Contested | A node touched equally by both sides, or being neutralised by the enemy; it yields nothing |
| Cathedral Zone | Your home deployment zone and sanctuary |
| Recruit zone | Where a recruit may be placed: your Cathedral Zone, and the free hexes within 2 of a Fortress you have held unbroken for 75 s |
| Caught on the march | Struck while marching; the unit owes half a gauge (Interrupt) |
| Tithes (₮) | Money, earned only from nodes, spent on recruits and upgrade cards |
| Fervor | Faith, capped at 100, spent on Miracles and merges |
| Morale | Each side's life total, starting at 20 |
| Bleed | The steady Morale loss of the side holding fewer nodes |
| Blessing | An army-wide buff won in a Wager: Cut Them Down, Hold the Line, Holy Surge |
| Skirmish | One attack plus every strike it provokes |
| Pinned | Took an unsaved Suppressing Fire hit; can't Retaliation Charge this skirmish |
| Refit | Buying an upgrade card for a ready unit |
| Trinity Merge, Zealot, Arch-Zealot | Fusing three same-kind, same-tier units into one of the next tier; the Tier 2 and Tier 3 units that result |
| Extinction | Losing because a side has no field units for the Extinction timer |
| Retaliation Charge | A Chopper's free charge at a ranged attacker that fails to kill or pin it |

## Related documents

[Pitch](pitch.md) · [TDD](tdd.md) · [Open questions](open-questions.md) · [Tuning history](tuning-history.md) · [GDD decisions](gdd-decisions.md) · [TDD decisions](tdd-decisions.md) · [Art and screenshots](../../art/blackletter/README.md)
