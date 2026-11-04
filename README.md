# UNELAPSED

RPG de survie en TypeScript et Vite : le temps sert de vie et de monnaie. La simulation continue pendant les absences et la progression est sauvegardée dans le navigateur.

## Démarrer

Node.js 22.18+ ou 24 et npm :

```sh
npm install
npm run dev
```

Ouvrir l’adresse affichée par Vite, généralement http://127.0.0.1:5173.

Si le Node.js Homebrew de cette machine ne démarre pas, utiliser celui fourni par Codex :

```sh
export PATH="/Users/thibaultchalaoux/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
```

## Vérifier et compiler

- `npm test` : tests du moteur et des sauvegardes.
- `npm run check` : vérification TypeScript.
- `npm run build` : vérification TypeScript et génération de `dist/`.
- `npm run preview` : prévisualisation du build.

## Repères

- `src/game.ts` : règles, simulation et migrations des sauvegardes.
- `src/main.ts` / `src/style.css` : interface et persistance.
- `src/clock.ts` : horloge et vitesses de test.
- `src/timer.ts` / `src/notifications.ts` : affichage du temps et notifications.
- [INITIAL_STATE.md](INITIAL_STATE.md) : règles jouables détaillées.
- [TASKS.md](TASKS.md) : principes et pistes futures.
