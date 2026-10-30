"""Build, re-price and shuffle the weekly plan."""

from fastapi import APIRouter, HTTPException

from app.catalog import PriceBook, load_meals
from app.matching import build_cart, cart_total_cents, meal_cost_cents
from app.optimizer import build_week
from app.prices import get_price_book
from app.savings import (
    BOWL_PRICE_CENTS,
    FUN_GOALS,
    GOAL_LABELS,
    TAKEOUT_MEALS_PER_WEEK,
    protein_target_g,
    quick_meal_savings_cents,
    week_money,
)
from app.schemas import (
    CatalogResponse,
    EvaluateRequest,
    Evaluation,
    MealSummary,
    PlanRequest,
    PlanResponse,
    PriceSource,
    QuickMeal,
    QuickMealsResponse,
)

router = APIRouter(tags=["plan"])

SLOT_KINDS = ("breakfast", "main", "main")


def _price_source(prices: PriceBook) -> PriceSource:
    return PriceSource(
        store=prices.store,
        location=prices.location,
        fetched_at=prices.fetched_at,
        is_sample=prices.is_sample,
    )


def _evaluate(days: list[list[str]], budget_cents: int, prices: PriceBook) -> Evaluation:
    meals = load_meals()
    items = build_cart((meal_id for day in days for meal_id in day), meals, prices)
    return Evaluation(
        items=items,
        money=week_money(cart_total_cents(items), budget_cents),
        price_source=_price_source(prices),
    )


def _validate_days(days: list[list[str]]) -> None:
    meals = load_meals()
    for day in days:
        if len(day) != len(SLOT_KINDS):
            raise HTTPException(422, "Each day needs a breakfast, lunch and dinner.")
        for meal_id, kind in zip(day, SLOT_KINDS, strict=True):
            if meal_id not in meals or meals[meal_id].kind != kind:
                raise HTTPException(422, f"Unknown meal for this slot: {meal_id}")


@router.get("/catalog", response_model=CatalogResponse)
def catalog() -> CatalogResponse:
    """Meals, fun goals and the takeout baseline the app needs to render."""
    return CatalogResponse(
        meals=[MealSummary(**meal.model_dump()) for meal in load_meals().values()],
        fun_goals=FUN_GOALS,
        goal_labels=GOAL_LABELS,
        bowl_price_cents=BOWL_PRICE_CENTS,
        takeout_meals_per_week=TAKEOUT_MEALS_PER_WEEK,
    )


@router.post("/plan", response_model=PlanResponse)
def make_plan(body: PlanRequest) -> PlanResponse:
    """Build the cheapest week that meets the user's protein target."""
    prices = get_price_book(body.store_id, body.force_sample)
    target = protein_target_g(body.weight_lb, body.goal)
    week = build_week(load_meals(), prices, target, body.seed)
    return PlanResponse(
        days=week.days,
        target_g=week.target_g,
        weekly_protein_g=week.weekly_protein_g,
        shortfall_g=week.shortfall_g,
        evaluation=_evaluate(week.days, body.budget_cents, prices),
    )


@router.post("/plan/evaluate", response_model=Evaluation)
def evaluate_plan(body: EvaluateRequest) -> Evaluation:
    """Re-price a plan the user edited (for example after a swap)."""
    _validate_days(body.days)
    prices = get_price_book(body.store_id, body.force_sample)
    return _evaluate(body.days, body.budget_cents, prices)


@router.get("/quick-meals", response_model=QuickMealsResponse)
def quick_meals(
    store_id: str = "kroger",
    in_cart: str = "",
    force_sample: bool = False,
) -> QuickMealsResponse:
    """Meals under 15 minutes, what each costs and what it saves versus a bowl.

    `in_cart` is a comma-separated list of ingredient ids already in the user's cart.
    """
    prices = get_price_book(store_id, force_sample)
    cart = {part for part in in_cart.split(",") if part}
    result: list[QuickMeal] = []
    for meal in load_meals().values():
        if not meal.quick:
            continue
        cost = meal_cost_cents(meal, prices)
        result.append(
            QuickMeal(
                id=meal.id,
                name=meal.name,
                minutes=meal.minutes,
                protein_g=meal.protein_g,
                cost_cents=cost,
                saves_cents=quick_meal_savings_cents(cost),
                in_cart=bool(cart) and all(part.id in cart for part in meal.ingredients),
            )
        )
    result.sort(key=_quick_sort_key)
    return QuickMealsResponse(meals=result, price_source=_price_source(prices))


def _quick_sort_key(meal: QuickMeal) -> tuple[bool, int]:
    return (not meal.in_cart, -meal.saves_cents)
