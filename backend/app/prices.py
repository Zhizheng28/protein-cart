"""Where prices come from. Milestone 1 always serves the sample price book.

Milestone 2 adds the live Kroger lookup here, with a 3-second timeout that falls back
to `load_sample_prices()` so the demo never shows a blank screen.
"""

from app.catalog import PriceBook, load_sample_prices


def get_price_book(store_id: str, force_sample: bool = False) -> PriceBook:
    """Prices for `store_id`. Until live prices land, this is always the sample book."""
    return load_sample_prices()
