# Operating Card
Stack: React 19 + TypeScript + Vite 8; Dexie; date-fns; plain CSS.
Runtime: Node.js 22.12+; package manager: npm; one committed package-lock.json.
Folders: components/ db/ services/ hooks/ types/ styles/ data/
Commands:
- npm install
- npm run dev
- npm run lint
- npm run typecheck
- npm test -- --run
- npm run build
- npm run verify
Approved runtime deps: react, react-dom, dexie, dexie-react-hooks, date-fns.
Approved dev deps: vite, typescript, eslint, @eslint/js, typescript-eslint, vitest, jsdom, @testing-library/react, @testing-library/jest-dom, @vitejs/plugin-react, @types/react, @types/react-dom.
Use IndexedDB only; no server, auth, API, telemetry, AI model, scraping, or browser extension.
Use crypto.randomUUID() for IDs and YYYY-MM-DD local-date keys.
Keep NeetCode catalog in data/neetcode150.json; store metadata and links, never problem text.
Implement direct Dexie calls in db/ and pure rules in services/; no repository, adapter, factory, queue, cache, or retry loop.
All recommendation and review rules must be deterministic and unit tested.
Use one transaction when saving an attempt and updating problem progress.
Show caught failures inline with one explicit Retry button.
Search debounce: 200 ms; every other form action: no debounce.
External problem links open in a new tab with rel="noreferrer".
Responsive breakpoint: 720 px.
npm run verify must run lint, typecheck, unit tests once, then production build.
