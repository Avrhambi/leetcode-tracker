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
    // Always clear the flag after the reveal window, even if another badge lands
    // mid-animation — otherwise the `fresh` class would stick and a later unlock
    // could not re-fire it.
    const timer = window.setTimeout(() => setFresh(new Set()), 700);
    return () => {
      window.clearTimeout(timer);
      setFresh(new Set());
    };
  }, [earned]);

  // A compact strip of marks — the header slot on a screen that does not scroll
  // has no room for cards, so each badge carries its label and hint in the
  // tooltip and the accessible name instead.
  return <ul className="badge-strip" aria-label={`Badges, ${earnedSet.size} of ${BADGES.length} earned`}>
    {BADGES.map((badge) => {
      const isEarned = earnedSet.has(badge.id);
      const classes = ['milestone', isEarned ? 'earned' : 'locked', fresh.has(badge.id) ? 'fresh' : ''].filter(Boolean).join(' ');
      const description = isEarned ? `${badge.label} — earned` : `${badge.label} — locked. ${badge.hint}`;
      return <li className={classes} key={badge.id} title={description}>
        <svg className="milestone-mark" viewBox="0 0 100 100" role="img" aria-label={description}>{MARKS[badge.id]}</svg>
      </li>;
    })}
  </ul>;
}
