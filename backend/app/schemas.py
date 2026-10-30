"""Request and response models shared by the API routers."""

from pydantic import BaseModel, Field

from app.catalog import MealKind
from app.matching import CartItem
from app.savings import FunGoal, Goal, WeekMoney


class PriceSource(BaseModel):
    store: str
    location: str
    fetched_at: str
    is_sample: bool


class MealSummary(BaseModel):
    id: str
    name: str
    kind: MealKind
    minutes: int
    quick: bool
    protein_g: int


class CatalogResponse(BaseModel):
    meals: list[MealSummary]
    fun_goals: list[FunGoal]
    goal_labels: dict[Goal, str]
    bowl_price_cents: int
    takeout_meals_per_week: int


class Profile(BaseModel):
    weight_lb: int = Field(ge=90, le=350)
    goal: Goal
    budget_cents: int = Field(ge=2000, le=40000)
    store_id: str = "kroger"


class PlanRequest(Profile):
    seed: int | None = None
    force_sample: bool = False


class EvaluateRequest(Profile):
    days: list[list[str]] = Field(min_length=7, max_length=7)
    force_sample: bool = False


class Evaluation(BaseModel):
    """A plan priced as a cart, with the week's money."""

    items: list[CartItem]
    money: WeekMoney
    price_source: PriceSource


class PlanResponse(BaseModel):
    days: list[list[str]]
    target_g: int
    weekly_protein_g: int
    shortfall_g: int
    evaluation: Evaluation


class QuickMeal(BaseModel):
    id: str
    name: str
    minutes: int
    protein_g: int
    cost_cents: int
    saves_cents: int
    in_cart: bool


class QuickMealsResponse(BaseModel):
    meals: list[QuickMeal]
    price_source: PriceSource


class Store(BaseModel):
    id: str
    name: str
    available: bool
    note: str


class SendCartResponse(BaseModel):
    status: str
    message: str
