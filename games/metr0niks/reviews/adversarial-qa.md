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
