# Manual QA

## Startup and persistence
- Open a fresh browser profile: loading appears, then exactly 150 catalog problems are available.
- Reload after recording an attempt: history, status, review date, and dashboard totals persist.
- Close and reopen the browser: today’s plan remains consistent.

## Daily plan
- With no history, the plan contains one new problem and no reviews.
- After activity across topics, no new recommendation repeats either of the last two new-problem topics when another topic is eligible.
- Create three overdue reviews: only the two earliest appear, followed by one new problem.
- Skip an item: it disappears immediately and returns after its stored 24-hour deadline.
- Confirm Medium and Hard eligibility follows the strong-attempt thresholds.

## Attempts and reviews
- Submit each valid outcome and confirm its quality, stage, status, and next-review date.
- Confirm help type is required only for hint/solution outcomes.
- Change the outcome and confirm the difficulty and help-type options adapt: "solved on my own" shows all three difficulties and no help type; "solved after a hint" drops "comfortable" and requires a help type from the shallow set; "watched the solution" and "couldn't solve it" hide the difficulty field entirely and save it as a struggle.
- Reject duration values 0, 601, decimals, and non-numbers; accept 1 and 600.
- Reject notes over 500 trimmed characters.
- Reach stage 5 through strong reviews and confirm mastered status with no next review.
- Record two attempts for one problem on the same day (one from the daily plan, one from the catalog): the review stage and status advance only once; both attempts show in the history. A weak second pass on a scheduled review does not send it back to the daily plan as a new problem.
- Open a problem that is on today's plan from the catalog and record an attempt there: the Today item shows "Solved" without touching the daily-plan screen.
- Record an attempt from the catalog for a problem skipped earlier today: the (now stale) recommendation is marked complete.
- In the attempt history, confirm help type, time spent, and notes appear on the rows that have them, and a "Needs a different approach" badge shows once a problem is struggling.
- Fail one problem weakly three times running: it is flagged struggling, its next review moves out past tomorrow (2, then 4, then 7 days), and its topic stops dominating the new-problem picks.
- While a topic has struggling problems, confirm new problems it still serves stay at the Easy difficulty ceiling — failing a topic must not unlock its Medium/Hard problems.
- Solve a struggling problem strongly: the flag clears and the next review returns to the normal ladder.

## Streak grace
- Miss one day after a run, then record an attempt: the streak survives (one grace day spent) and the dashboard shows "1 grace day used".
- Miss two consecutive days with no grace left: the streak resets to the new run and the grace note disappears.
- After seven active days, confirm a grace day is available again.
- Record an attempt yesterday but none today: the streak still shows the run ending yesterday, not 0.
- Reset all data, reseed, and record one attempt: the streak shows 1 with no grace note (the grace settings rows are absent and default cleanly).

## XP and levels
- Record a strong first attempt of the day: the dashboard XP strip rises by 20 without a reload.
- Record a second attempt for the same problem the same day: XP rises by 5 (the reinforcement quarter), not 20.
- Reload the page: the level and XP are unchanged.
- With the OS set to reduced motion, confirm the XP fill bar's slide is clamped to a brief 150 ms rather than a longer ease, and the level-up pulse and sweep do not play.
- Open an app that was on a pre-gamification (coach-fixes) build with existing attempts: on first load the XP strip shows a non-zero total replayed from the attempt history.
- Cross a level boundary while on the dashboard: the level number pulses once. Cross one while on Today, then return: no pulse (accepted — nothing stores what was announced).

## Badges, constellation, and needs-attention
- Solve a first problem: the "First solve" badge fills and fades in; the shelf reads 1 / 6.
- Take a problem to mastered, then drive it to three weak attempts: the "First mastered" badge stays earned (monotonic), and the problem appears in "Needs a different approach".
- With no struggling problems, "Needs a different approach" shows the all-clear message.
- The constellation renders one node per topic (18), larger and filled for more-mastered topics; long topic names wrap to two lines without overlap.
- Restore a backup with no badge data: the shelf starts empty and re-fills after the next attempt.

## Problems and links
- Search waits briefly, then matches titles and slugs case-insensitively.
- Combine topic, difficulty, and status filters; clear them and recover NeetCode order.
- Open a problem and confirm the LeetCode page opens in a separate tab.
- Confirm no problem statement or solution text is stored or displayed.

## Backup, restore, and failures
- Export data, reset, restore the export, and confirm all user data returns, XP included.
- Restore a pre-v2 backup file: it succeeds, and every problem's `consecutiveWeak` / `struggling` default to 0 / false.
- Restore a v2 backup that has no gamification row: it succeeds, XP is rebuilt from the restored attempts, and badges start empty.
- Restore a v2 backup whose gamification row carries a badges array: the shelf shows exactly those badges.
- Reject a file over 5 MB, malformed JSON, an unsupported format version, and invalid fields without changing existing data.
- Simulate blocked IndexedDB and confirm an inline error with a working explicit Retry action.
- Confirm reset does nothing until `RESET` is typed exactly.

## Responsive and production
- At 719 px, verify navigation, dashboard cards, forms, and lists remain usable without horizontal page scrolling.
- At 720 px and desktop width, verify the desktop layout appears.
- Run `npm install`, then `npm run dev`; confirm startup succeeds.
- Run the production build and serve its output; confirm direct app startup and local persistence work.
