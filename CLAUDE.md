# PatternPilot

Local-first NeetCode 150 practice tracker. React 19 + TypeScript + Vite, Dexie/IndexedDB,
plain CSS. No server, no auth, no network calls — all data lives in the browser.

## Commands

- `npm run dev` — Vite dev server (first free port from 8080)
- `npm run verify` — lint → typecheck → tests once → production build. **Run before every commit.**
- `npm test -- --run` — unit tests once (Vitest); `npm test` for watch mode

The test environment is pure Node: **no `indexedDB`, no `document`**. Pure logic lives in
`src/services/*.ts` and is unit-tested; components and Dexie migrations are verified by
running the app, not in-process.

## Key files

- `src/services/` — pure, deterministic, unit-tested rules: `reviews.ts` (quality + review
  stage), `dailyPlan.ts` (adaptive plan selection), `mastery.ts`, `streak.ts` (grace days),
  `gamification.ts` (XP/levels), `badges.ts`, `constants.ts` (all thresholds).
- `src/db/` — direct Dexie calls only. `database.ts` holds the versioned schema/migrations;
  `saveAttempt.ts` writes attempt + progress + XP + badges in one transaction;
  `backup.ts` is JSON export/restore with `formatVersion` validation.
- `src/data/catalog.ts` + `neetcode150.json` — the 150-problem catalog (metadata + links
  only, never problem text). Do not touch the `[INEFFECTIVE_DYNAMIC_IMPORT]` build warning
  for `catalog.ts` — it is known and benign.
- `src/styles/` — `../../tokens.css` (oklch dark "phosphor green" design tokens),
  `global.css`, `gamification.css`. Plain CSS, no framework.
- `docs/` — `AGENTS.md` (the authoritative operating card), `SPEC.md`, `SCHEMA.md`,
  `MILESTONES.md`, `QA.md`, `design/`. Keep these in sync with behaviour changes.

## Architecture notes

- **`docs/AGENTS.md` is the contract.** Approved dependency list, folder rules, the
  "no repository/adapter/factory/queue/cache" constraint, determinism requirement,
  720px breakpoint, 200ms search debounce — all there. Read it before non-trivial work.
- **Dexie migrations are append-only versions.** A `db.version(n).upgrade(cb)` callback
  never re-runs for a user already at `n`, and a fresh install is created at the highest
  version and skips all callbacks. New backfill logic = a new version, never a re-edit.
- **Level and badge state are derived, not stored where they can drift.** Level is
  `floor(sqrt(xp/50))` computed on read. Badges are a monotonic union — never un-earned.
  XP is the only persisted gamification number, and it is reconstructible from the
  `attempts` history alone (`replayXp`), which the v3 migration and backup restore rely on.
- **One attempt save = one transaction** (`saveAttempt.ts`): attempt row, progress,
  matching daily-recommendation completion, XP award, badge check — all atomic.
- **All animation sits behind `prefers-reduced-motion`.** The global rule in `global.css`
  clamps durations; showy gamification animations additionally get `animation: none`.

## Conventions

- IDs: `crypto.randomUUID()`. Dates: `YYYY-MM-DD` local-time string keys.
- External problem links: new tab, `rel="noreferrer"`.
- Caught failures render inline with a single explicit Retry button.

## Automation

`.claude/settings.json` runs `npm run lint && npm run typecheck` after every Edit/Write.
It does not build or run tests — do that yourself via `npm run verify` before committing.
