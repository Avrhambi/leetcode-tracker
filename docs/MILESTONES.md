# Milestones

## 1 — Project shell and catalog
Read: `../CLAUDE.md`, `SCHEMA.md`
- [x] Create the Vite React TypeScript app, scripts, linting, Vitest, and folder layout.
- [x] Add typed NeetCode 150 metadata loading and the Dexie database.
- [x] Seed catalog data once and render a runnable catalog list.
- [x] Run `npm run verify`.

## 2 — Attempts and review state
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [x] Implement pure quality and review-stage functions with unit tests.
- [x] Build problem detail and validated attempt form.
- [x] Save attempt plus progress in one Dexie transaction.
- [x] Run `npm run verify`.

## 3 — Recommendation engine
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [x] Implement deterministic daily-plan selection with unit tests.
- [x] Persist recommendation and 24-hour skip events.
- [x] Build the daily-plan UI with external LeetCode links.
- [x] Run `npm run verify`.

## 4 — Dashboard and problem browser
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [x] Build dashboard metrics and per-topic progress.
- [x] Add search, filters, statuses, and empty/error states.
- [x] Add responsive navigation and layouts for the defined breakpoint.
- [x] Run `npm run verify`.

## 5 — Backup and release
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`
- [x] Implement validated JSON export and atomic restore.
- [x] Implement typed reset confirmation and reseeding.
- [x] Add production deployment configuration and final failure states.
- [x] Run `npm run verify`.

## 6 — Adaptive-coach fixes
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`, `algorithm.md`
- [x] Cap review-stage advancement at one attempt per calendar day (any entry point).
- [x] Flag `struggling` problems, back off their reviews, and stop them pulling their topic's new-problem priority.
- [x] Add pure `mastery` (topic trajectory, struggling list) and `streak` (grace days) services.
- [x] Dexie `version(2)` migration (progress backfill) + backup `formatVersion: 2` with v1 back-compat.
- [x] Wire the catalog attempt form to complete a matching daily recommendation; reword the form copy and adapt its options to the outcome; surface the unused attempt fields.
- [x] Render problem status and difficulty as prominent badges in the catalog and problem detail.
- [x] Wire the grace-day streak into the dashboard.
- [x] Run `npm run verify`.

## 7 — Gamification
Read: `../CLAUDE.md`, `SPEC.md`, `SCHEMA.md`, `algorithm.md`
- [x] XP and levels as pure rules with unit tests; Dexie `version(3)` store + XP replay shared with backup restore.
- [x] Dashboard XP/level strip.
- [x] Badges as pure rules with unit tests (monotonic union, no replay); badge shelf.
- [x] Topic constellation (static SVG), needs-attention list.
- [x] CSS/SVG geometry animation (level-up pulse, badge reveal) behind `prefers-reduced-motion`.
- [x] Run `npm run verify`.
