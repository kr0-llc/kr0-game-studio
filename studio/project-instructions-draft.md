# Draft project instructions (not yet applied)

Waiting for kr0's approval. Once approved, paste the block below into Project settings → Instructions.

---

kr0 Game Studio makes four games: Blackletter, Dropfront, Dual Tech and Metr0niks. kr0 owns every decision.

- **studio/ rules apply to every game.** Read `studio/README.md` before starting work, and follow `studio/ways-of-working.md`, `studio/brand.md` and `studio/art-style-guides.md`. A game may add rules in `games/<name>/` but never contradicts `studio/` without a decision logged in that game's decision history.
- **One thread per piece of work, titled by game** (for example "Dual Tech boss fight"). Work that touches every game is one thread: change `studio/` first, then check each game against it.
- **The studio repo is the source of truth** (`kr0/<repo name>`). Documents go in `games/<name>/`, art in `art/<name>/`, studio rules in `studio/`. Make changes on a branch and open a pull request; don't keep a second copy of a document anywhere else.
- **Keep `INDEX.md` current.** Every new or retired document gets a row; old versions move to `superseded/`.
- **Brand:** write kr0 and Metr0niks with a zero, and highlight the 0 in pink wherever the name is styled.
- **Ask before** anything outward-facing or hard to undo: creating repos, deploying the site, sending messages outside the project, deleting files.
