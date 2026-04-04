/**
 * PriceHint.jsx
 * Displays an AI-suggested price range below the price input field
 * on the listing creation form. Shows loading state while Browser Use
 * scrapes comparable listings from Depop and eBay.
 */

// Renders the price suggestion hint below the price input
export default function PriceHint({ priceHint, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="price-hint price-hint--loading">
        <span className="price-hint__spinner" aria-hidden="true" />
        <span>Checking prices on Depop & eBay...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-hint price-hint--error">
        <span>Could not fetch price suggestion.</span>
      </div>
    );
  }

  if (!priceHint) {
    return null;
  }

  const { min_price, max_price, avg_price, source_count } = priceHint;

  return (
    <div className="price-hint price-hint--success">
      <p className="price-hint__range">
        Suggested price: <strong>${min_price.toFixed(2)} – ${max_price.toFixed(2)}</strong>
      </p>
      <p className="price-hint__detail">
        Average: ${avg_price.toFixed(2)} (based on {source_count} listing{source_count !== 1 ? "s" : ""} from Depop & eBay)
      </p>
    </div>
  );
}
