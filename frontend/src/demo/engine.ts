// Browser port of the backend's cart and savings math, for the static demo.
// Python (backend/app/matching.py, savings.py) is the source of truth;
// engine.test.ts checks these functions against answers exported from it.
import type {
  Aisle,
  CartItem,
  Evaluation,
  Goal,
  ProteinSource,
  QuickMeal,
  WeekMoney,
} from "../types";
import data from "./data.json";

export interface DemoProduct {
  name: string;
  size: string;
  package_grams: number;
  price_cents: number;
}

export interface DemoMeal {
  id: string;
  name: string;
  kind: "breakfast" | "main";
  protein_source: ProteinSource;
  minutes: number;
  quick: boolean;
  protein_g: number;
  ingredients: { id: string; grams: number }[];
}

export interface DemoPlan {
  days: string[][];
  target_g: number;
  shortfall_g: number;
}

export const demo = data as unknown as {
  price_book: {
    store: string;
    location: string;
    fetched_at: string;
    is_sample: boolean;
    products: Record<string, DemoProduct>;
  };
  meals: DemoMeal[];
  ingredient_aisles: Record<string, Aisle>;
  fun_goals: { id: string; name: string; cost_cents: number }[];
  goal_labels: Record<Goal, string>;
  protein_factors: Record<Goal, number>;
  bowl_price_cents: number;
  takeout_meals_per_week: number;
  stores: { id: string; name: string; available: boolean; note: string }[];
  plans: Record<string, DemoPlan[]>;
  parity: {
    cart_totals: Record<string, number>;
    quick_meal_costs: Record<string, number>;
    targets: Record<string, number>;
  };
};

const MEALS_PER_WEEK = 21;
const mealsById = new Map(demo.meals.map((meal) => [meal.id, meal]));

function product(id: string): DemoProduct {
  const found = demo.price_book.products[id];
  if (!found) throw new Error(`No price for ${id}`);
  return found;
}

/** Same as savings.protein_target_g: weight x factor, rounded half up to 10. */
export function proteinTargetG(weightLb: number, goal: Goal): number {
  return Math.floor((weightLb * demo.protein_factors[goal]) / 10 + 0.5) * 10;
}

/** Same as matching.build_cart: whole packages, most expensive first. */
export function buildCart(mealIds: string[]): CartItem[] {
  const grams = new Map<string, number>();
  const uses = new Map<string, number>();
  for (const mealId of mealIds) {
    for (const part of mealsById.get(mealId)?.ingredients ?? []) {
      grams.set(part.id, (grams.get(part.id) ?? 0) + part.grams);
      uses.set(part.id, (uses.get(part.id) ?? 0) + 1);
    }
  }
  const items: CartItem[] = [];
  for (const [id, needed] of grams) {
    const p = product(id);
    const packages = Math.ceil(needed / p.package_grams);
    items.push({
      ingredient_id: id,
      aisle: demo.ingredient_aisles[id] ?? "pantry",
      product_name: p.name,
      size: p.size,
      grams_needed: needed,
      meals_using: uses.get(id) ?? 0,
      packages,
      unit_price_cents: p.price_cents,
      cost_cents: packages * p.price_cents,
    });
  }
  return items.sort(
    (a, b) => b.cost_cents - a.cost_cents || (a.product_name < b.product_name ? -1 : 1),
  );
}

/** Same as savings.week_money. */
export function weekMoney(groceryCents: number, budgetCents: number): WeekMoney {
  const takeout = demo.takeout_meals_per_week * demo.bowl_price_cents;
  return {
    takeout_cents: takeout,
    grocery_cents: groceryCents,
    saved_cents: takeout - groceryCents,
    per_meal_cents: Math.round(groceryCents / MEALS_PER_WEEK),
    budget_cents: budgetCents,
    fun_cents: Math.max(0, budgetCents - groceryCents),
    over_budget_cents: Math.max(0, groceryCents - budgetCents),
  };
}

/** Same as matching.meal_cost_cents: the share of each package one serving uses. */
export function mealCostCents(meal: DemoMeal): number {
  let total = 0;
  for (const part of meal.ingredients) {
    const p = product(part.id);
    total += (p.price_cents * part.grams) / p.package_grams;
  }
  return Math.round(total);
}

export function evaluate(days: string[][], budgetCents: number): Evaluation {
  const items = buildCart(days.flat());
  const grocery = items.reduce((sum, item) => sum + item.cost_cents, 0);
  const { products: _products, ...source } = demo.price_book;
  return { items, money: weekMoney(grocery, budgetCents), price_source: source };
}

/** Pre-solved plans for a target. Targets outside the exported range use the nearest one. */
export function plansFor(targetG: number): DemoPlan[] {
  const keys = Object.keys(demo.plans).map(Number);
  const nearest = keys.reduce((best, key) =>
    Math.abs(key - targetG) < Math.abs(best - targetG) ? key : best,
  );
  return demo.plans[String(nearest)] ?? [];
}

export function quickMeals(inCart: string[]): QuickMeal[] {
  const cart = new Set(inCart.filter(Boolean));
  return demo.meals
    .filter((meal) => meal.quick)
    .map((meal) => {
      const cost = mealCostCents(meal);
      return {
        id: meal.id,
        name: meal.name,
        protein_source: meal.protein_source,
        minutes: meal.minutes,
        protein_g: meal.protein_g,
        cost_cents: cost,
        saves_cents: Math.max(0, demo.bowl_price_cents - cost),
        in_cart: cart.size > 0 && meal.ingredients.every((part) => cart.has(part.id)),
      };
    })
    .sort((a, b) => Number(b.in_cart) - Number(a.in_cart) || b.saves_cents - a.saves_cents);
}
