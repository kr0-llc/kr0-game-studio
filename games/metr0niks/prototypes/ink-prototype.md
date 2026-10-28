# Metr0niks ink prototype: art and audio

Last updated: 28 October 2026 · Requested by kr0 · Status: exploration, nothing here is a GDD rule yet

The ink prototype (`prototypes/prototype-ink.html`) tests whether the game can look like art board style C, sun-bleached ink, instead of voxels. It is a second, separate prototype (prototype 2): `prototypes/prototype.html` is prototype 1 (voxels). The two stay separate builds while kr0 compares the directions, but both observe the same rules: the GDD, keyboard and mouse only, no Gauntlet, and the numbers in `simulations/sim.js` (GDD-D32). It also carries the first music and sound effects the game has had, made cheaply on Scenario.

Play it: open `games/metr0niks/prototypes/prototype-ink.html` from a local web server at the repo root (it loads `simulations/sim.js` and the art in `art/metr0niks/ink-proto/`), or use the published copy linked in INDEX.md.

## What it is

One playable excursion in a 2D, three-quarter top-down view:

- **Garage:** the Scenario garage background with the mech idling on the lift and aiming at the mouse; the six slots with the starter build; banked scrap; Drop in. A music toggle cycles through the music directions below.
- **Battle:** five waves on one desert-slum map under the overpass (3 bots; 4 bots and a loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, a loader and the boss). The boss is the jumper/sniper role, drawn as the spider scuttler.
- **Player:** WASD drive, mouse aim, left click minigun with heat and overheat lockout, right click hold and release on the timing ring for the pile bunker (Perfect, Good, Miss), Space dash. Keyboard and mouse only (GDD-D29).
- **Destruction:** every building and prop takes damage, shakes, shows ink cracks, then collapses into flying debris, dust and a rubble pile and drops scrap. Big buildings crush enemies beside them; barrels, canisters and cars explode.
- **Extract or wreck:** clear wave 5 and the mech jets out with its scrap, which is banked (browser storage). Get wrecked and the scrap is lost.

The numbers (speeds, weapon damage, heat, ring timings, enemy stats, waves) are read from `sim.js` at load, so they match the main prototype. The world is a simple 2D stand-in: there are no voxels, zones, pods, parts shop, levels or co-op. Those are gaps against the shared rules, not different rules: when one is added, it follows the GDD and `sim.js`.

## How the art is made

Part generated, part drawn in code, as kr0 asked.

| Layer | Made by | Where |
| --- | --- | --- |
| Mech and enemy parts (torso, thigh, shin, arms, pack; enemy hulls, legs, claws) | Scenario, GPT Image 2.5, transparent background, using kr0's Tim-o sheets from the "metr0niks" collection as reference | `art/metr0niks/ink-proto/sheets/` |
| Buildings, props, debris pieces, explosion and dust effects, ground texture, garage background | Scenario, same model | same |
| Sprite atlas (slicing the sheets, scaling, joint positions) | `art/metr0niks/source/ink_atlas.py` | `art/metr0niks/ink-proto/sprites/` |
| Cut-out puppet animation: walk cycle, idle breathing, aiming arms, recoil, squash on landing, hit flash, crab and spider gaits, boss jump | Code | `prototype-ink.html` |
| Debris physics, shots, timing ring, shadows, ink cracks, lane paint, paper grain and frame, HUD panels | Code | `prototype-ink.html` |

Prompts are in `art/metr0niks/prompts/p_inkproto_*.txt`. Enemies use a rival palette (slate blue, coral, mustard, a skull-gear insignia) so they read apart from the peach and sage player at a glance.

**Known art gaps.** The mechs are drawn facing one way and mirrored, so there is no back view when walking up the screen. The arms are flat cut-outs, so their drawn aim is limited to about 45° up and 55° down; past that they would read as detached (the shots still go where you aim). Only the starter parts (minigun, pile bunker, jump jets) have art; the other 18 parts need sheets. Buildings have one damaged state (cracks drawn in code) and one rubble sprite.

## Renderer (27 October 2026)

kr0 decided the ink renderer stays in this prototype and is built out here, not ported onto the voxel build (GDD-D32). This round adds, all in code in `prototype-ink.html`:

| Feature | What it does |
| --- | --- |
| Bending legs | Two-bone IK on the mechs' legs: feet plant and slide back in stance, lift forward in swing, knees bend forward, and stride is sized from the gait so feet don't skate. Walking backwards swings the feet the other way. Legs dangle during the drop-in |
| Cast ink shadows | Sun from the upper left. Every standing prop and mech throws its silhouette onto the ground toward the lower right, gathered in one layer so overlaps don't double up, then filled with an ink cross-hatch |
| Chunked building damage | Big buildings lose bites from their roofline at 40% and 70% damage: holes with a dark inner rim and an ink edge, plus a spray of debris. The cut copy also casts the shadow, so the shadow loses the same bites |
| Ground decals | Scorch marks with ink splatter at explosions and wrecks, a dust stain where a building fell, a cracked crater where the boss lands, and footprints from every walking mech. They stay for the whole run |
| Comic bursts | CRASH! and KA-BOOM! pop in on a spiky coral burst |
| Line boil | Ink cracks redraw slightly six times a second, like hand-drawn animation |
| Arm aim limits | The drawn arm angle is clamped so cut-out arms stay attached to the shoulder |

**Performance (28 October 2026).** Measured in headless Chromium with software rendering (no GPU, so absolute numbers are pessimistic) at 1600 × 900, in a heavy battle with nine enemies, wrecked buildings, blasts and the minigun firing. The first renderer round had dropped the prototype from about 41 to 19 frames a second, because the cast shadows were redrawn at full-screen size every frame (about 18 ms of script a frame). Now the ground, the prop shadows and the decals are baked into one map-sized layer that is rebuilt only when a prop is cut or destroyed, and only the mech shadows are drawn each frame. The result is about 45 frames a second, faster than before the renderer round, with about 1.4 ms of script a frame (mech drawing 0.27 ms, flying debris 0.24 ms, game update 0.20 ms). At 4K with a 2× pixel ratio the software renderer is pixel-bound at about 8 frames a second, against 7 before the renderer round; a real GPU should handle that easily, but it is worth a check on kr0's PC.

Still open in the renderer: a back view for walking up the screen, bending legs for the crab and spider enemies, and art for the other 18 parts. Tim-O's animation sets are a separate piece of work, after Asset Desk ships.

## Enemy lab (28 October 2026)

kr0 asked for a lab page to see all the enemies in the ink prototype. `prototypes/ink-enemy-lab.html` loads `prototype-ink.html` in a frame (open it from a local web server at the repo root, or use the published copy in INDEX.md). It is modelled on the voxel units lab and changes nothing in the prototype: it wraps the prototype's own `update`, `updateEnemy`, `hurtMech`, `wrecked` and `drawRing` from outside.

- **Enemies:** the gunner bot (patrol bot role), the heavy loader (crab) and the jumper boss (spider), each with a live portrait, its numbers from `sim.js`, and its atlas parts.
- **Behaviours on demand:** drop in, walk, fire or triple shot, tell and charge, ram a building, crouch and jump slam, a Perfect pile-bunker hit, a minigun hit, a building collapsing on it, destroy. With Enemy AI off, enemies stand idle between behaviours.
- **Time:** pause, 0.1×, 0.25×, 0.5× and 1×, plus single-frame and 10-frame steps (fixed 60 Hz steps).
- **Field:** a line-up of one of each, waves 1 to 5 with their real mix, can't die, range rings (sight, fire range, ram trigger, jump range and slam radius), clear and reset. Waves, extract and the banked scrap are off.

**Where the ink enemies differ from sim.js** (listed on each enemy's card; nothing changed): the bot engages from anywhere with no patrol, pods or line-of-sight check; the loader starts its tell at 5.3 m instead of 2.2 m and has no haul route; the boss is a ground jumper with a triple shot and a jump slam instead of the roof-perching Bounty sniper. These are gaps against GDD-D32 to fix when the ink prototype is worked on again (GDD-D46 has it paused as a look study).

**Animation review (28 October 2026).** kr0 asked for a place to review each enemy's animations and parts. The lab's second view (`ink-enemy-lab.html#review`) has, for each enemy, the Scenario source sheet, every animation as a frame player (play, step, 0.25× to 1×, onion skin, ground line, a frame strip) and every sprite part with its pivot and joints. Each animation and part takes a Keep, Fix, Redo or Drop mark, flagged frames, a note and review comments (the studio's animation review rule). Marks save to the published page's `verdicts` collection, one document per item (`bot-walk`, `part-l_hull`); a local copy keeps them in the browser. The frames are the prototype's own drawing code at fixed times, so they match the game. The first findings are in `feedback/synthetic/2026-10-28-ink-enemy-animation-review.md`.

The lab also lists the enemies in the GDD fun pass (PR #13) that are not in the ink prototype yet: Scuttler, Bulwark, Wrecker, Elite, Sniper pair, Juggernaut and the Warden.

## Audio

### What was made

All from Scenario on 26 October 2026, about 119 credits in total including the art.

| Set | Model | Cost each | Files |
| --- | --- | --- | --- |
| 19 sound effects | Sonilo V1.1 Text to SFX (licensed for commercial use) | 3 credits | minigun, pile, perfect, ring, enemy_shot, explode, collapse, hit_building, scrap, step, dash, hurt, overheat, ui_click, ui_confirm, drop, enemy_die, claw, jump_land |
| Desert funk music: garage loop, extract sting, wrecked sting | Google Lyria 3 Clip | 6 credits | music_garage, music_extract, music_wrecked |
| Desert funk combat loop (2 min 27 s; intro plays once, then 16 s to 144 s loops) | Google Lyria 3 Pro | 12 credits | music_battle |
| Synthwave garage and combat loops | Lyria 3 Clip and Pro | 6 and 12 credits | synth_garage, synth_battle |
| Desert rock / stoner metal: combat loop, garage loop, extract and wrecked stings | Lyria 3 Pro and Clip | 12 and 6 credits | rock_battle, rock_garage, rock_extract, rock_wrecked: **not made yet** (see below) |

Sound effects are trimmed, loudness-normalized and mono; prompts are in `art/metr0niks/prompts/p_inkproto_audio.txt`. Other cheap options on Scenario: MM Audio 2 sound effects at 2 credits and Meta MusicGen. ElevenLabs sound effects and music cost 30 credits each. No open-source packs were used; the usual CC0 sources (Kenney, OpenGameArt, Freesound) are blocked from this environment, so pulling those would have to happen on kr0's machine.

### Desert rock / stoner metal (27 October 2026)

kr0 asked to try another music style, desert rock or stoner metal. The prompts are written (fuzzed down-tuned guitars, overdriven bass, big roomy drums, slow heavy swagger, Kyuss and Queens of the Stone Age as reference, kept warm and fun rather than dark) and saved in `art/metr0niks/prompts/p_inkproto_audio.txt`. Scenario refused the jobs on 27 October because the team has used its plan's 5,000 creative units for the period, so the four tracks still need to be generated, for about 30 credits.

The prototype is ready for them: the garage toggle offers "desert rock" as a third option as soon as `audio/rock_garage.mp3` exists, and uses `rock_battle`, `rock_extract` and `rock_wrecked` for the other cues. Until then the toggle shows only desert funk and synthwave.

### The music question for kr0

The GDD's Audio section (GDD-D26) sets a synthwave and retrowave direction. That suits the voxel looks. For the ink look I also made a sunny desert funk direction (warm synths, wah guitar, dusty breakbeats, a little 1970s French sci-fi prog), which matches the Moebius-style art. The garage toggle plays either one so kr0 can compare. If the ink style is chosen, the audio direction should be chosen with it (logged as Proposed GDD-D30).

### What the full game still needs

Measured against the GDD's Audio tables, the prototype covers:

| Area | Covered | Still needed |
| --- | --- | --- |
| Music cues (7) | Garage, combat loop, extract sting, campaign-over sting | Boss layer for waves 3 and 5, breather between waves, victory theme; stems so the boss layer can sit on the combat loop |
| Mech | Footsteps (one set), dash, armor hit, overheat, destroyed | Footsteps for siege treads and strider legs, torso servo, low-armor alarm, cooled-down, partner down and revived |
| Light weapons | Minigun shot | Minigun spin-up and loop, shotgun, plasma torch loop, rail shot |
| Heavy weapons | Ring running, Perfect, pile strike | ATB ready, separate Good and Miss sounds, pile retract, bunker-buster fire and blast, mag-winch fire and reel |
| Shoulder | none | Mortar launch and impact, flash-vent |
| Enemies | Drop-in landing, bot fire, loader tell (claw), boss jump and slam, enemy destroyed | Sniper tell and shot, separate destroyed sounds per enemy |
| World | Building hit, collapse, explosion | Collapse creak warning, pillar down, zone shutter |
| Pods, scrap, match, interface | Scrap pickup, click, confirm | Pod countdown and landing, field repair, Overclock, enemy took a pod, wave start and clear, buy, upgrade, repair, can't afford |

That is roughly 40 more sounds and 3 more music cues. At Sonilo and Lyria prices this is about 120 to 200 credits with retakes. A mix pass (warnings over music, pitch variation, voice limits) is partly done in code: minigun, scrap and steps vary in pitch and are capped.

## Decisions to make

1. Pick the Metr0niks art style (art board: A blockout voxels, B pitch micro-voxels, C sun-bleached ink). If C, the voxel destruction rules in the GDD need a 2D equivalent.
2. Pick the music direction: synthwave (GDD-D26), desert funk, or desert rock / stoner metal (GDD-D34, once its tracks exist).
3. ~~Whether the ink prototype should move onto `sim.js` or stay an art test.~~ Settled: the two prototypes stay separate and the ink renderer is built out here (GDD-D32).
