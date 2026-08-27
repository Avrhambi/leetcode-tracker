# Manual QA

## Startup and persistence
- Open a fresh browser profile: loading appears, then the workbench renders with the topic map and Today strip.
- Open every topic node in turn: across all topics exactly 150 problems are listed.
- Reload after recording an attempt: history, status, review date, and the workbench stat strip persist.
- Close and reopen the browser: today’s plan remains consistent.

## Daily plan
- The "Today's challenge" button in the stat strip opens the plan as a modal; Esc and a backdrop click both close it, and the count on the button matches the number of still-open items (it drops as items are completed).
- With the modal open and an attempt form expanded, the page itself still does not scroll — only the modal body does.
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
- Open a problem that is on today's plan from its topic's side panel and record an attempt there: the Today item shows "Logged".
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
- Solve a first problem: the "First solve" mark in the header strip fills and fades in; hovering it shows "First solve — earned", and a locked mark shows its hint.
- Take a problem to mastered, then drive it to three weak attempts: the "First mastered" badge stays earned (monotonic), and that topic's node turns warning red with a dashed ring.
- Solve the struggling problem strongly: the node returns to its mastery rung on the green ramp.
- Confirm a struggling node is never mistakable for a mastery level — the ramp is monotone green, red appears only for struggling.
- The topic map draws one continuous trail through all 18 topics, walked tier by tier with a gate label at each step up (Foundations / Intermediate / Advanced); topic order inside a tier matches the catalog, and reloading lays the route out identically.
- A node's ring fills with its mastery, its core brightens along the ramp, and it grows a step per rung; a fully cleared topic shows a star and a slow halo.
- The trail is lit as far as the furthest topic attempted and dim beyond it. Start a brand-new topic further along the route: the lit portion extends rather than retreating.
- With the OS set to reduced motion, the cleared-topic halo does not play at all (it loops, so it stops rather than being clamped to one pulse).
- **No label overlaps any other label or gate.** This is the failure mode of a path layout, and it is invisible to any scroll check. In the console:
  ```js
  const t = [...document.querySelectorAll('.path-node-label, .tier-gate')].map(e => e.getBoundingClientRect());
  t.flatMap((a, i) => t.slice(i + 1).filter(b =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom)).length;  // must be 0
  ```
  Check it at full width, with the panel open, and narrow.
- Restore a backup with no badge data: the badge strip starts all-locked and re-fills after the next attempt.

## Status labels
- A problem whose last attempt was weak reads "Weak", not "attempted"; one in the review rotation reads "Mid"; a finished one reads "Mastered"; an untouched one reads "Not started".
- Hover each chip: the tooltip explains the state in one line.
- Confirm the four chips read as one ladder (dim → bright on the same green ramp), and that "needs a different approach" is the only red badge.

## Side panel, search, and links
- Click a topic node: its problems list beside the map in NeetCode order with difficulty and status badges; click the node again or Close to dismiss.
- Click a problem in the panel: it opens **full screen**, replacing both the map and the panel; Back returns to the list with the map restored.
- In the full-screen problem view, expand the attempt form on a problem with a long history: the view scrolls inside its own box and the page itself still does not scroll.
- Type in the search box: after a ~200 ms pause the panel shows problems whose title or topic matches, each row also showing its primary topic, with a "N of 150" count. Clearing the box closes the panel.
- Search a string that matches nothing: the panel shows "No matching problems."
- Open a problem from the search results, then press Back: it returns to the search results, not a topic list. Open one from a topic node and press Back: it returns to that topic's list.
- Open a problem's LeetCode link and confirm it opens in a separate tab.
- Confirm no problem statement or solution text is stored or displayed.

## Backup, restore, and failures
- Export data, reset, restore the export, and confirm all user data returns, XP included.
- Restore a pre-v2 backup file: it succeeds, and every problem's `consecutiveWeak` / `struggling` default to 0 / false.
- Restore a v2 backup that has no gamification row: it succeeds, XP is rebuilt from the restored attempts, and badges start empty.
- Restore a v2 backup whose gamification row carries a badges array: the badge strip shows exactly those badges filled.
- Reject a file over 5 MB, malformed JSON, an unsupported format version, and invalid fields without changing existing data.
- Simulate blocked IndexedDB and confirm an inline error with a working explicit Retry action.
- Confirm reset does nothing until `RESET` is typed exactly.

## Responsive and production
The page must never scroll — only the side panel, the topic map's band list, and a
modal body do. In the browser console, the check is:

```js
const de = document.documentElement;
de.scrollHeight <= de.clientHeight && de.scrollWidth <= de.clientWidth;   // must be true
```

Assert it in each state below. Note that "no page scroll" alone is not a pass — it
has passed while the map was unreadable. Pair it with the label-overlap check in
"Badges and the topic map": the map is an SVG that scales rather than reflowing,
so it cannot overflow, but it *can* scale its labels into each other.

Run these against an account with mastery spread across topics, not a fresh
install — an empty map exercises none of the ring, halo, or lit-trail states.

- Full width (~1440x900), no panel open.
- Topic panel open on a long topic (Arrays & Hashing): the route scales into the narrower box with labels still legible and no overlaps, and the panel's list scrolls inside its own box.
- Below 48 rem (~700x800): the panel stacks under the map, both fit the viewport, and each scrolls inside its own box; no horizontal scrolling. If the browser window will not resize this narrow, load the app in a same-origin `<iframe>` sized 700x800 and run the checks against its `contentDocument` — media queries evaluate against the iframe's own viewport. Confirm `documentElement.clientWidth` reads 700 first; if it reads the outer width the iframe is not establishing a viewport and the run proves nothing.
- In each of the above, open the "Today's challenge" modal with a multi-item plan and the attempt form expanded, and open a problem full screen.
- At 720 px and desktop width, verify the topic panel sits beside the map.
- Run `npm install`, then `npm run dev`; confirm startup succeeds.
- Run the production build and serve its output; confirm direct app startup and local persistence work.
