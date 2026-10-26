# Metr0niks ink prototype: art and audio

Last updated: 26 October 2026 · Requested by kr0 · Status: exploration, nothing here is a GDD rule yet

The ink prototype (`prototype-ink.html`) tests whether the game can look like art board style C, sun-bleached ink, instead of voxels. It is a second, separate prototype: `prototype.html` and `sim.js` are unchanged. It also carries the first music and sound effects the game has had, made cheaply on Scenario.

Play it: open `games/metr0niks/prototype-ink.html` from a local web server at the repo root (it loads `sim.js` and the art in `art/metr0niks/ink-proto/`), or use the published copy linked in INDEX.md.

## What it is

One playable excursion in a 2D, three-quarter top-down view:

- **Garage:** the Scenario garage background with the mech idling on the lift and aiming at the mouse; the six slots with the starter build; banked scrap; Drop in. A music toggle switches between the two directions below.
- **Battle:** five waves on one desert-slum map under the overpass (3 bots; 4 bots and a loader; 4 bots and the boss; 6 bots and 2 loaders; 5 bots, a loader and the boss). The boss is the jumper/sniper role, drawn as the spider scuttler.
- **Player:** WASD drive, mouse aim, left click minigun with heat and overheat lockout, right click hold and release on the timing ring for the pile bunker (Perfect, Good, Miss), Space dash. Keyboard and mouse only (GDD-D29).
- **Destruction:** every building and prop takes damage, shakes, shows ink cracks, then collapses into flying debris, dust and a rubble pile and drops scrap. Big buildings crush enemies beside them; barrels, canisters and cars explode.
- **Extract or wreck:** clear wave 5 and the mech jets out with its scrap, which is banked (browser storage). Get wrecked and the scrap is lost.

The numbers (speeds, weapon damage, heat, ring timings, enemy stats, waves) are read from `sim.js` at load, so they match the main prototype. The world is a simple 2D stand-in: there are no voxels, zones, pods, parts shop, levels or co-op.

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

**Known art gaps.** The mechs are drawn facing one way and mirrored, so there is no back view when walking up the screen. Legs are rigid pieces, so knees bend only a little. Only the starter parts (minigun, pile bunker, jump jets) have art; the other 18 parts need sheets. Buildings have one damaged state (cracks drawn in code) and one rubble sprite.

## Audio

### What was made

All from Scenario on 26 October 2026, about 119 credits in total including the art.

| Set | Model | Cost each | Files |
| --- | --- | --- | --- |
| 19 sound effects | Sonilo V1.1 Text to SFX (licensed for commercial use) | 3 credits | minigun, pile, perfect, ring, enemy_shot, explode, collapse, hit_building, scrap, step, dash, hurt, overheat, ui_click, ui_confirm, drop, enemy_die, claw, jump_land |
| Desert funk music: garage loop, extract sting, wrecked sting | Google Lyria 3 Clip | 6 credits | music_garage, music_extract, music_wrecked |
| Desert funk combat loop (2 min 27 s; intro plays once, then 16 s to 144 s loops) | Google Lyria 3 Pro | 12 credits | music_battle |
| Synthwave garage and combat loops | Lyria 3 Clip and Pro | 6 and 12 credits | synth_garage, synth_battle |

Sound effects are trimmed, loudness-normalized and mono; prompts are in `art/metr0niks/prompts/p_inkproto_audio.txt`. Other cheap options on Scenario: MM Audio 2 sound effects at 2 credits and Meta MusicGen. ElevenLabs sound effects and music cost 30 credits each. No open-source packs were used; the usual CC0 sources (Kenney, OpenGameArt, Freesound) are blocked from this environment, so pulling those would have to happen on kr0's machine.

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
2. Pick the music direction: synthwave (GDD-D26) or desert funk.
3. Whether the ink prototype should move onto `sim.js` (a 2D renderer over the real sim) or stay an art test.
