# Systems Designer — Round 1

Scope: core loop, progression structure, pacing, difficulty curve, economy math for Metr0niks. Source: `gdd.md` (Oct 20, 2026, with Oct 22 prototype additions).

## F1 — Gauntlet lets you keep scrap with no risk, which breaks Excursion's risk/reward loop
**Severity: BLOCKING**

**Source:** *Run rules*: "**Gauntlet:** the same waves with no penalty for losing. You keep your scrap and take no damage that needs repair. Gauntlet doesn't progress your mech." *Garage and drop pods*: "Gauntlet has no such loss." *Run rules*: "**Progression:** mechs progress only in excursions."

**Problem:** The whole progression model runs on scrap, and the garage turns scrap into parts, upgrades and repairs. If Gauntlet scrap is kept and can be spent in the garage, Gauntlet is a no-risk farm: same waves, no durability damage, no loss on death. That makes it strictly better than Excursion, and the extract-or-lose-everything tension in the core loop goes away. If Gauntlet scrap can't be spent, "you keep your scrap" means nothing, and Gauntlet gives no reward at all. The document says both "keeps scrap" and "doesn't progress your mech" without saying which one it means. The core loop isn't defined until this is settled. Possible fixes: Gauntlet scrap is cosmetic or not banked, it goes into a separate pool, or it pays out at a heavy discount.

## F2 — The prototype's "campaign levels" and zones don't fit the 5-wave excursion structure
**Severity: MAJOR**

**Source:** *Run rules*: "**Waves:** each excursion is 5 waves. Bosses come on waves 3 and 5. This is the only place the wave structure is defined." *Zones (prototype, 22 Oct)*: "a campaign opens them one level at a time … the Underpass (level 1), the Freight Yard (opens on level 2) and Smelter Row (opens on level 3); from level 4 the whole sector is one battlefield … the camera returns before wave 1 begins. Both players watch the same shot."

**Problem:** The Zones section adds a second progression axis, campaign levels, that appears nowhere in Run rules, Game modes or Economy. Several things are left unanswered. Is a "level" an excursion? Does "wave 1 begins" mean each level restarts the 5-wave count? Is level progress saved, and is it lost on death the way scrap is? Do zones gate scrap hotspots (the highway transports) and therefore income? "Both mechs land" and "both players" also clash with the single-player scope ("1 vs AI"). Pacing over a full playthrough, meaning how the arena widens and the difficulty rises, now depends on a system the canonical rules section says doesn't exist.

## F3 — All-or-nothing scrap plus durability decay sets up a death spiral with no catch-up
**Severity: MAJOR**

**Source:** *Run rules*: "**Extract:** clearing wave 5 extracts you and banks your scrap. Leaving early counts as a loss." "**On death:** you lose all scrap from the match." "**Durability:** at the end of an excursion, a share of the damage taken (TBD%) becomes durability damage. It lowers max health, heat tolerance and other stats until you repair it in the garage." *Economy*: "Repair durability damage | TBD | Yes".

**Problem:** A failed run costs the player twice. They bank no scrap, and if durability applies on a death (the text only says "at the end of an excursion", which is ambiguous), their mech is also weaker for the next run, with no scrap to repair it. The weaker mech is more likely to die again. The only floor is "Starter mechs … free and can't be lost," which means falling back to the bottom of the power curve and doesn't help a damaged owned build recover. A 5-wave run has two bosses (waves 3 and 5) and no early-extract option, so the cost of failure grows the deeper you get. The document doesn't define a partial payout, a checkpoint after the wave-3 boss, or a repair floor. Durability %, repair cost and scrap income are all TBD, so nothing shows the loop recovers from failure.

## F4 — Part tradeoffs bypass the five-stat model they're supposed to feed
**Severity: MAJOR**

**Source:** *Overview* pillar: "Each part changes weight, heat or power, so building your mech changes how it moves and fights." *Mech building*: "Every part adds to five stats … Base values and formulas for each stat are TBD." *Parts list*: Ablative slag-plating "30% slower"; Bunker-buster "torso turns 25% slower"; Reactor "Sets speed and thrust time in the air"; Jump-jets "Each jump adds 40% heat". *Damage regions*: "A disabled weapon stops firing and its weight is removed, so the mech gets faster … Speed always follows weight."

**Problem:** The garage promises "every change shows its effect on the five stats," but most tradeoffs in the starting pool are flat percentage modifiers that skip Power/Armor/Speed/Weight/Heat. Slag-plating is "30% slower" rather than adding Weight, and the Reactor sets speed and air time while Speed is supposed to come from the Speed stat minus Weight. Only the Oct 22 prototype parts use stat deltas ("+14 speed", "weight -12", "Power +20"). As written, the stat model and the parts table run side by side instead of linking, so the pillar "every part is a tradeoff" can't be checked or tuned. The weight-removal rule also rewards losing an arm with more speed, and there's no stated counterweight. That works against the build-matters pillar unless it's tuned on purpose.

## F5 — Scrap sinks overlap, every value is TBD, and rarity is defined two different ways
**Severity: MAJOR**

**Source:** *Economy*: "Scrap is the only currency. All values are TBD." Sinks: "Buy a part (higher rarity costs more) | TBD per tier | No", "Stat upgrade | TBD per level | Yes", "Higher-tier weapon | TBD per tier | Yes". "Repairs and upgrades keep scrap useful once every part is owned." *Parts list*: "parts come in five tiers: white, green, blue, purple and orange" versus the prototype "rarity uses three tiers for now (common, rare, epic)" with prices 15–140.

**Problem:** Three sinks seem to buy the same thing: a part's rarity tier, a "higher-tier weapon", and a "stat upgrade". The document doesn't say whether a higher-tier weapon is a separate purchase from a higher-rarity part, or whether stat upgrades stack on a part or on the frame. That leaves no clear power-progression axis to pace against. No scrap source has a value, so nobody can estimate runs-to-next-part, or check whether the prototype's 140-scrap Cold-fusion cell takes 2 runs or 20 to earn. The long-term sink claim ("once every part is owned") rests on repeatable sinks whose costs and caps are undefined. A five-tier design and a three-tier prototype exist side by side with no mapping between them. Before any tuning, the document needs one rarity scheme, a distinct purpose for each sink, and at least target income per run.
