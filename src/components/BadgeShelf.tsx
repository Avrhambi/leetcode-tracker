import { useEffect, useRef, useState, type ReactElement } from 'react';
import { BADGES } from '../services/constants';

interface BadgeShelfProps {
  earned: string[];
}

// A geometry mark per badge — triangle, square, pentagon, hexagon, circle,
// octagon — filled when earned, outline when locked. Badges earned while this is
// mounted get a one-shot reveal fade.
const MARKS: Record<string, ReactElement> = {
  'first-solve': <polygon points="50,8 92,86 8,86" />,
  'first-mastered': <rect x="12" y="12" width="76" height="76" />,
  'topic-cleared': <polygon points="50,6 92,38 76,88 24,88 8,38" />,
  'ten-day-streak': <polygon points="50,6 86,26 86,74 50,94 14,74 14,26" />,
  'half-catalog': <circle cx="50" cy="50" r="42" />,
  century: <polygon points="32,7 68,7 93,32 93,68 68,93 32,93 7,68 7,32" />
};

export function BadgeShelf({ earned }: BadgeShelfProps) {
  const earnedSet = new Set(earned);
  const knownRef = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (knownRef.current === null) { knownRef.current = new Set(earned); return; }
    const added = earned.filter((id) => !knownRef.current!.has(id));
    knownRef.current = new Set(earned);
    if (added.length === 0) return;
    setFresh(new Set(added));
    const timer = window.setTimeout(() => setFresh(new Set()), 700);
    return () => window.clearTimeout(timer);
  }, [earned]);

  return <section className="badge-shelf" aria-labelledby="badge-shelf-heading">
    <p className="eyebrow" id="badge-shelf-heading">Badges · {earnedSet.size} / {BADGES.length}</p>
    <ul className="badge-grid">
      {BADGES.map((badge) => {
        const isEarned = earnedSet.has(badge.id);
        const classes = ['milestone', isEarned ? 'earned' : 'locked', fresh.has(badge.id) ? 'fresh' : ''].filter(Boolean).join(' ');
        return <li className={classes} key={badge.id}>
          <svg className="milestone-mark" viewBox="0 0 100 100" aria-hidden="true">{MARKS[badge.id]}</svg>
          <b>{badge.label}</b>
          <span>{isEarned ? 'Earned' : badge.hint}</span>
        </li>;
      })}
    </ul>
  </section>;
}
