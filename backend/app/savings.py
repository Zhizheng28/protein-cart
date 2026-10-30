"""Takeout baseline, protein targets and fun-money math. All money is integer cents."""

from math import ceil, floor
from typing import Literal

from pydantic import BaseModel

Goal = Literal["gain", "lean", "maintain"]

# The takeout baseline lives here and only here.
BOWL_PRICE_CENTS = 1350  # burrito bowl incl. tax, Ann Arbor, Oct 2026
TAKEOUT_MEALS_PER_WEEK = 14  # every lunch and dinner
MEALS_PER_WEEK = 21

PROTEIN_FACTORS: dict[Goal, float] = {"gain": 0.7, "lean": 0.75, "maintain": 0.55}
GOAL_LABELS: dict[Goal, str] = {
    "gain": "Build muscle",
    "lean": "Lean out",
    "maintain": "Stay healthy",
}


class FunGoal(BaseModel):
    id: str
    name: str
    cost_cents: int


FUN_GOALS: list[FunGoal] = [
    FunGoal(id="football", name="Football game ticket", cost_cents=6000),
    FunGoal(id="basketball", name="Basketball game with friends", cost_cents=3500),
    FunGoal(id="concert", name="Concert ticket", cost_cents=8500),
    FunGoal(id="chicago", name="Weekend trip to Chicago", cost_cents=18000),
]


class WeekMoney(BaseModel):
    takeout_cents: int
    grocery_cents: int
    saved_cents: int
    per_meal_cents: int
    budget_cents: int
    fun_cents: int
    over_budget_cents: int


def protein_target_g(weight_lb: float, goal: Goal) -> int:
    """Rough daily protein target in grams, rounded half up to the nearest 10."""
    return int(floor(weight_lb * PROTEIN_FACTORS[goal] / 10 + 0.5) * 10)


def takeout_cents() -> int:
    """Weekly cost of buying a bowl for every lunch and dinner."""
    return TAKEOUT_MEALS_PER_WEEK * BOWL_PRICE_CENTS


def week_money(grocery_cents: int, budget_cents: int) -> WeekMoney:
    """Savings versus takeout and fun money left in the budget for one week."""
    takeout = takeout_cents()
    return WeekMoney(
        takeout_cents=takeout,
        grocery_cents=grocery_cents,
        saved_cents=takeout - grocery_cents,
        per_meal_cents=round(grocery_cents / MEALS_PER_WEEK),
        budget_cents=budget_cents,
        fun_cents=max(0, budget_cents - grocery_cents),
        over_budget_cents=max(0, grocery_cents - budget_cents),
    )


def quick_meal_savings_cents(meal_cost_cents: int) -> int:
    """What cooking one meal saves versus ordering a bowl (never negative)."""
    return max(0, BOWL_PRICE_CENTS - meal_cost_cents)


def weeks_to_goal(goal_cents: int, banked_cents: int, weekly_saved_cents: int) -> int | None:
    """Weeks left at the current pace, or None if savings are not positive."""
    remaining = goal_cents - banked_cents
    if remaining <= 0:
        return 0
    if weekly_saved_cents <= 0:
        return None
    return ceil(remaining / weekly_saved_cents)
