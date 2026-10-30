from decimal import Decimal

from app.catalog import Meal, MealIngredient, PriceBook, Product, load_meals, load_sample_prices
from app.matching import (
    build_cart,
    cart_total_cents,
    cost_per_serving_cents,
    meal_cost_cents,
    packages_needed,
    servings_per_package,
)

CHICKEN = Product(name="Chicken, 3 lb", size="3 lb", package_grams=1361, price_cents=1047)
RICE = Product(name="Rice, 2 lb", size="2 lb", package_grams=907, price_cents=329)
BOOK = PriceBook(
    store="Kroger",
    location="Test",
    fetched_at="2026-10-28",
    is_sample=True,
    products={"chicken_breast": CHICKEN, "rice": RICE},
)
BOWL = Meal(
    id="bowl",
    name="Bowl",
    kind="main",
    protein_source="chicken",
    minutes=20,
    quick=False,
    protein_g=40,
    ingredients=[
        MealIngredient(id="chicken_breast", grams=150),
        MealIngredient(id="rice", grams=75),
    ],
)


def test_servings_and_cost_per_serving() -> None:
    assert round(servings_per_package(CHICKEN, 150), 2) == Decimal("9.07")
    assert cost_per_serving_cents(CHICKEN, 150) == 115  # 1047 / 9.07


def test_packages_round_up_to_whole_packages() -> None:
    assert packages_needed(0, 907) == 0
    assert packages_needed(1, 907) == 1
    assert packages_needed(907, 907) == 1
    assert packages_needed(908, 907) == 2


def test_meal_cost_uses_fraction_of_each_package() -> None:
    # 150/1361 * 1047 = 115.4 ; 75/907 * 329 = 27.2  -> 142.6
    assert meal_cost_cents(BOWL, BOOK) == 143


def test_cart_buys_whole_packages() -> None:
    meals = {"bowl": BOWL}
    items = build_cart(["bowl"] * 10, meals, BOOK)  # 1500 g chicken, 750 g rice
    by_id = {item.ingredient_id: item for item in items}
    assert by_id["chicken_breast"].packages == 2
    assert by_id["chicken_breast"].aisle == "meat"
    assert by_id["rice"].packages == 1
    assert by_id["chicken_breast"].meals_using == 10
    assert cart_total_cents(items) == 2 * 1047 + 329
    assert items[0].ingredient_id == "chicken_breast"  # most expensive first


def test_sample_book_covers_every_meal_ingredient() -> None:
    prices = load_sample_prices()
    for meal in load_meals().values():
        for part in meal.ingredients:
            assert part.id in prices.products, f"{meal.id} uses unpriced {part.id}"
