# Blackletter: Chronos TDD decision history

Newest first. Status is Proposed until kr0 accepts or rejects it. The [TDD](tdd.md) is the build plan; this file records why it says what it says.

| ID | Date | Decision | Options considered | Why | Status | Decided by |
| --- | --- | --- | --- | --- | --- | --- |
| TDD-D6 | 2026-10-21 | The online game server is a post-semester milestone; the semester ships the static 2D game with online modes behind a feature flag | Build the server in the semester | The server adds rooms, leases and reconnection on top of the same engine; the vertical slice needs none of it, and the budget's reserve is for balance rework, not infrastructure | Proposed | kr0 |
| TDD-D5 | 2026-10-21 | Rework reserve is 40% of the feature subtotal (12.2M on 30.5M, total 44.1M) | 30%; 50% | The experimental build needed fourteen tuning versions and still has two balance risks open, so balance rework is expected; 50% would be padding | Proposed | kr0 |
| TDD-D4 | 2026-10-21 | A fixed 100 ms engine step; the renderer interpolates and the clock speeds change steps per real second | Variable timestep from the frame clock | Replays must hash identically on every device; a variable step ties the rules to frame rate | Applied in the TDD | technical-director |
| TDD-D3 | 2026-10-21 | Add a development token budget per feature with a rework reserve, and keep the runtime and tooling budget beside it | Runtime budget only | The build is the largest spend and what the course's feasibility criterion checks; the runtime budget alone said nothing about building the game | Applied (figures are planning estimates until sprint 1 closes) | kr0 |
| TDD-D2 | 2026-10-21 | Name twelve development agents, each with a one-sentence role on this game, matching the other studio games | Count them without naming; thirteen with a separate technical-artist | The old TDD said "13 studio roles" and named none; the studio's other briefs name twelve, and the card art already exists so no technical-artist is budgeted this semester | Applied | kr0 |
| TDD-D1 | 2026-10-21 | The GDD keeps rules and player effects only; routes, polling rates and tuning-file internals live in the TDD | Leave implementation notes in the GDD | Implementation detail was creeping into the GDD's overview and modes | Applied | gdd-designer pass |
