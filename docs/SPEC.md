# NeetCode Study Coach

## Core flows
On first launch, seed the bundled NeetCode 150 metadata into IndexedDB and show the dashboard. The user opens the daily plan, follows a LeetCode link, returns, records the attempt, and receives an updated plan. A previously completed problem is recorded through the same attempt form; defaults are today, `solved_independently`, and `manageable`. Recording an attempt from either entry point — the daily plan's feedback form or the catalog's problem detail — completes any open daily recommendation for that problem today, so logging a plan problem from the catalog still marks the Today item done.

## Daily plan
The plan is adaptive, two to four items, and always contains at least one new problem. Review and new slots scale with the number of due reviews: zero due gives two new problems; one or two due gives one review and one or two new; three to five due gives two reviews and one new; six or more gives three reviews and one new. Due reviews are ordered by weakest last quality first (`weak`, then `partial`, then `strong`), then earliest `nextReviewDate`, then NeetCode order; reviews beyond the review slots wait for a later day and are surfaced as the dashboard "Due reviews" count. A skipped item is hidden until 24 hours after the skip timestamp. Once any recommendation has been persisted today, the plan replays those stored items so it stays stable as progress changes, topping up new problems only if the stored set is short of the new-slot target.

For a new problem, exclude solved/mastered problems. Each eligible topic gets a priority of `tierWeight × (1 − mastery) × recencyPenalty + jitter`. `tierWeight` favours common foundations over niche topics (tier 1 = 1.0, tier 2 = 0.6, tier 3 = 0.35; see `src/data/topicTiers.ts`). `mastery` is the mean of `reviewStage ÷ 5` over the topic's problems, so a topic you are progressing through fades and a topic that goes badly (a weak attempt resets its stage) climbs back up; a `struggling` problem is the one exception, counting as 0.5 here so a blind-spot topic does not stay pinned at the top (see "Attempt quality and reviews"). `recencyPenalty` is 0.35 when the topic was used by a new-problem recommendation in the last two distinct days or is already used earlier in today's plan, else 1.0. `jitter` is a small deterministic per-day, per-topic value that breaks fixed ordering while staying stable within a day. The highest-priority topic wins; a fully mastered topic scores zero and drops out. Within the chosen topic, the difficulty ceiling follows mastery — Easy below 0.2, up to Medium below 0.5, up to Hard at or above 0.5 — computed with `struggling` problems counting as their real (reset-to-0) stage, so a topic being failed does not unlock its harder problems. The easiest unsolved problem at or below the ceiling is chosen, by official difficulty order then NeetCode order. If the topic has no problem at or below the ceiling, its easiest unsolved problem is chosen.

## Attempt quality and reviews
The attempt form requires an outcome. Outcome options: `solved_independently`, `solved_with_hint`, `watched_solution`, `could_not_solve`, `skipped`. The remaining fields adapt to the outcome so only sensible combinations are offered:

- `solved_independently` — perceived difficulty offered as `easy` / `manageable` / `hard`; no help type.
- `solved_with_hint` — perceived difficulty offered as `manageable` / `hard`; help type required, offered as `small_hint` / `pattern_identification` / `pseudocode`.
- `watched_solution` — no perceived-difficulty field (saved as `hard`); help type required, offered as `pseudocode` / `full_code` / `solution_video`.
- `could_not_solve` — no perceived-difficulty field (saved as `hard`); no help type.

Perceived difficulty defaults to `manageable`. When the outcome changes, a selection that is out of the new outcome's range snaps to that outcome's first allowed value; a selection the new outcome hides is preserved so switching away and back does not silently rewrite it. Outcomes that hide the field always save `hard`. Duration is optional, integer 1–600 minutes. Notes are optional, trimmed, maximum 500 characters.

Quality is `strong` for independent plus easy/manageable; `partial` for independent plus hard or solved with hint; `weak` for watched solution or could not solve. Skipped creates no attempt and hides the recommendation for 24 hours.

Review stage starts at 0. Weak sets stage 0 and review tomorrow. Partial sets stage 1 and review in 3 days. Strong increments the previous stage by one, capped at 5. Stage 1 reviews in 3 days, stage 2 in 7, stage 3 in 14, stage 4 in 30, and stage 5 has no next review and is mastered. Dates use the browser’s local calendar.

If an attempt for the same problem already exists on the same calendar day (from either the daily plan or the catalog), a further attempt that day is reinforcement only: it records the attempt and updates the last quality and the consecutive-weak / struggling signals, but the review stage, next-review date, and progress status are unchanged, so a second pass cannot skip a spaced-repetition interval or push a scheduled review back into the new-problem pool.

After three consecutive weak attempts on one problem it is flagged `struggling`. While the consecutive-weak run is at three or more, a further weak attempt schedules the next review on a 2-, 4-, 7-day ladder instead of the next day, so a persistent blind spot is not surfaced daily; a non-weak attempt resets the run and the next weak attempt starts the ladder over from the next day. For the new-problem topic pick, a `struggling` problem contributes a neutral 0.5 to its topic's mastery instead of its reset-to-0 stage, so the plan stops flooding new problems from a topic the user is stuck in — but the difficulty ceiling still uses the real stage, so a topic being failed never unlocks its harder problems. A strong attempt clears the flag; a partial attempt stops the weak run without clearing it.

## Screens
Dashboard shows an XP/level strip, a badge shelf, a topic constellation, a needs-attention list, today’s plan, current streak, attempts in the last 7 calendar days, due-review count, and per-topic attempted/strong/mastered counts. Problems shows all 150 items with 200 ms search, topic/difficulty/status filters, and NeetCode order by default. Problem detail shows metadata, external LeetCode link, attempt history newest first, next review, and record-attempt action. Settings provides JSON export, JSON restore, and reset-all-data.

## Streak
The dashboard streak counts consecutive calendar days with at least one recorded attempt, up to and including the last active day — so a day without practice yet does not zero the streak, it holds at the run ending on the last active day. A returning user does not lose the whole streak on the first missed day: one grace day is always available and is spent automatically to bridge a single gap. Grace does not stretch to two adjacent missed days, and it is only ever counted as used once a later active day is actually reached — a gap before the user's first-ever attempt bridges nothing. Two or more consecutive missed days reset the streak to the run that follows the gap.

The grace refresh cadence (`refreshGrace`: one grant per rolling seven active days, capped at one) lives in `services/streak.ts` but is currently unobservable — the allowance is never spent down in storage, so it always reads as one. The `settings` rows (`streakGraceRemaining`, `streakGraceRefreshedOn`) hold the allowance and are read with that default when absent (fresh install, reset, version-1 restore); the dashboard does not write them back. Grace usage is re-derived from the active dates on every render, so the streak is stable across re-renders. When grace bridged a gap, the dashboard notes how many grace days the current streak used.

## XP and levels
Every recorded attempt awards XP inside the same transaction that writes the
attempt: 20 / 12 / 5 for a strong / partial / weak first attempt of the day on
that problem, and a quarter of that (5 / 3 / 1) for a later same-day attempt on
the same problem. There is no bonus for a new problem versus a review — the award
is a pure function of the stored attempt row, so lifetime XP can be rebuilt
exactly by replaying the attempt history (done once by the Dexie `version(3)`
upgrade for existing users, and on backup restore when the payload predates
gamification). Level is `floor(sqrt(xp / 50))` — 50 XP to level 1, 200 to 2, 450
to 3 — and is derived on read, never stored. The dashboard shows a level / XP
strip above the metric grid; its fill bar transitions on XP change (clamped by
`prefers-reduced-motion`). When the level rises while the dashboard is on screen,
a one-shot pulse plays; a level-up that happens while the user is on another
screen is not replayed — nothing stores what was last announced.

## Badges
Six milestone badges: first solve, first mastered, topic cleared (every problem
in one topic mastered), ten-day streak, halfway (75 distinct problems attempted),
century (100). Each is a pure predicate over progress, attempts, the catalog, and
the current streak length, checked after every attempt save. The earned set is
stored as a monotonic union — once a badge is earned it is never lost, even when
a later weak attempt resets the review stage that earned it. The dashboard shows
a shelf of all six (earned or locked); a badge that unlocks while the dashboard
is mounted gets a one-shot reveal fade. On restore of a backup that has no badge
data, the shelf starts empty and re-fills on the next attempt.

## Topic constellation and needs-attention
The dashboard renders a static SVG constellation — one node per topic, its radius
and fill set by that topic's mean review-stage mastery (a struggling problem
counts at its real low stage). Below it, "Needs a different approach" lists the
problems currently flagged `struggling`, weakest run first, each linking to its
detail view; most profiles have none, and the list shows an all-clear message.

## States and limits
Initial seeding shows a blocking loading state. Empty search/filter results show “No matching problems.” Successful saves update the screen immediately and show a message for 2 seconds. Database or file failures show an inline error and Retry; no automatic retry. Export contains all local user data as a `formatVersion` 2 payload, including the gamification XP-and-badges row when present. Restore accepts one `.json` file up to 5 MB of format version 1 or 2, validates the full payload before replacing data, defaults the version-2 fields when restoring a version-1 file, rebuilds lifetime XP from the restored attempts when the payload carries no gamification row, and leaves existing data unchanged on failure. Reset requires typing `RESET` exactly. No pagination is used for the 150-problem catalog.
