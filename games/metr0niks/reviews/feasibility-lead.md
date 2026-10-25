# Technical Feasibility Lead — Round 1

Scope of review: whether Metr0niks can be built as written, judged against a 2026 PC production. The document dates itself Oct 20, 2026, with prototype notes from Oct 22, 2026. Nowhere does it state team size, schedule, engine, or a cut list. Every finding below is grounded in that text.

## F1. The game is "online-only, no multiplayer," but the prototype is already a two-player networked sim, and the document never specifies the netcode

- **Problem:** The scope requires a server-backed, always-online game. The non-goals rule out multiplayer, yet the prototype section describes two player mechs sharing one simulation clock. Either way the team has to build networked, synchronized voxel destruction, the most expensive kind of netcode, and the document gives no authority model, server architecture, determinism strategy, or bandwidth budget. Accounts and server-side progression are also required before a single-player loop can ship.
- **Passages:**
  - *Overview → Scope:* "single-player Excursion and Gauntlet first ... All play is online; multiplayer comes later."
  - *Overview → Non-goals:* "no multiplayer"
  - *Run rules → Progression:* "mechs progress only in excursions and are tied to the player's account."
  - *Maps → Zones (prototype, 22 Oct):* "both mechs land ... Both players watch the same shot because it runs on the simulation clock."
- **Omission:** The document does not say what "online" means for a 1-vs-AI mode (who is authoritative, what happens on disconnect mid-excursion when death costs all scrap), or how collapses are kept in sync across clients.
- **Severity:** BLOCKING. This decision shapes the whole architecture and has to be settled before any other system is built.

## F2. Structural voxel collapse is the headline tech and has no technical spec, performance budget, or scale that fits the prototype map

- **Problem:** Three pillars and most of the combat depend on real-time support-graph collapse: falling debris, collapse damage, buried pods and scrap, terrain reshaping, a camera cutaway through voxel buildings, and AI that deliberately breaks supports and paths through rubble that keeps changing. None of these has a stated algorithm, voxel resolution, debris limit, or frame budget. The scale numbers also conflict. The flagship map hook needs 40 m of road, but the prototype map is too small for a 15 m minimum range.
- **Passages:**
  - *Destruction and environment:* "anything resting on something else can fall" and "Break enough supports and everything above collapses."
  - *Maps (table):* "Break two pillars in a row and 40 m of road falls on everyone below"
  - *Parts list → In the prototype:* "a 4 m minimum range (the 32-cell map is too small for 15 m)"
  - *Enemies and AI → Collapses:* "enemies break supports on purpose to drop structures on the player."
  - *Controls and camera → Cutaway:* "buildings between the camera and your mech cut away in a voxel cross-section"
- **Omission:** There is no voxel size, no maximum number of simultaneously falling bodies, no plan for AI navigation over terrain that changes every match, and no fallback if full collapse simulation proves too costly (for example, scripted or authored break points only).
- **Severity:** BLOCKING. If the collapse system fails or has to be scripted, "The city is a weapon" and the Overpass Sector 4 hook fail with it.

## F3. Every core number is TBD, but several systems are specified as depending on them

- **Problem:** Stat formulas, timing windows, heat values, and the whole economy are unset. Systems that need those numbers are still described as finished: the garage's stat-delta preview, durability, the accessibility "widen Perfect window" option, the enemy pod-grab rule (based on armor percentage), and pile-bunker double scrap. Power drives both damage and ATB fill speed, so one stat formula feeds both the real-time layer and the ATB layer, which makes tuning tightly coupled. None of these systems can be balanced or tested until the base numbers exist.
- **Passages:**
  - *Mech building:* "Base values and formulas for each stat are TBD."
  - *Combat → Tunables:* "Perfect window | TBD", "Good window | TBD", "Heat per light shot | TBD", "Heat drain per second | TBD"
  - *Economy:* "Scrap is the only currency. All values are TBD."
  - *Overview → Accessibility:* "options to widen the Perfect timing window ... Window sizes are TBD."
  - *Run rules → Durability:* "a share of the damage taken (TBD%) becomes durability damage."
  - *Mech building (stat table):* "Power | Weapon damage and how fast ATB bars fill"
- **Severity:** MAJOR. The systems can be built, but none can be validated, and the meta-loop (die → lose all scrap → repair durability → upgrade) cannot be judged feasible or fun until the economy has numbers.

## F4. The spec and the prototype have already diverged, and there is no single source of truth

- **Problem:** Two days after the spec, the prototype contradicts it on part count, rarity tiers, firing models, and run structure. The prototype adds a campaign/level/zone layer that the spec says does not exist. A team building from this document cannot tell which version is authoritative, which is a classic source of rework.
- **Passages:**
  - *Parts list:* "The starting pool is twelve parts." vs. *In the prototype:* "the garage sells 21 parts"
  - *Parts list → Rarity:* "five tiers: white, green, blue, purple and orange" vs. "rarity uses three tiers for now (common, rare, epic)"
  - *Parts list:* the mag-winch "fires on the left arm's ATB bar and timing ring rather than in real time", and the siege mortar becomes "a Q-key shoulder active". Both change how they interact with the "only one timing ring runs at a time" rule in *Combat → Edge cases*.
  - *Run rules → Waves:* "This is the only place the wave structure is defined." vs. *Maps → Zones:* "a campaign opens them one level at a time ... from level 4 the whole sector is one battlefield ... before wave 1 begins."
  - *Mech building:* the mech has "three regions: left weapon, right weapon and legs", with no damage region for the shoulder, core, or reactor slots, even though the shoulder mortar's "pods explode if shot".
- **Severity:** MAJOR.

## F5. No team size, timeline, milestones, or cut list, and the feature list is broad for one map and one mode pair

- **Problem:** The document lists many separate systems for its "first version": dual-layer real-time/ATB combat with per-weapon timing rings, a twin-stick split torso/legs controller, six-slot modular mechs with five interacting stats, mid-match regional disabling, between-match durability, five (or three) rarity tiers, drop pods contested by AI, structural destruction, three enemy types plus a rooftop-hopping boss, a zone-reveal camera sequence, and online accounts. It also names two more maps and two PvP modes. It never says who builds this or by when, and it gives no priority order for what goes first if time runs short. "Later" is not a cut list.
- **Passages:**
  - Document header: "Oct 20, 2026 · @kr0". This is the only staffing information given.
  - *Maps:* "Overpass Sector 4 is the first map; the other two come later."
  - *Game modes:* "Draft Duel ... After single-player" and "Scrap Rush ... After single-player"
  - *Enemies and AI:* "an ultra-light sniper that jumps across rooftops". This boss needs navigation across rooftops that may already have been destroyed.
- **Omission:** There is no MVP line inside the first version. For example, the document never says whether durability, damage regions, or rarity tiers can be deferred, and it gives no fallback if the online requirement or collapse simulation slips.
- **Severity:** MAJOR.
