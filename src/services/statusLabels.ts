import type { ProgressStatus } from '../types/models';

// How `ProgressStatus` is spoken to the user. Display-only: the stored enum in
// `types/models.ts` is unchanged and is read by badges, dailyPlan, mastery,
// recommendations, and the backup payload — renaming it would be a migration and
// a backup-compatibility break for what is a wording problem.
//
// The stored names are misleading on their own. `reviews.ts` sets `attempted`
// when the last attempt came out *weak* and `solved` when the problem entered the
// review rotation, so both words sound like success while describing opposite
// outcomes — and status is recomputed every attempt, so it can fall back down.
// These labels name the strength the state actually represents.
export const STATUS_LABELS: Record<ProgressStatus, string> = {
  not_started: 'Not started',
  attempted: 'Weak',
  solved: 'Mid',
  mastered: 'Mastered'
};

// One-line explanation, shown as the chip's tooltip.
export const STATUS_HINTS: Record<ProgressStatus, string> = {
  not_started: 'No attempts recorded yet.',
  attempted: 'The last attempt did not land — this one comes back soon.',
  solved: 'Landed, and in the review rotation on its way to mastered.',
  mastered: 'Reviewed all the way through. No reviews left to schedule.'
};
