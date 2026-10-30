"""Stores the user can shop at."""

from fastapi import APIRouter

from app.schemas import Store

router = APIRouter(prefix="/stores", tags=["stores"])

STORES: list[Store] = [
    Store(id="kroger", name="Kroger", available=True, note="Ann Arbor"),
    Store(id="meijer", name="Meijer", available=False, note="Coming soon"),
    Store(id="costco", name="Costco", available=False, note="Coming soon"),
]


@router.get("", response_model=list[Store])
def list_stores() -> list[Store]:
    """All stores; only available ones can be picked."""
    return STORES
