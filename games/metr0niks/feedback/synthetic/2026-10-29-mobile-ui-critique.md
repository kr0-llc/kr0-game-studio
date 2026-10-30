# Mobile UI lab critique

Oct 29, 2026 · @kr0 asked for a critique round · Claude, using the design-critique method · reviewed: the four layouts of `prototypes/mobile-ui-lab.html`, first build, on a 390 × 844 phone held upright and sideways (844 × 390), in a phone emulator

## Overall impression

All four layouts play the real game on a phone, and the frame-scaling trick (the prototype drawn larger and scaled down) shows enough of the city upright. The biggest problems are shared, not per design: the upright HUD eats the top fifth of the screen, the pile-bunker timing ring sits under the thumb that is holding it, and the two auto-aim designs can't shoot the city, which is half of what makes Metr0niks Metr0niks.

## Findings

| # | Finding | Where | Severity | Recommendation | Done |
| --- | --- | --- | --- | --- | --- |
| 1 | The upright HUD is four bars plus a row of chips, about 140 px of an 844 px screen. Dash and pile bars repeat what the button rings already show | All, upright | 🔴 Critical | Drop the dash and pile rows; put armor and heat side by side in one strip; shrink the chips | Yes |
| 2 | The pile-bunker timing ring is drawn on the button, under the thumb holding it. Players time the release blind or look at the in-world ring far from their thumb | All | 🔴 Critical | Draw the closing and target rings as a halo larger than the button so they show around the thumb; add a short vibration when the ring enters the good window (Android) | Yes |
| 3 | One thumb and Lock-on can only aim at enemies. Shooting pillars to drop a span (GDD pillar: the city is a weapon) is impossible | 3, 4 | 🔴 Critical | One thumb: a quick tap on the street fires a burst at that spot. Lock-on: tapping empty ground locks the ground point (dashed pink marker), and FIRE shoots it | Yes |
| 4 | Twin stick: the aim stick only appears where the thumb lands, so the aim zone is invisible until touched, and in upright the right zone overlaps the Dash and Pile arc | 1 | 🟡 Moderate | Show a resting ghost of the aim stick at its home spot; keep the floating behaviour inside the zone | Yes |
| 5 | Upright: the pause button sits on top of the zone hints at the bottom edge, where the home bar gesture also lives | All, upright | 🟡 Moderate | Move pause to the top right, next to the HUD | Yes |
| 6 | Zone hints ("Drive", "Swipe to aim") stay on screen for the whole match at low contrast: noise after the first minute | All | 🟢 Minor | Fade them out after 6 s | Yes |
| 7 | Cockpit upright: the left FIRE button sat just above the drive stick, so a thumb reaching for the stick fired (seen in the emulator run) | 2, upright | 🟡 Moderate | Raise the left FIRE well clear of the stick | Yes (before the round) |
| 8 | One thumb: the auto-fire state chip is small and far from the thumb; it is the main thing a player needs to read | 3 | 🟡 Moderate | Larger chip, coloured by state (firing, cooling, off); heat strip stays next to it | Yes |
| 9 | The title's 0 in "Metr0niks" reads as a letter O in Chakra Petch | Picker | 🟡 Moderate (brand) | Set the pink 0 in JetBrains Mono, whose zero is dotted | Yes |
| 10 | Landscape: the HUD panel sits top left, where the mech often walks when heading up-left | All, sideways | 🟢 Minor | Fixed by finding 1 (the panel is half as tall) | Yes |
| 11 | No left-handed option: One thumb's Pile and Q sit bottom right | 3, and the right cluster in 1, 2, 4 | 🟡 Moderate | Add a Mirror switch | No: listed as a follow-up |
| 12 | The garage and menus are the prototype's desktop screens squeezed onto a phone (they work by tapping, but nothing is designed for a thumb) | All | 🟡 Moderate | Out of scope for this round (kr0 asked for the match UI); a phone garage is its own piece of work | No |
| 13 | Movement is 8-way because the sim reads WASD; on a stick that feels notchy next to analog games | All | 🟢 Minor | Needs an analog input in sim.js, a GDD and TDD call; not changed here | No |

## Visual hierarchy

- **What draws the eye first:** the fire button (big, rust) in Cockpit and Lock-on, the orange aim knob in Twin stick, the yellow Pile ring in One thumb. Right for each design.
- **Reading flow:** HUD at the top, city in the middle, controls at the bottom. After finding 1 the city gets the middle 70% upright.
- **Emphasis:** heat on the fire button ring (Cockpit) is the clearest heat read of the four.

## Consistency

| Element | Issue | Recommendation |
| --- | --- | --- |
| Colours | Cyan for movement and dash, rust for fire, yellow for pile, pink for lock: consistent across designs | Keep |
| Button shapes | Call-ins are rounded squares, everything else circles | Keep: they are consumables, not abilities |
| Labels | Q shows the part name (Breach, Red line) once a shoulder part is fitted | Keep |

## Accessibility

- **Contrast:** HUD numbers are near-white on a 72% black panel (passes); zone hints are decorative and fade (finding 6).
- **Touch targets:** smallest 48 px (call-ins), fire 92 to 104 px. Meets the 44 pt and 48 dp guidance.
- **Text:** HUD labels 10 px uppercase mono are small but secondary; numbers are 11 to 15 px.
- **Motion and haptics:** vibration can be switched off on the picker.

## What works well

- The game is unchanged: rules, numbers, audio, menus and saves are the prototype's.
- Rings on buttons (dash, pile, Q, heat) read at a glance without looking away from the mech.
- One thumb is the most different from the web version and the most comfortable upright.
- The Extract or Overtime prompt as two big buttons is better than the desktop prompt on any screen.

## Priority recommendations

1. **Free the upright screen** (finding 1).
2. **Make the pile timing readable under a thumb** (finding 2).
3. **Let auto-aim layouts shoot the city** (finding 3).
