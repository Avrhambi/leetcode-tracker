import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CatalogList } from './components/CatalogList';
import { Dashboard } from './components/Dashboard';
import { DailyPlan } from './components/DailyPlan';
import { ProblemDetail } from './components/ProblemDetail';
import { Settings } from './components/Settings';
import { db } from './db/database';
import { persistRecommendations, skipRecommendation } from './db/recommendations';
import { seedCatalog } from './db/seedCatalog';
import { selectDailyPlan } from './domain/dailyPlan';
import type { CatalogProblem } from './types/models';

export default function App() {
  const problems = useLiveQuery(() => db.problems.orderBy('neetcodeOrder').toArray(), []);
  const progress = useLiveQuery(() => db.progress.toArray(), []);
  const recommendationEvents = useLiveQuery(() => db.recommendationEvents.toArray(), []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), []);
  const [seedError, setSeedError] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CatalogProblem | null>(null);
  const [screen, setScreen] = useState<'dashboard' | 'daily' | 'problems' | 'settings'>('dashboard');

  const seed = () => {
    setSeedError(false);
    void seedCatalog().catch(() => setSeedError(true));
  };

  useEffect(seed, []);

  const plan = problems && progress && recommendationEvents ? selectDailyPlan({ problems, progress, recommendationEvents }) : undefined;
  useEffect(() => { if (plan) void persistRecommendations(plan); }, [plan]);

  if (seedError) return <main><p role="alert">The catalog could not be loaded.</p><button type="button" onClick={seed}>Retry</button></main>;
  if (!problems || !progress || !recommendationEvents || !attempts) return <main><p>Loading catalog…</p></main>;
  if (selectedProblem) return <main><ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} /></main>;
  const progressByProblem = new Map(progress.map((item) => [item.problemId, item.status]));
  return <main><header className="app-header"><div><p className="eyebrow">Pattern Pilot</p><h1>NeetCode 150</h1></div><nav aria-label="Primary navigation"><button type="button" className={screen === 'dashboard' ? 'active' : ''} onClick={() => setScreen('dashboard')}>Dashboard</button><button type="button" className={screen === 'daily' ? 'active' : ''} onClick={() => setScreen('daily')}>Daily challenge</button><button type="button" className={screen === 'problems' ? 'active' : ''} onClick={() => setScreen('problems')}>Problems</button><button type="button" className={screen === 'settings' ? 'active' : ''} onClick={() => setScreen('settings')}>Settings</button></nav></header>{screen === 'dashboard' ? <Dashboard attempts={attempts} problems={problems} progress={progress} /> : screen === 'daily' ? <DailyPlan items={plan ?? []} onSkip={(item) => skipRecommendation(item.problem.id, item.kind)} /> : screen === 'problems' ? <CatalogList problems={problems} progressByProblem={progressByProblem} onSelect={setSelectedProblem} /> : <Settings />}</main>;
}
