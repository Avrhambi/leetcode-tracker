import Dexie, { type EntityTable } from 'dexie';
import type { AppSetting, Attempt, CatalogProblem, ProblemProgress, RecommendationEvent } from '../types/models';

export const db = new Dexie('pattern-pilot') as Dexie & {
  problems: EntityTable<CatalogProblem, 'id'>;
  progress: EntityTable<ProblemProgress, 'problemId'>;
  attempts: EntityTable<Attempt, 'id'>;
  recommendationEvents: EntityTable<RecommendationEvent, 'id'>;
  settings: EntityTable<AppSetting, 'key'>;
};

db.version(1).stores({
  problems: '&id, slug, neetcodeOrder, primaryTopic, difficulty',
  progress: '&problemId, status, nextReviewDate, lastAttemptDate',
  attempts: '&id, problemId, attemptedOn, createdAt',
  recommendationEvents: '&id, problemId, kind, recommendedAt, skippedUntil',
  settings: '&key'
});
