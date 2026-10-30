import { describe, expect, it } from "vitest";
import { buildCart, demo, mealCostCents, plansFor, proteinTargetG } from "./engine";
import type { Goal } from "../types";

// The Python backend wrote these answers into data.json. The browser must agree.
describe("browser engine matches the Python backend", () => {
  it("computes the same protein targets", () => {
    for (const [key, expected] of Object.entries(demo.parity.targets)) {
      const [weight, goal] = key.split("-");
      expect(proteinTargetG(Number(weight), goal as Goal), key).toBe(expected);
    }
  });

  it("prices every pre-solved week to the same cart total", () => {
    for (const [target, expected] of Object.entries(demo.parity.cart_totals)) {
      const plan = plansFor(Number(target))[0];
      const total = buildCart(plan?.days.flat() ?? []).reduce((s, i) => s + i.cost_cents, 0);
      expect(total, `target ${target}`).toBe(expected);
    }
  });

  it("prices quick meals to the same cent", () => {
    for (const meal of demo.meals.filter((m) => m.quick)) {
      expect(mealCostCents(meal), meal.id).toBe(demo.parity.quick_meal_costs[meal.id]);
    }
  });

  it("has a plan for every target onboarding can produce", () => {
    for (let weight = 90; weight <= 350; weight++) {
      for (const goal of Object.keys(demo.protein_factors) as Goal[]) {
        const target = proteinTargetG(weight, goal);
        expect(plansFor(target)[0]?.target_g, `${weight} ${goal}`).toBe(target);
      }
    }
  });
});
