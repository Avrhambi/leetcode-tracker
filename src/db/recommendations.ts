import { db } from './database';
import type { DailyPlanItem } from '../domain/dailyPlan';

export async function persistRecommendations(items: DailyPlanItem[], now = new Date()): Promise<void> {
  const recommendedAt = now.toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  await db.transaction('rw', db.recommendationEvents, async () => {
    for (const item of items) {
      const existing = await db.recommendationEvents.filter((event) => event.problemId === item.problem.id && event.kind === item.kind).last();
      if (!existing || existing.recommendedAt < dayStart) await db.recommendationEvents.add({ id: crypto.randomUUID(), problemId: item.problem.id, kind: item.kind, recommendedAt, skippedUntil: null, completedAt: null });
    }
  });
}

export async function skipRecommendation(problemId: string, kind: DailyPlanItem['kind'], now = new Date()): Promise<void> {
  const skippedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  await db.recommendationEvents.add({ id: crypto.randomUUID(), problemId, kind, recommendedAt: now.toISOString(), skippedUntil, completedAt: null });
}

export async function completeRecommendation(problemId: string, kind: DailyPlanItem['kind'], now = new Date()): Promise<void> {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const events = await db.recommendationEvents.where('problemId').equals(problemId).toArray();
  const event = events.find((item) => item.kind === kind && item.skippedUntil === null && new Date(item.recommendedAt) >= dayStart);
  if (event) await db.recommendationEvents.update(event.id, { completedAt: now.toISOString() });
}
