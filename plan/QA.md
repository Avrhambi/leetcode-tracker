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
- Reject duration values 0, 601, decimals, and non-numbers; accept 1 and 600.
- Reject notes over 500 trimmed characters.
- Reach stage 5 through strong reviews and confirm mastered status with no next review.

## Problems and links
- Search waits briefly, then matches titles and slugs case-insensitively.
- Combine topic, difficulty, and status filters; clear them and recover NeetCode order.
- Open a problem and confirm the LeetCode page opens in a separate tab.
- Confirm no problem statement or solution text is stored or displayed.

## Backup, restore, and failures
- Export data, reset, restore the export, and confirm all user data returns.
- Reject a file over 5 MB, malformed JSON, wrong format version, and invalid fields without changing existing data.
- Simulate blocked IndexedDB and confirm an inline error with a working explicit Retry action.
- Confirm reset does nothing until `RESET` is typed exactly.

## Responsive and production
- At 719 px, verify navigation, dashboard cards, forms, and lists remain usable without horizontal page scrolling.
- At 720 px and desktop width, verify the desktop layout appears.
- Run `npm install`, then `npm run dev`; confirm startup succeeds.
- Run the production build and serve its output; confirm direct app startup and local persistence work.
