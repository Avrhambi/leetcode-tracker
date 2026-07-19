import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CatalogList } from './components/CatalogList';
import { db } from './db/database';
import { seedCatalog } from './db/seedCatalog';

export default function App() {
  const problems = useLiveQuery(() => db.problems.orderBy('neetcodeOrder').toArray(), []);
  const [seedError, setSeedError] = useState(false);

  const seed = () => {
    setSeedError(false);
    void seedCatalog().catch(() => setSeedError(true));
  };

  useEffect(seed, []);

  if (seedError) return <main><p role="alert">The catalog could not be loaded.</p><button type="button" onClick={seed}>Retry</button></main>;
  if (!problems) return <main><p>Loading catalog…</p></main>;
  return <main><header><p className="eyebrow">Pattern Pilot</p><h1>NeetCode 150</h1><p>Your problem catalog is ready.</p></header><CatalogList problems={problems} /></main>;
}
