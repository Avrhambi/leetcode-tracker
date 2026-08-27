import { useEffect, useRef, useState } from 'react';
import type { GamificationSnapshot } from '../services/gamification';

interface GamificationBarProps {
  snapshot: GamificationSnapshot;
}

// Minimal XP / level strip. The fill width transitions on XP change. When the
// level rises while this component is mounted, a one-shot pulse plays; a level-up
// that happened while the user was on another screen is not replayed (nothing
// stores what was last announced — an accepted limitation, see docs/SPEC.md).
export function GamificationBar({ snapshot }: GamificationBarProps) {
  const { level, xp, xpIntoLevel, xpForNextLevel } = snapshot;
  const pct = xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 100;

  const previousLevel = useRef(level);
  const [leveled, setLeveled] = useState(false);

  useEffect(() => {
    if (level > previousLevel.current) {
      setLeveled(true);
      const timer = window.setTimeout(() => setLeveled(false), 1000);
      previousLevel.current = level;
      return () => window.clearTimeout(timer);
    }
    previousLevel.current = level;
  }, [level]);

  return <article className="xp-bar" data-leveled={leveled} aria-label={`Level ${level}, ${xp} total XP`}>
    <div className="xp-bar-topline">
      <strong>Lv {level}</strong>
      <span>{xpIntoLevel} / {xpForNextLevel} XP to level {level + 1}</span>
    </div>
    <div className="xp-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="xp-fill" style={{ width: `${pct}%` }} />
    </div>
  </article>;
}
