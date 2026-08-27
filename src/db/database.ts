import Dexie, { type EntityTable } from 'dexie';
import type { AppSetting, Attempt, CatalogProblem, ProblemProgress, RecommendationEvent } from '../types/models';

export const db = new Dexie('pattern-pilot') as Dexie & {
  problems: EntityTable<CatalogProblem, 'id'>;
  progress: EntityTable<ProblemProgress, 'problemId'>;
  attempts: EntityTable<Attempt, 'id'>;
  recommendationEvents: EntityTable<RecommendationEvent, 'id'>;
  settings: EntityTable<AppSetting, 'key'>;
};

const stores = {
  problems: '&id, slug, neetcodeOrder, primaryTopic, difficulty',
  progress: '&problemId, status, nextReviewDate, lastAttemptDate',
  attempts: '&id, problemId, attemptedOn, createdAt',
  recommendationEvents: '&id, problemId, kind, recommendedAt, skippedUntil',
  settings: '&key'
};

db.version(1).stores(stores);

// v2: `consecutiveWeak` / `struggling` added to progress for the struggling-problem
// de-escalation. No index changes, so no store rebuild. Idempotent — guards on
// field presence.
//
// The streak-cadence settings (`streakGraceRemaining`, `streakGraceRefreshedOn`,
// `lastActiveOn`) are NOT seeded here and are currently not written — the
// dashboard reader defaults when they are absent, so a reset or a v1 restore
// (neither of which re-runs this upgrade) leaves the streak working, not broken.
db.version(2).stores(stores).upgrade(async (tx) => {
  await tx.table<ProblemProgress>('progress').toCollection().modify((row) => {
    if (typeof row.consecutiveWeak !== 'number') row.consecutiveWeak = 0;
    if (typeof row.struggling !== 'boolean') row.struggling = false;
  });
});
