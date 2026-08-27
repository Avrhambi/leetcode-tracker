import type { RecommendationEvent } from '../types/models';

// Pure rules for recommendation events. The Dexie I/O lives in `db/recommendations.ts`.

function startOfDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// True when `event` is an open daily recommendation for `problemId` that a
// today's attempt should mark complete: recommended today, not a skip row, and
// not already completed. Kind-agnostic — the catalog entry point does not know
// whether the plan surfaced the problem as `new` or `review`.
export function isOpenRecommendationToday(event: RecommendationEvent, problemId: string, now: Date): boolean {
  return (
    event.problemId === problemId &&
    event.skippedUntil === null &&
    (event.completedAt === null || event.completedAt === undefined) &&
    new Date(event.recommendedAt) >= startOfDay(now)
  );
}

// The open recommendation events (any kind) that a today's attempt for
// `problemId` should complete.
export function openRecommendationsToComplete(events: RecommendationEvent[], problemId: string, now: Date): RecommendationEvent[] {
  return events.filter((event) => isOpenRecommendationToday(event, problemId, now));
}
