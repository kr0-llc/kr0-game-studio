# Metr0niks economy options, Oct 28

Oct 28, 2026 · game-designer, for kr0 · **kr0 chose A, B and F on Oct 28 (GDD-D54)**; the rest stay suggestions

kr0: "I don't know what to do about the economy at the moment. Create a few suggestions. Look at other games in research/ for inspiration."

## The problem

The fun pass adds scrap faster than it adds things to buy. New income comes from Overtime (double drops and +25%), the combo (+20% to +60%), the demolition bonus (+50%), Elites (triple), contracts and Scrap caches. New spending is six parts (about 445 scrap) and three upgrade tracks (390). With a 5-level campaign (GDD-D47), a player will own everything after a few climbs. After that, scrap has no use, and pillar 4 ("scrap only counts if you get out") loses its bite, because there is nothing to lose. The Oct 26 critique asked the same question: what is scrap for once everything is owned?

Any fix has to respect four decisions: no raw stat upgrades (GDD-D23), all-or-nothing scrap until extract (GDD-D8), keeping the garage on a death (pillar 5), and no PvP or selling of parts (non-goals and the Monetisation backlash pitfall in research).

## What the research points at

From [research/mech-games-2026-10-26.md](../research/mech-games-2026-10-26.md). That file's sources are search excerpts, not full reads, and the "Reading" notes are inferences.

- **Hades:** the Mirror of Night gives permanent power and "takes the sting out of failure" (section 3, principle 9). Permanent power bought with run currency is the thing GDD-D23 rules out, but the idea of spending between runs on something that changes the next run carries over.
- **Rogue Legacy:** a carry-over currency, against the critique that meta-unlocks blur skill with grinding (section 3, the "Grind replacing skill" pitfall).
- **Deep Rock Galactic:** a resupply drop and a drone that revives solo players are bought or limited per mission (section 3, Co-op). Spending inside a mission is something players do together.
- **Escape from Tarkov and extraction games:** gear fear and "bank-it-or-lose-it" (principle 10). What you bring in is at risk, so spending before a drop is a bet.
- **BattleTech:** salvage depends on how you kill, and you need three parts to complete a mech (principle 5, section 3). Income is tied to play style, and completion takes time.
- **Armored Core VI and Crossout:** the build is self-expression (section 1); Crossout's pay-to-win complaints show that selling power for money backfires (pitfalls).

## Options

| # | Option | Inspired by | Sink | Pillar fit | Cost to build | Risks |
| --- | --- | --- | --- | --- | --- | --- |
| A | **Call-in supplies.** Before dropping in, buy up to two call-ins for that match, used with a key: a resupply pod you place (Field repair, 40 scrap), an Overclock pod (30), a Strike beacon (50). They are lost unused on a death, so you bet scrap before you drop | Deep Rock Galactic resupply; Tarkov gear fear | Repeatable, scales with use | Pillar 4: you risk scrap you already banked. Not a stat upgrade | Low: pods already exist | Too strong makes runs easy; price by level |
| B | **Reroll the next level.** In the garage, pay to reroll the next level's contract (15) or sector condition (25), with the price doubling each reroll in a climb | Garage preview (GDD-D38, D39) | Repeatable | Pillar 1: you shape the level, then build for it | Low | Rerolling away every hard condition; the doubling price limits it |
| C | **Weapon mods at Mk III.** A Mk III weapon can buy one of three sidegrade mods that change a verb, not a number: for example the minigun gets Spin-up (faster fire after 2 s held, more heat), Shredder (+voxel damage, −enemy damage) or Cooled barrel (less heat, shorter range). Swapping mods is free once bought | Armored Core VI Assembly; research principle 1 ("the build changes how you play") | One-off per mod (about 27 mods across nine weapons) | Pillar 1. GDD-D23 is kept: mods trade, they don't add | Medium: 27 small rules | Balance work; must stay sidegrades |
| D | **Paint, decals and pilot callsigns.** A cosmetic shop: paint schemes, decals, a nameplate, a different victory pose. Prices rise with rarity | Crossout and AC6 self-expression | One-off, but large | No pillar; pure expression | Low to medium (art) | Needs art the pipeline doesn't have yet (GDD-D46); it doesn't keep scrap meaningful forever |
| E | **Salvage contracts.** Instead of buying a blueprint part outright, finish it from salvage: kill a zone's enemy in a set way (three Bulwarks broken by a Perfect) to cut its price, BattleTech style | BattleTech salvage; principle 5 | Lowers income needs instead of adding a sink | Pillars 1 and 2 | Medium | Grind if the counts are too high |
| F | **Trim income.** Cut the Overtime bonus to ×1.5 drops with no +25%, the demolition bonus to +25%, and Elites to ×2 | The critique | — | Neutral | Lowest | Rewards feel smaller; doesn't fix "everything owned" |
| G | **Heat levels after victory.** After winning, start a climb with chosen modifiers (two conditions per level, Elites in every zone, no revive) for a scrap multiplier and a record | Hades (the research mentions only the Mirror; this is the reading that the same game's harder-run options fit the same loop) | Raises the value of scrap only if paired with A to D | Pillar 5 | Medium | Needs a sink to spend the extra on |

Not suggested: anything that buys raw stats (breaks GDD-D23), insurance that keeps match scrap on a death (breaks GDD-D8 and pillar 4), and selling parts or scrap for money (the monetisation pitfall).

## Recommendation

1. **A, call-in supplies,** as the main sink. It uses pods that already exist, it is a bet before every drop (pillar 4), and in co-op both players spend together.
2. **B, rerolls,** as a small second sink that makes the garage preview a decision.
3. **F, trim income,** only for whatever is left over once the sweep shows how fast a player owns everything.
4. Keep **C, weapon mods,** for after the zone enemies ship. It is the best long-term answer to "what is scrap for?" but the most design work.

None of this changes rules until kr0 picks; whichever is picked goes into the GDD Economy section and the tuning history's sweep plan.
