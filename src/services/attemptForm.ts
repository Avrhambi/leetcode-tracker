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

// The perceivedDifficulty to persist given the chosen outcome and the value the
// user last had selected. When the field is hidden for this outcome we store
// 'hard' (still maps to 'weak', and matches "this was a struggle"); otherwise we
// snap an out-of-range selection to the first allowed option.
export function resolvePerceivedDifficulty(outcome: Outcome, selected: PerceivedDifficulty): PerceivedDifficulty {
  const allowed = outcomeOptions[outcome].difficulties;
  if (!allowed) return 'hard';
  return allowed.includes(selected) ? selected : allowed[0];
}
