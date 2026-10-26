# Player Psychologist — Round 1

Scope: what a real player goes through in Metr0niks, especially the first hour, where they get frustrated, and whether the reward structure keeps them coming back.

## F1. The rewards are all-or-nothing and repairs cost scrap, so a losing player can slide into a death spiral — BLOCKING

**Problem.** One death wipes out a whole excursion's worth of scrap, including a death on the final boss wave. Even a successful run leaves durability damage that weakens the mech until the player pays scrap to repair it. A struggling player can therefore end up here: they die and earn nothing, they carry durability damage into the next run (or did not repair it), their mech is weaker, they die again. The starter mech guarantees the player can *deploy*. It does not guarantee they can *recover*. Loss aversion is strongest right at the end of a run. Losing everything on wave 5, after beating the wave-3 boss, is the moment players uninstall. There is also no voluntary bail-out ("Leaving early counts as a loss"), so the player cannot cash out to protect what they have earned.

**Source.**
- *Core loop:* "Dying at any point sends you back to the garage with none of that match's scrap."
- *Run rules:* "**Extract:** clearing wave 5 extracts you and banks your scrap. Leaving early counts as a loss." / "**On death:** you lose all scrap from the match."
- *Run rules:* "**Durability:** at the end of an excursion, a share of the damage taken (TBD%) becomes durability damage. It lowers max health, heat tolerance and other stats until you repair it in the garage."
- *Economy:* "Repair durability damage | TBD | Yes."
- *Overview:* "All play is online." The document never says what happens to an excursion when the connection drops. Players will read "disconnect = leaving early = lose everything" as unfair.
- The document also leaves open whether durability damage applies after a death, which matters a great deal for how harsh the spiral is.

**Suggested direction.** Add a partial bank point after the wave-3 boss, or let a dying player keep a fraction of their scrap. Make the first repair, or repairs on starter parts, free. Say explicitly whether durability applies on death and what happens on a disconnect.

## F2. There is no onboarding or first-hour plan, and the first run asks the player to learn too much at once — MAJOR

**Problem.** The document never describes a tutorial, a first match, or a difficulty ramp. In their first excursion a new player has to handle all of this together:
- twin-stick driving with momentum and traction
- a mouse-aimed torso that also tilts in elevation
- two arm weapons whose mouse mapping is crossed over
- a heat meter with a 3 s lockout
- press-and-hold ATB timing rings that run while they keep driving
- damage regions that can disable parts mid-match
- drop-pod races
- collapses they must dodge by reading falling shadows

Their first boss arrives on wave 3, and it is the hardest target in the document to hit with a mouse-aimed timing weapon. Without a learning curve, the player cannot tell whether they died because of the controls, the build, or the timing system. Players who can't explain their own losses tend to quit.

**Source.**
- *Controls and camera:* "Left mouse button | Right arm weapon" / "Right mouse button | Left arm weapon." The crossed mapping adds friction from the first minute.
- *Controls and camera:* "**Timing press:** press and hold a heavy weapon's or ability's button to start its timing ring, then release at the right time." / *Combat:* "You keep driving and aiming while the ring runs."
- *Run rules:* "Bosses come on waves 3 and 5." / *Enemies and AI:* "**Bounty boss** … an ultra-light sniper that jumps across rooftops."
- *Zones:* zones open "one level at a time" across a "campaign." This could be an onboarding ramp, but the document never links it to the player's first sessions or to teaching mechanics.
- Omission: the document has no section on the tutorial, the first match, or which systems unlock in what order.

**Suggested direction.** Write out the first hour. A good start: the first excursion runs with light guns only and no heat pressure, timing rings arrive in run 2, the first boss is easier or rooftop sniping comes later, and the zone campaign is used to introduce one system per level.

## F3. Missing a timing ring makes the next miss more likely, which hits new players hardest — MAJOR

**Problem.** A Miss already halves damage. It also costs "Full cost" heat, while Good and Perfect cost "Normal" heat (the table never defines how these differ). A novice who misses therefore deals less damage *and* builds more heat. More heat leads to overheat, and overheating during a ring "cancels and counts as a Miss." That is a loop where failing makes the next failure more likely. The player feels it as the game piling on. The accessibility options would soften it, but the window sizes are TBD, and the document never says whether these options are presented to new players or buried in a settings menu.

**Source.**
- *Combat* timing table: "Miss or ring closes | 50% | Reduced | Full cost" vs. "Perfect … Normal" / "Good … Normal."
- *Combat, Edge cases:* "**Overheat during a ring:** the ring cancels and counts as a Miss."
- *Combat, Edge cases:* "**Two heavy weapons ready:** only one timing ring runs at a time; the second heavy weapon waits until the first ring resolves." The document doesn't say what the player sees when they press a heavy weapon's button and nothing happens. Without feedback, that reads as the controls ignoring them.
- *Overview:* "**Accessibility:** options to widen the Perfect timing window and to auto-release timing rings … Window sizes are TBD."

**Suggested direction.** Make a Miss cost the *same* heat as a hit, or less. Then a miss only loses damage and doesn't push the player toward overheating. Add clear "queued" feedback for the second heavy weapon. Consider offering the wider timing window automatically after repeated misses.

## F4. Gauntlet, the natural practice mode, earns nothing, so practice feels wasted — MAJOR

**Problem.** Gauntlet is the obvious place to learn the game, but the document says it "doesn't progress your mech," and it never says whether Gauntlet scrap can be kept or spent. "You keep your scrap" can be read two ways. It might mean Gauntlet *earns* scrap you keep, or only that it doesn't take away scrap you already banked. Players who practice and get nothing for it learn that practice is a waste of time. They will skip it and go straight into the punishing Excursion (see F1). Then the safe mode does not do its job of keeping players.

**Source.**
- *Run rules:* "**Gauntlet:** the same waves with no penalty for losing. You keep your scrap and take no damage that needs repair. Gauntlet doesn't progress your mech."
- *Run rules:* "**Progression:** mechs progress only in excursions."
- *Garage and drop pods:* "Gauntlet has no such loss."
- *Game modes:* "Excursion is … the only one that progresses your mech; Gauntlet is a no-penalty alternative."

**Suggested direction.** Decide what Gauntlet is *for* and give it a reward that matches. Options include a small scrap payout, mastery or timing-accuracy goals, cosmetic unlocks, or test-driving parts you don't own yet ("try before you buy" helps the garage loop too).

## F5. When the player is about to die, the game shows them less — MINOR

**Problem.** As health drops, "darkness creeping in from the screen edges" hides the outer part of the screen. That is exactly where the player needs to see falling-structure shadows, drop-pod markers and rooftop snipers. Heavy builds also get a tighter camera ("light builds see more"), so a player who chose armor for safety ends up seeing less of the threats around them. Both decisions take information away at the moment the player most needs it, which makes deaths feel unfair rather than earned. This works against the document's own "**Readable danger**" promise.

**Source.**
- *Controls and camera:* "Zoom is set by your build when you drop in (light builds see more) and never reacts to damage. Low health shows warning colors and darkness creeping in from the screen edges."
- *Destruction and environment:* "**Readable danger:** falling structures cast a shadow on the ground before they land, so players can dash clear."
- *Enemies and AI:* "enemies break supports on purpose to drop structures on the player."

**Suggested direction.** Use a low-health effect that doesn't hide anything, such as a tint, a pulse or audio, or make sure shadows, pod markers and threat indicators always draw on top of the vignette. Tell the player in the garage that a heavy build means a tighter camera, so the tradeoff is a known choice.

## Round 2 — Cross-examination

I read all five colleague reviews and re-checked the disputed passages in the Metr0niks GDD. Below, "PP" means my own Round 1 findings.

### Systems Designer

**CONFLICT — systems-designer F1 (Gauntlet is a no-risk farm) vs. PP F4 (Gauntlet practice earns nothing).** We read the same ambiguous line ("You keep your scrap … Gauntlet doesn't progress your mech") and recommend opposite fixes. SD's fixes ("Gauntlet scrap is cosmetic or not banked") would make Gauntlet the empty mode I warned about. I accept SD's economic point: full-rate bankable scrap from a no-penalty copy of the same waves would empty out Excursion. But SD's framing treats Gauntlet only as a risk/reward leak. For a struggling player, Gauntlet is the only place to learn timing rings and heat without losing anything. If it pays nothing, players will skip practice and go straight into the mode that punishes them hardest (PP F1). My position: Gauntlet shouldn't pay Excursion-rate scrap. It should pay rewards that don't compete with Excursion: mastery/accuracy goals, cosmetics, try-before-you-buy parts, plus a small *capped* scrap trickle that works as a recovery floor (see the adversarial-qa F4 connection below). That keeps practice from being wasted, and it can't be farmed.

**CONFLICT (severity) — systems-designer F3 (death spiral, MAJOR) vs. PP F1 (BLOCKING).** SD, adversarial-qa F4 and I all found the same spiral independently, so the finding itself is solid. SD rates it MAJOR because the TBD numbers might tune it away. I keep it BLOCKING. Tuning can soften the slope, but it can't remove the *structure*: a wave-5 death after a wave-3 boss kill, followed by a weaker next run. Players feel that as "the game took my hour and then made me worse." It happens in the first sessions, before any long-term motivation exists. A design that loses players on day one can't be rescued by tuning on day thirty. A partial bank, or a repair floor, has to be decided at the design level.

**CONNECTION — systems-designer F2 (campaign levels don't fit the 5-wave structure) + PP F2 (no onboarding).** SD treats zones as a structural contradiction to resolve. Through my lens, the zone campaign is the *only* thing in the GDD that looks like a first-hour ramp. Level 1 is a single zone (the Underpass), so it has fewer spawn lanes, fewer perches and less to track. The arena "spreads out as the campaign goes on." If the team makes the campaign canonical, it should also be the teaching spine: one system or threat per level. Rooftop sniper perches should stay sealed until the player has learned the timing ring. If the team cuts the campaign (as business-analyst F1 suggests), it loses its most natural onboarding tool and will need to build another one.

**CONNECTION — systems-designer F4 (weight removal makes a crippled mech faster).** SD and adversarial-qa F3 both treat this as an exploit or a pillar violation. From the player's side, it is also an accidental *comeback mechanic*. A mech that just lost an arm gets faster, so it can reach a Field repair pod or dash clear of a collapse. Removing it entirely (adversarial-qa's "keep a disabled weapon as dead weight") would add yet another penalty in the moment a struggling player is already losing. I'd cap the speed gain rather than remove it, and say plainly in the HUD why the mech sped up. An unexplained speed change mid-fight reads as a bug.

### Adversarial QA

**CORRECTION — adversarial-qa F3, point 3 (losing both arms is "unwinnable", "no damage source left").** Strictly speaking, the GDD doesn't support "no damage source". Overheating "vents damaging steam" (*Combat → Heat*). Vectored jump-jets add 40% heat per jump, so an armless mech with jump-jets can still deal damage by deliberately overheating. Enemy-triggered collapses also damage "everything under it," including enemies. So it is a *practical* soft-lock rather than a strict one. This actually makes the player experience worse: the way out is a hidden, degenerate trick no new player will find. They'll sit through a long, helpless wait to die and then lose all the scrap. I add this to PP F1 as a third route into the death spiral, alongside death and disconnect. The fix is a fallback that is *visible* (a ram/melee, or a "scuttle" that banks part of the scrap), not an obscure one.

**CONNECTION — adversarial-qa F5, point 2 (overheat-Miss charges "Full cost" heat on top of 100%) + PP F3 (missing a ring makes the next miss more likely).** I described the failure loop up to the overheat. QA's point shows it can continue *past* it. If the cancelled ring's "Full cost" heat lengthens the 3 s lockout or triggers a second overheat right away, a novice who fumbles one ring while hot loses control for longer than the tunables say. That turns a 3-second penalty into "I couldn't do anything and I don't know why." I upgrade the urgency of PP F3. It stays MAJOR, but QA's fix ("a Miss caused by overheating adds no further heat") should be adopted together with mine ("a Miss costs no more heat than a hit").

**CONNECTION — adversarial-qa F4 (the only escape from the spiral is Gauntlet scrap) + systems-designer F1 / adversarial-qa F1 (remove Gauntlet scrap).** QA notices this without following it through: QA's own F1 fix (Gauntlet "pays no bankable scrap") closes the only escape route from the spiral QA describes in F4. Accepting F1's fix without a PP F1 fix (partial bank, free starter repair, or a repair floor) leaves a player with a damaged build and 0 scrap no way back except abandoning that build for a starter mech. The board should treat these as one decision, not two.

### Business Analyst

**CONFLICT — business-analyst F1 ("freeze the zone and campaign work and fold zone-opening into the Excursion wave structure").** I agree that the two-player wording and the synchronized cinematic are out of scope. I disagree with freezing the *zone gating* itself, for the onboarding reason above: the GDD offers nothing else that ramps the arena's complexity. Folding zone-opening into a single 5-wave excursion would open three zones over roughly 20 minutes in *every* run. That repeats the same reveal every match and loses the across-sessions ramp. My counter-proposal: keep zone gating as a single-player progression ramp and cut "both mechs" and "both players". Also make the 5.5 s reveal skippable after the first time it plays, because an unskippable camera sequence is a classic irritant on repeat runs.

**CONNECTION — business-analyst F2 (always-online single-player with no stated reason) + feasibility-lead F1 (no disconnect behaviour) + PP F1.** The business cost (negative reviews) and the player cost are the same event: a dropped connection on wave 5 that the player reads as "leaving early counts as a loss." Every reviewer who touched this treated disconnects as a sub-bullet. Combined, it is the single most review-bomb-prone moment in the design: an external failure the player can't control, applied to a rule that wipes everything. I **upgrade** the disconnect point from a sub-note in PP F1 to a standalone requirement. Either the run state survives a reconnect, or a disconnect banks the scrap earned so far. If neither is possible, that is a strong argument for business-analyst F2's offline-capable single-player.

**AGREEMENT WITH EXTENSION — business-analyst F3 ("Gauntlet gives casual players no reason to play").** BA reaches my PP F4 conclusion from the audience side. Taken together, the audience split BA describes (hardcore extraction loss vs. a casual no-penalty mode) only works if Gauntlet is the casual player's *on-ramp* into Excursion. Right now it is a dead end with no reward and no stated purpose. Naming the target player (BA's ask) also decides how harsh PP F1's fix needs to be.

**CONNECTION — business-analyst F5 (five loot-color rarity tiers without a loot loop).** White-to-orange colors teach players to expect drops. When a player who knows the genre clears a wave and gets cubes instead of a purple part, that is a small expectation violation every match. It's minor, but it supports BA's ask: if rarity stays, the garage needs to say up front that parts are bought, not dropped.

### Narrative Critic

**CONFLICT — narrative-critic F4 (wave 5 should escalate beyond the wave-3 boss) vs. PP F1/F2.** Narratively this is right: the same sniper twice flattens the arc. But escalating wave 5 raises the difficulty exactly where loss aversion is highest and a death costs the most. Without a partial bank after wave 3, a harder wave-5 boss makes the uninstall moment I described in PP F1 more likely. My condition: escalate wave 5 *only if* the wave-3 kill banks something. Then wave 3 becomes the readable, easier introduction to the sniper (which serves PP F2), and wave 5 is the earned, harder rematch. That also gives NC the "grudge" beat it asks for.

**CONFLICT (caution) — narrative-critic F5 (extraction should be "a tense escape" rather than a state change).** I strongly support an authored end-of-match beat. Relief after high stakes is what makes players queue again. But NC's phrase "a tense escape" could be read as a *playable* extraction sequence, which would add another fail point after the final boss. I'd scope it as NC's own fallback options (an extraction cinematic, a ruined-skyline shot, a garage return line): a reward beat with no new failure risk.

**CONNECTION — narrative-critic F2/F3 (enemies aren't mechs; player role undefined) + PP F2.** In the first hour, motivation comes from knowing what you are and what you're fighting. The GDD sells "a cheap mech can beat an upgraded one," but there is no upgraded enemy mech for the new player to beat. This also explains why the pod-race text ("Enemy mechs grab pods too") will confuse a first-time player: the patrol bots grabbing pods are never named as rivals. A one-paragraph premise (NC's ask) is cheap and also improves onboarding clarity.

### Feasibility Lead

**CONNECTION — feasibility-lead F5 (no cut list) + PP F1/F2.** Feasibility asks whether durability, damage regions or rarity tiers can be deferred. From my lens, **deferring durability** is the highest-value cut in the document. It removes a system to build and tune, it removes the second half of the death spiral (PP F1, systems-designer F3, adversarial-qa F4), and it removes one item from the new player's cognitive load (PP F2). Damage regions are the next candidate: deferring them also removes adversarial-qa F3's soft-lock and the "arm disabled mid-ring" loss that feels arbitrary to novices.

**CONNECTION — feasibility-lead F2 (fallback to scripted/authored break points if full collapse proves too costly).** Feasibility frames this as a downgrade. For readability it may be an upgrade. Authored break points can be telegraphed consistently (cracks, sparks, a standard shadow), and that makes the "**Readable danger**" promise learnable. A fully emergent collapse is spectacular, but a new player can't predict it. Paired with PP F5 (the vignette hides the edge-of-screen shadows), I'd recommend that the shadows and break-point telegraphs always draw above every low-health effect, whichever collapse model ships.

**CHECK — feasibility-lead F1 ("the prototype is already a two-player networked sim").** The GDD says "Both players watch the same shot because it runs on the simulation clock." That implies a shared simulation. It doesn't literally say the prototype is networked, since a shared clock could also mean local co-op or a test harness. The architectural concern stands either way, but the board shouldn't present the existence of netcode as a fact from the GDD.

### Revisions to my Round 1

- **PP F1 — stays BLOCKING, scope widened.** It now explicitly covers three routes into the spiral: death, disconnect (raised to a standalone requirement, per business-analyst F2 + feasibility-lead F1), and the practical arm-loss soft-lock (adversarial-qa F3, corrected above). It should be decided together with the Gauntlet fix, because removing Gauntlet scrap closes the only exit (adversarial-qa F4).
- **PP F2 — stays MAJOR, recommendation sharpened.** Use the zone campaign (systems-designer F2) as the onboarding spine instead of inventing a separate tutorial. Keep zone gating even if the two-player campaign wording is cut (against business-analyst F1).
- **PP F3 — stays MAJOR, urgency upgraded.** adversarial-qa F5 shows the failure loop can extend past the 3 s lockout. Adopt both heat fixes.
- **PP F4 — partially revised.** I withdraw "a small scrap payout" as an uncapped option. systems-designer F1 and adversarial-qa F1 are right that it would empty out Excursion. I keep the core claim that Gauntlet needs a non-competing reward, plus at most a capped recovery trickle.
- **PP F5 — stays MINOR.** It becomes more relevant if the collapse model is emergent rather than authored (feasibility-lead F2).
