import type { GamificationSnapshot } from '../services/gamification';

interface GamificationBarProps {
  snapshot: GamificationSnapshot;
}

// Minimal XP / level strip. The progress bar width transitions on XP change; the
// global `prefers-reduced-motion` rule clamps that. Richer flourish (level-up
// pulse, badge reveal) lands in the visuals PR.
export function GamificationBar({ snapshot }: GamificationBarProps) {
  const { level, xp, xpIntoLevel, xpForNextLevel } = snapshot;
  const pct = xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 100;

  return <article className="xp-bar" aria-label={`Level ${level}, ${xp} total XP`}>
    <div className="xp-bar-topline">
      <strong>Lv {level}</strong>
      <span>{xpIntoLevel} / {xpForNextLevel} XP to level {level + 1}</span>
    </div>
    <div className="xp-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="xp-fill" style={{ width: `${pct}%` }} />
    </div>
  </article>;
}
