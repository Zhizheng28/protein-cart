import { useEffect, useState } from "react";
import type { Plan, Profile, Tab } from "./types";

// v2: the menu changed, so plans saved with v1 meal ids are dropped.
const STORAGE_KEY = "protein-cart-state-v2";

export interface BankedWeek {
  week: number;
  savedCents: number;
}

/** A goal the user saved up for and spent. */
export interface ClaimedGoal {
  name: string;
  costCents: number;
  week: number;
}

/** Everything we remember between visits. Prices are re-fetched, never stored. */
export interface SavedState {
  profile: Profile | null;
  editing: boolean;
  plan: Plan | null;
  bankedCents: number;
  week: number;
  cookedInstead: number;
  cookedSavedCents: number;
  history: BankedWeek[];
  claimed: ClaimedGoal[];
  tab: Tab;
  planDay: number;
  useSample: boolean;
}

export const initialState: SavedState = {
  profile: null,
  editing: false,
  plan: null,
  bankedCents: 0,
  week: 1,
  cookedInstead: 0,
  cookedSavedCents: 0,
  history: [],
  claimed: [],
  tab: "money",
  planDay: todayIndex(),
  useSample: false,
};

/** Monday = 0 ... Sunday = 6. */
export function todayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function load(): SavedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...(JSON.parse(raw) as Partial<SavedState>) };
  } catch {
    return initialState;
  }
}

/** Clears savings and goes back to week 1, keeping the user's answers and plan. */
export function resetProgress(state: SavedState): SavedState {
  return {
    ...state,
    bankedCents: 0,
    week: 1,
    cookedInstead: 0,
    cookedSavedCents: 0,
    history: [],
    claimed: [],
  };
}

/** App state that survives reloads. Storage failures are ignored, the app still works. */
export function useSavedState() {
  const [state, setState] = useState<SavedState>(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode or full storage: keep going without saving.
    }
  }, [state]);
  return [state, setState] as const;
}
