"""Meals, ingredients and the sample price book, loaded from backend/data."""

import json
from functools import cache
from typing import Literal

from pydantic import BaseModel

from app.config import DATA_DIR

MealKind = Literal["breakfast", "main"]
ProteinSource = Literal["chicken", "beef", "seafood", "pork", "eggs", "dairy"]
Aisle = Literal["meat", "dairy", "grains", "produce", "pantry"]


class Ingredient(BaseModel):
    id: str
    name: str
    search_term: str
    preferred_size: str
    grams_per_serving: int
    protein_per_100g: float
    aisle: Aisle


class MealIngredient(BaseModel):
    id: str
    grams: int


class Meal(BaseModel):
    id: str
    name: str
    kind: MealKind
    protein_source: ProteinSource
    minutes: int
    quick: bool
    protein_g: int
    ingredients: list[MealIngredient]


class Product(BaseModel):
    """One store product that stands in for an ingredient."""

    name: str
    size: str
    package_grams: int
    price_cents: int


class PriceBook(BaseModel):
    """Prices for every ingredient at one store, with where and when they came from."""

    store: str
    location: str
    fetched_at: str
    is_sample: bool
    products: dict[str, Product]


@cache
def load_ingredients() -> dict[str, Ingredient]:
    """All ingredients keyed by id."""
    raw = json.loads((DATA_DIR / "ingredients.json").read_text())
    return {item["id"]: Ingredient(**item) for item in raw}


@cache
def load_meals() -> dict[str, Meal]:
    """All meals keyed by id, in file order."""
    raw = json.loads((DATA_DIR / "meals.json").read_text())
    return {item["id"]: Meal(**item) for item in raw}


@cache
def load_sample_prices() -> PriceBook:
    """The fallback price book used in demo mode or when the store API fails."""
    raw = json.loads((DATA_DIR / "sample_prices.json").read_text())
    raw.pop("note", None)
    return PriceBook(**raw)
