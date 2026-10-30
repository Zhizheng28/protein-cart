import { useEffect, useState } from "react";
import type { Plan, Profile, Tab } from "./types";

const STORAGE_KEY = "protein-cart-state-v1";

export interface BankedWeek {
  week: number;
  savedCents: number;
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
