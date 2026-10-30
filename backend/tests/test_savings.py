from app.savings import (
    BOWL_PRICE_CENTS,
    protein_target_g,
    quick_meal_savings_cents,
    takeout_cents,
    week_money,
    weeks_to_goal,
)


def test_protein_targets_round_to_ten() -> None:
    assert protein_target_g(170, "gain") == 120  # 119
    assert protein_target_g(170, "lean") == 130  # 127.5
    assert protein_target_g(170, "maintain") == 90  # 93.5
    assert protein_target_g(200, "gain") == 140
    assert protein_target_g(150, "gain") == 110  # 105 rounds up, same as the browser demo


def test_takeout_baseline_is_fourteen_bowls() -> None:
    assert BOWL_PRICE_CENTS == 1350
    assert takeout_cents() == 18900


def test_week_money_under_budget() -> None:
    money = week_money(grocery_cents=6639, budget_cents=9000)
    assert money.saved_cents == 18900 - 6639
    assert money.fun_cents == 2361
    assert money.over_budget_cents == 0
    assert money.per_meal_cents == 316  # 6639 / 21 = 316.1


def test_week_money_over_budget() -> None:
    money = week_money(grocery_cents=6639, budget_cents=5000)
    assert money.fun_cents == 0
    assert money.over_budget_cents == 1639


def test_quick_meal_savings_never_negative() -> None:
    assert quick_meal_savings_cents(250) == 1100
    assert quick_meal_savings_cents(2000) == 0


def test_weeks_to_goal() -> None:
    assert weeks_to_goal(6000, 0, 12261) == 1
    assert weeks_to_goal(18000, 5000, 6000) == 3
    assert weeks_to_goal(6000, 6000, 100) == 0
    assert weeks_to_goal(6000, 0, 0) is None
