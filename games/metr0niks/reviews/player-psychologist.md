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
