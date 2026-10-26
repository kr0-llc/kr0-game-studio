# Adversarial QA — Round 1

Reviewed: Metr0niks GDD (Oct 20, 2026, with Oct 22 prototype additions).

## F1. Gauntlet is a risk-free scrap farm that contradicts "progress only in excursions"

**Severity: BLOCKING**

**Problem.** Gauntlet lets you keep your scrap, takes no durability damage, and has no loss penalty. Scrap is the only currency, and you spend it in the garage on parts, stat upgrades and higher-tier weapons. So Gauntlet does progress your mech, just one step removed. A rational player will farm Gauntlet and never take on Excursion's risk. That guts the extract-or-lose tension the core loop is built on. The document also never says whether Gauntlet scrap is banked to the account or how much a Gauntlet run pays.

**Source.**
- Run rules: "**Gauntlet:** the same waves with no penalty for losing. You keep your scrap and take no damage that needs repair. Gauntlet doesn't progress your mech."
- Run rules: "**Progression:** mechs progress only in excursions and are tied to the player's account."
- Garage: "In an excursion, scrap only counts once you extract ... Gauntlet has no such loss."
- Garage: "Spend scrap on parts, stat upgrades, higher-tier weapons and repairs".

**Fix direction.** Choose one. Gauntlet pays no bankable scrap, or it pays at a sharply reduced rate. Then reword "doesn't progress your mech" so it matches.

## F2. The Zones section contradicts the scope, the non-goals and the "only place" wave definition

**Severity: MAJOR**

**Problem.** The prototype Zones section brings in a multi-level "campaign", "both mechs" landing, and "both players" watching the same shot. The first version, though, is single-player and has no multiplayer. The section also opens with "wave 1" for each level. Run rules say a match is a single 5-wave excursion and claim to be the only place the wave structure is defined. Several things are left undefined. What is a level? Does campaign progress survive death, which wipes the match's scrap? Is a level one excursion or several? Does Gauntlet use zones? Where do the wave 3 boss and the "sniper perches" go when the zone they need is still sealed?

**Source.**
- Zones (prototype, 22 Oct): "a campaign opens them one level at a time ... from level 4 the whole sector is one battlefield."
- Zones: "both mechs land ... Both players watch the same shot because it runs on the simulation clock."
- Run rules: "**Waves:** each excursion is 5 waves. Bosses come on waves 3 and 5. This is the only place the wave structure is defined."
- Overview: "**Non-goals (first version):** no multiplayer".

**Fix direction.** Define "campaign" and "level" in Run rules. Spell out how they relate to excursions and death. Either remove the two-player wording or move it to the post-single-player modes.

## F3. Losing weapon regions makes you faster, and losing both arms is an unwinnable soft-lock

**Severity: MAJOR**

**Problem.**
1. **Exploit.** A disabled weapon's weight is removed, so the mech gets faster. A player can fit a heavy ATB weapon as ballast for the fight and then let it get shot off for a speed boost. That breaks the "every part is a tradeoff" pillar.
2. **Ambiguity.** The text doesn't say whether disabled legs also drop their weight. If they do, "speed always follows weight" pushes the speed up while "impair movement" pushes it down.
3. **Soft-lock.** If both arm regions are disabled, the player may have no damage source left. Shoulder slots can hold a non-weapon part such as the heatsink or salvage magnet. The waves can't be cleared, and "leaving early counts as a loss". The player's only options are to wait to be killed or to quit, and both wipe the match's scrap.
4. **Disconnects.** All play is online, but the document never says whether a disconnect counts as leaving early.

**Source.**
- Mech building: "A disabled weapon stops firing and its weight is removed, so the mech gets faster; disabled legs impair movement. Speed always follows weight."
- Mech building: "the mech has three regions: left weapon, right weapon and legs. A region that takes enough damage is disabled for the rest of the match."
- Run rules: "Leaving early counts as a loss."
- Overview: "All play is online".

**Fix direction.** Keep a disabled weapon as dead weight, or cap the speed gain. Add a fallback damage source, such as a melee/ram or a self-destruct that banks part of the scrap. Define what happens on a disconnect.

## F4. Durability plus the scrap wipe on death creates a death spiral that the "always deploy" guarantee doesn't cover

**Severity: MAJOR**

**Problem.** Durability damage lowers max health and heat tolerance until you pay to repair it. A losing player keeps no scrap, so they can't repair. They redeploy weaker, are more likely to die, and earn nothing again. Starter mechs are "free and can't be lost", but the document doesn't say whether durability damage applies to them, or whether it applies on death at all ("at the end of an excursion" could mean extracts only). A player with 0 scrap and a degraded mech can deploy but may be unable to win. The only escape is Gauntlet scrap (see F1), which is meant not to progress you.

**Source.**
- Run rules: "**Durability:** at the end of an excursion, a share of the damage taken (TBD%) becomes durability damage. It lowers max health, heat tolerance and other stats until you repair it in the garage."
- Run rules: "**On death:** you lose all scrap from the match."
- Run rules: "**Starter mechs:** basic loadouts that are free and can't be lost, so a player with 0 scrap can always deploy."

**Fix direction.** State whether durability applies on death and to starter mechs. Add a floor, such as free repair of starter mechs or a minimum stat level.

## F5. Combat timing rules contradict each other (Overclock, overheat during a ring)

**Severity: MINOR**

**Problem.**
1. Overclock lasts 15 s and makes ATB bars fill twice as fast. The edge case says that if a ring is running when Overclock is picked up, it "speeds up the next ATB fill only". With the 6 s base fill, a 15 s window covers about 5 doubled fills, so the "next fill only" rule either cuts the pod short or reads ambiguously.
2. Overheat during a ring "counts as a Miss", and a Miss costs "Full cost" heat. The mech is already at 100% heat, so it's undefined whether the extra heat lengthens the 3 s lockout or wraps into another overheat.
3. The Heat column reads "Normal" for Perfect/Good and "Full cost" for a Miss, which suggests Normal is a discount, but "Normal" is never defined.

**Source.**
- Drop pods: "Overclock | ATB bars fill twice as fast for 15 s".
- Drop pods, Edge cases: "**Overclock during a running ring:** speeds up the next ATB fill only; the ring's timing doesn't change."
- Combat, Edge cases: "**Overheat during a ring:** the ring cancels and counts as a Miss."
- Combat, timing table: "Miss or ring closes | 50% | Reduced | Full cost".
- Combat, Tunables: "ATB base fill time | 6 s (TBD)".

**Fix direction.** Reword the Overclock edge case as "the running ring is unaffected; all fills during the 15 s are doubled". Specify that a Miss caused by overheating adds no further heat. Define "Normal" heat against "Full cost".

## Round 2 — Cross-examination

I read all five colleague reviews and re-checked their quotes against the Metr0niks GDD. Below, "QA Fn" means my Round 1 findings.

### Conflicts

**C1. player-psychologist F4 offers a reading of "You keep your scrap" that the GDD doesn't support, which leaves QA F1 at BLOCKING.** The psychologist says the phrase "might mean Gauntlet *earns* scrap you keep, or only that it doesn't take away scrap you already banked." The second reading doesn't hold up. Excursion never takes banked scrap either: "**On death:** you lose all scrap from the match. Parts you own are never lost." The only loss Gauntlet could be waiving is the loss of *match* scrap. The garage section says so outright: "In an excursion, scrap only counts once you extract; if your mech dies, you lose all the scrap from that match. Gauntlet has no such loss." So Gauntlet scrap is earned and kept. systems-designer F1 frames it as two readings to choose between, but the text has already chosen. As written, Gauntlet is a risk-free farm, and "doesn't progress your mech" is the sentence that has to change.

**C2. The psychologist's fixes would open new exploits unless they come with limits.**
- *player-psychologist F4, "a small scrap payout" for Gauntlet:* any risk-free payout beats Excursion once its scrap per minute exceeds Excursion's risk-adjusted rate. That rate has to account for loss on death and durability repair costs. So the payout must be capped below that line, or paid in a separate currency that the garage's power sinks don't accept. "Small" isn't a design value. The ceiling is.
- *player-psychologist F3, "Make a Miss cost the same heat as a hit, or less":* I support "the same", which also settles QA F5.3. I oppose "or less". "Miss or ring closes" requires no input at all. If a Miss is cheaper on heat, letting the ring close becomes a low-heat fire mode. And since "Overheat during a ring … counts as a Miss", overheating mid-ring would get a heat discount. A deliberate failure should never cost less than a success.
- *player-psychologist F1 and systems-designer F3, "a partial bank point after the wave-3 boss":* this creates a **suicide-farm loop**. If scrap banks at wave 3 and later deaths keep it, the best route becomes clearing waves 1 to 3 and then dying, whenever that's faster than finishing waves 4 and 5. QA F3's both-arms soft-lock already gives a player a reason to want to die. A bank point turns that into a strategy. If the board adopts a bank point, it should be an **opt-in extract** at wave 3 that pays out at a lower rate than finishing, never an automatic checkpoint. This also gives narrative-critic F5 the "extract" beat the player actually plays, which it asks for.

**C3. business-analyst F2's suggestion to ship single-player offline-capable widens the exploit surface.** Account-bound progression ("mechs progress only in excursions and are tied to the player's account") is the only thing that makes the scrap economy trustworthy. Scrap Rush, listed for after single-player, is "1v1 or 2v2 plus AI", and nothing says owned mechs and parts are kept out of it. An offline client that can mint scrap would carry edited saves straight into PvP. Offline play is fine only if offline progression is quarantined from any future PvP account. The board should state that as a requirement, not leave it as a tradeoff.

**C4. business-analyst F3 misreads Draft Duel.** BA says Draft Duel "resets scrap each round" and that the PvP modes don't use "the garage, durability or extraction loss." The GDD says only "both see each other's buys and get new scrap between rounds". "Get new scrap" doesn't mean reset, since it could add to what you have, and the document says nothing at all about whether the PvP modes use the garage. The underlying point, that these modes have no economy spec, stands. The specific claims go further than the text.

**C5. player-psychologist F2 calls the mouse mapping "crossed over". I disagree.** "Left mouse button | Right arm weapon" is the mech-genre convention: the dominant hand's button drives the right arm. That isn't the friction point. The friction point is that the prototype mag-winch is an ATB weapon on "Arm-L", so its timing ring is on press-and-hold *right* mouse. If the player also has a heavy weapon on the right arm, both timing rings are mouse holds and only one can run at a time (Combat edge case). The psychologist's request for "queued" feedback matters most for exactly this build.

### Connections

**X1. A Bulldozer-treads mech can't survive a collapse it was promised it could escape** (feasibility-lead F2 + player-psychologist F5 + QA F3). Every collapse safeguard in the GDD assumes a dash: "falling structures cast a shadow on the ground before they land, so players can dash clear" and "The falling shadow gives the player time to dash clear." The Bulldozer siege treads say "No dash; turning in place takes twice as long". Disabled legs also "impair movement" by a TBD amount. Then stack the map hook ("40 m of road falls on everyone below"), AI that breaks supports "on purpose to drop structures on the player", and the low-health edge darkness that the psychologist notes hides the shadow. Together that is an **unplanned, unavoidable death** for one legitimate build, and for any mech whose legs are disabled. It also fails the "Every part is a tradeoff" pillar, because the trade is death and not a cost. Fix: make the shadow lead time scale with the slowest legal escape speed, or exempt treads from collapse damage (they "crush rubble"), and always draw shadows on top of the vignette.

**X2. Auto-extract can swallow the boss's scrap** (narrative-critic F5 + Economy). Narrative-critic says extraction is "an automatic result of clearing wave 5". Economy says "Scrap dropped as cubes must be picked up." If extraction fires the moment wave 5 clears, the wave-5 boss's scrap cubes, the biggest drop of the run, are never picked up. The order is also undefined when the player kills the boss and dies in the same moment, for example by dropping a road on both of them, or by taking overheat steam damage ("it vents damaging steam") after the killing shot. Is that an extract or a death? Under all-or-nothing scrap, that one tie-break decides whether the whole run pays out. Fix: a short pickup or extract window after wave 5, and an explicit rule that a boss kill resolves before the player's death in the same tick.

**X3. Damage regions only cover the arms and legs, so the soft-lock depends on the build** (feasibility-lead F4 + QA F3). Feasibility notes there are no shoulder, core or reactor regions, even though the mortar's "pods explode if shot". So a shoulder *weapon* can never be disabled, while a shoulder *heatsink or salvage magnet* leaves nothing to fall back on. The QA F3 soft-lock (both arms disabled, no damage left to deal) therefore hits only builds that took the non-weapon shoulder option. Players are punished for a choice the garage presents as an ordinary tradeoff. Also, "pods explode if shot" with no region and no damage value means the mortar has a failure state the stat model can't describe.

**X4. The Cryo flash-vent breaks the overheat rules that the psychologist's death spiral depends on** (player-psychologist F3 + feasibility-lead F4). The prototype part "dumps all heat, even during a lockout". Overheat is defined as "weapons and thrusters shut down for 3 seconds". Does venting end the lockout, or does the mech sit at 0 heat and still locked out? If it ends the lockout, the "3 s" tunable is optional for any shoulder build with a 10 s recharge, and stacking the Coolant flood pod makes heat irrelevant for long stretches. If it doesn't, the part's headline line is false. Either way, the miss, heat, overheat loop in player-psychologist F3 plays out completely differently depending on the shoulder slot. That needs a sentence in Combat's Edge cases.

**X5. The camera zoom also sets weapon range and boss visibility** (player-psychologist F5). The psychologist treats the build-based zoom ("light builds see more") as an information problem. It's a range problem too. The prototype mortar "lobs two arcing shells onto the cursor", so its maximum range is the visible screen, and heavy builds get a shorter mortar. The boss is "an ultra-light sniper that jumps across rooftops". If a perch sits outside a heavy build's view, that player can't aim at the boss at all, which is an unwinnable wave 3 or wave 5. Fix: either guarantee every sniper perch is visible at the tightest zoom, or add an off-screen threat indicator that can also be targeted.

**X6. Pods race against enemy mechs that the roster doesn't contain** (narrative-critic F2 + Drop pod rule). Narrative-critic is right that "Enemy mechs grab pods too" has no mechs to grab pods. The AI rule ("an enemy goes for a pod when the pod is closer than the player, or when its own armor is below 50%") therefore applies to bots, loaders and the boss. If it applies to the boss, then baiting it with a pod pulls the "ultra-light sniper" off its perch at under 50% armor. That could be a degenerate boss strategy, or a boss heal ("Field repair | Restore 40% armor") that drags out the fight. Either way it's unplanned. The rule needs an explicit list of which enemies it covers.

**X7. During the zone reveal, the camera leaves the player's mech, and nothing says whether input is live** (feasibility-lead F1 + QA F2). "both mechs land, nothing spawns for 5.5 s, the camera leaves the mechs" and it "runs on the simulation clock". If the player can drive or fire while the camera is elsewhere, they can pre-position for the first pod or wander into a collapse with no view. If they can't, then on a networked sim clock a lag spike can eat the start of wave 1. The GDD should say input is locked and the mech can't be damaged for the whole shot.

**X8. "Same frame" means nothing online** (feasibility-lead F1). The pod tie-break ("**Player and enemy touch a pod in the same frame:** the player gets it (proposed)") assumes a single local frame. Feasibility is right that the GDD names no authority model. Under a server tick the rule needs to read "same server tick". Otherwise latency decides pod races and the "player wins ties" promise breaks unpredictably.

### Revisions to my Round 1

- **QA F1: stays BLOCKING, and the argument is stronger.** See C1. The text already says Gauntlet scrap is earned. What's left is a decision, not a clarification.
- **QA F2: upgraded from MAJOR to BLOCKING.** Business-analyst F1, narrative-critic F1 and feasibility-lead F1 make it clear the zones section isn't loose wording. A two-player, simulation-clock campaign has already been built. My edge cases (where the wave-3 boss and sniper perches go in a level-1 sector, what happens on death) can't even be tested until someone decides whether a level is an excursion.
- **QA F3: stays MAJOR, scope widened.** Add the treads/no-dash collapse death (X1) and the build-dependent soft-lock (X3). I'm keeping the speed-ballast exploit, but systems-designer F4 is right that most starter tradeoffs are flat percentages ("30% slower", "torso turns 25% slower") that sit outside the Weight stat. The exploit's size depends on whether those percentages stack with weight-based speed, and the GDD doesn't say. So that sub-point becomes "exploit or no-op, depending on an undefined formula".
- **QA F4: kept, and should be merged.** systems-designer F3 and player-psychologist F1 cover the same death spiral. The board should consolidate it into one finding. My distinct contribution is the open question of whether starter mechs take durability damage. That is still unanswered, and it decides whether a floor exists at all.
- **QA F5.1: downgraded to a wording fix.** On re-reading, "speeds up the next ATB fill only" can fairly be read as applying to the weapon whose ring is running, since its bar is full, rather than as capping the whole 15 s effect. It's ambiguous, not contradictory. F5.2 and F5.3 stand, and X4 adds a new heat-rule gap.
- **New, MAJOR:** X1 (treads plus collapse means unavoidable death) and X2 (auto-extract and the extract-versus-death tie-break). Both are unplanned fail states inside the core loop.
