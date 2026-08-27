import type { Outcome, PerceivedDifficulty, ProblemProgress, ProgressStatus, Quality } from '../types/models';
import { STRUGGLE_BACKOFF_DAYS, STRUGGLE_THRESHOLD } from './constants';

export function qualityFor(outcome: Outcome, perceivedDifficulty: PerceivedDifficulty): Quality {
  if (outcome === 'solved_independently') return perceivedDifficulty === 'hard' ? 'partial' : 'strong';
  return outcome === 'solved_with_hint' ? 'partial' : 'weak';
}

export function localDate(offsetDays = 0, from = new Date()): string {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offsetDays);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function reviewDate(stage: ProblemProgress['reviewStage'], today = new Date()): string | null {
  const daysByStage = [1, 3, 7, 14, 30, null] as const;
  const days = daysByStage[stage];
  return days === null ? null : localDate(days, today);
}

// Days until the next review, backing off once a problem is `struggling` so a
// persistent blind spot is not served every single day. `consecutiveWeak` is the
// count *including* this attempt.
function weakReviewDate(consecutiveWeak: number, today: Date): string {
  if (consecutiveWeak < STRUGGLE_THRESHOLD) return localDate(1, today) as string;
  const index = Math.min(consecutiveWeak - STRUGGLE_THRESHOLD, STRUGGLE_BACKOFF_DAYS.length - 1);
  return localDate(STRUGGLE_BACKOFF_DAYS[index], today);
}

// Advance a problem's review state after an attempt.
//
// `alreadyAttemptedToday` is true when an attempt for this problem already exists
// on `attemptedOn` (any entry point — daily plan or catalog). In that case the
// spaced-repetition position (`reviewStage`, `nextReviewDate`) is frozen so a
// second same-day pass is reinforcement, not accelerated promotion — but the
// softer signals (`lastQuality`, `consecutiveWeak`, `struggling`, counts) still
// move. This needs no stored "last advanced on" column and stays correct under
// out-of-order backdated attempts.
export function progressAfterAttempt(
  existing: ProblemProgress | undefined,
  quality: Quality,
  attemptedOn: string,
  updatedAt: string,
  alreadyAttemptedToday = false,
  today = new Date()
): ProblemProgress {
  const previousStage = existing?.reviewStage ?? 0;
  const consecutiveWeak = quality === 'weak' ? (existing?.consecutiveWeak ?? 0) + 1 : 0;
  const struggling = quality === 'strong' ? false : consecutiveWeak >= STRUGGLE_THRESHOLD || (existing?.struggling ?? false);

  const advancedStage = (quality === 'strong' ? Math.min(previousStage + 1, 5) : quality === 'partial' ? 1 : 0) as ProblemProgress['reviewStage'];
  const reviewStage = alreadyAttemptedToday ? previousStage : advancedStage;
  const nextReviewDate = alreadyAttemptedToday
    ? (existing?.nextReviewDate ?? null)
    : quality === 'weak'
      ? weakReviewDate(consecutiveWeak, today)
      : reviewDate(reviewStage, today);

  // Freeze `status` with the rest of the spaced-repetition position: a second
  // same-day pass must not flip a scheduled review back to 'attempted' (which
  // would make it eligible as a fresh recommendation while still due for review).
  const status: ProgressStatus = alreadyAttemptedToday && existing
    ? existing.status
    : reviewStage === 5
      ? 'mastered'
      : quality === 'weak'
        ? 'attempted'
        : 'solved';

  return {
    problemId: existing?.problemId ?? '',
    status,
    reviewStage,
    nextReviewDate,
    lastAttemptDate: attemptedOn,
    lastQuality: quality,
    strongAttemptCount: (existing?.strongAttemptCount ?? 0) + (quality === 'strong' ? 1 : 0),
    consecutiveWeak,
    struggling,
    updatedAt
  };
}
