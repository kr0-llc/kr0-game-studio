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

## Round 2 — Cross-examination

I re-read the GDD to check each claim below. Quotes are from `gdd.md` unless marked otherwise.

### business-analyst

**Conflict: BA F1 says to freeze the zone work. I say keep it as a cost cutter.** BA F1 asks to "freeze the zone and campaign work and fold zone-opening into the Excursion wave structure." I agree about the campaign and the second player. The zone gating itself is one of the few prototype features that lowers technical risk. "A sealed zone is walled off by a blast shutter ... and nothing spawns there," and "Enemies, loaders, drop pods and sniper perches only use open zones." That shrinks the active area the collapse sim and AI navigation have to handle (my F2), and it gives a natural staging ground for player-psychologist F2's onboarding ramp. Cut the "both mechs" and "campaign" wording. Keep zones as the way an Excursion grows across waves.

**Conflict: BA F3 says to "give Gauntlet a reason to exist ... or cut it." On engineering cost, cutting it saves almost nothing.** Gauntlet is "the same waves with no penalty for losing," so it is the Excursion code with the penalties turned off. Its cost is entirely in economy design (see systems-designer F1 / adversarial-qa F1), not in building it. It is also the cheapest playtest harness the team will have. Fix its reward. Don't cut it as scope.

**Correction to BA F4.** BA says "Two later maps are designed in detail." Each later map is one table row ("Warehouses, cranes and raised slag vats" / "Open courtyard, four glass towers, an underground garage"). That is not detailed design, and BA counts them as "decorative content." **Connection:** BA has the category wrong, and the real risk is higher. Each later-map hook needs tech the first map doesn't. "Shoot vat chains to flood alleys with molten slag" needs a voxel fluid/flow system. "Towers lean and fall" needs large rigid-body tipping, not just pillar-and-beam support collapse. "Ambient heat makes energy weapons overheat 20% faster" needs a per-map modifier layer on a heat model that has no numbers yet. "Later" maps are later tech projects, and they belong in the cut list my F5 asked for.

**Connection: BA F2 + my F1 turns the online question into the first cut.** BA could find no business reason for "All play is online," and the GDD gives only "mechs ... are tied to the player's account." Combined with my F1, the always-online requirement is the most expensive line in the scope with no stated benefit. It is also the easiest to remove. Shipping offline-capable single-player with cloud-synced saves removes the server-authority, disconnect and backend work from the first version.

### player-psychologist

**Connection: PP F5 + my F2 point to scripted collapses.** PP F5 is right that the vignette hides "falling structures cast a shadow on the ground before they land." My lens adds a second problem. A shadow *before* landing means the game has to know the debris footprint before the fall resolves. Free physics debris can't promise that. A collapse that is precomputed, or authored per support group, can. The GDD's own readability pillar therefore pushes toward the fallback I raised in F2 ("scripted or authored break points only"). The team should commit to that early rather than discover it late. This also means the shadow has to draw over both the cutaway ("buildings ... cut away in a voxel cross-section") and the vignette. That is a render-ordering requirement nobody has specified.

**Connection: PP F1 (death spiral) + my F1 adds an unscheduled feature: excursion resume.** PP notes that players will read "disconnect = leaving early = lose everything." Because the game is always-online, the team can't leave this undefined. It has to either build mid-excursion reconnect and state recovery, or write a forgiveness rule. Reconnect for a match with live voxel destruction means snapshotting the destroyed-map state, which is the hardest state in the game to serialize. That is a concrete feature hiding inside my F1 omission, and another reason to drop the online requirement.

**Conflict: PP F2's suggestion to stage systems ("timing rings arrive in run 2") is good design, but the build has no gating to support it.** Nothing in the GDD lets a part or system be locked per run. Starter mechs and the garage are the only gates. Adding per-run feature unlocks is new progression work on top of an economy that is all TBD (my F3). The cheaper path is to use what exists. Give the starter loadout no ATB weapon (the starter part is the real-time "Minigun (starter)"), and let the first heavy-weapon purchase be the timing-ring tutorial.

### adversarial-qa

**Partial misread in QA F3.3 (soft-lock).** QA says that with both arms disabled "the player may have no damage source left." Two things weaken this. First, the shoulder slot has no damage region. The GDD lists only "left weapon, right weapon and legs," so a fitted siege mortar keeps firing (my F4 flagged that "pods explode if shot" implies a shoulder hit region that doesn't exist). Second, overheat "vents damaging steam," which is technically a damage source. The soft-lock is real only for shoulder-utility builds, and the steam vent is a degenerate escape that QA testing will find. I agree with the fix direction and would add one point. Whatever the team decides about a shoulder damage region also decides whether this soft-lock exists, so the two should be settled together.

**Connection: QA F1 (Gauntlet farm) + my F1 means the online model decides whether the exploit can be fixed.** If Gauntlet scrap is bankable and results are reported by the client, players will script or memory-edit the farm no matter what payout rate design picks. Either the server simulates or validates runs (which brings back the authority question in my F1), or Gauntlet scrap must not be bankable. In technical terms, that is the only fix that doesn't need server authority. This is a tiebreaker for systems-designer F1's options: an "is not banked" Gauntlet is the one the build can enforce cheaply.

**Agreement with a cost note on QA F5.** "Overclock ... speeds up the next ATB fill only" is a spec bug, not a tech risk. The rule QA proposes ("all fills during the 15 s are doubled") is also simpler to implement as a global fill multiplier.

### systems-designer

**Connection: SD F4 + my F3 means the garage preview can't be built as specified.** SD shows that many parts use flat percentages ("30% slower", "torso turns 25% slower", "Each jump adds 40% heat") instead of stat deltas. The garage promises "Every change shows its effect on the five stats before you confirm." A percentage on top of an unknown formula can't be shown as a delta on a stat card. Engineering needs a single modifier pipeline (additive stat deltas, then multipliers, in a fixed order) before the preview UI, durability ("lowers max health, heat tolerance and other stats") or mid-match weight removal can be built. Three features share that one unbuilt dependency, and none of them can start until it exists.

**Conflict on SD F2: zones are not just a pacing problem.** SD treats the campaign levels as a second progression axis to reconcile with Run rules. I agree, but the second axis is mostly a *persistence* question ("Is level progress saved?"). With accounts on a server, that becomes new backend schema. My recommendation is the same as for BA F1: zones open across waves inside one Excursion, nothing persists between runs, and that cost goes away.

### narrative-critic

**Misread in NC F2.** NC says "the first version's enemies are not mechs" and that "the 'upgraded one' doesn't exist." The boss is "an ultra-light sniper," which uses mech weight-class language. "Enemy mechs grab pods too" also names enemy mechs in the first-version pod rules. The prototype has already rewritten the mag-winch tradeoff to fit the bot roster ("A wall or a heavy loader reels you in instead"). The tension is smaller than claimed, but NC is right that the spec text still promises mech-vs-mech moments the roster doesn't deliver. **Connection:** from a build standpoint, the pile-bunker's "launches mechs through walls" and "Pulling a heavier mech" logic mostly have the boss as a target. That makes the rooftop-hopping boss the single most interdependent entity in the game: collapse, verticality aim, mag-winch "yanks a roof sniper off its perch", and AI navigation over "rooftops that may already have been destroyed" (my F5).

**Conflict on NC F4 (same boss twice).** NC wants wave 5 to "escalate" or wave 3 to get "a different encounter." A second boss is the most expensive asset in the roster, so I'd push back on that option. The cheap version is already in the systems: the wave-5 fight happens after more of the city has been destroyed, and with zones it can happen in a newly opened zone. The same AI then gets a different perch and different supports to break. I'd scope it as a behavior variant, not a new boss.

**Connection: NC F5's authored extraction beat is cheap.** The zone-open sequence already has a scripted sim-clock camera ("the camera leaves the mechs, pulls back ... the camera returns"). An extraction shot can reuse it, so the narrative ask costs very little.

### Revisions to my Round 1

- **F1: narrowed, severity unchanged (BLOCKING).** I wrote "Either way the team has to build networked, synchronized voxel destruction." That overstates it. Synchronized destruction is needed only if the two-player prototype ships. A 1-vs-AI online game needs accounts, a backend, result validation and disconnect/resume handling. That is still blocking (see PP F1 and QA F1 above), but it is a different and cheaper problem. The decision is now two separate questions: (a) co-op in the first version, yes or no; (b) online required, yes or no. With BA F2, I recommend no on both.
- **F2: upgraded in specificity.** I now recommend authored or precomputed collapse groups as the baseline, not a fallback, because the "Readable danger" shadow requires knowing the footprint in advance (see the PP F5 connection).
- **F3: unchanged at MAJOR, but now the root cause of other findings.** The Gauntlet-farm and death-spiral findings (SD F1/F3, PP F1, QA F1/F4) can't be closed without numbers. I'd add a modifier-pipeline spec (SD F4 connection) as a required deliverable alongside the base values.
- **F4: extended.** Add SD F4's stat-delta vs. percentage split to the list of spec/prototype divergences.
- **F5: extended.** Add later-map tech (slag flow, tower tipping, ambient heat) to the cut list, and add excursion resume and onboarding as currently unscheduled features. Proposed MVP line for the first version: one map with zones opening by wave; offline-capable single-player; about 10 parts on one rarity scheme; authored collapse groups; one boss with a wave-5 behavior variant. Defer: co-op and campaign persistence, five-tier rarity, stat upgrades as a separate sink, and the later maps.
