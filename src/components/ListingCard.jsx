/**
 * ListingCard.jsx
 * Card displayed in the home page listing grid.
 * Shows the item photo, price, title, and seller's college.
 * Displays a "Just listed" badge if the listing was created within the last 24 hours.
 */

import "./ListingCard.css";

// Returns true if the listing was created within the last 24 hours
function isJustListed(createdAt) {
  if (!createdAt) return false;
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - new Date(createdAt).getTime() < oneDayMs;
}

export default function ListingCard({ listing, onClick }) {
  const justListed = isJustListed(listing.created_at);

  return (
    <button className="listing-card" onClick={() => onClick(listing)} aria-label={`View ${listing.title}`}>
      <div className="listing-card-image-wrap">
        <img
          className="listing-card-image"
          src={listing.image_url || "/placeholder-item.png"}
          alt={listing.title}
        />
        {justListed && <span className="listing-card-badge">Just listed</span>}
      </div>

      <div className="listing-card-info">
        <span className="listing-card-price">
          {listing.price === 0
            ? "FREE"
            : typeof listing.price === "number" && listing.price > 0
            ? `$${listing.price.toFixed(2)}`
            : "Price unavailable"}
        </span>
        <span className="listing-card-title">{listing.title}</span>
        <span className="listing-card-college">{listing.seller?.college ?? ""}</span>
      </div>
    </button>
  );
}
