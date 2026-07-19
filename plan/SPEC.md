# NeetCode Study Coach

## Core flows
On first launch, seed the bundled NeetCode 150 metadata into IndexedDB and show the dashboard. The user opens the daily plan, follows a LeetCode link, returns, records the attempt, and receives an updated plan. A previously completed problem is recorded through the same attempt form; defaults are today, `solved_independently`, and `manageable`.

## Daily plan
Show at most three items: up to two due reviews, then one new problem. Due reviews are ordered by earliest `nextReviewDate`, then NeetCode order. A skipped item is hidden until 24 hours after the skip timestamp.

For a new problem, exclude solved/mastered problems and topics used by the last two new-problem recommendations. Choose the topic with the fewest attempted problems; break ties by bundled topic order. If every eligible topic is excluded, ignore the recent-topic exclusion. Within the topic choose by official difficulty order Easy, Medium, Hard, then NeetCode order. Medium becomes eligible after two strong attempts in that topic; Hard after three. If no problem passes the difficulty gate, choose the first unattempted problem in that topic.

## Attempt quality and reviews
The attempt form requires outcome and perceived difficulty. Outcome options: `solved_independently`, `solved_with_hint`, `watched_solution`, `could_not_solve`, `skipped`. Perceived difficulty options: `easy`, `manageable`, `hard`; default `manageable`. Duration is optional, integer 1–600 minutes. Help type is required for hint/solution outcomes and absent otherwise. Notes are optional, trimmed, maximum 500 characters.

Quality is `strong` for independent plus easy/manageable; `partial` for independent plus hard or solved with hint; `weak` for watched solution or could not solve. Skipped creates no attempt and hides the recommendation for 24 hours.

Review stage starts at 0. Weak sets stage 0 and review tomorrow. Partial sets stage 1 and review in 3 days. Strong increments the previous stage by one, capped at 5. Stage 1 reviews in 3 days, stage 2 in 7, stage 3 in 14, stage 4 in 30, and stage 5 has no next review and is mastered. Dates use the browser’s local calendar.

## Screens
Dashboard shows today’s plan, current streak, attempts in the last 7 calendar days, due-review count, and per-topic attempted/strong/mastered counts. Problems shows all 150 items with 200 ms search, topic/difficulty/status filters, and NeetCode order by default. Problem detail shows metadata, external LeetCode link, attempt history newest first, next review, and record-attempt action. Settings provides JSON export, JSON restore, and reset-all-data.

## States and limits
Initial seeding shows a blocking loading state. Empty search/filter results show “No matching problems.” Successful saves update the screen immediately and show a message for 2 seconds. Database or file failures show an inline error and Retry; no automatic retry. Export contains all local user data. Restore accepts one `.json` file up to 5 MB, validates the full payload before replacing data, and leaves existing data unchanged on failure. Reset requires typing `RESET` exactly. No pagination is used for the 150-problem catalog.
