# Manual QA

## Startup and persistence
- Open a fresh browser profile: loading appears, then the workbench renders with the topic map and Today strip.
- Open every topic node in turn: across all topics exactly 150 problems are listed.
- Reload after recording an attempt: history, status, review date, and the workbench stat strip persist.
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
- Record two attempts for one problem on the same day (one from the Today strip, one from its topic's side panel): the review stage and status advance only once; both attempts show in the history. A weak second pass on a scheduled review does not send it back to the daily plan as a new problem.
- Open a problem that is on today's plan from its topic's side panel and record an attempt there: the Today item shows "Solved".
- Record an attempt from a side panel for a problem skipped earlier today: the (now stale) recommendation is marked complete.
- In the attempt history, confirm help type, time spent, and notes appear on the rows that have them, and a "needs a different approach" badge shows in the problem detail once a problem is struggling.
- Fail one problem weakly three times running: it is flagged struggling, its next review moves out past tomorrow (2, then 4, then 7 days), and its topic stops dominating the new-problem picks.
- While a topic has struggling problems, confirm new problems it still serves stay at the Easy difficulty ceiling — failing a topic must not unlock its Medium/Hard problems.
- Solve a struggling problem strongly: the flag clears and the next review returns to the normal ladder.

## Streak grace
- Miss one day after a run, then record an attempt: the streak survives (one grace day spent) and the stat strip shows "1 grace day".
- Miss two consecutive days with no grace left: the streak resets to the new run and the grace note in the stat strip disappears.
- After seven active days, confirm a grace day is available again.
- Record an attempt yesterday but none today: the streak still shows the run ending yesterday, not 0.
- Reset all data, reseed, and record one attempt: the stat strip shows a 1-day streak with no grace note (the grace settings rows are absent and default cleanly).

## XP and levels
- Record a strong first attempt of the day: the XP strip rises by 20 without a reload.
- Record a second attempt for the same problem the same day: XP rises by 5 (the reinforcement quarter), not 20.
- Reload the page: the level and XP are unchanged.
- With the OS set to reduced motion, confirm the XP fill bar's slide is clamped to a brief 150 ms rather than a longer ease, and the level-up pulse and sweep do not play.
- Open an app that was on a pre-gamification (coach-fixes) build with existing attempts: on first load the XP strip shows a non-zero total replayed from the attempt history.
- Cross a level boundary while the workbench is on screen: the level number pulses once. Cross one while the Settings overlay is open, then close it: no pulse (accepted — nothing stores what was announced).

## Badges and the topic map
- Solve a first problem: the "First solve" badge fills and fades in; the shelf reads 1 / 6.
- Take a problem to mastered, then drive it to three weak attempts: the "First mastered" badge stays earned (monotonic), and that topic's node shows the dashed warning ring.
- Solve the struggling problem strongly: the warning ring on the topic's node clears.
- The topic map renders one node per topic (18) in three bands (Foundations / Intermediate / Advanced), larger and filled for more-mastered topics; long topic names wrap without overlap. Narrow the window to ~360 px: the band grid reflows to fewer columns and the labels stay full-size (not shrunk to fit).
- Restore a backup with no badge data: the shelf starts empty and re-fills after the next attempt.

## Side panel, search, and links
- Click a topic node: its problems list beside the map in NeetCode order with difficulty and status badges; click the node again or Close to dismiss.
- Click a problem in the panel: the panel swaps to the problem detail; Back returns to the list; the map stays visible throughout.
- Type in the search box: after a ~200 ms pause the panel shows problems whose title or topic matches, each row also showing its primary topic, with a "N of 150" count. Clearing the box closes the panel.
- Search a string that matches nothing: the panel shows "No matching problems."
- Open a problem from the search results, then press Back: it returns to the search results, not a topic list. Open one from a topic node and press Back: it returns to that topic's list.
- Open a problem's LeetCode link and confirm it opens in a separate tab.
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
- At 719 px, verify the topic map (band grid reflowed, labels full-size), an open topic panel (stacked under the map), the search box, the Today strip, badges, forms, and the Settings overlay remain usable without horizontal page scrolling.
- At 720 px and desktop width, verify the topic panel sits beside the map.
- Run `npm install`, then `npm run dev`; confirm startup succeeds.
- Run the production build and serve its output; confirm direct app startup and local persistence work.
