# Mobile mech and shooter UX: what the mobile UI lab borrows

Oct 29, 2026 · @kr0 asked for it · researched by Claude · suggestions, not decisions

kr0 asked for four phone layouts for the voxel prototype that draw on how other mech and action games handle touch. This note lists what each reference does and what the [mobile UI lab](../prototypes/mobile-ui-lab.md) takes from it. The web sources found were thin (mostly player guides, no developer postmortems), so several points rest on how these games are commonly played rather than on a published design rationale. Each point says which.

## What the references do

| Game | Control pattern | Source | Used in |
| --- | --- | --- | --- |
| Brawl Stars | Left move stick, right attack stick: drag to aim and release to fire, tap for an auto-aimed quick shot. Guides say auto-aim works up close and manual aim at range | Player guides ([ar-pay](https://ar-pay.com/blog/en/articles/brawl-stars/), [boostroom](https://boostroom.com/blog/aim-better-in-brawl-stars-movement-peeking-and-shot-timing)); no Supercell source | Design 1, Twin stick |
| Call of Duty: Mobile, Warzone Mobile | Fire mode choice: manual, custom per weapon, or auto-fire; a second fire button on the left so the right thumb can keep aiming; movable HUD | [Activision blog](https://blog.activision.com/call-of-duty/2019-10/Getting-a-Grip-on-the-Call-of-Duty-Mobile-Controls), [Warzone Mobile blog](https://www.callofduty.com/blog/2024/03/call-of-duty-warzone-mobile-complete-control-plus-customization-controller-options) | Design 2 left Fire; auto-fire in Design 3 |
| Mech Arena | Left side moves the mech; right side aims, fires and holds the mech ability, which sits just above the big fire button | [BlueStacks guide](https://www.bluestacks.com/blog/game-guides/mech-arena/ma-features-guide-en.html) | Design 2, Cockpit |
| War Robots | Left stick drives; right side swipes to look; fire buttons per weapon group, and the fire button can be dragged to keep looking | Common play; the War Robots search found no mobile control guide | Design 2, dragging from Fire |
| Archero | One stick; the hero fires at the closest enemy only while standing still, so skill is positioning | [Pocket Gamer tips](https://www.pocketgamer.com/articles/083458/archero-tips-to-help-you-become-an-arrow-marksman/), [games.gg](https://games.gg/archero/) | Design 3, One thumb |
| Survivor.io, Vampire Survivors (mobile) | Portrait, one thumb, drag anywhere to move, auto-attack | Common play | Design 3 |
| Armored Core, MechWarrior | Lock boxes and target cycling: the player picks the target, the mech handles the tracking | Common play | Design 4, Lock-on |
| Mobile Legends and other MOBAs | Tap an enemy or its portrait to set a target; the attack button hits that target | Common play | Design 4 tap to lock |

## Principles taken

1. **The left thumb drives, everywhere.** Every reference with two thumbs puts movement on the left. All four designs do too (Design 3 drives anywhere).
2. **Aim assist scales with how hard the aim is.** A phone has no mouse; every reference adds some help, from Brawl Stars' tap-to-auto-aim to Archero's full auto. The four designs sit on that ladder: manual with snap (1), trackpad with snap (2), full auto (3), you pick, it aims (4). The prototype already snaps the torso to a bot near the cursor; the lab keeps that.
3. **Big, few, fixed buttons.** Mech Arena and War Robots keep one big fire button and two or three smaller ones in an arc the thumb reaches. Platform guidance puts touch targets at 44 pt (Apple) or 48 dp (Material) at least; the lab's smallest button is 48 px and fire is 92 to 104 px.
4. **Show cooldowns on the button, not in a list.** The references draw recharge as a ring on the ability button. The lab draws dash, pile charge, Q and heat as rings.
5. **Hold-to-fire on its own button is what lets one thumb aim and the other shoot** (CoD Mobile's left fire). The pile-bunker's hold-and-release timing maps well onto a held button.
6. **Upright play needs auto-fire.** The portrait games kr0 is likely to compare against (Archero, Survivor.io) are one-thumb games with automatic attacks; two sticks on an upright phone are cramped.

## What is specific to Metr0niks

- **Legs are 8-way.** The prototype reads WASD, so every stick is cut into eight directions. Analog movement would need a sim change (a GDD call).
- **The city is a weapon.** Shooting pillars to drop a span is a pillar of the game. Auto-aim at enemies alone can't do that, so Designs 3 and 4 need a way to aim at the ground (added after the critique).
- **Heat.** Auto-fire has to respect the 3 s lockout. Design 3 pauses at 85% heat and resumes at 40%.
- **The pile-bunker timing ring is the skill check.** Under a thumb, a ring drawn on the button is hidden; the critique moved it outside the button.
