import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BadgeShelf } from './components/BadgeShelf';
import { GamificationBar } from './components/GamificationBar';
import { SettingsOverlay } from './components/SettingsOverlay';
import { Workbench } from './components/Workbench';
import { db } from './db/database';
import { skipRecommendation } from './db/recommendations';
import { seedCatalog } from './db/seedCatalog';
import { useDailyPlan } from './hooks/useDailyPlan';
import { useGamification } from './hooks/useGamification';

export default function App() {
  const problems = useLiveQuery(() => db.problems.orderBy('neetcodeOrder').toArray(), []);
  const progress = useLiveQuery(() => db.progress.toArray(), []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const [seedError, setSeedError] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { plan, completedProblemIds } = useDailyPlan(problems, progress);
  const gamification = useGamification();

  const seed = () => {
    setSeedError(false);
    void seedCatalog().catch(() => setSeedError(true));
  };

  useEffect(seed, []);

  if (seedError) return <main><p role="alert">The catalog could not be loaded.</p><button type="button" onClick={seed}>Retry</button></main>;
  if (!problems || !progress || !attempts || !settings) return <main><p>Loading catalog…</p></main>;

  const progressByProblem = new Map(progress.map((item) => [item.problemId, item.status]));

  return <main>
    <header className="app-header">
      <div className="app-intro">
        <h1>LeetCode Tracker</h1>
      </div>
      {gamification && <GamificationBar snapshot={gamification} />}
      {gamification && <BadgeShelf earned={gamification.badges} />}
      <button type="button" className="settings-toggle" onClick={() => setSettingsOpen(true)}>Settings</button>
    </header>
    <Workbench
      attempts={attempts}
      problems={problems}
      progress={progress}
      progressByProblem={progressByProblem}
      settings={settings}
      planItems={plan ?? []}
      completedProblemIds={completedProblemIds}
      onSkip={(item) => skipRecommendation(item.problem.id, item.kind)}
    />
    {settingsOpen && <SettingsOverlay onClose={() => setSettingsOpen(false)} />}
  </main>;
}
