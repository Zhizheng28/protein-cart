// Same surface as the HTTP API, answered in the browser from pre-solved data.
import type {
  Catalog,
  Evaluation,
  PlanResponse,
  Profile,
  QuickMealsResponse,
  SendCartResponse,
  Store,
} from "../types";
import { demo, evaluate, plansFor, proteinTargetG, quickMeals } from "./engine";

function sameDays(a: string[][], b: string[][]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const localApi = {
  catalog: async (): Promise<Catalog> => ({
    meals: demo.meals.map(({ ingredients: _ingredients, ...meal }) => meal),
    fun_goals: demo.fun_goals,
    goal_labels: demo.goal_labels,
    bowl_price_cents: demo.bowl_price_cents,
    takeout_meals_per_week: demo.takeout_meals_per_week,
  }),
  stores: async (): Promise<Store[]> => demo.stores,
  plan: async (profile: Profile, _forceSample: boolean, seed?: number, current?: string[][]) => {
    const target = proteinTargetG(profile.weightLb, profile.goal);
    const options = plansFor(target);
    let choice = options[0];
    if (seed !== undefined && options.length > 1) {
      // Shuffle: any pre-solved variant other than the week on screen.
      const others = options.filter((p) => !current || !sameDays(p.days, current));
      choice = others[seed % others.length] ?? choice;
    }
    if (!choice) throw new Error("No plan for this target");
    const evaluation = evaluate(choice.days, profile.budgetCents);
    const weekly = choice.days
      .flat()
      .reduce((sum, id) => sum + (demo.meals.find((m) => m.id === id)?.protein_g ?? 0), 0);
    const response: PlanResponse = {
      days: choice.days,
      target_g: target,
      weekly_protein_g: weekly,
      shortfall_g: Math.max(0, target * 7 - weekly),
      evaluation,
    };
    return response;
  },
  evaluate: async (profile: Profile, days: string[][]): Promise<Evaluation> =>
    evaluate(days, profile.budgetCents),
  quickMeals: async (_storeId: string, inCart: string[]): Promise<QuickMealsResponse> => {
    const { products: _products, ...source } = demo.price_book;
    return { meals: quickMeals(inCart), price_source: source };
  },
  sendCart: async (): Promise<SendCartResponse> => ({
    status: "preview",
    message: "Demo: the real app hands this list to Kroger. No order placed.",
  }),
};
