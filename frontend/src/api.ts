import type {
  Catalog,
  Evaluation,
  PlanResponse,
  Profile,
  QuickMealsResponse,
  SendCartResponse,
  Store,
} from "./types";
import { localApi } from "./demo/localApi";

/** True for the GitHub Pages build: no server, everything answered in the browser. */
export const STATIC_DEMO = import.meta.env.VITE_DATA_MODE === "static";

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ApiError("We couldn't reach the server.");
  }
  if (!response.ok) {
    throw new ApiError(`The server answered ${response.status}.`);
  }
  return (await response.json()) as T;
}

function profileBody(profile: Profile, forceSample: boolean) {
  return {
    weight_lb: profile.weightLb,
    goal: profile.goal,
    budget_cents: profile.budgetCents,
    store_id: profile.storeId,
    force_sample: forceSample,
  };
}

const httpApi = {
  catalog: () => request<Catalog>("/catalog"),
  stores: () => request<Store[]>("/stores"),
  plan: (profile: Profile, forceSample: boolean, seed?: number, _current?: string[][]) =>
    request<PlanResponse>("/plan", {
      method: "POST",
      body: JSON.stringify({ ...profileBody(profile, forceSample), seed: seed ?? null }),
    }),
  evaluate: (profile: Profile, days: string[][], forceSample: boolean) =>
    request<Evaluation>("/plan/evaluate", {
      method: "POST",
      body: JSON.stringify({ ...profileBody(profile, forceSample), days }),
    }),
  quickMeals: (storeId: string, inCart: string[], forceSample: boolean) => {
    const query = new URLSearchParams({
      store_id: storeId,
      in_cart: inCart.join(","),
      force_sample: String(forceSample),
    });
    return request<QuickMealsResponse>(`/quick-meals?${query}`);
  },
  sendCart: () => request<SendCartResponse>("/cart/send", { method: "POST" }),
};

export const api: typeof httpApi = STATIC_DEMO ? localApi : httpApi;
