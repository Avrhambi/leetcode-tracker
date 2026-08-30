import { useEffect, useRef, useState, type ReactElement } from 'react';
import { BADGES, type BadgeId } from '../services/constants';

interface BadgeShelfProps {
  earned: string[];
}

// One geometry mark per badge, filled when earned, outline when locked. Typed by
// BadgeId so a new badge in `constants.ts` without a mark here is a compile
// error, not a silently blank <svg>. Each axis has its OWN glyph family and the
// tier within it adds one element — so no two marks collide, and the strip reads
// as four progressions:
//   first steps — triangle, square
//   consistency — a bar chart gaining bars (1 → 2 → 3 → 4)
//   mastery     — a diamond gaining a ring, then a second diamond
//   volume      — a half disc, then a full disc
//   level       — a chevron, then a double chevron
// All shapes are filled solid (see gamification.css), so families are told apart
// by silhouette, not by fine detail that vanishes at 20px.
// Badges earned while this is mounted get a one-shot reveal fade.
const bars = (n: number) => Array.from({ length: n }, (_, i) => (
  <rect key={i} x={12 + i * 22} y={70 - i * 16} width="14" height={20 + i * 16} />
));
const MARKS: Record<BadgeId, ReactElement> = {
  'first-solve': <polygon points="50,12 88,80 12,80" />,
  'first-mastered': <rect x="16" y="16" width="68" height="68" />,
  // Consistency — a bar chart, one more (taller) bar per streak tier.
  'week-streak': <>{bars(1)}</>,
  'ten-day-streak': <>{bars(2)}</>,
  'month-streak': <>{bars(3)}</>,
  'century-streak': <>{bars(4)}</>,
  // Mastery — one diamond, then two, then three (topics falling).
  'topic-cleared': <polygon points="50,10 82,50 50,90 18,50" />,
  'five-topics-cleared': <><polygon points="30,14 54,50 30,86 6,50" /><polygon points="70,14 94,50 70,86 46,50" /></>,
  'all-mastered': <><polygon points="22,20 40,50 22,80 4,50" /><polygon points="50,20 68,50 50,80 32,50" /><polygon points="78,20 96,50 78,80 60,50" /></>,
  // Volume — a half disc, then a full disc.
  'half-catalog': <path d="M50 8 A42 42 0 0 1 50 92 Z" />,
  century: <circle cx="50" cy="50" r="42" />,
  // Level — a chevron, then a double chevron.
  'level-5': <polygon points="50,14 90,54 78,66 50,38 22,66 10,54" />,
  'level-10': <><polygon points="50,10 88,48 78,58 50,30 22,58 12,48" /><polygon points="50,46 88,84 78,94 50,66 22,94 12,84" /></>
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
