# Narrative Critic — Round 1

Scope: story logic, motivation, tone, theme, and whether the structure pays off what Metr0niks promises. Systems balance, tech scope and business questions are left to other reviewers.

## F1. The only authored story structure in the doc contradicts its own scope — BLOCKING

**Problem.** The doc says Metr0niks has no story and no multiplayer. The one piece of dramatic structure it does describe is a multi-level campaign with two player mechs. Nothing says what a "campaign" or a "level" is in relation to an excursion, or who the second mech is. Readers can't tell what the player's journey through the game actually is.

**Passages.**
- Overview, Non-goals: "no multiplayer, no story, no map damage that carries between matches"
- Maps > Zones (prototype, 22 Oct): "a campaign opens them one level at a time... from level 4 the whole sector is one battlefield"
- Same section: "both mechs land... Both players watch the same shot because it runs on the simulation clock."
- Run rules: "A match is an excursion of 5 waves on one map."

**Why it matters.** Opening sealed zones is a real reveal: the shutter falls, the zone lights up, and the fight spreads out as the campaign goes on. That is the closest thing the game has to an arc. But it sits beside a structure (single excursions, solo play, no story) that has no place for it. Is a level the same as an excursion? Does zone access persist on the account? Does it reset? Who is "both"? Until the doc picks one frame of progression, no narrative or tonal work can be built on it.

## F2. The core fantasy is mech against mech, but the first version's enemies are not mechs — MAJOR

**Problem.** Parts, environment and pod text repeatedly promise fights against other mechs. The enemy roster for the first version is bots, haulers and one sniper. So the moments the doc sells most strongly have no opponent to happen to.

**Passages.**
- Destruction and environment: "A cheap mech can beat an upgraded one by dropping a road on it."
- Parts list: Pile-bunker "launches mechs through walls"; Mag-winch "Pulling a heavier mech drags you to it instead"
- Garage and drop pods: "Enemy mechs grab pods too, so every pod is a race."
- Enemies and AI table: "Patrol bot", "Heavy loader", "Bounty boss... an ultra-light sniper"
- Scope: "single-player Excursion and Gauntlet first... multiplayer comes later."

**Why it matters.** "A cheap mech beats an upgraded one" is an underdog story about two builds. In the first version the "upgraded one" doesn't exist. Either the enemy cast needs rival mechs, with an identity and a reason to be fighting you, or the pitch lines need rewriting around the opponents that actually ship. As written, the doc promises a payoff it defers to a later, multiplayer version.

## F3. The player's role and moral position are undefined, while the setting carries heavy thematic weight — MAJOR

**Problem.** The player levels "slum streets," knocks armored transports off highways, blasts into "bank vaults," and kills "patrol" bots and ore-"hauling" loaders for scrap. The doc never says who the player is: salvager, raider, mercenary, or rebel. It also never says whose city this is or why tearing it down is good or fun to the character. "No story" doesn't remove the theme. It just leaves the theme unexamined.

**Passages.**
- Overview: "tear down the city for scrap that rebuilds your mech"
- Maps: Overpass Sector 4: "Slum streets under a six-lane highway overpass"; Neon Financial Plaza: "Bank vaults in the basement"
- Enemies and AI: Patrol bot (security?) and Heavy loader, which "hauls ore" (labor?)
- Enemies table: "Bounty boss" (whose bounty, on whom?)

**Why it matters.** Patrol bots and armored transports suggest the player is the criminal. Slums as the first destruction playground suggest punching down. The financial plaza suggests the opposite, punching up. These choices pull the tone in different directions: gleeful demolition derby, cyberpunk class revolt, or amoral looting. Even a game with no story needs a one-paragraph premise and tone statement so art, enemy names, barks and UI copy all pull the same way.

## F4. The "Bounty boss" is the climax twice, and its framing never pays off — MAJOR

**Problem.** Each excursion has two boss beats, on waves 3 and 5, but the first version has one fixed boss. The wave 5 climax, the moment you extract and bank everything, repeats the wave 3 mid-point. The word "Bounty" sets up a hunter-and-target relationship that nothing else in the doc follows up.

**Passages.**
- Run rules: "Bosses come on waves 3 and 5."
- Enemies and AI: "Bounty boss | First version has one fixed boss: an ultra-light sniper that jumps across rooftops"

**Why it matters.** The stakes ladder is "survive to wave 5 or lose all scrap." That ladder needs wave 5 to feel like a step beyond wave 3. Meeting the same sniper twice flattens it. The doc should say whether wave 5 escalates (same boss, new behavior, a grudge, a different perch or zone) or whether wave 3 gets a different encounter. "Bounty" should be explained or renamed.

## F5. "Tear down the city" and "extract" promise consequences the structure takes back — MINOR

**Problem.** The headline verb is destroying the city, but no destruction outlasts a match. The core loop names "extract" as the final beat, but extraction is an automatic result of clearing wave 5, not a moment the player plays. The doc's two most dramatic promises, permanent ruin and a tense escape, both resolve off-screen.

**Passages.**
- Overview: "tear down the city for scrap"; Non-goals: "no map damage that carries between matches"
- Destruction and environment: "Damage stays until the match ends."
- Core loop: "A match runs garage, drop in, waves, boss, extract."
- Run rules: "clearing wave 5 extracts you and banks your scrap."

**Why it matters.** The sense of loss on death ("you lose all scrap from the match") needs an equal sense of relief at the end. Right now the loop's climax is a state change, not a beat. Likewise, a city that resets every match can't be "torn down." It reads as an arena. Neither needs persistence or new systems to fix. The doc just needs an authored end-of-match beat (extraction sequence, a ruined-skyline shot, a garage return line) and wording that matches what actually happens to the city.

## Round 2 — Cross-examination

I read all five colleague reviews and re-checked their quotes against the GDD. I've grouped my response by colleague, then listed my revisions. One note on overlap first: five of the six reviews (mine F1, systems-designer F2, adversarial-qa F2, feasibility-lead F1/F4, business-analyst F1) flag the Zones/campaign contradiction. The board doesn't need a sixth argument that it exists. What's still open is which way to resolve it, and that's where I disagree with some of you.

### business-analyst

**CONFLICT: BA F1 (freeze zone and campaign work).** I agree that the two-player wording ("both mechs land", "Both players watch the same shot") has to go. feasibility-lead F1 shows it implies networked sim work that the scope rules out. But "freeze the zone and campaign work and fold zone-opening into the Excursion wave structure" throws out the one authored arc the document has. The shutter falling and the sector opening "one level at a time" until "from level 4 the whole sector is one battlefield" is the only thing that gives a player a sense of getting somewhere beyond a number going up. player-psychologist F2 makes the same point from another angle: the zones could be the onboarding ramp. My position: cut the co-op framing, keep the single-player zone progression, and define it in Run rules as an account-level unlock track that sits above excursions. That costs one paragraph of spec, not a freeze.

**CONFLICT: BA F3 (cut Draft Duel and Scrap Rush from the GDD).** I'm fine with moving them out. The problem is that they're currently the only place where the document's mech-versus-mech promises pay off (my F2). If they go and nothing else changes, the first version still promises "A cheap mech can beat an upgraded one by dropping a road on it" and "Enemy mechs grab pods too", and now there's no opponent for those lines even in the deferred modes. So BA F3 only works if it's paired with my F2 fix: either add rival mechs to the single-player roster, or rewrite those pitch lines around bots, loaders and the sniper. There's evidence the prototype is already drifting toward the second option. It rewrote the mag-winch tradeoff from "Pulling a heavier mech drags you to it instead" to "A wall or a heavy loader reels you in instead". The rest of the document should catch up on purpose rather than by accident.

**MISREAD: BA F3.** It says Draft Duel "resets scrap each round" and that "Neither uses the garage". The GDD says "both see each other's buys and get new scrap between rounds". "Get new scrap" doesn't mean reset, since scrap could carry over and grow, and "buys" implies a shop or garage step. The broader point that these are different games still holds, but this evidence overstates how far apart they are.

**CONNECTION: BA F2 (no audience or positioning) + my F3 (no premise or moral position).** These are the same missing paragraph. A positioning section that names the audience and comparable games has to say whether this is a gleeful demolition derby, a class-revolt power fantasy, or amoral salvage-looting, and that choice decides who the game is for. **BA F5 (loot-game rarity colors)** adds a tonal problem on top: white-to-orange "epic" tiers bought off a shelf sit badly with a fiction about rebuilding your mech from scrap you tore out of a city. If rarity stays, frame it as salvage grade or provenance (for example "slum scrap" vs "vault-grade") so the economy reinforces the theme.

### player-psychologist

**CONNECTION: PP F1 + systems-designer F3 (death spiral) + my F5 (extraction isn't a beat).** Both colleagues suggest a partial bank point after the wave-3 boss. Through my lens that's a story change too. Done naively, it creates a second climax at wave 3 and makes my F4 worse, because wave 5 is already a rerun of wave 3's boss. Done as a **choice**, it fixes three findings together. After the wave-3 boss, offer a played extraction: call the dropship, hold a landing zone under fire, and leave with what you have, or push on to wave 5 for the full bank. That gives the loop the "tense escape" I said in F5 happens off-screen, gives PP F1 the voluntary cash-out it asks for, and lets wave 5 mean "I chose greed." The GDD's "Leaving early counts as a loss" would need to change to "leaving outside an extraction window counts as a loss."

**CONFLICT (mild): PP F4 (Gauntlet needs a reward) vs adversarial-qa F1 / systems-designer F1 (Gauntlet must not pay bankable scrap).** I side with PP, and the fiction can settle it. Gauntlet has no diegetic identity right now. It's "the same waves with no penalty", so it's unclear who the player is in it or why nothing breaks. Frame it as a simulator run. Then simulated scrap doesn't bank, which satisfies AQA and SD. Simulator rewards like timing mastery or test-driving unowned parts make sense in that frame, which satisfies PP. The frame tells players what the mode is for without a tooltip.

**CONNECTION: PP F2 (first boss is the hardest target) + my F4 (same boss twice).** One rooftop sniper as both the first boss and the climax is a tuning problem and a dramatic one. A boss that's too hard at wave 3 for a new player is also too familiar at wave 5 for a veteran. The two findings point to the same fix: the wave-3 boss should be a simpler, grounded encounter, and the sniper should be the wave-5 climax.

### adversarial-qa

**CONFLICT: AQA F3 (disabled weapons should stay as dead weight).** I agree about the exploit (fitting a heavy weapon as ballast and letting it get shot off) and the both-arms soft-lock. I disagree with the fix. A mech shedding parts and getting faster as it's torn apart is one of the best dramatic images in the document: a stripped, limping last stand. Making disabled parts dead weight removes it. Cap the speed gain (systems-designer F4 also flags the uncapped gain) so it never beats a healthy build. For the soft-lock, give the stripped mech a fallback that fits the fiction, like a ram or a self-destruct that banks part of the scrap. That's AQA's own suggestion, and I'd make it the main fix rather than an add-on.

**CONNECTION: AQA F2 (sniper perches gated by sealed zones) + feasibility-lead F5 (rooftop boss on destroyed rooftops) + my F4 and F5.** The GDD says "Enemies, loaders, drop pods and sniper perches only use open zones" and "Damage stays until the match ends." Taken together, those answer my F4: the wave-5 sniper fight happens on a skyline the player has spent four waves wrecking. Fewer perches means the sniper has to come down, which escalates the fight in a way the player caused. That pays off "the city is a weapon" and gives the destruction from my F5 a consequence inside the match. It turns feasibility-lead's navigation risk into a design rule (perches degrade, the boss has a grounded fallback state) rather than an edge case to patch. The document should state this on purpose.

### feasibility-lead

**CONNECTION: FL F2 (collapse scale) + my F5.** FL quotes the prototype's "the 32-cell map is too small for 15 m" against the flagship hook "40 m of road falls on everyone below". That's a narrative problem as well as a technical one. The 40 m overpass collapse is the document's signature image of tearing down the city. If it can't fit the prototype map, or has to be scripted, the headline promise shrinks to "break a pillar." My F5 assumed collapse would work and only questioned whether it lasted. FL shows it may not happen at the advertised scale at all. If the spectacle gets scripted, author it as an excursion beat, such as the overpass coming down when the wave-5 boss arrives, rather than leaving it to emergent chance.

### systems-designer

**CONNECTION: SD F4 (tradeoffs skip the five-stat model).** The parts table promises flavor ("punch through 3 layers of concrete", "launches mechs through walls") through flat modifiers that bypass the stats. For the story, it matters that the stat model is the player's language for their mech. If slag-plating says "30% slower" in the parts list but the garage preview shows Weight, the player can't trust what the garage tells them about their machine. That undercuts the "rebuild your mech" fantasy as much as it undercuts tuning.

### Revisions to my Round 1

- **F1: downgrade BLOCKING → MAJOR (narrative lens).** The blocking decision (co-op or not, campaign or not) belongs to scope. BA F1 and FL F1 own it, and five reviews already cover it. My remaining narrative ask is smaller: once scope is set, define a level as an account-level zone unlock above excursions, and keep the reveal.
- **F2: keep MAJOR, strengthened.** If BA F3's cut goes through, the mech-vs-mech pitch lines lose their last deferred payoff. The prototype's mag-winch rewrite shows the drift has already started without anyone deciding it.
- **F4: keep MAJOR, revise the fix.** Make the wave-3 boss a simpler grounded encounter (per PP F2) and the sniper the wave-5 climax on a skyline the player has wrecked (per AQA F2 / FL F5). "Bounty" still needs explaining or renaming.
- **F5: upgrade MINOR → MAJOR.** Combined with PP F1 and SD F3, the missing extraction beat is now part of fixing the death spiral, not just a matter of polish. A played, optional extraction after wave 3 is the single change that addresses my F4, my F5, PP F1 and SD F3 together.
- **F3: unchanged (MAJOR),** but it should be delivered inside BA F2's positioning section rather than as a separate document.
