import type { HelpType, Outcome, PerceivedDifficulty } from '../types/models';

// Which secondary answers make sense for each outcome. An outcome with no
// `difficulties` hides the "how hard did it feel" field (and 'hard' is saved,
// since these outcomes are already weak); an outcome with no `helpTypes` hides
// the help-type field.
export const outcomeOptions: Record<Outcome, { difficulties?: PerceivedDifficulty[]; helpTypes?: HelpType[] }> = {
  solved_independently: { difficulties: ['easy', 'manageable', 'hard'] },
  solved_with_hint: { difficulties: ['manageable', 'hard'], helpTypes: ['small_hint', 'pattern_identification', 'pseudocode'] },
  watched_solution: { helpTypes: ['pseudocode', 'full_code', 'solution_video'] },
  could_not_solve: {}
};

// The perceivedDifficulty to persist for a save. When the field is hidden for
// this outcome we store 'hard' (still maps to 'weak', and matches "this was a
// struggle"); otherwise we snap an out-of-range selection to the first allowed
// option.
export function resolvePerceivedDifficulty(outcome: Outcome, selected: PerceivedDifficulty): PerceivedDifficulty {
  const allowed = outcomeOptions[outcome].difficulties;
  if (!allowed) return 'hard';
  return allowed.includes(selected) ? selected : allowed[0];
}

// The difficulty value to hold in form state after the outcome changes. Unlike
// the save-path resolution, this preserves the user's selection when the new
// outcome hides the field — so switching away and back does not silently rewrite
// a "manageable" solve into "a real struggle". Only an out-of-range value (e.g.
// 'easy' after switching to solved_with_hint) is snapped into range.
export function snapDifficultyForOutcome(outcome: Outcome, selected: PerceivedDifficulty): PerceivedDifficulty {
  const allowed = outcomeOptions[outcome].difficulties;
  if (!allowed || allowed.includes(selected)) return selected;
  return allowed[0];
}
