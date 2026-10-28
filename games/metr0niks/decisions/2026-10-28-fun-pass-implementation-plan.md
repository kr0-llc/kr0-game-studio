# Metr0niks fun pass implementation plan

Oct 28, 2026 · technical-director, for kr0 · Approved rules: GDD-D35 to GDD-D55 (kr0, Oct 28) · Architecture: [TDD](../tdd.md), TDD-D9 to TDD-D17

kr0 approved the fun pass GDD on Oct 28 and asked for an implementation plan. This plan says how to build it into `simulations/sim.js` and the voxel prototype (`prototypes/prototype.html`): in what order, what each step changes and how we know it works. The rules come from the [GDD](../gdd.md); the line-level list of changes is in [prototype changes](../prototypes/prototype-changes.md) sections 2 to 15 and 19. Nothing here changes a rule.

## Ground rules

- **Rules go into `sim.js` first** (GDD-D32). The prototype only draws them and sends input. The ink prototype is paused (GDD-D46) and isn't updated.
- **Every number is a key in `T`.** The numbers in the GDD are starting values for the sweep, so nothing may be hard-coded.
- **The sim stays deterministic.** All randomness comes from the sim's seeded stream, presentation (hit-stop, stamps, camera punch) never touches `sim.step()`, and co-op stays host-authoritative.
- **Each phase is one pull request** that leaves the game playable, with a passing headless check (`node simulations/rules-check.js`, added in phase 0) and new mechanics lab tests where a mechanic can be tested alone.
- **`map-check.js` keeps passing.** The map belongs to the level design work; this plan only adds the slag spill rule to the props it placed.
- **Old prototype changes come first where the fun pass needs them.** Sections 2, 10, 11, 13 and 14 of prototype changes (wear, weapon upgrades, victory, the seed, the save on death) aren't built yet. They are folded into the phases below instead of being done separately.

## Phases

| Phase | What it delivers | Depends on | Size |
| --- | --- | --- | --- |
| 0. Harness | Headless runner, scripted player, replay hash check, rules check, per-run tuning overrides | — | M |
| 1. Hit pipeline and combat | One damage path (GDD-D48), kill credit, combo and stagger, multi-kills, match stats record | 0 | M |
| 2. Campaign and save | 5 levels and victory, a seed per climb, the climb plan, save v2, wear, upgrades, repair | 0 | M |
| 3. Match flow | Contracts, sector conditions, Overtime, wave report and excursion report, host leaving ends the room | 1, 2 | L |
| 4. Zone enemies | Scuttler, Bulwark, Wrecker, Elites and the zone threats table | 1 | M |
| 5. City hazards | Scaled collapse damage, collapse kill credit, demolition bonus, slag spill, CRUSHED | 1 | S |
| 6. Parts, pods and garage | Six blueprint parts with the Redline vent, two new pods and odds, call-ins, next level preview, records | 1, 2 | L |
| 7. Bosses | Boss roster, Sniper pair, Juggernaut, the Warden | 1, 3, 4 | L |
| 8. Feel and audio | Hit-stop, stamps, callouts, multi-kill text, cockpit voice, new sounds and music | 1 to 7 | M |
| 9. Sweep | The fun pass sweep questions in the tuning history, then kr0 sets targets | 0 to 7 | M |

Sizes are relative: S is a day or two of focused work, M about a week, L more. Phases 4, 5 and 6 can run in parallel once 1 and 2 are in. Phase 7 is the riskiest and goes after the systems it reuses.

## Phase 0: harness

**Done Oct 28** (PR after #13): `create({tune})`, `sim.stateHash()` and `sim.tuneHash()` in `sim.js`; `simulations/pilot.js`, `simulations/run.js` and `simulations/rules-check.js` (23 cases). 100 level-1 runs take about 30 s and the replay check passes. The baseline is in the [tuning history](../tuning-history.md).

Without a runner, none of the fun pass numbers can be swept, and the studio standard requires one before the first tuning change ([simulation and tuning](../../../studio/simulation-and-tuning.md)).

- **Tuning overrides per run (TDD-D11):** `create({tune})` deep-merges an override object over a copy of `MetroSim.T` and uses that copy for the whole run. Sector conditions (phase 3) and sweep variants both use it. `MetroSim.T` stays the shared default and is never mutated.
- **Runner (TDD-D17):** `simulations/run.js` plays whole excursions in Node from a campaign, a seed list and an override file, and writes one metrics record per run to `tuning-runs/`. The record is the GDD-D50 stats record from phase 1, plus the result, level, ticks and a state hash.
- **Scripted player:** drives `setInput` with simple goals (fight the nearest enemy, take pods, keep moving, release the ring at a set accuracy: always Perfect, a 70/25/5 mix, or random), so a run needs no human. Two of them for co-op runs.
- **Replay check:** the runner replays one run per batch from its seed and input log and compares state hashes. A mismatch fails the batch.
- **Rules check:** `simulations/rules-check.js`, like `map-check.js`: short scripted scenarios that assert a rule (for example "a Perfect on a bot staggers it for 60 ticks"). Each later phase adds its cases here.

Done when: 100 level-1 runs on paired seeds finish headless, the replay check passes, and the record matches what the prototype shows for the same seed.

## Phase 1: hit pipeline and combat

**Done Oct 28:** `hitEnemy` and `hitMech` in `sim.js` carry every hit; kill credit, combo, stagger, the scrap combine rule, multi-kills and the `stats[mech][wave]` record are in, with the `cb`, `sg`, `mk`, `x` and `w` events. The rules check has 33 more cases (56 in all). The prototype HUD doesn't show the combo or stagger yet; that comes with phase 8 (feel). Level-1 solo extracts rose from 21% to 26% with the same pilot, mostly from stagger.

Today 13 call sites call `damage(e, dmg, …)` directly, each applying power its own way. The fun pass needs one order for every hit and someone to credit each kill.

- **One hit path (TDD-D9):** `hitEnemy(src, target, base, info)` applies the GDD-D48 order (shield check, power, upgrade, grade, stagger, armor resistance, one rounding) and `hitMech(target, base, info)` applies level scaling and the Elite bonus. Every weapon, blast, collapse, pod strike and enemy attack goes through one of them. `info` carries the source kind (light, heavy, shoulder, collapse, hazard, pod, enemy) for stats and credit.
- **Kill credit:** each enemy keeps `{by, at}`, the last mech that hit it and the tick. A kill is credited if `at` is within `T.credit.window` (3 s). Clusters and hazard events carry the mech that broke the chunk, or nobody for events an enemy started (phase 5 fills these in).
- **Combo and stagger:** per-mech combo from ×1 to ×4 (`T.combo`), raised by a Perfect, held by a Good, dropped by a Miss, a closed or cancelled ring, or 12 s without a heavy shot. Stagger is an enemy timer that stops movement, firing, charges and jumps, cancels a tell and adds 50% damage taken; a new Perfect restarts it.
- **Scrap on a kill:** one `killScrap(enemy, credit)` that applies the GDD's combine rule (level scale, Perfect pile-bunker ×2, Overtime ×1.5, Elite ×1.5, then the combo and demolition percentages added). Every kill uses it.
- **Multi-kills:** per-mech count of credited kills within 1.5 s or in one event; an event when it reaches 2, 3, 4 and 5 or more.
- **Stats record (TDD-D13):** the sim keeps `stats[mech][wave]` with every GDD-D50 counter and sends a wave's stats in a new wave-clear event, and the whole record in the run-over event's detail.
- **Events:** combo step and break, stagger, multi-kill, grade.

Done when: the rules check covers each step of the damage order, credit after 2.9 s and after 3.1 s, combo rise, hold and drop, stagger restart, and the scrap formula with every bonus stacked; the lab shows combo and stagger on dummies.

## Phase 2: campaign and save

**Done Oct 28:** `T.level.max` 5 with a `victory` end state; save v2 with v1 migration; wear, repair and Mk upgrades (applied through phase 1's hit path); `Campaign.plan` with the condition, contract and bosses per level; the in-match mark; the garage's repair, upgrade, next-level panel and seed box; a victory screen and the records line. 66 rules-check cases. Not yet: the call-in shop and "New" marks (phase 6), showing the plan to a co-op guest, and the room server's v2 fields (TDD-D21).

- **Five levels and victory:** `T.level.max = 5`; extracting level 5 ends the campaign with a victory event, and the victory button starts a new climb (prototype changes section 11, changed from level 50).
- **A seed per climb (GDD-D49):** a new campaign, a death and a victory restart draw a new random seed from the browser (outside the sim, which stays seeded). A typed seed at level 1 is kept for that climb only.
- **The climb plan (TDD-D10):** `Campaign.plan(c)` derives, from the climb seed alone, each level's sector condition, contract and wave-3 and wave-5 bosses, with no repeats inside a climb, level 1's mild conditions and the sniper on level 1 wave 3. It uses its own seeded stream, not the level's, so in-match randomness never changes the plan, and the garage can show the next level before the match exists. The plan is worked out again on load and never saved.
- **Save v2 (TDD-D12):** adds per-part wear, per-weapon upgrade levels, the highest level ever extracted, lifetime records, whether the seed was typed, the two call-in slots and the in-match mark. A v1 code loads with no wear, no upgrades, the highest level set to its current level and empty records.
- **Wear, repair and upgrades:** prototype changes sections 2 and 10, as the GDD's Durability and Weapon upgrades sections say, including the one Repair button in slot order (GDD-D28).
- **Death and leaving save at once:** prototype changes section 14 (the in-match mark, TDD-D8).

Done when: the rules check covers v1 to v2 migration, rejected bad codes, the plan being the same for the same seed and different for different seeds, and no repeats in a climb.

## Phase 3: match flow

- **Contracts (GDD-D38):** a table of ten, each a check over the phase 1 stats record and events (for example Crush reads the most kills from one collapse), with the not-drawable rules (Clean sweep under Cold front; Eviction without a sniper boss; Crush and Bring it down where the open zones have no span) applied when the plan is drawn. Completing one adds `T.contract.scrap` × the level scale to the completing mech's match scrap (each living mech in co-op) and emits an event; the HUD shows progress.
- **Sector conditions (GDD-D39):** nine conditions, each a tuning override (phase 0) plus a few flags the sim reads: Blackout's sight cut and the renderer's night look, Sniper's nest's extra sniper per boss wave, Pod rain's pod-seeking bots, Loose pillars' pre-damaged lowest chunks.
- **Overtime (GDD-D37):** after wave 5 the run goes into a `choose` state for 6 s (`T.overtime.choose`). New input bits: F calls Overtime (the host only in co-op), Enter or R extracts, and no choice extracts. Overtime builds wave 4 plus one loader through the zone threats table, multiplies drops by 1.5 while it runs, and extracts automatically when cleared. Calling it runs the revive check.
- **Screens:** the wave report strip in each breather and the excursion report (scrap count-up, contract, condition, per-wave chart, highlights) from the stats record, in the prototype only.
- **Host leaving ends the room (GDD-D52):** in the prototype's co-op layer, the host's disconnect ends the guest's match with their match scrap lost, and the host's next load counts it as a death (the in-match mark).

Done when: each contract has a rules check case that completes it and one that fails it; each condition changes what it should in a scripted match; Overtime works in single-player and in a two-tab co-op test.

## Phase 4: zone enemies

- **Zone threats table (GDD-D40):** `T.zoneThreats` lists zone, enemy, replaced slots and waves. `beginWave` swaps slots for each open zone's enemy and keeps the drop order in the GDD's Wave pacing. A zone enemy prefers spawn cells inside its zone (`MAP.zones` bounds).
- **Scuttler:** a fast enemy in packs of 4 that land together, with a flash and a blast that hurts everyone in 1.5 m and chips one voxel. It can't take pods.
- **Bulwark:** a loader variant with a front shield arc checked first in `hitEnemy`, a bash, a slow turn rate, and the Perfect-breaks-shield rule.
- **Wrecker:** keeps 8 m from every mech, walks to a support chunk at least 8 m from every mech, plants a charge entity (20 health, 4 s fuse) that destroys its chunk through the normal break path. Its charge is an enemy-made event, so the kills belong to nobody.
- **Elites:** the seed picks one bot or loader per wave in the Terminus Yard's waves to get double health, +25% damage, gold trim, 1.5× scrap and a Field repair or Overclock pod on death.

Done when: each enemy has a unit lab entry and rules check cases (Bulwark front and back Perfects, Wrecker charge credit, Scuttler blast hitting another enemy), and a level 5 match shows all four.

## Phase 5: city hazards

**Done Oct 28:** collapse scaling, cluster credit and the demolition bonus came with phase 1; phase 5 added CRUSHED and SPAN DOWN events and callouts, whole-box containers so stacks topple, slag pools from every vat and the gallery, the `props` stat, and 30 rules-check cases (span drop on level-5 bots credited to the last pillar's breaker, a bot burned in slag, each prop falling).

- **Collapse damage** to enemies scales with level (`T.collapse.botDmg` × the hp scale); 40 to mechs at any level.
- **Credit on clusters:** when a chunk breaks, the cluster records the mech whose hit broke it (from `hitVoxel`'s source), or nobody for an enemy's charge, blast or Juggernaut. `land()` passes it to `hitEnemy` as the hazard source.
- **Demolition bonus and CRUSHED:** collapse, topple, container and slag kills get `T.demolition` (+15%) through `killScrap`, and one event per collapse counts its kills.
- **Slag spill:** a vat that lands leaves a 4 × 4 m pool entity for 8 s that hurts enemies and mechs and adds heat, at half for Grav-skids. The vats, crane, stacks, billboard and water tower are already in `MAP` (level design, PR #12).

Done when: the rules check drops a span on bots at level 5 and kills them, credits the mech that broke the last pillar chunk, and burns a bot in a slag pool.

## Phase 6: parts, pods and garage

- **Blueprint parts (GDD-D42):** six entries in `PARTS` with a `zone` field, shown in the garage once the save's highest extracted level reaches that zone's level (Freight Yard at 2 to Terminus Yard at 5). Arc caster (chain bolt), Redline vent (Q: 5 s Redline, ends a lockout, armor cost on net heat, longer lockout after), Seismic hammer (ATB ground slam, Perfect topples stacks and shakes perches), Breach charges (sticky charges, Q again detonates, 2 m voxel sphere), Overdrive core (low-armor power and drain), Grav-skids (two dashes, wider slide, half slag). Twelve upgradable weapons.
- **Pods (GDD-D43):** Scrap cache (8 cubes, scaled; carried by an enemy that takes it) and Strike beacon (four shells in a line; aimed at mechs if an enemy takes it), with odds 50/20/15/15 in `T.pods.odds`.
- **Call-ins (GDD-D54):** two slots in the save, bought in the garage at the level-scaled price, called with keys 1 and 2 at the cursor (up to 14 m) as a normal pod with its marker and countdown. Unused ones carry over; carried ones are lost on a death.
- **Garage:** next level preview from the climb plan (zones, zone enemies, condition, contract), the call-in shop and slots, "New" marks, the Repair button, upgrade buttons. Records on the title screen.

Done when: each part has a mechanics lab test (Redline armor cost, Breach charges on a pillar, Arc caster chain), the garage lab shows the blueprints, and a call-in can be stolen by a bot.

## Phase 7: bosses

- **Roster (GDD-D51):** `beginWave` reads the climb plan's boss for waves 3 and 5; wave 5 is the harder variant (prototype changes section 3). Sniper's nest adds one sniper to each boss wave.
- **Sniper pair:** two snipers at two thirds health who never perch within 8 m of each other and alternate fire.
- **Juggernaut:** a boss loader whose charge lasts up to 2 s and breaks building and pillar chunks through the normal break path, so it can drop a span; its collapses belong to nobody. A Perfect stagger stops the charge.
- **The Warden (TDD-D14):** a walker made of linked entities in the enemy list: a body aloft at 5 m, three rider platforms (150 health), three riders (snipers with the normal rules), and four legs (300 health). Damage to the body halves while any rider is up. Leg breaks stagger and slow it; four broken legs bring it down as a collapse. Barrage, belly Scuttler drops and the stomp run off its own timers. It walks in from the far end of the Terminus Yard and never takes pods. Its arena is the open floor at x 168 to 215.
- **Performance:** the Warden's body is the first moving enemy larger than a mech. Its collision uses its legs and stomp radius only; the body is drawn, not collided with.

Done when: the unit lab can spawn each boss and run each behaviour on demand, the rules check covers the half-damage cover and the four-legs collapse, and a scripted level 5 wave 5 ends in both ways (body killed; legs broken, then killed).

## Phase 8: feel and audio

All in the prototype, driven by sim events: hit-stop that freezes only the effect and flashes the enemy, grade stamps with the combo, SPAN DOWN and CRUSHED ×N, multi-kill text, the combo by the heat bar (and on the cursor ring at ×2 or more), the Redline glow, contract progress, condition icon, call-in slots, the cockpit voice with its 3 s gap, the new sounds, the Overtime layer and the Warden theme. Sounds come from the existing Scenario pipeline ([design workflows](../../../studio/design-workflows.md)) and need kr0's approval like any art.

Done when: every event in the GDD's Audio and Feel sections has a sound or effect, and a co-op test shows no desync from presentation.

## Phase 9: sweep

Run the fun pass sweep questions in the [tuning history](../tuning-history.md) on paired seeds with the runner: combo rates, Redline cost, extract rate and scrap per run with and without Overtime, call-in spending, collapse lethality at level 5, Warden fight length, multi-kill frequency, the stacked scrap curve against prices, the death-rate step per zone enemy, climb length, and wave density on the 216 × 48 m map in solo and co-op. kr0 sets the targets first; each change kr0 picks gets a decision row.

## Risks

| Risk | Why | What we do |
| --- | --- | --- |
| The Warden | A multi-part walker is new to the sim, and it's the finale | Build it last, in the unit lab first, with each behaviour switchable |
| Determinism drift | Many new random draws and entities | The replay hash check runs on every batch from phase 0 on |
| Co-op bandwidth | Charges, pools, riders and stats add to snapshots | Add them to the snapshot only as compact arrays; measure snapshot size in the two-tab test |
| Wave density | The map is 2.25× the floor, the waves are unchanged | Phase 9 sweeps it; until then, solo matches will feel sparse |
| Scope | Ten phases for one developer | Each phase ships playable, so the order can stop or change at any phase boundary |
