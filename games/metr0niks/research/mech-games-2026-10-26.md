# What makes mech games fun: research for Metr0niks

Oct 26, 2026 · researcher: a separate Claude agent with web search · for kr0 and the game-designer

**How this was gathered.** About 30 web searches. Direct page fetches failed in that environment, so every claim comes from the search-result excerpts of the cited pages; no full article was read and no talk was watched. Forum posts, fan wikis and student blogs are labelled as such. **(Reading)** marks the researcher's inference, not a sourced fact. No sales figures are quoted. Implications for Metr0niks are suggestions, not decisions; several would change decisions already made and need kr0.

## 1. The mech fantasy

- **Weight versus clunkiness is the central tension.** MechWarrior 5 reviewers: "you feel the heavy weight of your 'mech as you surge forward" (Impulse Gamer); mechs are "a pleasure to handle" (PC Gamer). The same game drew complaints about throttle drift and realigning legs with the torso (GameRevolution, Outer Haven). An itch.io developer: "there's a fine balance between impactful and clunky"; another kept screen shake low because it "hindered aiming" and made the mech feel less heavy (practitioner opinion).
- **Body-part identity.** Torso twisting "to show strong armor to the enemy" (PC Gamer, MW5) and moving legs and torso separately (Destructoid) make the mech a machine you operate.
- **The build is self-expression.** Armored Core VI's director Yamamura wanted Assembly to change "the play and feel as an action game", not just stats (PlayStation Blog, Gematsu). Custom Robo reviewers treat customisation as the core (Nintendo World Report). Crossout reviewers call building "the part that is the most fun" (TheXboxHub).
- **Scale is felt through contrast.** Brendan Keogh: if Titans are "giant, clunky", pilots must be their opposite, and levels need spaces a Titan can't enter (brkeogh.com).
- **The controller fantasy.** Steel Battalion's 44-input controller with an eject button; failing to eject deleted the save (Wikipedia, GameSpot). Some critics called that "a step too far" (Everygamegoing).
- **Sound sells mass.** On the AC6 Steam forums one player said mechs feel "so light and don't make any sound when they move"; another found them "powerful as heck" (forum opinion).

## 2. Design principles

| # | Principle | Seen in (cited) | Implication for Metr0niks |
| --- | --- | --- | --- |
| 1 | The build changes how you play, not only numbers | AC6 Assembly goal (PlayStation Blog); EN and weight limits mean "you can't equip everything" (Inquirer); Custom Robo bombs differ by how they launch (NWR) | Each slot should change a verb (turn rate, dash, heat curve, ATB fill), not only a stat total |
| 2 | Heat pushes choices, not punishment | MW5 and BattleTech shutdown leaves you defenceless (GameRevolution, koehntopp blog); MWO lets you override shutdown at the risk of ammo explosions (MWO dev blog via GameBanshee) | A deliberate "push past the limit" option could make heat a gamble rather than a hard stop |
| 3 | Show enemy intent before it lands | Into the Breach telegraphs; Subset: "a push to be more deterministic" (Game Developer IGF interview, PC Gamer preview) | Readable wind-ups make positioning and overpass drops a plan |
| 4 | The environment is a weapon and a stake | Into the Breach pushes into water and acid; lost buildings weaken you (PCWorld, Fandom, Game Developer). Red Faction Guerrilla towers toppled with guards on top (Raymond Camden) | Overpass drops get stronger if the city also matters to you (cover you need, a route you might cut) |
| 5 | Targeted damage tells a story | Front Mission lost arms disable weapons (Wikipedia, Siliconera); BattleTech salvage depends on how you kill (GameBanshee, PC Gamer, Steam forum) | How you kill an enemy could decide its scrap (Metr0niks already doubles scrap on a Perfect pile-bunker kill) |
| 6 | A big, readable payoff for staggering | AC6 Impact bar: staggered enemies take "almost double" damage (Gfinity); bosses reward aggressive stagger play (PCGamesN) | A Perfect could add stagger, opening a window for a follow-up or co-op combo |
| 7 | Turn waiting into an active, skilled beat | Gears active reload turns "a vulnerable passive moment into an active one" (Rod Fergusson, Time); Legend of Dragoon's timed counters "disrupt combat flow" (Game Informer member review) | The ATB ring must never freeze or hide the fight around it |
| 8 | Pair contrasting bodies | Titanfall pilot and titan (Keogh); Brigador lights use cover, heavies tank (Steam discussion, PC Gamer) | In co-op, light and heavy builds should need each other |
| 9 | Take the sting out of failure | Hades: "Take the sting out of failure" (Kasavin, Inlander); no "game over" feel (Tom's Guide) | A reset to level 1 needs something new on the climb back, or 50 levels feel like a treadmill **(reading)** |
| 10 | Extraction is a bank-or-push choice | Extraction shooters run on "loss aversion and delayed gratification" (Insider Gaming); gear fear (UofT student blog); "bank-it-or-lose-it" (Co-Optimus blog) | The researcher suggests extracting after any wave; this conflicts with GDD-D8 (no early cash-out) |
| 11 | Keep choices legible | Daemon X Machina's arsenal "starts to blend together" (Zelda Universe); Mech Engineer one of "the most inaccessible games" (PCGamesN) | Five trade-off axes across six slots need side-by-side comparison in the garage |
| 12 | Fit control complexity to the camera | Brigador's tank controls "cumbersome" (PC Gamer, Killscreen); its later "Screen Absolute" twin-stick option was received better (GamingOnLinux 2016) | Brigador is the closest relative: isometric, separate legs and torso, destructible city. Metr0niks already uses screen-relative legs |
| 13 | Co-op equal for both players | MW5 co-op: only the host manages the company; guests "sit around" (Outer Haven). Deep Rock Galactic: "Co-op First" (Co-Optimus interview) | Both players need garage ownership and their own scrap at risk; ties to the co-op save question in the Oct 26 critique |
| 14 | Find the fun in the tech first | Teardown was "just a voxel destruction sandbox" before its heist structure (TechRadar) | Prototype overpass drops as a toy before balancing them as a weapon |

## 3. Mechanics worth studying

- **Movement and weight:** MW5 torso twist and throttle (and its leg-alignment complaints); Titanfall 2 sped up heavy Titans' dash recharge after its tech test (EA blog): heavy needn't mean sluggish; AC6 light-build dodging; ZOE2's fast grabs and dash attacks (Konami, GameSpot); an MWO forum idea to tie reticle sway to the walk cycle.
- **Weapons and heat:** MW and BattleTech shutdown, MWO's override; AC6 four weapon slots combined for stagger (Gematsu); Gears active reload; Custom Robo's gun, bomb and pod roles (NWR).
- **Customisation:** AC6 EN and weight limits and being "overburdened" (Inquirer, Steam); BattleTech salvage needs three parts per mech (GameBanshee); Robocraft and Crossout free-form building with "almost no damage feedback" (TheXboxHub).
- **Destruction:** Red Faction Guerrilla's per-material sounds and buildings collapsing under their own weight (Multiplayer.it, Gamewatcher); Volition's designers had to "practically train as structural engineers" (Gamewatcher); Brigador destruction earns money (Wikipedia); Teardown chose voxels for the look and found they helped design (Shacknews).
- **Enemies and encounters:** Into the Breach telegraphs and very low randomness; AC6 bosses as stagger duels; Daemon X Machina enemies that "no single weapon type" handles well.
- **Run structure and loss:** Hades death moves the story and the Mirror of Night gives permanent power; Rogue Legacy carry-over currency (GMTK) against the critique that meta-unlocks blur skill with grinding (Piefed thread); Tarkov gear fear; Hunt: Showdown withholds information for tension (PS Blog).
- **Co-op:** Deep Rock Galactic class roles, quick revives and a drone that revives solo players four times (Prima); Helldivers 2 always-on friendly fire as part of the charm, with some deaths feeling "cheap" (Tom's Guide, CGM); MW5's host-only campaign as the cautionary case.

## 4. Common pitfalls and exposure

Exposure ratings are the researcher's reading.

| Pitfall | Evidence | Exposure |
| --- | --- | --- |
| Controls clunky rather than heavy | MW5 throttle and legs (Outer Haven); Brigador tank controls (PC Gamer) | High: separate legs and torso carry the same risk |
| Timing minigame breaks the flow | Dragoon counters "disrupt combat flow" (GI member review) | High: the ATB ring sits inside real-time combat |
| Too many weapons that blend together | Daemon X Machina (Zelda Universe, Press Start) | Medium |
| Inaccessible builder | Mech Engineer (PCGamesN, Steam) | Medium |
| Harsh loss that feels unfair | Steel Battalion save wipe "a step too far" (Everygamegoing) | High: losing match scrap and resetting to level 1 stack |
| Grind replacing skill | Meta-progression critique (Piefed, forum) | Medium: owned parts carry over, so power creep can flatten 50 levels |
| Unequal co-op | MW5 host-only campaign (Outer Haven) | Medium |
| Weak damage feedback | Crossout (TheXboxHub) | Medium |
| Repetitive missions or enemies | Daemon X Machina (VGC), ZOE2 M∀RS (TheSixthAxis), Into the Breach "same-y" (Fandom) | Medium: five waves over 50 levels |
| Live-service failure | Hawken: no official postmortem; fans blame pay-to-win variants, thin content and tech debt (Steam threads, unverified); servers closed in 2017 (bit-tech) | Low |
| Monetisation backlash | Crossout pay-to-win complaints (Steam, CGM) | Low unless parts are sold |

## 5. Audio

- **Warnings and the cockpit voice.** MWO brought back "Bitching Betty", the classic MechWarrior cockpit voice, by player demand (DSOGaming). An MW5 mod swaps in MW2-era heat lines (Nexus Mods), which suggests attachment to those lines **(reading)**. For Metr0niks: rising heat cues before the lockout.
- **A voice for each mech.** Titanfall 2 Titans each have their own voice and movement style (The Sound Architect); Respawn's sound team discussed weapons, robot vocalisations and recording shipping-container impacts (A Sound Effect); embark, exit, walking and footsteps were separate jobs in Titanfall (Prima eGuide).
- **Footsteps and mass.** The AC6 forum split shows footsteps decide whether a mech feels light or heavy.
- **Destruction audio.** Red Faction Guerrilla gave each material its own sounds (Multiplayer.it); Designing Sound covers its physics audio.
- **Sound as information.** Hunt: Showdown's audio pillars are feedback, immersion and emotion, with readable sounds and missing information used for tension (PS Blog, 80.lv).
- **Synthwave and retrowave references:** Brigador, scored by Makeup and Vanity Set, over 3 hours of music (Steam; NewRetroWave). Furi, with Carpenter Brut, Danger, Lorn and others, each briefed on one boss, tracks evolving with fight phases (The Game Bakers, NewRetroWave). Hotline Miami, whose music dies down when a floor is cleared (Wikipedia, Giant Bomb). AC6's synth-heavy score (fan soundtrack site, low reliability).

## 6. Sources

**Armored Core VI:** https://blog.playstation.com/?p=383443 · https://gematsu.com/2023/02/armored-core-vi-fires-of-rubicon-producer-yasunori-ogura-talks-mech-action-at-taipei-game-show-2023 · https://egmnow.com/armored-core-vi-wont-have-soulsborne-type-gameplay-miyazaki-says/ · https://www.pcgamesn.com/armored-core-6/review-pc · https://www.gfinityesports.com/guides/armored-core-6-impact-bar-stagger · https://technology.inquirer.net/127378/armored-core-6-review/amp · https://steamcommunity.com/app/1888160/discussions/0/3820795131605560917 · https://nmiagaming.com/?p=160377 · https://a2zsoundtrack.com/armored-core-6-soundtrack/

**Titanfall 2:** https://labs.invenglobal.com/articles/1230/redesigning-titan-combat-strategical-decisions-that-made-titanfall-great-again · https://brkeogh.com/2016/11/04/notes-on-titanfall-2/ · https://ea.com/games/titanfall/titanfall-2/amp/news/tech-test-and-feedback · https://asoundeffect.com/titanfall-2-sound/ · https://www.thesoundarchitect.co.uk/titanfall-2-pre-alpha-tech-test-audio-review/ · https://primagames.com/eguides/titanfall-eguide/behind-the-scenes/audio

**MechWarrior 5 and Online:** https://www.pcgamer.com/uk/mechwarrior-5-mercenaries-review/ · https://destructoid.com/?p=253697 · https://www.gamerevolution.com/review/622541-mechwarrior-5-mercenaries-review · https://www.impulsegamer.com/mechwarrior-5-mercenaries-review/ · https://www.theouterhaven.net/2019/12/mechwarrior-5-mecenaries-review/ · https://gamebanshee.com/d989 · https://www.dsogaming.com/?p=40276 · https://www.nexusmods.com/mechwarrior5mercenaries/mods/179 · https://mwomercs.com/forums/topic/141070-retical-sway/

**BattleTech (HBS):** https://blog.koehntopp.info/2018/04/26/harebrained-battletech/ · https://www.pcworld.com/article/3269232/battletech-review-pc-performance.html · https://pcgamer.com/how-battletech-mixed-defeat-with-victory · https://www.gamebanshee.com/k4y8h · https://opencritic.com/game/5947/battletech/reviews

**Brigador:** https://www.pcgamer.com/brigador-review/ · https://www.gamespot.com/reviews/brigador-review/1900-6416481/ · https://www.killscreen.com/brigador-wants-you-die-dignity/ · https://gamingonlinux.com/2016/10/testing-out-brigador-with-the-new-control-scheme-destroy-everything · https://en.wikipedia.org/wiki/Brigador · https://store.steampowered.com/app/1239511/Brigador__Vol_II/ · https://newretrowave.com/2016/12/26/top-ten-retrowave-albums-of-2016/

**Into the Breach:** https://gdcvault.com/play/1025772/-Into-the-Breach-Design · https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i- · https://pcgamer.com/into-the-breach-preview · https://www.fandom.com/articles/into-the-breach-review · https://www.pcworld.com/article/408011/into-the-breach-review.html · https://digitaltrends.com/gaming/into-the-breach-review

**Zone of the Enders:** https://gamespot.com/reviews/zone-of-the-enders-the-2nd-runner-review/1900-2912559/ · https://www.konami.com/games/zoe2/english/review_01.html · https://www.cgmagonline.com/reviews/zone-of-the-enders-the-2nd-runner-m%e2%88%80rs-playstation-4-review/ · https://www.thesixthaxis.com/?p=321862

**Custom Robo:** https://www.nintendoworldreport.com/review/4233/custom-robo-gamecube · https://superphillipcentral.com/2013/12/custom-robo-gcn-retro-review.html

**Front Mission:** https://en.wikipedia.org/wiki/Front_Mission_(video_game) · https://www.siliconera.com/front-mission-fine-tuned-for-the-ds/ · https://www.giantbomb.com/front-mission-4/3030-771/

**Hawken:** https://steamcommunity.com/app/705040/discussions/0/3833171151458337696 · https://bit-tech.net/news/reloaded-games-announces-hawken-end-of-life/1 · https://cinemablend.com/games/Hawken-Finally-Making-Comeback-70708.html

**Crossout and Robocraft:** https://www.thexboxhub.com/crossout-review/ · https://www.mmobomb.com/review/crossout · https://www.cgmagonline.com/2017/05/25/crossout-preview-promising-vehicular-combat/

**Daemon X Machina:** https://videogameschronicle.com/review/daemon-x-machina · https://press-start.com.au/reviews/nintendo-switch/2019/09/16/daemon-x-machina-review-fast-and-frenetic/ · https://zeldauniverse.net/features/review-daemon-x-machina-offers-a-lot-but-doesnt-always-deliver/ · https://shacknews.com/article/116313/daemon-x-machina-pc-review-mid-grade-mech-goodness

**Mech Engineer:** https://www.pcgamesn.com/mech-engineer/steam-robot-game · https://www.steampulse.org/game/1428520

**Steel Battalion:** https://en.wikipedia.org/wiki/Steel_Battalion · https://www.gamespot.com/xbox/action/steelbattalion/review.html · https://everygamegoing.com/larticle/steel-battalion/58438 · https://gamecritics.com/mike-bracken/my-secret-gaming-shame-i-paid-full-price-for-steel-battalion

**Red Faction Guerrilla:** https://multiplayer.it/articoli/gdc-2009-red-faction-guerrilla-anteprima.html · https://www.gamewatcher.com/2009-24-03-volition-five-to-ten-years-ahead-of-everyone-with-red-faction · https://designingsound.org/2010/04/01/audio-implementation-greats-6-physics-audio-part-1/ · https://www.raymondcamden.com/2009/07/04/review-red-faction-guerrilla-xbox-360 · https://gameinformer.com/games/red_faction_guerrilla/b/xbox360/archive/2009/09/22/review

**Teardown:** https://www.techradar.com/gaming/consoles-pc/teardown-devs-top-priority-is-always-physics-the-game-can-come-later · https://www.shacknews.com/article/135274/tuxedo-labs-teardown-interview · https://filmstories.co.uk/gaming/teardown-looking-ahead-to-a-delightfully-destructive-sandbox

**Hades and roguelite meta-progression:** https://www.tomsguide.com/uk/features/hades-exclusive-interview-supergiant · https://inlander.com/culture/hades-writer-greg-kasavin-on-how-he-made-video-game-deaths-drive-a-feel-good-story-22725237 · https://amara.org/subtitles/7doGHxwrhRpX/en/1/download/Roguelikes%20Persistency%20and%20Progression%20%20Game%20Makers%20Toolkit.en.txt · https://piefed.keyboardvagabond.com/c/games/p/232999/meta-progression-in-roguelites-was-fun-for-a-while-but-it-s-starting-to-f

**Extraction games:** https://insider-gaming.com/love-or-hate-extraction-shooters-wild/ · https://cmsweb.utsc.utoronto.ca/c46blog-f19/?p=1296 · https://www.co-optimus.com/blog/article-poster/3326/risk-timing-and-nerve-the-game-mechanics-that-test-when-to-cash-out.html · https://blog.playstation.com/?p=221483 · https://80.lv/articles/crytek-on-the-sound-design-of-hunt-showdown

**Timing mechanics:** https://techland.time.com/2011/09/16/epics-rod-fergusson-talks-gears-of-war-3/print/ · https://primagames.com/eguides/gears-war-3-eguide/multiplayer/gears-concepts · https://legendofdragoon.org/interviews/yasuyuki-gb-tm/ · https://gameinformer.com/games/members/b/natea64_blog/archive/2018/03/19/review-the-legend-of-dragoon

**Co-op:** https://www.co-optimus.com/editorial/1978/page/2/indie-ana-co-op-and-the-deep-rock-galactic-interview.html · https://game-wisdom.com/critical/creating-compelling-coop-design · https://primagames.com/featured/deep-rock-galactic-review · https://www.tomsguide.com/reviews/helldivers-2 · https://www.cgmagonline.com/review/game/helldivers-2-xbox/

**Music:** https://www.thegamebakers.com/?p=2574 · https://newretrowave.com/2016/07/28/furi-ost-review/ · https://www.decibelmagazine.com/?p=12184 · https://en.wikipedia.org/wiki/Hotline_Miami · https://www.soundandvision.com/content/sv-interview-devolver-digitals-nigel-lowrie-talks-hotline-miami

**Game feel (practitioner opinion):** https://www.wayline.io/blog/weapon-feel-indie-games · https://gamedev.net/blogs/entry/2260566-the-mechanical-heart-good-vibrations

**Gaps:** the full GDC talks (Into the Breach postmortem, Titanfall 2 "Solving Titan sized problems", Red Faction Guerrilla 2009) weren't readable; the Into the Breach talk is reported to be free on GDC's YouTube channel. No source on Hawken's mech feel, no official Hawken postmortem, no source on Titan footsteps. Mech-weight advice is mostly forum and blog opinion.
