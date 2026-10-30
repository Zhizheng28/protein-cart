"""Ingredient -> store product, package size -> cost per serving, plan -> cart.

Money math uses Decimal internally and returns integer cents. The cart buys whole
packages, so the plan's cost is the cart total, not the sum of per-serving costs.
"""

from collections import Counter
from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal
from math import ceil

from pydantic import BaseModel

from app.catalog import Aisle, Meal, PriceBook, Product, load_ingredients


class CartItem(BaseModel):
    ingredient_id: str
    aisle: Aisle
    product_name: str
    size: str
    grams_needed: int
    meals_using: int
    packages: int
    unit_price_cents: int
    cost_cents: int


def _round_cents(value: Decimal) -> int:
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


def servings_per_package(product: Product, grams_per_serving: int) -> Decimal:
    """How many servings one package holds (may be fractional)."""
    return Decimal(product.package_grams) / Decimal(grams_per_serving)


def cost_per_serving_cents(product: Product, grams_per_serving: int) -> int:
    """Package price divided by servings per package, rounded to the cent."""
    servings = servings_per_package(product, grams_per_serving)
    return _round_cents(Decimal(product.price_cents) / servings)


def packages_needed(grams_needed: int, package_grams: int) -> int:
    """Whole packages to buy to cover `grams_needed`."""
    if grams_needed <= 0:
        return 0
    return ceil(grams_needed / package_grams)


def meal_cost_cents(meal: Meal, prices: PriceBook) -> int:
    """Ingredient cost of one serving of a meal, using what it uses from each package."""
    total = Decimal(0)
    for part in meal.ingredients:
        product = prices.products[part.id]
        total += Decimal(product.price_cents) * Decimal(part.grams) / Decimal(product.package_grams)
    return _round_cents(total)


def build_cart(
    meal_ids: Iterable[str], meals: dict[str, Meal], prices: PriceBook
) -> list[CartItem]:
    """Turn a list of planned meals into whole-package cart lines, most expensive first."""
    grams: Counter[str] = Counter()
    uses: Counter[str] = Counter()
    for meal_id in meal_ids:
        for part in meals[meal_id].ingredients:
            grams[part.id] += part.grams
            uses[part.id] += 1

    ingredients = load_ingredients()
    items: list[CartItem] = []
    for ingredient_id, grams_needed in grams.items():
        product = prices.products[ingredient_id]
        count = packages_needed(grams_needed, product.package_grams)
        items.append(
            CartItem(
                ingredient_id=ingredient_id,
                aisle=ingredients[ingredient_id].aisle,
                product_name=product.name,
                size=product.size,
                grams_needed=grams_needed,
                meals_using=uses[ingredient_id],
                packages=count,
                unit_price_cents=product.price_cents,
                cost_cents=count * product.price_cents,
            )
        )
    items.sort(key=_cart_sort_key)
    return items


def _cart_sort_key(item: CartItem) -> tuple[int, str]:
    return (-item.cost_cents, item.product_name)


def cart_total_cents(items: Iterable[CartItem]) -> int:
    """Sum of all cart lines."""
    return sum(item.cost_cents for item in items)
