export interface PreviousSetValues {
  weight: number;
  reps: number;
}

export interface SetPrefillInput {
  completed: boolean;
  weight: number;
  reps: number;
  previousSet: PreviousSetValues | null | undefined;
  /**
   * True after this set has been prefilled, or after the user edits weight
   * or reps. Focusing an empty field does not settle it: history often
   * arrives after that tap.
   */
  settled: boolean;
}

export interface SetPrefillDecision {
  settled: boolean;
  apply: PreviousSetValues | null;
}

/** Copy the previous workout onto an incomplete set that is still empty. */
export function decideSetPrefill(input: SetPrefillInput): SetPrefillDecision {
  if (input.settled || input.previousSet == null) {
    return { settled: input.settled, apply: null };
  }
  if (input.completed || input.weight !== 0 || input.reps !== 0) {
    return { settled: true, apply: null };
  }
  return {
    settled: true,
    apply: { weight: input.previousSet.weight, reps: input.previousSet.reps },
  };
}

/**
 * Clear-on-focus is only for a value already on screen. An empty field must
 * stay empty in state so a late previous-set copy is not overwritten by 0.
 */
export function shouldClearOnFocus(completed: boolean, value: number): boolean {
  return !completed && value !== 0;
}
