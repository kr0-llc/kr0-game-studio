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
