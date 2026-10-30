# Metr0niks mobile UI lab

Oct 29, 2026 · @kr0 asked for it · built by Claude · decision: GDD-D58 (Proposed)

`prototypes/mobile-ui-lab.html` has four playable phone layouts for the voxel prototype (prototype 1, tuned build 10). Like the mechanics lab, it loads `prototype.html` in a frame and drives it through the prototype's test hook (`window.__m`): it writes the prototype's own keys and mouse and draws its own HUD. The renderer, rules, audio, menus, garage and saves are the real game's, and every number comes from `simulations/sim.js`. Neither file changes.

**Hypothesis:** at least one of these layouts makes the voxel prototype fun on a phone, and the way players aim decides which. If none does, GDD-D29 (keyboard and mouse only) stands.

The GDD says PC, keyboard and mouse only (GDD-D29). This lab doesn't change that: it gives kr0 something to try before deciding (GDD-D58).

## How to open it

- On a phone: the published copy linked in INDEX.md. Pick a layout, then Drop in from the title and garage as usual.
- Locally: from a web server at the repo root (for example `python3 -m http.server`), open `games/metr0niks/prototypes/mobile-ui-lab.html`. Desktop browsers with touch emulation work too.

## The four layouts

Research behind them: [mobile mech UX](../research/mobile-mech-ux-2026-10-29.md).

| # | Layout | After | Move | Aim | Fire | Best held |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Twin stick | Brawl Stars, CoD Mobile | Floating stick, left half | Aim stick, right half (ghost at rest) | Drag the aim stick; tap for a burst at the nearest enemy | Sideways |
| 2 | Cockpit | War Robots, Mech Arena | Fixed stick with an armor ring | Swipe the right side like a trackpad; the torso snaps to nearby enemies | Big Fire (heat ring), drag from it to keep aiming; second Fire on the left | Sideways |
| 3 | One thumb | Archero, Survivor.io | Drag anywhere | Automatic: the nearest enemy in sight within 12 m; a tap on the street fires a burst there | Automatic, pausing at 85% heat and resuming at 40% so guns never lock | Upright, one hand |
| 4 | Lock-on | Armored Core, MechWarrior, MOBAs | Floating stick, lower left | Tap an enemy to lock (pink), or the nearest is soft-locked (white); tap the street to lock a spot (dashed); Next cycles | Hold Fire | Either |

Every layout has Pile (hold when ready, let go when the closing ring turns green: the ring is drawn as a halo larger than the button so the thumb doesn't hide it, with a vibration tick on Android), Dash, the shoulder part (Q), call-ins 1 and 2 when carried, pause, and a big Extract or Overtime prompt after wave 5.

## Shared details

- **View:** during a match the frame is drawn larger and scaled down, so more of the city fits on a small screen without touching the prototype's zoom. Near, Mid and Far are set per orientation (defaults: Mid sideways, Far upright) from the pause screen.
- **Legs are 8-way:** sticks are cut into eight directions because the sim reads WASD.
- **Upright and sideways:** each layout rearranges on rotation; positions respect the safe areas.
- **Kept from the prototype:** title, garage, settings, toasts, the cockpit voice caption (moved up so it clears the buttons), the boss bar. Hidden: the desktop HUD, the keys table and the desktop Extract prompt.
- **Focus:** tapping the lab's controls would blur the frame and pause the game; the lab stops that blur before the prototype sees it. Backgrounding the app still pauses.
- **Saves:** the frame uses the prototype's own campaign save on that device.

## Critique round

The first build was reviewed with the design-critique method on a 390 × 844 phone held both ways: [critique](../feedback/synthetic/2026-10-29-mobile-ui-critique.md). Fixed in the same PR: the upright HUD cut to one strip, the pile ring moved outside the thumb, street aiming for One thumb and Lock-on (shooting pillars), the Twin stick ghost, pause moved to the top right, fading hints, a larger auto-fire chip, the Cockpit left Fire moved clear of the stick, and a dotted zero in the title.

Not done (follow-ups): a left-handed mirror, a phone garage and menus, analog legs (a sim.js and GDD call).
