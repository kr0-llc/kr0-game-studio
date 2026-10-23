# Brand rules

Last updated: 23 October 2026 · Owner: art-director, approved by kr0

## The r0 styling

The studio name and any game name that contains "r0" (kr0, Metr0niks) are written with a **zero, never a letter O**, and the **0 is highlighted in pink**.

- In HTML: `kr<span class="r0">0</span>`, with `.r0{color:var(--r0-pink)}`.
- Pink token: `--r0-pink` (exact hex still to be set by kr0; until then the site should not substitute another accent colour for the 0).
- Plain text and file names keep the zero but have no colour: `kr0`, `metr0niks`.

**Known drift:** the studio site (`site/index.html`) currently colours the 0 with the amber `--accent`, not pink. Fix it when the pink hex is set.

## Per-game brands

Each game keeps its own palette and type in its art board or art README:

- Blackletter: Canterbury blackletter masks, white ink on black with crimson ([art/blackletter/README.md](../art/blackletter/README.md))
- Dual Tech: [art/dual-tech/board/index.html](../art/dual-tech/board/index.html)
- Metr0niks: [art/metr0niks/board/index.html](../art/metr0niks/board/index.html)
