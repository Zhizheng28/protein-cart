"""Handing the cart to the store. Milestone 4 adds the real Kroger cart."""

from fastapi import APIRouter

from app.schemas import SendCartResponse

router = APIRouter(prefix="/cart", tags=["cart"])


@router.post("/send", response_model=SendCartResponse)
def send_cart() -> SendCartResponse:
    """Preview only for now: no order is placed."""
    return SendCartResponse(
        status="preview",
        message="Kroger sign-in is coming next. Your list is saved here for now.",
    )
