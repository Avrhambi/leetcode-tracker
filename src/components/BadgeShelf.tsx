import { useEffect, useRef, useState, type ReactElement } from 'react';
import { BADGES, type BadgeId } from '../services/constants';

interface BadgeShelfProps {
  earned: string[];
}

// One geometry mark per badge, filled when earned, outline when locked. Typed by
// BadgeId so a new badge in `constants.ts` without a mark here is a compile
// error, not a silently blank <svg>. Marks share a shape family per axis and gain
// a side as the tier climbs (streak: 3→4→5→6 sides; mastery pentagon→hexagon→
// heptagon; level: 5-point→6-point star), so the strip reads as a progression.
// Badges earned while this is mounted get a one-shot reveal fade.
const MARKS: Record<BadgeId, ReactElement> = {
  'first-solve': <polygon points="50,10 90,80 10,80" />,
  'first-mastered': <rect x="14" y="14" width="72" height="72" />,
  // Consistency — a polygon that gains a side as the streak lengthens.
  'week-streak': <polygon points="50,10 90,80 10,80" />,
  'ten-day-streak': <rect x="16" y="16" width="68" height="68" />,
  'month-streak': <polygon points="50,6 92,38 76,88 24,88 8,38" />,
  'century-streak': <polygon points="50,6 86,26 86,74 50,94 14,74 14,26" />,
  // Mastery — pentagon, hexagon, heptagon as more topics fall.
  'topic-cleared': <polygon points="50,6 92,38 76,88 24,88 8,38" />,
  'five-topics-cleared': <polygon points="50,6 86,26 86,74 50,94 14,74 14,26" />,
  'all-mastered': <polygon points="50,5 80,20 94,52 78,84 42,94 12,72 8,36 28,12" />,
  // Volume — disc, then octagon.
  'half-catalog': <circle cx="50" cy="50" r="40" />,
  century: <polygon points="32,7 68,7 93,32 93,68 68,93 32,93 7,68 7,32" />,
  // Level — 5-point star, then 6-point star.
  'level-5': <polygon points="50,6 61,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 39,38" />,
  'level-10': <polygon points="50,6 60,28 84,24 74,46 96,58 72,64 76,88 56,74 42,94 38,70 14,72 26,52 4,42 28,34 22,10 44,22" />
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
  return <div className="badge-strip-scroll">
    <ul className="badge-strip" aria-label={`Badges, ${earnedSet.size} of ${BADGES.length} earned`}>
      {BADGES.map((badge) => {
        const isEarned = earnedSet.has(badge.id);
        const classes = ['milestone', isEarned ? 'earned' : 'locked', fresh.has(badge.id) ? 'fresh' : ''].filter(Boolean).join(' ');
        const description = isEarned ? `${badge.label} — earned` : `${badge.label} — locked. ${badge.hint}`;
        return <li className={classes} key={badge.id} title={description}>
          <svg className="milestone-mark" viewBox="0 0 100 100" role="img" aria-label={description}>{MARKS[badge.id]}</svg>
        </li>;
      })}
    </ul>
  </div>;
}
