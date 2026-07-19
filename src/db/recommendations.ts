import { db } from './database';
import type { DailyPlanItem } from '../domain/dailyPlan';

export async function persistRecommendations(items: DailyPlanItem[], now = new Date()): Promise<void> {
  const recommendedAt = now.toISOString();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  await db.transaction('rw', db.recommendationEvents, async () => {
    for (const item of items) {
      const existing = await db.recommendationEvents.filter((event) => event.problemId === item.problem.id && event.kind === item.kind).last();
      if (!existing || existing.recommendedAt < dayStart) await db.recommendationEvents.add({ id: crypto.randomUUID(), problemId: item.problem.id, kind: item.kind, recommendedAt, skippedUntil: null });
    }
  });
}

export async function skipRecommendation(problemId: string, kind: DailyPlanItem['kind'], now = new Date()): Promise<void> {
  const skippedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  await db.recommendationEvents.add({ id: crypto.randomUUID(), problemId, kind, recommendedAt: now.toISOString(), skippedUntil });
}
