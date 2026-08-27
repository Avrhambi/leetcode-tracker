import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CatalogList } from './components/CatalogList';
import { Dashboard } from './components/Dashboard';
import { DailyPlan } from './components/DailyPlan';
import { ProblemDetail } from './components/ProblemDetail';
import { Settings } from './components/Settings';
import { db } from './db/database';
import { skipRecommendation } from './db/recommendations';
import { seedCatalog } from './db/seedCatalog';
import { useDailyPlan } from './hooks/useDailyPlan';
import { useGamification } from './hooks/useGamification';
import type { CatalogProblem } from './types/models';

export default function App() {
  const problems = useLiveQuery(() => db.problems.orderBy('neetcodeOrder').toArray(), []);
  const progress = useLiveQuery(() => db.progress.toArray(), []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const [seedError, setSeedError] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<CatalogProblem | null>(null);
  const [screen, setScreen] = useState<'dashboard' | 'daily' | 'problems' | 'settings'>('dashboard');

  const { plan, completedProblemIds } = useDailyPlan(problems, progress);
  const gamification = useGamification();

  const seed = () => {
    setSeedError(false);
    void seedCatalog().catch(() => setSeedError(true));
  };

  useEffect(seed, []);

  if (seedError) return <main><p role="alert">The catalog could not be loaded.</p><button type="button" onClick={seed}>Retry</button></main>;
  if (!problems || !progress || !attempts || !settings) return <main><p>Loading catalog…</p></main>;
  if (selectedProblem) return <main><ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} /></main>;
  const progressByProblem = new Map(progress.map((item) => [item.problemId, item.status]));
  return <main><header className="app-header"><div className="app-intro"><p className="eyebrow">LeetCode Tracker / local training system</p><h1>LeetCode<br />Tracker</h1><p className="app-lede">A focused NeetCode 150 workbench for deliberate practice, reviews, and clear next steps.</p></div><nav className="terminal-nav" aria-label="Primary navigation"><span className="terminal-prompt" aria-hidden="true">$</span><button type="button" className={screen === 'dashboard' ? 'active' : ''} onClick={() => setScreen('dashboard')}>--dashboard</button><button type="button" className={screen === 'daily' ? 'active' : ''} onClick={() => setScreen('daily')}>--today</button><button type="button" className={screen === 'problems' ? 'active' : ''} onClick={() => setScreen('problems')}>--catalog</button><button type="button" className={screen === 'settings' ? 'active' : ''} onClick={() => setScreen('settings')}>--settings</button><span className="terminal-caret" aria-hidden="true">▮</span></nav></header>{screen === 'dashboard' ? <Dashboard attempts={attempts} problems={problems} progress={progress} settings={settings} gamification={gamification} onSelectProblem={setSelectedProblem} /> : screen === 'daily' ? <DailyPlan items={plan ?? []} completedProblemIds={completedProblemIds} onSkip={(item) => skipRecommendation(item.problem.id, item.kind)} /> : screen === 'problems' ? <CatalogList problems={problems} progressByProblem={progressByProblem} onSelect={setSelectedProblem} /> : <Settings />}<footer className="app-footer"><p>LeetCode Tracker is local-first. Your practice history stays in this browser.</p></footer></main>;
}
