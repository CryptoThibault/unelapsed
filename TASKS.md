# UNELAPSED — Direction and ideas

Current gameplay rules are in [INITIAL_STATE.md](INITIAL_STATE.md); code and tests describe their implementation. This file records design principles and future ideas.

## Principles

- An economic survival RPG inspired by In Time, with its own setting.
- Time is life and currency: start with one hour, die at zero, and accumulate an unlimited reserve.
- Timestamp-based simulation continues while the player is away.
- Keep options and items few, each with a distinct purpose. Avoid generic quizzes and minigames.
- Let players discover their investments through explicit costs, durations and effects, without a prescribed purchase order.
- Progression unlocks more profitable income; the beginning should remain demanding.
- Only one active task at the start. Purchases remain independent of tasks.
- English interface, restrained styling, little text, a prominent timer, subtle colors, and dark/light themes.

## Planned

- [ ] Unlock action queues and routines through progression; define their costs and requirements.

## Ideas to validate

- Craft the Tool kit as an alternative to buying it; define the recipe and duration.
- Add jobs or tools only when they create distinct choices; avoid equivalent bonuses and wear without a meaningful purpose.
- Introduce districts with different prices and opportunities.
- Add characters and quests offering alternative economic paths.
- Make long absences survivable: investigate housing, shelter or reserves.
- Introduce predictable, preventable constraints without multiplying gauges and penalties.
- Assess whether exploration and combat support the economic loop.
- Decide whether to keep the DEV controls: Restart, +1h and speeds from ×1 to ×512.

## Technical constraints

- Local saves are tied to the browser and game address; there are no accounts or server.
- Use the device clock; consider a server clock for a potential shared economy.
- Preserve progress during save migrations.
- Restart resets the run, with no permanent progression.
- UNELAPSED name: a search for games with the same name has been performed; trademark and domain availability have not been checked.
