# Metr0niks TDD decision history

Newest first. Status is Proposed until kr0 accepts or rejects it. The [TDD](tdd.md) holds the architecture; this file records the options and trade-offs behind it. These are technical-director proposals drawn from what the prototype already does and from the [GDD review](feedback/synthetic/gdd-review-2026-10-25/SYNTHESIS.md); none has been decided by kr0 yet.

| ID | Date | Decision | Options considered | Trade-off | Status |
| --- | --- | --- | --- | --- | --- |
| TDD-D8 | 2026-10-26 | The save carries an in-match mark written when a match starts; a save still marked on load counts as a death, so closing the game mid-match can't dodge the level reset (GDD-D28). The co-op revive runs inside the sim at wave clear (GDD-D24) | Save only at extract and death; detect leaving with a page-unload handler | Unload handlers don't run reliably when a tab is killed; the mark costs one extra write per match | Proposed |
| TDD-D7 | 2026-10-26 | Weapon upgrade levels (GDD-D23) are data on each owned weapon instance and in the save, read into a per-mech damage multiplier per weapon, next to wear (TDD-D5); values live in `T.upgrade` | Separate upgraded copies of each part in `PARTS` | One field per owned part keeps the parts table at 21 entries and lets sweeps change `T.upgrade` alone; the save and its validation grow by one field | Proposed |
| TDD-D6 | 2026-10-25 | Enemies and pods use flow fields over a walk grid rebuilt when voxels change, as the prototype does, instead of a navmesh | A navmesh with local rebakes | The grid is already built and updates with every collapse; a navmesh is more work and the TDD's old plan | Proposed |
| TDD-D5 | 2026-10-25 | Per-part wear is data on each owned part instance, applying GDD-D18 (wear 10% of armor lost ÷ max armor, helpful stat changes scaled by 1 − wear), replacing the prototype's single carried armor value | Keep the carried armor pool and charge repairs by fitted tier | Per-part durability matches GDD-D9 but needs per-part save data and a garage UI; the armor pool is built and simple | Proposed |
| TDD-D4 | 2026-10-25 | Disconnects are handled by the server holding the match and sending a full snapshot on rejoin | Drop the player and give the partner the mech; end the excursion | Holding state keeps the player's run but needs the server to snapshot the destroyed map; the prototype destroys a dropped mech | Moved to the backlog (GDD-D21) |
| TDD-D3 | 2026-10-25 | Single-player runs on the server too, so account progress, co-op and later PvP share one economy | Keep single-player in the browser with a local save and campaign code | Server-backed saves stop edited scrap; the browser version works offline and needs no backend | Moved to the backlog (GDD-D21) |
| TDD-D2 | 2026-10-25 | The rules stay a headless, deterministic simulation in `sim.js`, run by the room server and by Node for sweeps | A separate balance copy of the rules; the engine's own physics | One rules file keeps sweeps and the game identical; it ties the build to JavaScript until the engine choice is made | Proposed |
| TDD-D1 | 2026-10-25 | Co-op uses a server-run simulation with snapshots and client prediction of the player's own movement, as the prototype does | Lockstep between two clients; peer-hosted rooms | An authoritative server settles pod ties and damage in one place and fits later accounts (backlog, GDD-D21); it costs server hosting and the server code lives in a private repo | Proposed |

## Document history

| Date | Change |
| --- | --- |
| 2026-10-27 | Oct 26 critique fixes in the TDD: timing ring in seconds, Perfect radius limited to the pile-bunker, collapse rubble and scrap, engine table, header; TDD-D1 and TDD-D5 wording. Previous TDD in `superseded/tdd-2026-10-26.md` |
| 2026-10-26 | In-match save mark and co-op revive (TDD-D8); audio section added to the TDD |
| 2026-10-26 | Weapon upgrade levels added to the mech model and save data (TDD-D7) |
| 2026-10-25 | TDD aligned with the Excursion-only GDD, with server features moved to the backlog (GDD-D21) and touch controls removed (GDD-D22); (no Gauntlet or damage regions, wear rules, flow fields, camera and AI as built). Earlier on the same day it was updated from the Oct 20 version: simulation and netcode section, level and death reset, rejoin, durability data, heat rules, save data, risks (TDD-D1 to TDD-D5). The Oct 20 version moved to `superseded/` |
