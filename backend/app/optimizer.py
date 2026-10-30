"""Weekly plan: hit the protein target at the lowest cart cost.

The model chooses how many times each meal appears in the week (0-3), buys whole
packages of every ingredient those meals use, and minimises the cart total. Protein
is a soft constraint with a steep penalty, so an impossible target still returns the
best plan it can, with the shortfall reported.

Cheapest alone would be chicken every night, so lunches and dinners must mix proteins:
at least two chicken, two beef and two seafood meals a week, from at least two different
dishes each, and no protein more than six times. Meals are then spread across days so
each day's protein is as even as possible and lunch and dinner use different proteins.
"""

import random
from collections import Counter
from functools import partial
from typing import Literal

import pulp
from pydantic import BaseModel

from app.catalog import Meal, MealKind, PriceBook, ProteinSource
from app.matching import meal_cost_cents

DAYS_PER_WEEK = 7
BREAKFASTS_PER_WEEK = 7
MAINS_PER_WEEK = 14
MAX_REPEATS = 3
SHORTFALL_PENALTY_CENTS_PER_G = 1000
SHUFFLE_JITTER_CENTS = 250
SOLVER_TIME_LIMIT_SECONDS = 2
MIN_MAINS_PER_PROTEIN: dict[ProteinSource, int] = {"chicken": 2, "beef": 2, "seafood": 2}
MIN_DISHES_PER_PROTEIN = 2
MAX_MAINS_PER_PROTEIN = 6


class WeekPlan(BaseModel):
    """Seven days of [breakfast, lunch, dinner] meal ids."""

    days: list[list[str]]
    target_g: int
    weekly_protein_g: int
    shortfall_g: int
    solver: Literal["milp", "fallback"]


def build_week(
    meals: dict[str, Meal],
    prices: PriceBook,
    target_g: int,
    seed: int | None = None,
) -> WeekPlan:
    """Choose 7 breakfasts and 14 lunches/dinners that meet `target_g` a day at lowest cost.

    `seed` adds a small random tilt to each meal's cost so "Shuffle" gives a different
    but still cheap week. Without it the result is deterministic.
    """
    rng = random.Random(seed)
    jitter = _jitter(meals, rng) if seed is not None else dict.fromkeys(meals, 0)
    counts = _solve_counts(meals, prices, target_g, jitter)
    solver: Literal["milp", "fallback"] = "milp"
    if counts is None:
        counts = _fallback_counts(meals, prices, jitter)
        solver = "fallback"

    days = _spread_over_days(counts, meals, rng if seed is not None else None)
    weekly = sum(meals[meal_id].protein_g * n for meal_id, n in counts.items())
    return WeekPlan(
        days=days,
        target_g=target_g,
        weekly_protein_g=weekly,
        shortfall_g=max(0, target_g * DAYS_PER_WEEK - weekly),
        solver=solver,
    )


def _jitter(meals: dict[str, Meal], rng: random.Random) -> dict[str, int]:
    return {meal_id: rng.randint(0, SHUFFLE_JITTER_CENTS) for meal_id in meals}


def _ids_of_kind(meals: dict[str, Meal], kind: MealKind) -> list[str]:
    return [meal_id for meal_id, meal in meals.items() if meal.kind == kind]


def _solve_counts(
    meals: dict[str, Meal],
    prices: PriceBook,
    target_g: int,
    jitter: dict[str, int],
) -> Counter[str] | None:
    """Solve the MILP. Returns meal counts, or None if the solver fails."""
    model = pulp.LpProblem("weekly_plan", pulp.LpMinimize)
    uses = {
        meal_id: model.add_variable(f"n_{meal_id}", 0, MAX_REPEATS, cat="Integer")
        for meal_id in meals
    }
    used_ingredients = sorted({part.id for meal in meals.values() for part in meal.ingredients})
    packs = {ing: model.add_variable(f"p_{ing}", 0, cat="Integer") for ing in used_ingredients}
    shortfall = model.add_variable("shortfall_g", 0)

    model += (
        pulp.lpSum(prices.products[ing].price_cents * packs[ing] for ing in used_ingredients)
        + pulp.lpSum(jitter[meal_id] * uses[meal_id] for meal_id in meals)
        + SHORTFALL_PENALTY_CENTS_PER_G * shortfall
    )
    model += pulp.lpSum(uses[m] for m in _ids_of_kind(meals, "breakfast")) == BREAKFASTS_PER_WEEK
    model += pulp.lpSum(uses[m] for m in _ids_of_kind(meals, "main")) == MAINS_PER_WEEK
    picked = {m: model.add_variable(f"y_{m}", 0, 1, cat="Binary") for m in meals}
    for meal_id in meals:
        model += uses[meal_id] <= MAX_REPEATS * picked[meal_id]
        model += uses[meal_id] >= picked[meal_id]
    for source, ids in _mains_by_protein(meals).items():
        mains_of_source = pulp.lpSum(uses[m] for m in ids)
        model += mains_of_source <= MAX_MAINS_PER_PROTEIN
        if source in MIN_MAINS_PER_PROTEIN:
            model += mains_of_source >= min(MIN_MAINS_PER_PROTEIN[source], MAX_REPEATS * len(ids))
            model += pulp.lpSum(picked[m] for m in ids) >= min(MIN_DISHES_PER_PROTEIN, len(ids))
    model += (
        pulp.lpSum(meal.protein_g * uses[meal_id] for meal_id, meal in meals.items()) + shortfall
        >= target_g * DAYS_PER_WEEK
    )
    for ing in used_ingredients:
        grams = pulp.lpSum(
            part.grams * uses[meal_id]
            for meal_id, meal in meals.items()
            for part in meal.ingredients
            if part.id == ing
        )
        model += prices.products[ing].package_grams * packs[ing] >= grams

    try:
        model.solve(_solver())
    except pulp.PulpSolverError:
        return None
    if pulp.LpStatus[model.status] != "Optimal":
        return None

    counts: Counter[str] = Counter()
    for meal_id, var in uses.items():
        n = int(round(var.value() or 0))
        if n:
            counts[meal_id] = n
    return counts


def _mains_by_protein(meals: dict[str, Meal]) -> dict[ProteinSource, list[str]]:
    groups: dict[ProteinSource, list[str]] = {}
    for meal_id in _ids_of_kind(meals, "main"):
        groups.setdefault(meals[meal_id].protein_source, []).append(meal_id)
    return groups


def _solver() -> pulp.LpSolver:
    """HiGHS in-process when installed, otherwise PuLP's bundled CBC."""
    highs = pulp.HiGHS(msg=False, timeLimit=SOLVER_TIME_LIMIT_SECONDS)
    if highs.available():
        return highs
    return pulp.PULP_CBC_CMD(msg=False, timeLimit=SOLVER_TIME_LIMIT_SECONDS)


def _fallback_counts(
    meals: dict[str, Meal],
    prices: PriceBook,
    jitter: dict[str, int],
) -> Counter[str]:
    """Greedy backup: most protein per dollar, up to MAX_REPEATS each, keeping the protein mix."""

    def protein_per_cent(meal_id: str) -> float:
        cost = meal_cost_cents(meals[meal_id], prices) + jitter[meal_id]
        return meals[meal_id].protein_g / max(cost, 1)

    counts: Counter[str] = Counter()
    per_source: Counter[ProteinSource] = Counter()

    def add(meal_id: str, wanted: int) -> int:
        source = meals[meal_id].protein_source
        room = MAX_REPEATS - counts[meal_id]
        if meals[meal_id].kind == "main":
            room = min(room, MAX_MAINS_PER_PROTEIN - per_source[source])
        take = max(0, min(room, wanted))
        counts[meal_id] += take
        if meals[meal_id].kind == "main":
            per_source[source] += take
        return take

    for source, minimum in MIN_MAINS_PER_PROTEIN.items():
        ids = sorted(_mains_by_protein(meals).get(source, []), key=protein_per_cent, reverse=True)
        per_dish = -(-minimum // MIN_DISHES_PER_PROTEIN)  # ceil: spread over two dishes
        for meal_id in ids:
            minimum -= add(meal_id, min(per_dish, minimum))
    for kind, slots in (("breakfast", BREAKFASTS_PER_WEEK), ("main", MAINS_PER_WEEK)):
        ranked = sorted(_ids_of_kind(meals, kind), key=protein_per_cent, reverse=True)
        remaining = slots - sum(n for m, n in counts.items() if meals[m].kind == kind)
        for meal_id in ranked:
            remaining -= add(meal_id, remaining)
    return counts


def _spread_over_days(
    counts: Counter[str],
    meals: dict[str, Meal],
    rng: random.Random | None,
) -> list[list[str]]:
    """Place meals on days so daily protein is even and lunch and dinner differ."""
    day_protein = [0] * DAYS_PER_WEEK
    mains: list[list[str]] = [[] for _ in range(DAYS_PER_WEEK)]
    breakfasts: list[str] = [""] * DAYS_PER_WEEK
    day_order = list(range(DAYS_PER_WEEK))
    if rng is not None:
        rng.shuffle(day_order)

    def protein_of(meal_id: str) -> int:
        return meals[meal_id].protein_g

    def day_load(day: int) -> tuple[int, int]:
        return (day_protein[day], day_order.index(day))

    main_queue = sorted(_expand(counts, meals, "main"), key=protein_of, reverse=True)
    for meal_id in main_queue:
        source = meals[meal_id].protein_source
        open_days = [d for d in range(DAYS_PER_WEEK) if len(mains[d]) < 2]
        new_meal = [d for d in open_days if meal_id not in mains[d]]
        new_protein = [
            d for d in new_meal if all(meals[m].protein_source != source for m in mains[d])
        ]
        day = min(new_protein or new_meal or open_days, key=day_load)
        mains[day].append(meal_id)
        day_protein[day] += protein_of(meal_id)

    breakfast_queue = sorted(_expand(counts, meals, "breakfast"), key=protein_of, reverse=True)
    for meal_id in breakfast_queue:
        open_days = [d for d in range(DAYS_PER_WEEK) if not breakfasts[d]]
        day = min(open_days, key=day_load)
        breakfasts[day] = meal_id
        day_protein[day] += protein_of(meal_id)

    return _reorder_for_variety([[breakfasts[d], *mains[d]] for d in range(DAYS_PER_WEEK)])


def _reorder_for_variety(days: list[list[str]]) -> list[list[str]]:
    """Order days so neighbours share as few meals as possible (no identical Mon/Tue)."""
    remaining = days[1:]
    ordered = days[:1]
    while remaining:
        best = min(remaining, key=partial(_shared_meals, ordered[-1]))
        remaining.remove(best)
        ordered.append(best)
    return ordered


def _shared_meals(previous: list[str], day: list[str]) -> int:
    return len(set(previous) & set(day))


def _expand(counts: Counter[str], meals: dict[str, Meal], kind: MealKind) -> list[str]:
    return [
        meal_id
        for meal_id, n in sorted(counts.items())
        if meals[meal_id].kind == kind
        for _ in range(n)
    ]
