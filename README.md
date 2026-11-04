# UNELAPSED

A survival RPG built with TypeScript and Vite: time is both life and currency. The simulation continues while you are away, and progress is saved in the browser.

## Getting started

Requires Node.js 22.18+ or 24 and npm:

```sh
npm install
npm run dev
```

Open the address printed by Vite, usually http://127.0.0.1:5173.

If Homebrew's Node.js installation on this machine fails to start, use the runtime provided by Codex:

```sh
export PATH="/Users/thibaultchalaoux/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
```

## Checks and builds

- `npm test`: game engine and save tests.
- `npm run check`: TypeScript checks.
- `npm run build`: TypeScript checks and production output in `dist/`.
- `npm run preview`: preview the production build.

## Project map

- `src/game.ts`: rules, simulation and save migrations.
- `src/main.ts` / `src/style.css`: interface and persistence.
- `src/clock.ts`: simulation clock and test speeds.
- `src/timer.ts` / `src/notifications.ts`: time formatting and notifications.
- [INITIAL_STATE.md](INITIAL_STATE.md): detailed gameplay rules.
- [TASKS.md](TASKS.md): design principles and future ideas.
