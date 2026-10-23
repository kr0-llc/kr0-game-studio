# Art style guides

Last updated: 23 October 2026 · Owner: art-director

Each game's art board draws the same subjects in competing styles. kr0 picks one per game; until then the column says "Not chosen".

| Game | Candidate styles | Chosen | Where |
| --- | --- | --- | --- |
| Blackletter | Woodcut ink and crimson (tabletop card art, Figma concept art) | Woodcut ink and crimson | [art/blackletter/README.md](../art/blackletter/README.md) |
| Dual Tech | A: prototype blockout (flat navy shapes) · B: pitch 16-bit pixel art · C: Art Nouveau stained glass | Not chosen | [art/dual-tech/board/index.html](../art/dual-tech/board/index.html) |
| Metr0niks | A: prototype blockout voxels (slate, rust, cyan) · B: pitch rust and sparks micro-voxels · C: sun-bleached ligne-claire ink | Not chosen | [art/metr0niks/board/index.html](../art/metr0niks/board/index.html) |
| Dropfront | None yet | Not chosen | |

## Rules for every game

- Save every generated image's prompt in `art/<name>/prompts/` and note the tool and model on the art board.
- Art drawn in code keeps its script in `art/<name>/source/`.
- Build captures are screenshots of the current prototype, kept in `art/<name>/screenshots/`.
- Remove garbled AI pseudo-text by cropping or regenerating, and say so in the README.
