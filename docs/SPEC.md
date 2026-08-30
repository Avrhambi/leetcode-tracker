# NeetCode Study Coach

## Core flows
On first launch, seed the bundled NeetCode 150 metadata into IndexedDB and show the workbench. The user reads the Today strip, follows a LeetCode link, returns, records the attempt, and receives an updated plan. A previously completed problem is recorded through the same attempt form, reached from its topic's side panel; defaults are today, `solved_independently`, and `manageable`. Every entry point opens the same full-screen problem detail with its attempt form: selecting a problem from a topic or search list, and "Give feedback" on a daily-challenge item (which closes the challenge modal first). Recording an attempt anywhere completes any open daily recommendation for that problem today, so logging a plan problem from the side panel still marks the Today item done.

## Daily plan
The plan is adaptive, two to four items, and always contains at least one new problem. Review and new slots scale with the number of due reviews: zero due gives two new problems; one or two due gives one review and one or two new; three to five due gives two reviews and one new; six or more gives three reviews and one new. Due reviews are ordered by weakest last quality first (`weak`, then `partial`, then `strong`), then earliest `nextReviewDate`, then NeetCode order; reviews beyond the review slots wait for a later day and are surfaced as the workbench "for review" count. A skipped item is hidden until 24 hours after the skip timestamp. Once any recommendation has been persisted today, the plan replays those stored items so it stays stable as progress changes, topping up new problems only if the stored set is short of the new-slot target.

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

If an attempt for the same problem already exists on the same calendar day (from either the Today strip or a topic's side panel), a further attempt that day is reinforcement only: it records the attempt and updates the last quality and the consecutive-weak / struggling signals, but the review stage, next-review date, and progress status are unchanged, so a second pass cannot skip a spaced-repetition interval or push a scheduled review back into the new-problem pool.

After three consecutive weak attempts on one problem it is flagged `struggling`. While the consecutive-weak run is at three or more, a further weak attempt schedules the next review on a 2-, 4-, 7-day ladder instead of the next day, so a persistent blind spot is not surfaced daily; a non-weak attempt resets the run and the next weak attempt starts the ladder over from the next day. For the new-problem topic pick, a `struggling` problem contributes a neutral 0.5 to its topic's mastery instead of its reset-to-0 stage, so the plan stops flooding new problems from a topic the user is stuck in — but the difficulty ceiling still uses the real stage, so a topic being failed never unlocks its harder problems. A strong attempt clears the flag; a partial attempt stops the weak run without clearing it.

## Screens
The app is a single screen that never scrolls. The shell is a fixed `100dvh` grid with `overflow: hidden` on `html`/`body`; anything that can grow scrolls inside its own box instead — the side panel, the topic map's band list, and a modal body. There is no page footer.

The header carries, on one line: the title, the XP/level strip, the badge strip, and the Settings button. Below it a one-line stat strip (current streak, attempts in the last 7 calendar days, "for review" count) ends with a "Today's challenge" button badged with the number of still-open plan items. Then the search box, and then the topic map, which takes all remaining height.

Two things are modals, sharing one `Overlay` component (Esc or backdrop click closes; focus moves to the dialog on open; the panel caps at `85dvh` and its body scrolls): **Settings** (JSON export, JSON restore, reset-all-data, and the local-first note) and **Today's challenge** (the daily plan). "Give feedback" on a plan item closes this modal and opens the problem full screen, the same view a topic or search list opens.

The badge strip is a compact row of the six milestone marks — filled when earned, dim outline when locked — with each badge's label and hint in the tooltip and the SVG's accessible name, since the header has no room for cards.

The topic map is a quest path: one winding trail through all 18 topics, walked tier by tier — Foundations / Intermediate / Advanced from `src/data/topicTiers.ts` — keeping catalog order inside each tier, with a gate label where the curriculum steps up. The route serpentines across three legs and rides a sine wave, so it reads as a hand-drawn trail rather than rows. Clicking a node opens the side panel; clicking it again, or Close, dismisses it. Below 48rem the panel stacks under the map.

The side panel has two modes: a topic's problem list (from a node) and the search results (when the search box is non-empty, 200 ms debounced, matching problem title or topic — each row also shows the primary topic). An empty search shows "No matching problems."

Selecting a problem from either list — or "Give feedback" on a daily-challenge item — opens that problem **full screen**, in place of the map and panel: metadata, external LeetCode link, attempt history newest first, next review, and the record-attempt form. It is the one place real work happens and the map is not useful while working, so it gets the whole region. A Back button returns to whichever list it was opened from, or to the bare map when it was opened from the daily challenge (the search query survives the round trip). This view is not a modal — it is a sibling of the map region, which is what keeps the back-target state and the search-clearing behaviour intact. It is also the one region that can genuinely exceed the viewport (form plus full history), so it scrolls inside its own box; the page still does not. There is no separate catalog screen.

## Streak
The streak counts consecutive calendar days with at least one recorded attempt, up to and including the last active day — so a day without practice yet does not zero the streak, it holds at the run ending on the last active day. A returning user does not lose the whole streak on the first missed day: one grace day is always available and is spent automatically to bridge a single gap. Grace does not stretch to two adjacent missed days, and it is only ever counted as used once a later active day is actually reached — a gap before the user's first-ever attempt bridges nothing. Two or more consecutive missed days reset the streak to the run that follows the gap.

The grace refresh cadence (`refreshGrace`: one grant per rolling seven active days, capped at one) lives in `services/streak.ts` but is currently unobservable — the allowance is never spent down in storage, so it always reads as one. The `settings` rows (`streakGraceRemaining`, `streakGraceRefreshedOn`) hold the allowance and are read with that default when absent (fresh install, reset, version-1 restore); the app does not write them back. Grace usage is re-derived from the active dates on every render, so the streak is stable across re-renders. When grace bridged a gap, the stat strip notes how many grace days the current streak used.

## XP and levels
Every recorded attempt awards XP inside the same transaction that writes the
attempt: 20 / 12 / 5 for a strong / partial / weak first attempt of the day on
that problem, and a quarter of that (5 / 3 / 1) for a later same-day attempt on
the same problem. There is no bonus for a new problem versus a review — the award
is a pure function of the stored attempt row, so lifetime XP can be rebuilt
exactly by replaying the attempt history (done once by the Dexie `version(3)`
upgrade for existing users, and on backup restore when the payload predates
gamification). Level is `floor(sqrt(xp / 50))` — 50 XP to level 1, 200 to 2, 450
to 3 — and is derived on read, never stored. The workbench shows a level / XP
strip at the top; its fill bar transitions on XP change (clamped by
`prefers-reduced-motion`). When the level rises while the strip is on screen,
a one-shot pulse plays; a level-up that happens while the strip is unmounted
(e.g. the Settings overlay is open) is not replayed — nothing stores what was
last announced.

## Badges
Six milestone badges: first solve, first mastered, topic cleared (every problem
in one topic mastered), ten-day streak, halfway (75 distinct problems attempted),
century (100). Each is a pure predicate over progress, attempts, the catalog, and
the current streak length, checked after every attempt save. The earned set is
stored as a monotonic union — once a badge is earned it is never lost, even when
a later weak attempt resets the review stage that earned it. The header shows a
compact strip of all six marks (filled when earned, dim outline when locked); a
badge that unlocks while the strip is mounted gets a one-shot reveal fade. On
restore of a backup that has no badge data, the strip starts all-locked and
re-fills on the next attempt.

## Topic map and the struggling signal
The workbench renders the topic map as a quest path — one continuous trail
through every topic, walked tier by tier and drawn as an SVG on a fixed
viewBox. The viewBox is load-bearing: the map scales into whatever box is left
over and can never reflow or overflow, which is what allows the irregular
placement under the no-scroll invariant. Earlier grid layouts had to trade
column counts against crushed tiles to get the same guarantee. No per-width
tuning exists, and nothing in the map scrolls.

Node geometry is a pure, unit-tested function of the topic's index along the
route (`src/services/topicPath.ts`), never random, so the curriculum ordering is
preserved exactly and the map lays out identically on every render. Labels
alternate above and below their node: topic names are much wider than the gap
between nodes, and letting neighbours share a baseline is what makes the trail
unreadable.

Mastery is carried by three channels so none is load-bearing alone: the node's
ring fills as a progress arc, its core steps the five-rung `--mastery-*` ramp,
and its radius grows a step per rung. A fully cleared topic additionally gets a
star and a slow halo (motion-clamped; the loop stops entirely under
`prefers-reduced-motion`). The trail itself is dim for its whole length with the
travelled portion lit over it — lit as far as the furthest topic the user has
attempted, so the glow tracks the journey rather than sliding backwards when a
newly started topic drags the mean mastery down.

A topic with one or more problems currently flagged `struggling` is drawn in
warning red with a dashed ring — deliberately **off** the mastery ramp, which
stays monotone within the phosphor family, so "needs a different approach" can
never be read as a rung on the ladder. There is no separate needs-attention
list; the flagged problems remain reachable through that topic's side panel.

## Status labels
`ProgressStatus` is spoken to the user as a strength ladder: `not_started` →
"Not started", `attempted` → "Weak", `solved` → "Mid", `mastered` → "Mastered",
each chip carrying a one-line explanation in its tooltip. The chips use the same
monotone `--mastery-*` ramp as the topic map, so one screen describes mastery in
a single colour language.

The ladder never uses "solved" as a **status**, because that is exactly the word
it exists to disambiguate. A completed item in the daily-challenge modal is
chipped "Logged" — it says an attempt was recorded, which is all that action
means, and leaves the strength claim to the status chip. The attempt-outcome
labels ("Solved it on my own", "Solved it after a hint") deliberately keep the
word: there it names what happened on one attempt, not a rung on the ladder.

This mapping lives in `src/services/statusLabels.ts` and is **display-only** —
the stored enum in `src/types/models.ts` is unchanged. The stored names are
misleading on their own (`attempted` is set when the last attempt came out
*weak*, `solved` when the problem entered the review rotation, and status is
recomputed every attempt so it can fall back down), but the enum is persisted in
Dexie and read by `badges.ts`, `dailyPlan.ts`, `mastery.ts`, `recommendations.ts`
and the backup payload. **Do not "fix" the mismatch by renaming the stored
values** — that is a migration plus a backup-format break for a wording problem.

## States and limits
Initial seeding shows a blocking loading state. A topic with no problems shows nothing in its panel; a search with no matches shows "No matching problems." Successful saves update the screen immediately and show a message for 2 seconds. Database or file failures show an inline error and Retry; no automatic retry. Export contains all local user data as a `formatVersion` 2 payload, including the gamification XP-and-badges row when present. Restore accepts one `.json` file up to 5 MB of format version 1 or 2, validates the full payload before replacing data, defaults the version-2 fields when restoring a version-1 file, rebuilds lifetime XP from the restored attempts when the payload carries no gamification row, and leaves existing data unchanged on failure. Reset requires typing `RESET` exactly. The side-panel problem lists are never paginated.
