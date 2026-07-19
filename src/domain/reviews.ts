import type { Outcome, PerceivedDifficulty, ProblemProgress, ProgressStatus, Quality } from '../types/models';

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

export function progressAfterAttempt(existing: ProblemProgress | undefined, quality: Quality, attemptedOn: string, updatedAt: string, today = new Date()): ProblemProgress {
  const previousStage = existing?.reviewStage ?? 0;
  const reviewStage = (quality === 'strong' ? Math.min(previousStage + 1, 5) : quality === 'partial' ? 1 : 0) as ProblemProgress['reviewStage'];
  const status: ProgressStatus = reviewStage === 5 ? 'mastered' : quality === 'weak' ? 'attempted' : 'solved';
  return { problemId: existing?.problemId ?? '', status, reviewStage, nextReviewDate: reviewDate(reviewStage, today), lastAttemptDate: attemptedOn, lastQuality: quality, strongAttemptCount: (existing?.strongAttemptCount ?? 0) + (quality === 'strong' ? 1 : 0), updatedAt };
}
