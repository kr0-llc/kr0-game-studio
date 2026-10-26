# Metr0niks GDD review: synthesis

25 October 2026 · Moderator: Claude (round 3) · Decides: kr0

Reviewed: `games/metr0niks/gdd.md` (Oct 20, 2026, with Oct 22 prototype additions). Method: the [gdd-review-kit](https://github.com/GixGosu/gdd-review-kit) rounds 1 to 3. Six reviewers read only the GDD, each in their own context, then cross-examined each other's files. This synthesis adds no critiques of its own. Every point traces to a review file in this folder. Per studio rules, it reports observations, not a verdict: kr0 decides.

**Count after cross-examination:** 34 findings (30 in round 1, plus 4 new in round 2): 9 BLOCKING, 22 MAJOR, 3 MINOR.

| Reviewer | Round 1 | After round 2 |
| --- | --- | --- |
| [Systems designer](systems-designer.md) | F1 B, F2–F5 M | F3 up to B; new F6 M |
| [Player psychologist](player-psychologist.md) | F1 B, F2–F4 M, F5 m | unchanged; F1 widened, F4 partly withdrawn |
| [Adversarial QA](adversarial-qa.md) | F1 B, F2–F4 M, F5 m | F2 up to B; new X1, X2 M; F5.1 down to wording |
| [Feasibility lead](feasibility-lead.md) | F1–F2 B, F3–F5 M | F1 narrowed (still B) |
| [Narrative critic](narrative-critic.md) | F1 B, F2–F4 M, F5 m | F1 down to M; F5 up to M |
| [Business analyst](business-analyst.md) | F1 B, F2–F4 M, F5 m | F2 up to B; new N1 M |

B = BLOCKING, M = MAJOR, m = MINOR.

---

## 1. Top 5 issues

Ranked by severity × confidence (how many reviewers reached it independently, and how it fared in cross-examination).

### 1. The Zones section's two-player "campaign" contradicts the stated scope and the 5-wave run rules
**BLOCKING · Strengthened**

The prototype Zones section describes a level-by-level campaign where "both mechs land" and "Both players watch the same shot". The Overview says single-player first with "no multiplayer", and Run rules call themselves "the only place the wave structure is defined". Nobody can say what a level is relative to an excursion, whether it persists, or what happens to it on death.

- **Flagged by:** business-analyst F1, narrative-critic F1, systems-designer F2, adversarial-qa F2, feasibility-lead F1/F4 (five of six independently in round 1); player-psychologist joined in round 2.
- **Cross-examination:** adversarial-qa upgraded it to BLOCKING. Narrative-critic moved it to MAJOR in its own lane, deferring to the scope owners. The board converged on part of a fix: cut the two-player wording, keep zone gating as a single-player ramp (business-analyst conceded its "freeze" ask to player-psychologist F2). The structure question is still open (disagreement D3).

### 2. Losing all scrap on death, plus durability damage, makes a death spiral with no way out
**BLOCKING · Strengthened**

A death on any wave, even wave 5, wipes the match's scrap, "Leaving early counts as a loss", and durability damage weakens the mech until scrap is spent on repairs. A losing player redeploys weaker with nothing to repair with. The starter mech guarantees deploying, not recovering.

- **Flagged by:** player-psychologist F1, systems-designer F3, adversarial-qa F4; business-analyst N1 and feasibility-lead in round 2.
- **Cross-examination:** systems-designer upgraded F3 to BLOCKING. Round 2 found three routes into total loss the player can't control: death, a disconnect read as "leaving early" (feasibility-lead F1, adversarial-qa F3.4, player-psychologist), and the both-arms-disabled practical soft-lock (adversarial-qa F3, corrected by systems-designer, player-psychologist and feasibility-lead: steam vent and shoulder mortar still deal damage, so it's build-dependent). Everyone agrees the GDD must say whether durability applies on death and to starter mechs. How to fix it is split (D2, D5).

### 3. Gauntlet has no defined purpose or reward, and one reading makes it a risk-free scrap farm
**BLOCKING · Survived, with a dispute over what the text says**

"You keep your scrap and take no damage that needs repair. Gauntlet doesn't progress your mech", next to "mechs progress only in excursions" and "Gauntlet has no such loss". If Gauntlet scrap banks and spends, Gauntlet beats Excursion and the extract-or-lose tension goes. If it doesn't, practice earns nothing.

- **Flagged by:** systems-designer F1, adversarial-qa F1, player-psychologist F4, business-analyst F3.
- **Cross-examination:** all four agree the sentence is defective. They disagree on whether the text already says Gauntlet earns scrap (D1). Several tied it to issue 2: removing Gauntlet scrap closes the only recovery route (player-psychologist on adversarial-qa F4; systems-designer's repair-only pool).

### 4. The game requires a connection and its pillars promise mech-vs-mech fights, but nothing says which game it is or who it's for
**BLOCKING · Strengthened (one supporting claim weakened)**

"All play is online" with no multiplayer in the first version. There are no stated audience, comparables, price or business model. The pitch lines ("A cheap mech can beat an upgraded one", "Enemy mechs grab pods too", the pile-bunker "launches mechs through walls") point at mech opponents the first-version roster mostly lacks.

- **Flagged by:** feasibility-lead F1, business-analyst F2 (upgraded to BLOCKING and merged with F3), narrative-critic F2/F3; player-psychologist and adversarial-qa on disconnects.
- **Cross-examination:** business-analyst framed the root decision as "is Metr0niks a PvE extraction game that might add PvP, or a PvP mech game shipping a PvE stage first?". Feasibility-lead split it into two questions, co-op in the first version and online required, and recommends no to both. Weakened: feasibility-lead's claim that the prototype is "already a two-player networked sim" was corrected by player-psychologist and business-analyst (a shared simulation clock is not proof of networking), and feasibility-lead narrowed F1 to match. Narrative-critic F2 was partly corrected: the "ultra-light sniper" boss is likely a mech (business-analyst, feasibility-lead). Adversarial-qa C3 adds that any offline progression must be kept out of future PvP accounts.

### 5. The core numbers are unset, and the spec and prototype disagree, so systems can't be balanced or built against one source
**MAJOR · Strengthened**

Stat formulas, timing windows, heat values and every economy value are TBD. The parts table exists twice: 12 parts with flat percentages ("30% slower") against 21 prototype parts with stat deltas ("weight -12"). Rarity has five tiers in one place and three in the other. There are four overlapping vertical power tracks: rarity, stat upgrades, higher-tier weapons and Reactor tiers.

- **Flagged by:** feasibility-lead F3/F4, systems-designer F4/F5, business-analyst F4/F5.
- **Cross-examination:** feasibility-lead calls F3 the root cause behind issues 2 and 3 and adds a required stat-modifier pipeline, since three features depend on it (the garage preview, durability, weight removal). Systems-designer and business-analyst agreed the merge should go toward the prototype's stat-delta table. Feasibility-lead corrected business-analyst F4: later maps are one table row each, not "designed in detail", though their hooks need new tech. Systems-designer added F6: player power only rises, with no enemy scaling, so the same waves get easier over time.

**Just outside the top 5:** feasibility-lead F2 (BLOCKING). Structural collapse, the headline tech behind three pillars, has no algorithm, budget or fallback, and "40 m of road" doesn't fit the 32-cell prototype map. In round 2, feasibility-lead upgraded the fix to authored or precomputed collapse groups as the baseline, because the "Readable danger" shadow needs the footprint known in advance. Player-psychologist and narrative-critic supported authored collapses. Business-analyst said collapse should come first in the build order.

---

## 2. Unresolved disagreements

These go to kr0. Each states both sides as the reviewers argued them.

**D1. What Gauntlet pays, and what it's for**
- *Gauntlet scrap is earned and banked; restrict what it buys* (adversarial-qa C1, systems-designer). "Gauntlet has no such loss" only makes sense if match scrap counts. Systems-designer proposes a repair-only scrap pool, so "doesn't progress your mech" stays true and broke players can recover.
- *The text only promises no loss; decide the purpose first* (business-analyst, player-psychologist). "No scrap lost" is a protection, not income. Player-psychologist wants non-competing rewards (mastery goals, cosmetics, try-before-you-buy) plus at most a capped trickle. Narrative-critic suggests framing it as a simulator whose scrap doesn't bank. Feasibility-lead notes non-bankable scrap is the only version enforceable without server authority.
- **Decision:** what Gauntlet is for, and whether its scrap can buy anything.

**D2. A cash-out point after the wave-3 boss: automatic or chosen**
- *Automatic partial bank* (player-psychologist F1, systems-designer: bank 30 to 50% of waves 1 to 3 at the wave-3 kill).
- *Opt-in extraction at a lower rate, never automatic* (adversarial-qa C2: an automatic bank creates a suicide-farm loop). Narrative-critic wants that choice as a played extraction ("hold a landing zone under fire").
- *No played extraction sequence yet* (systems-designer, player-psychologist: it adds a fail point at the most loss-averse moment).
- **Decision:** whether a cash-out exists, whether it's automatic or chosen, and whether it's played.

**D3. Zones: progress across runs, or inside one excursion**
- *Account-level unlock earned by extracting, never lost on death* (systems-designer, narrative-critic, player-psychologist as the onboarding spine).
- *Zones open across waves inside each excursion, and nothing persists* (feasibility-lead: no new backend schema; business-analyst's original fold-in ask). Player-psychologist objects that this repeats the same reveal every match and loses the ramp across sessions.
- **Decision:** what a "level" is.

**D4. Whether a disabled weapon's weight comes off**
- *Keep it as dead weight* (adversarial-qa F3; systems-designer agrees that's the right fix).
- *Cap the speed gain and explain it in the HUD* (player-psychologist: an accidental comeback mechanic; narrative-critic: the stripped last stand is one of the best images in the doc).
- *Cut the rule* (business-analyst cut list: nothing depends on it).

**D5. Durability in the first version**
- *Cut it* (business-analyst N1: no pillar needs it, and it drives the death spiral; player-psychologist: the highest-value cut).
- *Keep it with a floor* (adversarial-qa F4: free starter repairs or a minimum stat level; systems-designer's minimum fix set keeps durability but defines it on death).

**D6. The wave-3 and wave-5 bosses**
- *Different wave-3 encounter; the sniper becomes the wave-5 climax* (narrative-critic F4 as revised, player-psychologist on first-boss difficulty).
- *Same boss, wave-5 behaviour variant on a wrecked skyline* (feasibility-lead: a second boss is the costliest asset). Player-psychologist accepts escalation only if wave 3 banks something (ties to D2).

---

## 3. Quick wins

1. **Delete the two-player wording from Zones** ("both mechs land", "Both players watch the same shot"). Every reviewer who discussed Zones agreed it goes, whichever way D3 is decided.
2. **Fix the heat and timing edge cases:**
   - Overclock: "the running ring is unaffected; all fills during the 15 s are doubled".
   - A Miss caused by overheating adds no further heat.
   - A Miss costs the same heat as a hit, not less, so letting a ring close never becomes a cheap fire mode.
   - Define the Cryo flash-vent against the lockout.

   Sources: adversarial-qa F5, C2, X4; player-psychologist F3.
3. **Draw danger cues on top of everything:** collapse shadows and pod markers draw above the low-health vignette and the cutaway. Sources: player-psychologist F5, adversarial-qa X1, feasibility-lead.

---

## 4. Observations (in place of a verdict)

The reviews say the GDD can't yet drive production. The blocking items are not tuning gaps but undecided frames: what a level is relative to an excursion (issue 1, D3), whether the first version is online and for whom (issue 4), and what Gauntlet and losing are meant to feel like (issues 2 and 3, D1, D2, D5). Several reviewers note that issues 2 and 3 should be decided together, since each proposed Gauntlet fix changes the death spiral's only exit. Feasibility-lead adds that none of the balance questions can close until the base numbers and a stat-modifier pipeline exist (issue 5). The single change the most reviewers pointed toward is settling the scope frame: single-player or co-op, online or offline-capable, and the level/excursion definition. Five of six flagged the Zones contradiction on their own, and business-analyst and feasibility-lead both put the product-identity question ahead of scoping. Which of these to settle, and how, is kr0's call.
