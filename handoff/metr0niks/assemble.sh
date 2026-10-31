#!/usr/bin/env bash
# Builds the new Metr0niks repo (kr0-llc/metr0niks) from kr0-game-studio.
# Usage: handoff/metr0niks/assemble.sh /path/to/metr0niks
# Copies files only; never changes the studio repo.
set -euo pipefail
KIT="$(cd "$(dirname "$0")" && pwd)"
SRC="$(cd "$KIT/../.." && pwd)"
DEST="${1:?usage: assemble.sh DEST}"
G="$SRC/games/metr0niks"; A="$SRC/art/metr0niks"
mkdir -p "$DEST"/{design,decisions,feedback/human,feedback/synthetic,research,level-concepts,tuning-runs,art,game,tests/reference-sim,archive,.claude/agents,.claude/skills,.githooks}

# Rules, board, agents, tooling
cp "$KIT/CLAUDE.md" "$KIT/BOARD.md" "$KIT/package.json" "$DEST/"
cp "$KIT/mcp.json" "$DEST/.mcp.json"
cp "$KIT"/agents/*.md "$DEST/.claude/agents/"
cp -r "$SRC/studio/skills/gdd-designer" "$DEST/.claude/skills/"
cp "$KIT/pre-push" "$DEST/.githooks/pre-push" && chmod +x "$DEST/.githooks/pre-push"
cp "$KIT/tuning-runs/README.md" "$DEST/tuning-runs/"

# Design docs
cp "$G/gdd.md" "$G/tdd.md" "$G/proposals.md" "$G/open-questions.md" "$G/level-design.md" "$DEST/design/"
cp "$SRC/studio/gdd-template.md" "$DEST/design/"

# Archive: old versions, paused ink docs, old prompt, full tuning history
cp "$G"/superseded/*.md "$G/level-design-ink.md" "$G/artifacts/handoff-gdd-prompt.md" "$DEST/archive/"
cp "$G/tuning-history.md" "$DEST/archive/tuning-history-2026-10-29.md"

# Decision logs into decisions/: keep the 10 newest rows, archive the rest
trim() { # $1 source, $2 kept, $3 archive, $4 title
  awk -v keep="$2" -v arch="$3" '
    /^\| [GT]DD-D[0-9]+ / { n++; if (n <= 10) print > keep; else { if (!a++) printf "%s", hdr > arch; print > arch }; next }
    { if (n == 0 && $0 ~ /^\|/) hdr = hdr $0 "\n"; print > keep }' "$1"
  { printf '# %s, archived 2026-10-31\n\nRows trimmed from the live log. Newest first.\n\n' "$4"; cat "$3"; } > "$3.tmp" && mv "$3.tmp" "$3"
  printf '\nOlder rows: [archive](../archive/%s).\n' "$(basename "$3")" >> "$2"
}
trim "$G/gdd-decisions.md" "$DEST/decisions/gdd-decisions.md" "$DEST/archive/gdd-decisions-2026-10-31.md" "Metr0niks GDD decisions"
trim "$G/tdd-decisions.md" "$DEST/decisions/tdd-decisions.md" "$DEST/archive/tdd-decisions-2026-10-31.md" "Metr0niks TDD decisions"
cp "$G"/decisions/*.md "$DEST/decisions/"

# Point links at the new layout
for f in "$DEST"/design/*.md; do
  sed -i -e 's#](feedback/#](../feedback/#g' -e 's#](decisions/#](../decisions/#g' -e 's#](research/#](../research/#g' \
         -e 's#](gdd-decisions.md#](../decisions/gdd-decisions.md#g' -e 's#](tdd-decisions.md#](../decisions/tdd-decisions.md#g' \
         -e 's#](tuning-history.md#](../tuning-runs/README.md#g' -e 's#`tuning-history.md`#`tuning-runs/README.md`#g' "$f"
done
for f in "$DEST"/decisions/*.md "$DEST"/archive/*-decisions-*.md; do
  sed -i -e 's#](feedback/#](../feedback/#g' -e 's#](decisions/#](#g' \
         -e 's#](gdd.md#](../design/gdd.md#g' -e 's#](tdd.md#](../design/tdd.md#g' -e 's#](open-questions.md#](../design/open-questions.md#g' \
         -e 's#](tuning-history.md#](../tuning-runs/README.md#g' -e 's#`tuning-history.md`#`tuning-runs/README.md`#g' "$f"
done

# Feedback, research (level concepts are redone), tuning runs, reference sim
cp -r "$G"/feedback/human/. "$DEST/feedback/human/"
cp -r "$G"/feedback/synthetic/. "$DEST/feedback/synthetic/"
find "$G/research" -maxdepth 1 -type f -exec cp {} "$DEST/research/" \;
cp "$G"/tuning-runs/*.jsonl "$DEST/tuning-runs/"
cp "$G"/simulations/*.js "$DEST/tests/reference-sim/"

# Art: everything, checked in. Tim-o gets canon/, reference.html and reviews/
cp -r "$A"/. "$DEST/art/"
T="$DEST/art/characters/tim-o"
mkdir -p "$T/canon" "$T/reviews"
cp "$A/characters/tim-o/parts/hero-v1.webp" "$A/characters/tim-o/parts/exploded-v1.webp" "$T/canon/"
cp "$KIT/tim-o/reference.html" "$T/reference.html"
cp -r "$G/artifacts/guided-run-review" "$G/artifacts/puppet-rigging-lab" "$T/reviews/"

touch "$DEST/game/.gitkeep" "$DEST/level-concepts/.gitkeep"

# INDEX.md: one row per document
{
  printf '# Metr0niks index\n\nEvery document. Add a row when one is added; move retired ones to archive/.\n\n| Path | Title |\n| --- | --- |\n'
  cd "$DEST"
  find . -name '*.md' -not -path './.git/*' -not -path './art/*' -not -name INDEX.md | sort | while read -r p; do
    t="$(grep -m1 '^# ' "$p" | sed 's/^# //' || true)"; printf '| [%s](%s) | %s |\n' "${p#./}" "${p#./}" "$t"
  done
  printf '| [art/characters/tim-o/reference.html](art/characters/tim-o/reference.html) | Tim-o reference (canon only) |\n'
} > "$DEST/INDEX.md.tmp" && mv "$DEST/INDEX.md.tmp" "$DEST/INDEX.md"

echo "Assembled into $DEST. Next: git config core.hooksPath .githooks && npm test"
