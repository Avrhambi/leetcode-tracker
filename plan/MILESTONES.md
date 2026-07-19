# Milestones

## 1 — Project shell and catalog
Read: `CLAUDE.md`, `SCHEMA.md`
- [x] Create the Vite React TypeScript app, scripts, linting, Vitest, and folder layout.
- [x] Add typed NeetCode 150 metadata loading and the Dexie database.
- [x] Seed catalog data once and render a runnable catalog list.
- [x] Run `npm run verify`.

## 2 — Attempts and review state
Read: `CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [ ] Implement pure quality and review-stage functions with unit tests.
- [ ] Build problem detail and validated attempt form.
- [ ] Save attempt plus progress in one Dexie transaction.
- [ ] Run `npm run verify`.

## 3 — Recommendation engine
Read: `CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [ ] Implement deterministic daily-plan selection with unit tests.
- [ ] Persist recommendation and 24-hour skip events.
- [ ] Build the daily-plan UI with external LeetCode links.
- [ ] Run `npm run verify`.

## 4 — Dashboard and problem browser
Read: `CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [ ] Build dashboard metrics and per-topic progress.
- [ ] Add search, filters, statuses, and empty/error states.
- [ ] Add responsive navigation and layouts for the defined breakpoint.
- [ ] Run `npm run verify`.

## 5 — Backup and release
Read: `CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [ ] Implement validated JSON export and atomic restore.
- [ ] Implement typed reset confirmation and reseeding.
- [ ] Add production deployment configuration and final failure states.
- [ ] Run `npm run verify`.
