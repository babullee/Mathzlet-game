# Mathzlet

Mathzlet is a cooperative mathematical adventure for children aged 5–6 and their parents. This repository contains a responsive bilingual website and playable card-game prototype built for static hosting on GitHub Pages.

The experience encourages children and adults to notice patterns, combine quantities, compare ideas, and find more than one solution together. It uses positive, untimed feedback rather than scores, penalties, or competitive rankings.

## Features

- English and Simplified Chinese (`en` and `zh-CN`) with instant language switching
- Three child-friendly difficulty levels: Explorer, Pathfinder, and Adventure Master
- Five adventure locations, including Logic Mountain and Treasure Camp
- Target-number, multiple-solution, comparison, classification, pattern, matching, open-ended, and multi-condition missions
- Large number and strategy cards with tap/click interactions; dragging is not required
- Hint, undo, reset, parent-prompt, replay, and finish controls
- Reward collection focused on exploration, reasoning, revision, and teamwork
- A four-step tutorial that can be skipped or replayed
- A customizable local player profile with discovery statistics
- Local progress and settings persistence with no account or backend
- Keyboard navigation, visible focus states, live feedback, touch-friendly controls, and reduced-motion support
- Responsive layouts for phones, tablets, and desktop browsers

## Technology

The project uses semantic HTML, modular CSS, browser-native JavaScript modules, and `localStorage`. It has no runtime package dependencies, framework, build step, API key, database, or server-side component.

## Project structure

```text
.
├── index.html                  Application shell and accessible screen structure
├── assets/
│   └── illustrations/         Optimized adventure artwork and fallback image
├── css/                        Visual tokens, layout, cards, game UI, motion, responsive rules
├── js/
│   ├── main.js                Rendering and interaction coordinator
│   ├── app-state.js           Central state store
│   ├── localization.js        Runtime language switching
│   ├── storage.js             Safe local progress persistence
│   ├── data/                  Cards, missions, rewards, and translation dictionaries
│   └── game/                  Pure validation, dealing, and mission helpers
├── docs/                       Product UX, game design, and visual-system specifications
└── tests/
    ├── game-check.mjs          Mission solvability and multi-solution checks
    ├── i18n-check.mjs          Translation-key and language-parity check
    └── qa-check.mjs            Accessibility and interface contract checks
```

## Run locally

Because the application uses JavaScript modules, preview it through a small local web server rather than opening `index.html` as a `file://` URL.

### Visual Studio Code

1. Open this folder in Visual Studio Code.
2. Install a static-server extension such as **Live Server** if one is not already available.
3. Open `index.html` with the extension.

### Python

From the project root, run:

```sh
python -m http.server 8000
```

Then open [http://localhost:8000/](http://localhost:8000/).

No dependency installation or build command is required. To stop the Python server, press `Ctrl+C` in its terminal.

## Quality check

Node.js is needed only for the optional quality checks, not to run the website:

```sh
node tests/game-check.mjs
node tests/i18n-check.mjs
node tests/qa-check.mjs
```

The checks cover mission solvability, distinct and duplicate solution handling, missing translation keys, bilingual parity, semantic controls, focus, touch targets, and reduced-motion contracts.

Before publishing, also check the main journey in both languages at phone and desktop widths: tutorial, map, every difficulty, successful and developing answers, another-solution flow, settings persistence, reduced motion, and progress reset.

## Deploy to GitHub Pages

The repository is ready for branch-based GitHub Pages deployment. All application URLs are relative, so it works both at a domain root and under a repository path such as `https://USERNAME.github.io/REPOSITORY/`.

1. Create a GitHub repository and place these files at its root.
2. Push the project to the `main` branch.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and the `/(root)` folder, then save.
6. Wait for GitHub to publish the site and open the URL shown on the Pages settings screen.

GitHub Pages serves the current files directly; do not add a base URL or rewrite relative `./` and `../` paths. Filename capitalization matters on Pages, so preserve the casing committed in this repository.

## Editing content

- Add or revise visible text in both language objects in `js/data/translations.js`.
- Keep card, mission, and reward definitions in `js/data/` rather than hardcoding content in the UI.
- Keep mathematical validation and dealing rules in `js/game/` so they remain independent of the DOM.
- Keep new links and assets relative to the file that references them.
- Run the localization check after changing translation keys or content labels.

## Saved data and privacy

Settings, profile, and adventure progress are stored only in the visitor's browser under the `mathzlet-state-v2` local-storage key. Existing saves from the earlier prototype are migrated automatically. The prototype has no registration, analytics, remote data collection, or cloud synchronization. Players can reset adventure progress from Settings.

## Browser support

The prototype targets current versions of Chrome, Edge, Firefox, and Safari. JavaScript modules and `localStorage` must be enabled. If browser storage is unavailable, play continues for the current visit without persistent progress.
