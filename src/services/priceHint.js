/**
 * priceHint.js
 * Service layer for the AI price suggestion feature.
 * Calls the Python backend (FastAPI) which uses Browser Use
 * to scrape Depop and eBay for comparable used clothing prices.
 * Returns a price range or null if no data is available.
 */

const PRICE_HINT_API = import.meta.env.VITE_PRICE_HINT_API || "http://localhost:8000";

// Fetches a suggested price range for a clothing item from the backend
export async function getPriceHint(title, category) {
  if (!title || title.trim().length === 0) {
    throw new Error("Title is required for price suggestion.");
  }

  const params = new URLSearchParams({ title: title.trim() });
  if (category && category.trim().length > 0) {
    params.set("category", category.trim());
  }

  const response = await fetch(`${PRICE_HINT_API}/price-hint?${params}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Price hint service unavailable." }));
    throw new Error(err.detail || "Failed to fetch price suggestion.");
  }

  const data = await response.json();

  // Return null if no comparable listings were found
  if (data.source_count === 0) {
    return null;
  }

  return data;
}
