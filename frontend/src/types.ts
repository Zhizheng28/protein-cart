// Shapes returned by the FastAPI backend (see backend/app/schemas.py).

export type Goal = "gain" | "lean" | "maintain";
export type MealKind = "breakfast" | "main";

export interface MealSummary {
  id: string;
  name: string;
  kind: MealKind;
  minutes: number;
  quick: boolean;
  protein_g: number;
}

export interface FunGoal {
  id: string;
  name: string;
  cost_cents: number;
}

export interface Catalog {
  meals: MealSummary[];
  fun_goals: FunGoal[];
  goal_labels: Record<Goal, string>;
  bowl_price_cents: number;
  takeout_meals_per_week: number;
}

export interface CartItem {
  ingredient_id: string;
  product_name: string;
  size: string;
  grams_needed: number;
  meals_using: number;
  packages: number;
  unit_price_cents: number;
  cost_cents: number;
}

export interface WeekMoney {
  takeout_cents: number;
  grocery_cents: number;
  saved_cents: number;
  per_meal_cents: number;
  budget_cents: number;
  fun_cents: number;
  over_budget_cents: number;
}

export interface PriceSource {
  store: string;
  location: string;
  fetched_at: string;
  is_sample: boolean;
}

export interface Evaluation {
  items: CartItem[];
  money: WeekMoney;
  price_source: PriceSource;
}

export interface PlanResponse {
  days: string[][];
  target_g: number;
  weekly_protein_g: number;
  shortfall_g: number;
  evaluation: Evaluation;
}

export interface QuickMeal {
  id: string;
  name: string;
  minutes: number;
  protein_g: number;
  cost_cents: number;
  saves_cents: number;
  in_cart: boolean;
}

export interface QuickMealsResponse {
  meals: QuickMeal[];
  price_source: PriceSource;
}

export interface Store {
  id: string;
  name: string;
  available: boolean;
  note: string;
}

export interface SendCartResponse {
  status: string;
  message: string;
}

/** What the user told us during onboarding. */
export interface Profile {
  weightLb: number;
  goal: Goal;
  budgetCents: number;
  storeId: string;
  funGoalId: string;
}

/** The plan part of a PlanResponse, kept in saved state. */
export interface Plan {
  days: string[][];
  targetG: number;
  shortfallG: number;
}

export type Tab = "money" | "plan" | "cart" | "goals";
