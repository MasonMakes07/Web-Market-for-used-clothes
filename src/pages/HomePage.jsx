/**
 * HomePage.jsx
 * Main landing page — displays a searchable grid of active listings.
 * Search filters by title and category.
 * Clicking a card opens the ListingModal.
 */

import { useState, useMemo } from "react";
import { useListings } from "../hooks/useListings.jsx";
import ListingCard from "../components/ListingCard.jsx";
import ListingModal from "../components/ListingModal.jsx";
import "./HomePage.css";

export default function HomePage() {
  const { listings, isLoading, error } = useListings();
  const [query, setQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);

  // Filter listings by title or category (case-insensitive)
  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query, listings]);

  if (isLoading) {
    return (
      <div className="home">
        <p className="home-loading">Loading listings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <p className="home-error">Failed to load listings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Search bar */}
      <div className="home-search-wrap">
        <input
          className="home-search"
          type="text"
          placeholder="Search listings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search listings"
        />
      </div>

      {/* Listing grid */}
      {filteredListings.length === 0 ? (
        <p className="home-empty">
          {query ? `No listings match "${query}"` : "No listings yet. Be the first to sell!"}
        </p>
      ) : (
        <div className="home-grid">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={setSelectedListing}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
