"""Export everything the browser-only demo needs to frontend/src/demo/data.json.

The static site (GitHub Pages) has no Python, so we run the optimizer here for every
protein target a user can get and ship the results. Re-run after changing meals,
prices or the optimizer:

    cd backend && .venv/bin/python scripts/export_demo_data.py
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.catalog import load_meals, load_sample_prices  # noqa: E402
from app.matching import build_cart, cart_total_cents, meal_cost_cents  # noqa: E402
from app.optimizer import build_week  # noqa: E402
from app.routers.stores import STORES  # noqa: E402
from app.savings import (  # noqa: E402
    BOWL_PRICE_CENTS,
    FUN_GOALS,
    GOAL_LABELS,
    PROTEIN_FACTORS,
    TAKEOUT_MEALS_PER_WEEK,
    protein_target_g,
)

OUT = Path(__file__).resolve().parents[2] / "frontend" / "src" / "demo" / "data.json"
MIN_WEIGHT, MAX_WEIGHT = 90, 350
SHUFFLE_SEEDS = [11, 22, 33, 44, 55]


def all_targets() -> list[int]:
    """Every daily target onboarding can produce."""
    return sorted(
        {
            protein_target_g(weight, goal)
            for weight in range(MIN_WEIGHT, MAX_WEIGHT + 1)
            for goal in PROTEIN_FACTORS
        }
    )


def main() -> None:
    """Solve every target and write the JSON bundle."""
    meals = load_meals()
    prices = load_sample_prices()
    plans: dict[str, list[dict]] = {}
    cart_totals: dict[str, int] = {}
    for target in all_targets():
        variants = []
        seen: set[str] = set()
        for seed in [None, *SHUFFLE_SEEDS]:
            week = build_week(meals, prices, target, seed)
            key = json.dumps(week.days)
            if key in seen:
                continue
            seen.add(key)
            variants.append(
                {"days": week.days, "target_g": target, "shortfall_g": week.shortfall_g}
            )
        plans[str(target)] = variants
        first = [meal_id for day in variants[0]["days"] for meal_id in day]
        cart_totals[str(target)] = cart_total_cents(build_cart(first, meals, prices))
        print(f"target {target:3} g: {len(variants)} plans, {cart_totals[str(target)]} cents")

    data = {
        "price_book": prices.model_dump(),
        "meals": [meal.model_dump() for meal in meals.values()],
        "fun_goals": [goal.model_dump() for goal in FUN_GOALS],
        "goal_labels": GOAL_LABELS,
        "protein_factors": PROTEIN_FACTORS,
        "bowl_price_cents": BOWL_PRICE_CENTS,
        "takeout_meals_per_week": TAKEOUT_MEALS_PER_WEEK,
        "stores": [store.model_dump() for store in STORES],
        "plans": plans,
        # Answers from the Python code, so the TypeScript port can be checked against them.
        "parity": {
            "cart_totals": cart_totals,
            "quick_meal_costs": {
                meal.id: meal_cost_cents(meal, prices) for meal in meals.values() if meal.quick
            },
            "targets": {
                f"{weight}-{goal}": protein_target_g(weight, goal)
                for weight in (90, 133, 150, 170, 211, 350)
                for goal in PROTEIN_FACTORS
            },
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":")) + "\n")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
