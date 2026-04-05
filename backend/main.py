"""
backend/main.py

FastAPI server for the UCSD Clothing Marketplace AI price suggestion feature.

This module exposes a single endpoint — GET /price-hint — that accepts an item
title and optional category, then uses the Browser Use Cloud API to scrape
Depop and eBay for similar used clothing listings and returns a suggested
price range.  The Browser Use SDK handles the browser session; results are
returned as structured JSON.

Run with:
    uvicorn main:app --reload --port 8000
"""

import asyncio
import logging
import os
import re
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()

BROWSER_USE_API_KEY = os.getenv("BROWSER_USE_API_KEY", "")

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class SourceItem(BaseModel):
    """A single comparable listing scraped from an external site."""

    site: str
    title: str
    price: float


class PriceHintResponse(BaseModel):
    """Structured price suggestion returned to the frontend."""

    min_price: float = Field(..., description="Lowest comparable price found")
    max_price: float = Field(..., description="Highest comparable price found")
    avg_price: float = Field(..., description="Mean of comparable prices")
    source_count: int = Field(..., description="Number of listings used to compute the range")
    sources: list[SourceItem] = Field(default_factory=list, description="Individual comparable listings")


class BrowserUseOutput(BaseModel):
    """
    Schema passed to Browser Use as output_schema so it returns structured data
    directly instead of free-form text.
    """

    items: list[SourceItem] = Field(
        default_factory=list,
        description="List of comparable used clothing items with site, title, and price in USD",
    )


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="UCSD Marketplace Price Hint API",
    description="Returns a suggested price range for a used clothing item by scraping Depop and eBay.",
    version="1.0.0",
)

# Allow the Vite dev server to call this backend without CORS errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Input sanitisation helpers
# ---------------------------------------------------------------------------


# Regex that allows only alphanumeric characters, spaces, hyphens, apostrophes,
# and common punctuation.  Anything that looks like code is rejected.
_SAFE_PATTERN = re.compile(r"^[\w\s\-\'\",\.&()]{1,120}$")

# Characters that suggest injection attempts regardless of the pattern above.
_INJECTION_CHARS = re.compile(r"[<>;=\[\]{}/\\|`$]")


def sanitize_input(value: str, field_name: str) -> str:
    """
    Validate and clean a single user-supplied string before it is
    interpolated into a Browser Use task prompt.

    Raises HTTPException 400 if the value looks like code or contains
    characters that cannot appear in a normal clothing item description.
    """
    stripped = value.strip()

    if not stripped:
        raise HTTPException(status_code=400, detail=f"{field_name} must not be empty after stripping whitespace.")

    if len(stripped) > 120:
        raise HTTPException(status_code=400, detail=f"{field_name} must be 120 characters or fewer.")

    if _INJECTION_CHARS.search(stripped):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} contains disallowed characters. Plain text only.",
        )

    if not _SAFE_PATTERN.match(stripped):
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} contains invalid characters.",
        )

    return stripped


# ---------------------------------------------------------------------------
# Browser Use task
# ---------------------------------------------------------------------------

_BROWSER_USE_TIMEOUT_SECONDS = 30


async def fetch_price_data(title: str, category: str) -> BrowserUseOutput:
    """
    Dispatch a Browser Use Cloud task that searches Depop and eBay for used
    clothing items matching *title* (and optionally *category*), then returns
    the first 5–10 results from each site as a structured list.

    Uses gemini-3-flash (cheapest model) with a 30-second hard timeout.
    Falls back to an empty item list on any error so the endpoint degrades
    gracefully instead of crashing.
    """
    # Guard here before entering try/except so the 500 propagates to the caller
    # instead of being swallowed by the broad except below.
    if not BROWSER_USE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="BROWSER_USE_API_KEY is not configured on the server.",
        )

    category_clause = f" in the '{category}' category" if category else ""
    task_prompt = (
        f"Search Depop (depop.com) for used clothing listings matching '{title}'{category_clause}. "
        f"Extract the title and price (in USD) of the first 5 to 10 results. "
        f"Then search eBay (ebay.com) for used clothing matching '{title}'{category_clause}. "
        f"Extract the title and price (in USD) of the first 5 to 10 results. "
        f"Return all results as a JSON array where each object has the keys: "
        f"'site' (either 'Depop' or 'eBay'), 'title' (string), and 'price' (number, USD only, no currency symbols)."
    )

    try:
        # Import here so the module still loads if the SDK is absent during testing.
        from browser_use_sdk.v3 import AsyncBrowserUse  # type: ignore

        client = AsyncBrowserUse()  # reads BROWSER_USE_API_KEY from env automatically

        result = await asyncio.wait_for(
            client.run(task_prompt, output_schema=BrowserUseOutput, model="gemini-3-flash"),
            timeout=_BROWSER_USE_TIMEOUT_SECONDS,
        )

        # The SDK returns the Pydantic model populated from the structured output.
        if result and hasattr(result, "output") and result.output:
            return result.output

        return BrowserUseOutput(items=[])

    except asyncio.TimeoutError:
        # Degrade gracefully — the frontend will show "no suggestion available".
        return BrowserUseOutput(items=[])

    except HTTPException:
        # Re-raise FastAPI exceptions so they reach the caller unchanged.
        raise

    except Exception as exc:
        # Log and degrade gracefully — the frontend will show "no suggestion available".
        logger.exception("Browser Use task failed: %s", exc)
        return BrowserUseOutput(items=[])


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@app.get("/price-hint", response_model=PriceHintResponse)
async def price_hint(
    title: str = Query(..., min_length=1, max_length=120, description="Item title from the listing form"),
    category: Optional[str] = Query(None, max_length=60, description="Optional clothing category"),
) -> PriceHintResponse:
    """
    Return a suggested price range for a used clothing item.

    The frontend calls this while the seller fills in the listing form.
    The endpoint sanitizes inputs, dispatches a Browser Use cloud task to
    scrape Depop and eBay, then aggregates the scraped prices into a range.

    Frontend request:
        GET http://localhost:8000/price-hint?title=Levi%27s+501+Jeans&category=Bottoms

    Frontend receives:
        {
          "min_price": 18.0,
          "max_price": 55.0,
          "avg_price": 31.5,
          "source_count": 8,
          "sources": [
            { "site": "Depop", "title": "Levi's 501 jeans sz 32", "price": 24.0 },
            ...
          ]
        }

    Returns 400 if title/category fail sanitization.
    Returns 200 with source_count=0 and empty sources if Browser Use times out
    or returns no usable data (the frontend should handle this gracefully).
    """
    # Sanitize both inputs before they touch the Browser Use prompt.
    clean_title = sanitize_input(title, "title")
    clean_category = sanitize_input(category, "category") if category else ""

    browser_output = await fetch_price_data(clean_title, clean_category)

    items = browser_output.items

    if not items:
        # No data — return zeros so the frontend can detect "no suggestion".
        return PriceHintResponse(
            min_price=0.0,
            max_price=0.0,
            avg_price=0.0,
            source_count=0,
            sources=[],
        )

    prices = [item.price for item in items if item.price > 0]

    if not prices:
        return PriceHintResponse(
            min_price=0.0,
            max_price=0.0,
            avg_price=0.0,
            source_count=0,
            sources=items,
        )

    min_price = round(min(prices), 2)
    max_price = round(max(prices), 2)
    avg_price = round(sum(prices) / len(prices), 2)

    return PriceHintResponse(
        min_price=min_price,
        max_price=max_price,
        avg_price=avg_price,
        source_count=len(prices),
        sources=items,
    )
