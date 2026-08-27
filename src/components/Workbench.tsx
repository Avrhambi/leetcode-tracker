import { useState } from 'react';
import { STREAK_GRACE_PER_WEEK } from '../services/constants';
import { currentStreak, type StreakGraceState } from '../services/streak';
import { masteryByTopic } from '../services/mastery';
import type { DailyPlanItem } from '../services/dailyPlan';
import type { GamificationView } from '../hooks/useGamification';
import { GamificationBar } from './GamificationBar';
import { BadgeShelf } from './BadgeShelf';
import { TopicMap } from './TopicMap';
import { TopicPanel } from './TopicPanel';
import { DailyPlan } from './DailyPlan';
import type { AppSetting, Attempt, CatalogProblem, ProblemProgress, ProgressStatus } from '../types/models';

interface WorkbenchProps {
  attempts: Attempt[];
  problems: CatalogProblem[];
  progress: ProblemProgress[];
  progressByProblem: Map<string, ProgressStatus>;
  settings: AppSetting[];
  gamification: GamificationView | undefined;
  planItems: DailyPlanItem[];
  completedProblemIds: Set<string>;
  onSkip: (item: DailyPlanItem) => Promise<void>;
}

function localDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Grace state lives in `settings` rows but is never spent down (see
// services/streak.ts); when absent the allowance is simply the default and
// grace usage is re-derived from the active dates each render.
function graceStateFrom(settings: AppSetting[]): StreakGraceState {
  const byKey = new Map(settings.map((row) => [row.key, row.value]));
  const remaining = Number(byKey.get('streakGraceRemaining'));
  return {
    graceRemaining: Number.isFinite(remaining) ? remaining : STREAK_GRACE_PER_WEEK,
    graceRefreshedOn: byKey.get('streakGraceRefreshedOn') ?? ''
  };
}

// The single screen: XP strip, tiered topic map (with the bare-minimum stats in
// its header and a per-topic side panel), today's plan, badge shelf.
export function Workbench({ attempts, problems, progress, progressByProblem, settings, gamification, planItems, completedProblemIds, onSkip }: WorkbenchProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const today = localDate();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weekStart = localDate(sevenDaysAgo);

  const dueReviews = progress.filter((item) => item.nextReviewDate !== null && item.nextReviewDate <= today).length;
  const attemptsThisWeek = attempts.filter((attempt) => attempt.attemptedOn >= weekStart && attempt.attemptedOn <= today).length;
  const activeDates = new Set(attempts.map((attempt) => attempt.attemptedOn));
  const { streak, graceDaysUsed } = currentStreak(activeDates, graceStateFrom(settings));

  const problemById = new Map(problems.map((problem) => [problem.id, problem]));
  const strugglingTopics = new Set(
    progress
      .filter((row) => row.struggling)
      .map((row) => problemById.get(row.problemId)?.primaryTopic)
      .filter((topic): topic is string => topic !== undefined)
  );

  const toggleTopic = (topic: string) => setSelectedTopic((current) => (current === topic ? null : topic));

  return <section className="workbench" aria-label="Practice workbench">
    {gamification && <GamificationBar snapshot={gamification} />}

    <div className="workbench-stats" aria-label="Progress summary">
      <span><b>{streak}</b> day streak{graceDaysUsed > 0 && <> · <span className="grace-note">{graceDaysUsed} grace {graceDaysUsed === 1 ? 'day' : 'days'}</span></>}</span>
      <span><b>{attemptsThisWeek}</b> attempts · 7 days</span>
      <span><b>{dueReviews}</b> due reviews</span>
    </div>

    <div className={`workbench-map${selectedTopic ? ' has-panel' : ''}`}>
      <TopicMap
        cells={masteryByTopic(problems, progress)}
        strugglingTopics={strugglingTopics}
        selectedTopic={selectedTopic}
        onSelectTopic={toggleTopic}
      />
      {selectedTopic && <TopicPanel
        topic={selectedTopic}
        problems={problems}
        progressByProblem={progressByProblem}
        onClose={() => setSelectedTopic(null)}
      />}
    </div>

    <DailyPlan items={planItems} completedProblemIds={completedProblemIds} onSkip={onSkip} />

    {gamification && <BadgeShelf earned={gamification.badges} />}
  </section>;
}
