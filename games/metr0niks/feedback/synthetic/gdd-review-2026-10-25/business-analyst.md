# Production/Business Analyst — Round 1

Scope of this review: feature creep, which features carry the core vision and which are decoration, market positioning, audience clarity, and whether the document is trying to be several games at once. Story logic and systems math are left to other reviewers.

## F1. The prototype is already building co-op and a campaign that the stated scope excludes

**Severity: BLOCKING**

**Problem:** The Overview sets a single-player first version and lists multiplayer as a non-goal. The prototype section, though, describes a two-player, level-based campaign. Neither "campaign" nor "level" appears in Run rules or Game modes. Excursion is "5 waves on one map" and ends at extract, so it has nothing that opens over levels 1 to 4. Production is spending on synchronized two-player cinematics and campaign gating before the single-player loop has a single tuned number (see F4). Until someone decides whether the first version is co-op, the network, AI, spawn and camera work cannot be scoped.

**Source:**
- *Overview*: "**Scope:** single-player Excursion and Gauntlet first … multiplayer comes later." and "**Non-goals (first version):** no multiplayer, no story …"
- *Maps → Zones (prototype, 22 Oct)*: "a campaign opens them one level at a time … from level 4 the whole sector is one battlefield." and "Opening a zone is the drop-in of that level: both mechs land … Both players watch the same shot because it runs on the simulation clock."
- *Game modes*: lists only Excursion and Gauntlet (both "1 vs AI") for the first version. There is no campaign mode and no co-op mode.

**Ask:** Either add co-op and a campaign to the first-version scope, with the cost stated, or freeze the zone and campaign work and fold zone-opening into the Excursion wave structure.

## F2. Single-player that requires a connection, with no audience, price or business model stated

**Severity: MAJOR**

**Problem:** The first version has no multiplayer, yet it requires a connection. That gives players the main drawback of a live-service game (needing to be online, server cost, a shutdown risk) without the usual payoff (PvP, co-op, live events). On PC, always-online single-player is a well-known source of negative reviews. The document never explains why it's needed. It also never says who the game is for, what it competes with, or how it makes money: premium, free-to-play or early access. Those answers would explain the online requirement and the color-coded rarity (F5). Without them, the online requirement looks like a cost with no benefit.

**Source:**
- *Overview*: "All play is online; multiplayer comes later."
- *Game modes*: "All modes are online."
- *Run rules*: "**Progression:** mechs progress only in excursions and are tied to the player's account."
- Omission: no section covers target audience, comparable games, price or monetization anywhere in the GDD.

**Ask:** Add a short positioning section covering audience, comparables, price model and the reason for requiring a connection. If the only reason is account-bound progression for future PvP, consider shipping single-player offline-capable.

## F3. Three games in one document: extraction roguelite, PvP draft duel, and PvPvE farming arena

**Severity: MAJOR**

**Problem:** The core vision (build tradeoffs, the city as a weapon, timed heavy hits) is pitched as a single-player extraction loop with harsh loss. The modes table then sketches two more games with their own economies and audiences. Draft Duel resets scrap each round and shows each player the other's buys, much like an auto-battler or round-based shooter economy. Scrap Rush is a 2v2 PvPvE farm-and-raid mode. Neither uses the garage, durability or extraction loss that the rest of the document is built on. The audiences pull against each other too. Losing all scrap on death and paying to repair durability targets hardcore extraction players. Gauntlet removes every penalty and "doesn't progress your mech", so it gives casual players no reason to play. The document never says which player it is for.

**Source:**
- *Game modes*: "Draft Duel | 1v1 | Best of 5, 90-second rounds; both see each other's buys and get new scrap between rounds" and "Scrap Rush | 1v1 or 2v2 plus AI | Farm neutral AI for scrap, or bulk up and raid the other side's drop pods"
- *Run rules*: "**On death:** you lose all scrap from the match." and "**Gauntlet:** … Gauntlet doesn't progress your mech."
- *Economy*: Draft Duel's per-round scrap appears nowhere in the scrap source and sink tables.

**Ask:** Name the target player. Cut Draft Duel and Scrap Rush from this GDD into a separate "post-launch" note so they stop shaping the first-version design. Give Gauntlet a reason to exist (practice, daily challenge, or partial progress), or cut it.

## F4. Content keeps growing while the core numbers are still TBD

**Severity: MAJOR**

**Problem:** The parts list grew from 12 to 21 in the prototype. Two later maps are designed in detail, with slag floods, leaning towers and a 20% overheat modifier. Meanwhile the numbers that decide whether the core pillar works are still unset: the Perfect and Good windows, all heat values, every stat formula, every scrap amount and every sink cost. That is decorative content outpacing the load-bearing core. There are also now two sources of truth. The prototype garage has concrete prices and three rarity tiers, while the design section says "All values are TBD" and specifies five tiers. Three parts work differently in each version (mag-winch, siege mortar, cryo vent), so a reader can't tell which spec is real.

**Source:**
- *Parts list*: "The starting pool is twelve parts." and "**In the prototype (Oct 22, 2026):** the garage sells 21 parts; prices are in banked scrap and rarity uses three tiers for now (common, rare, epic)."
- *Combat → Tunables*: "Perfect window | TBD", "Good window | TBD", "Heat per light shot | TBD", "Heat per heavy shot | TBD", "Heat drain per second | TBD"
- *Mech building*: "Base values and formulas for each stat are TBD."
- *Economy*: "Scrap is the only currency. All values are TBD."
- *Maps*: full destruction hooks and hotspots for "The Smelting Yards (later)" and "Neon Financial Plaza (later)".

**Ask:** Freeze new parts and later-map design until one map and roughly 8 to 12 parts have tuned values. Merge the prototype decisions back into the main spec so there is one parts table and one rarity scheme.

## F5. Rarity tiers and overlapping scrap sinks borrow loot-game structure without a loot loop

**Severity: MINOR**

**Problem:** The five rarity colors (white through orange) are a loot-game convention, but parts are never dropped as loot. They are bought outright in the garage, so rarity is just a price ladder dressed up as loot. The sinks also overlap: "Buy a part (higher rarity costs more)", "Stat upgrade", and "Higher-tier weapon" (repeatable) all spend scrap on better stats. The difference between buying a higher-rarity part and buying a "higher-tier weapon" is never explained. This adds UI, balance and art cost without supporting the "every part is a tradeoff" pillar. Flat stat upgrades and tier climbing pull toward "every part is strictly better", which weakens that pillar.

**Source:**
- *Parts list*: "**Rarity:** parts come in five tiers: white, green, blue, purple and orange. Higher tiers have better stats and cost more scrap."
- *Economy*, scrap sink table: "Buy a part (higher rarity costs more)", "Stat upgrade | TBD per level | Yes", "Higher-tier weapon | TBD per tier | Yes"
- *Overview → Pillars*: "**Every part is a tradeoff.**"

**Ask:** Pick one vertical progression track (tiers or upgrades, not both). Keep rarity only if the business model in F2 needs it, and make sure higher tiers widen the tradeoffs instead of simply adding stats.

## Round 2 — Cross-examination

I read all five colleague reviews and re-checked the GDD where a claim depended on wording. Three things changed my view. First, narrative-critic F2 shows that the pillars are written for the PvP game, not the PvE one. Second, the death-spiral findings (systems-designer F3, player-psychologist F1, adversarial-qa F4) all run through a feature that no pillar needs. Third, player-psychologist F2 gives the zone campaign a real job.

### Systems Designer

**CONFLICT (systems-designer F1, BLOCKING, Gauntlet as a no-risk farm).** I agree the text is contradictory. I disagree that the exploit is the blocking problem. The exploit is a one-line rules fix, and both proposed fixes ("Gauntlet scrap is cosmetic or not banked", "pays out at a heavy discount") make Gauntlet pay little or nothing. That is the zero-reason-to-play mode I flagged in my F3. Closing the exploit without deciding what Gauntlet is *for* only swaps one broken mode for another. The decision that blocks the work is Gauntlet's purpose (practice, try-before-you-buy, daily challenge, or cut), and the payout follows from it. I'd file this as one decision with two symptoms, not as an economy bug.

**CONNECTION (systems-designer F4 + my F4).** Systems-designer found that only the Oct 22 prototype parts use real stat deltas ("+14 speed", "weight -12", "Power +20"). The 12-part design table uses flat percentages that skip the stat model. That settles my F4 two-sources-of-truth question in one direction: the prototype table is the more mature spec. Merge into the prototype table, not into the design table. That turns my "merge" ask into "the design-section parts table is superseded".

**CONNECTION (systems-designer F5 + my F5).** We found the same three overlapping sinks on our own. My lens adds one point: the second power axis (stat upgrades and higher-tier weapons on top of rarity) is exactly what makes the economy impossible to tune while every value is TBD. Cutting two of the three tracks for the first version removes a whole tuning dimension before anyone tunes anything.

### Narrative Critic

**CONNECTION, leading to a REVISION (narrative-critic F2 + my F2 and F3).** This is the most important combined finding of the round. The GDD's selling lines are about mech versus mech: "A cheap mech can beat an upgraded one by dropping a road on it", "Enemy mechs grab pods too, so every pod is a race", and the pile-bunker "launches mechs through walls". In the first version those lines have no opponent. Put that next to two facts from my review: the game requires a connection with no multiplayer, and progression is "tied to the player's account". The document then reads as a PvP mech game whose single-player first version is an onboarding stage. The online requirement makes sense for that product and for no other. So my F3 was too narrow. Draft Duel and Scrap Rush are not just mode creep to move into a post-launch note. The pillars themselves are written for them. The real decision is: **is Metr0niks a PvE extraction game that might add PvP, or a PvP mech game shipping a PvE stage first?** Each answer means different positioning, comparables, monetization, and online architecture.

**Partial misread (narrative-critic F2).** The review says "the first version's enemies are not mechs" and that "the 'upgraded one' doesn't exist." The boss is "an ultra-light sniper that jumps across rooftops". "Ultra-light" is a mech weight-class term, and the document calls enemies "Enemy mechs" in the pod rules. At least one opposing mech probably ships. That still doesn't save the point. One boss can't make "every pod is a race" true, and the drop-pod rule ("an enemy goes for a pod when … its own armor is below 50%") is written for a whole roster of pod-grabbing rivals.

**CONNECTION (narrative-critic F3 + F5 + my F2).** My F2 asked for a positioning section. Narrative-critic shows why it can't be written yet. With no premise, the store-page sentence has no subject: who the player is, and whether demolishing slums is a crime or a revolt. And a city that "resets every match" reads as an arena (F5). That matters for comparables. An "arena brawler" and an "extraction game" draw different audiences and come with different expectations about loss. The harsh loss rules suit extraction games. The structure the document actually describes suits arena games.

### Player Psychologist

**CONFLICT, and I concede (player-psychologist F2 vs my F1).** My F1 asked to "freeze the zone and campaign work". Player-psychologist suggests using the zone campaign "to introduce one system per level". That is the first job anyone has given zones that the single-player game actually needs: an onboarding ramp the document otherwise lacks completely. I revise my F1 ask. Keep zone-opening as single-player progression and onboarding. Freeze only the two-player parts ("both mechs land", "Both players watch the same shot") and the synchronization work behind them. F1 stays BLOCKING, because the GDD still has to define what a level is relative to an excursion before either of us gets what we asked for.

**CONNECTION (player-psychologist F4 vs systems-designer F1 and adversarial-qa F1).** These reviews read the same Gauntlet sentence in opposite directions, and the GDD supports player-psychologist's cautious reading more. The Game modes table says Gauntlet means "no scrap lost, no damage to repair". "No scrap lost" describes a protection, not income. Adversarial-qa F1's flat statement that "Gauntlet does progress your mech, just one step removed" treats one reading as fact (see below). For production, the ambiguity itself is the defect. Three reviewers spent findings on one sentence.

**CONNECTION, leading to a NEW finding (player-psychologist F1 + systems-designer F3 + adversarial-qa F4 + feasibility-lead F1).** Four colleagues report the death spiral, and one of them rates it BLOCKING. The common cause is **durability**. Check it against the pillars: durability serves none of "every part is a tradeoff", "the city is a weapon" or "timed heavy hits". By my Round 1 test it is decorative. Yet it creates the most-reported retention risk, adds a fourth scrap sink to a TBD economy, and needs persistent server-side mech state (feasibility-lead F1). That makes it the cheapest high-value cut in the document. See N1.

### Feasibility Lead

**AGREEMENT WITH A PUSH (feasibility-lead F1 + my F2).** Feasibility puts the cost on the online requirement my F2 questioned: accounts, server-side progression, and an authority model, all before a single-player loop can ship. With the narrative-critic connection above, I now treat the online question and the positioning question as **one** decision, and I upgrade F2 (see Revisions).

**Partial misread (feasibility-lead F1).** The review says "the prototype is already a two-player networked sim." The GDD says "both mechs land … Both players watch the same shot because it runs on the simulation clock". Nothing there says networked. A shared simulation clock fits local or same-screen play, or a deterministic sim with no networking yet. The scope risk is real. The claim that networking work has already started is not supported, so the BLOCKING rating should rest on the online requirement in the Overview, not on the prototype.

**CONNECTION (feasibility-lead F2 + my F4).** Feasibility notes that the 32-cell prototype map is "too small for 15 m", while the flagship hook is "40 m of road falls on everyone below". So the game's trailer moment, the one image that would tell a buyer what Metr0niks is, can't exist on the current prototype map. Meanwhile production has added 10 parts and a zone cinematic. That is my F4 in its clearest form: the load-bearing feature (collapse at landmark scale) has no spec and no space, while decorative features ship. Collapse is pillar 2, so it can't be cut. It should come first in the build order.

**CONNECTION (feasibility-lead F5 + my F3, F4 and F5).** Feasibility asks for a cut list and doesn't propose one. My load-bearing test produces one. In proposed priority order for cutting from the first version: (1) durability (N1); (2) rarity tiers beyond one price ladder (my F5, systems-designer F5); (3) the stat-upgrade and higher-tier-weapon sinks; (4) the weight-removed-on-disable speed rule (adversarial-qa F3 shows it is an exploit, and nothing depends on it); (5) the two-player zone sequence. None of these touch the three pillars.

### Adversarial QA

**Misread / overstatement (adversarial-qa F1).** The review says Gauntlet "lets you keep your scrap" and so "does progress your mech, just one step removed", and that "a rational player will farm Gauntlet." The GDD never says Gauntlet *awards* scrap. Its sentences are "You keep your scrap and take no damage that needs repair" and, in the modes table, "no scrap lost". Both are about loss, not income. The exploit exists only under one of two readings. I agree with the fix direction. I disagree with the BLOCKING framing for the reasons given under systems-designer F1.

**CONNECTION (adversarial-qa F3 + my F2 + feasibility-lead F1).** Adversarial-qa's point 4 is that the document never says whether a disconnect counts as leaving early, and leaving early wipes all scrap. Player-psychologist F1 raised the same gap. From my lens, this is the online requirement's worst review risk. A single-player game that takes a player's whole run because their connection dropped is the standard always-online complaint on PC store pages. It is a direct cost of a requirement the document never justifies.

**CONNECTION (adversarial-qa F3 + my F1 and F5).** The both-arms-disabled soft-lock gets more likely the more shoulder options are non-weapons. The prototype added two more: Salvage magnet and Cryo flash-vent ("no passive weapon"). Feature growth in the prototype has widened a soft-lock window, which is a concrete example of decorative content creating load-bearing bugs.

### Revisions to my Round 1

- **F1: stays BLOCKING, ask revised.** Keep zones as a single-player onboarding and progression ramp (per player-psychologist F2). Freeze only the two-player and synchronized-cinematic work. The definition of "level" relative to "excursion" is still the blocking gap.
- **F2: UPGRADED from MAJOR to BLOCKING, merged with the PvP question from F3.** Narrative-critic F2 shows the pillars are written for mech-vs-mech PvP, and feasibility-lead F1 shows the online requirement fixes the architecture. Together, "which game is this, for whom, and why online" decides the architecture, not just the marketing. It has to be answered before scoping.
- **F3: narrowed.** The Gauntlet part now sits with systems-designer F1, adversarial-qa F1 and player-psychologist F4. My remaining contribution is that the fix must start from Gauntlet's purpose, not its payout. I withdraw the ask to "cut Draft Duel and Scrap Rush into a separate post-launch note" as worded. If the answer to F2 is "PvP is the product", those modes are the destination, and the PvE stage should be designed as their onramp.
- **F4: unchanged (MAJOR).** It is now backed by feasibility-lead F2, which shows the flagship hook doesn't fit the prototype map, and by systems-designer F4, which shows the prototype table is the one to keep.
- **F5: stays MINOR.** In my lane it is a cost and positioning issue. Systems-designer F5 rightly rates the same overlap MAJOR for its economy effects, and I defer to that rating for tuning purposes.
- **NEW N1. Durability is decorative but drives the death spiral. Cut it from the first version. Severity: MAJOR.** No pillar needs it. It is the shared cause behind systems-designer F3, player-psychologist F1 (BLOCKING) and adversarial-qa F4. It adds a repeatable sink to an economy with no numbers, and it needs persistent per-mech server state. Source: *Run rules*: "**Durability:** at the end of an excursion, a share of the damage taken (TBD%) becomes durability damage." *Economy*: "Repair durability damage | TBD | Yes". **Ask:** Remove durability from the first version, so the loss on death is just the scrap, which already carries the extraction tension. Reconsider it only once there is income data per run.
