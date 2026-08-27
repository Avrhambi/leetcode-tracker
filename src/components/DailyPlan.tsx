import { useEffect, useState } from 'react';
import type { DailyPlanItem } from '../services/dailyPlan';
import { AttemptForm } from './AttemptForm';

interface DailyPlanProps {
  items: DailyPlanItem[];
  completedProblemIds: Set<string>;
  onComplete: (item: DailyPlanItem) => Promise<void>;
  onSkip: (item: DailyPlanItem) => Promise<void>;
}

export function DailyPlan({ items, completedProblemIds, onComplete, onSkip }: DailyPlanProps) {
  const [error, setError] = useState(false);
  const [expandedProblemIds, setExpandedProblemIds] = useState<Set<string>>(new Set());
  useEffect(() => setError(false), [items]);
  const skip = (item: DailyPlanItem) => {
    setError(false);
    void onSkip(item).catch(() => setError(true));
  };
  const toggleFeedback = (problemId: string) => setExpandedProblemIds((current) => {
    const next = new Set(current);
    if (next.has(problemId)) {
      next.delete(problemId);
    } else {
      next.add(problemId);
    }
    return next;
  });
  const complete = (item: DailyPlanItem) => {
    void onComplete(item).catch(() => setError(true));
    toggleFeedback(item.problem.id);
  };
  return <section className="daily-plan"><p className="eyebrow">Today</p><h2>Daily challenge</h2><p>Complete a challenge on LeetCode, then track how it went when you are ready.</p>{error && <p role="alert">The recommendation could not be updated. Retry.</p>}{items.length === 0 ? <p>No problems are available for today.</p> : <ol>{items.map((item) => {
    const feedbackId = `feedback-${item.problem.id}`;
    const feedbackExpanded = expandedProblemIds.has(item.problem.id);
    const completed = completedProblemIds.has(item.problem.id);
    return <li className={completed ? 'completed-challenge' : ''} key={`${item.kind}-${item.problem.id}`}><div className="daily-challenge-header"><div><strong>{item.kind === 'review' ? 'Review' : 'New'} · {item.problem.title}</strong>{completed && <span className="challenge-status">Solved</span>}<p>{item.problem.primaryTopic} · {item.problem.difficulty}</p><a href={item.problem.leetcodeUrl} target="_blank" rel="noreferrer">Solve on LeetCode</a></div><div className="daily-challenge-actions">{!completed && <button type="button" aria-expanded={feedbackExpanded} aria-controls={feedbackId} onClick={() => toggleFeedback(item.problem.id)}>{feedbackExpanded ? 'Hide feedback' : 'Give feedback'}</button>}{!completed && <button type="button" onClick={() => skip(item)}>Skip for 24 hours</button>}</div></div>{feedbackExpanded && !completed && <div id={feedbackId}><AttemptForm problemId={item.problem.id} onSaved={() => complete(item)} /></div>}</li>;
  })}</ol>}</section>;
}
