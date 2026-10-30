from collections import Counter

import pytest

from app.catalog import load_meals, load_sample_prices
from app.matching import build_cart, cart_total_cents
from app.optimizer import MAX_REPEATS, build_week


@pytest.fixture(scope="module")
def meals():
    return load_meals()


@pytest.fixture(scope="module")
def prices():
    return load_sample_prices()


def _flat(days: list[list[str]]) -> list[str]:
    return [meal_id for day in days for meal_id in day]


def test_week_shape_and_slots(meals, prices) -> None:
    week = build_week(meals, prices, target_g=120)
    assert week.solver == "milp"
    assert len(week.days) == 7
    for breakfast, lunch, dinner in week.days:
        assert meals[breakfast].kind == "breakfast"
        assert meals[lunch].kind == "main"
        assert meals[dinner].kind == "main"
        assert lunch != dinner


def test_meets_target_and_repeat_limit(meals, prices) -> None:
    week = build_week(meals, prices, target_g=120)
    assert week.shortfall_g == 0
    assert week.weekly_protein_g >= 120 * 7
    assert max(Counter(_flat(week.days)).values()) <= MAX_REPEATS


def test_days_are_balanced(meals, prices) -> None:
    week = build_week(meals, prices, target_g=120)
    daily = [sum(meals[m].protein_g for m in day) for day in week.days]
    assert max(daily) - min(daily) <= 15


def test_higher_target_costs_at_least_as_much(meals, prices) -> None:
    low = build_week(meals, prices, target_g=90)
    high = build_week(meals, prices, target_g=130)
    low_cost = cart_total_cents(build_cart(_flat(low.days), meals, prices))
    high_cost = cart_total_cents(build_cart(_flat(high.days), meals, prices))
    assert high_cost >= low_cost


def test_impossible_target_reports_shortfall(meals, prices) -> None:
    week = build_week(meals, prices, target_g=250)
    assert week.shortfall_g > 0
    assert week.weekly_protein_g + week.shortfall_g == 250 * 7
    assert len(_flat(week.days)) == 21


def test_shuffle_is_repeatable_and_different(meals, prices) -> None:
    base = build_week(meals, prices, target_g=120)
    first = build_week(meals, prices, target_g=120, seed=42)
    again = build_week(meals, prices, target_g=120, seed=42)
    others = [build_week(meals, prices, target_g=120, seed=s).days for s in range(1, 6)]
    assert first.days == again.days
    assert any(days != base.days for days in others)
    assert first.shortfall_g == 0
