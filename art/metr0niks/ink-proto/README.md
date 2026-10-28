# Metr0niks ink prototype assets

Art and audio for `games/metr0niks/prototypes/prototype-ink.html` (see `games/metr0niks/prototypes/ink-prototype.md`).

- `sheets/`: the Scenario sprite sheets as generated (GPT Image 2.5, transparent backgrounds), stored as WebP. Prompts: `../prompts/p_inkproto_*.txt`.
- `sprites/`: the atlas the prototype loads, built from `sheets/` by `../source/ink_atlas.py` (`atlas.webp`, `atlas.json`, `atlas.js`, plus `ground.webp` and `garage.webp`). Rebuild after changing a sheet.
- `audio/`: sound effects (Sonilo V1.1) and music (Lyria 3 Clip and Pro) from Scenario, trimmed and loudness-normalized with ffmpeg. Prompts: `../prompts/p_inkproto_audio.txt`.

`../source/ink_scenario_gen.py` is the small Scenario API helper used to run the generations. No AI pseudo-text appears in these sheets; the garage background was regenerated without the concept's UI text.

`sheets/player_parts.webp` (Tim-o's puppet parts) was rejected by kr0 on 28 October 2026: the parts don't align and shouldn't be used. The prototype still loads it until a new, aligned parts sheet replaces it (see `games/metr0niks/feedback/human/2026-10-28-tim-o-animation-review.md`).
