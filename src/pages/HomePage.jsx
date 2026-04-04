/**
 * HomePage.jsx
 * Main landing page — displays a searchable grid of active listings.
 * Search filters by title and tags.
 * Clicking a card opens the ListingModal.
 *
 * TODO: Replace MOCK_LISTINGS with useListings() hook once Mason's implementation is ready.
 */

import { useState, useMemo } from "react";
import ListingCard from "../components/ListingCard.jsx";
import ListingModal from "../components/ListingModal.jsx";
import "./HomePage.css";

// ---------------------------------------------------------------------------
// Mock data — matches the real DB shape (listings joined with profiles)
// Replace this with: const { listings } = useListings();
// ---------------------------------------------------------------------------
const MOCK_LISTINGS = [
  {
    id: "1",
    title: "Vintage Levi Denim Jacket",
    price: 35,
    category: "Outerwear",
    condition: "Like New",
    description: "Classic 90s Levis trucker jacket, barely worn. Size M.",
    image_url: "https://picsum.photos/seed/jacket1/400/400",
    tags: ["denim", "jacket", "vintage", "levi", "outerwear"],
    created_at: new Date().toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "2",
    title: "Nike Air Force 1 Size 10",
    price: 55,
    category: "Shoes",
    condition: "Good",
    description: "White AF1s, some sole yellowing but clean uppers.",
    image_url: "https://picsum.photos/seed/shoes1/400/400",
    tags: ["nike", "air force 1", "sneakers", "shoes", "white"],
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "3",
    title: "Floral Summer Dress",
    price: 18,
    category: "Dresses",
    condition: "Like New",
    description: "Worn once to a formal. Size M.",
    image_url: "https://picsum.photos/seed/dress1/400/400",
    tags: ["dress", "floral", "summer", "formal", "women"],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "4",
    title: "Black Cargo Pants",
    price: 22,
    category: "Bottoms",
    condition: "Good",
    description: "H&M cargos, size 32x30. Small scuff on left knee.",
    image_url: "https://picsum.photos/seed/cargo1/400/400",
    tags: ["cargo", "pants", "black", "hm", "streetwear"],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "5",
    title: "Oversized Graphic Tee",
    price: 12,
    category: "Tops",
    condition: "Good",
    description: "Vintage band tee, size L fits like XL.",
    image_url: "https://picsum.photos/seed/tee1/400/400",
    tags: ["graphic tee", "oversized", "vintage", "band tee", "tops"],
    created_at: new Date().toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "6",
    title: "Patagonia Fleece Pullover",
    price: 45,
    category: "Outerwear",
    condition: "Like New",
    description: "Classic snap-T in navy. Size M.",
    image_url: "https://picsum.photos/seed/fleece1/400/400",
    tags: ["patagonia", "fleece", "pullover", "outerwear", "navy"],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "7",
    title: "High Waist Mom Jeans",
    price: 28,
    category: "Bottoms",
    condition: "Good",
    description: "Light wash, size 27. Great condition.",
    image_url: "https://picsum.photos/seed/jeans1/400/400",
    tags: ["jeans", "mom jeans", "high waist", "light wash", "women"],
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
  {
    id: "8",
    title: "New Balance 574 Size 9",
    price: 40,
    category: "Shoes",
    condition: "Good",
    description: "Grey/white colorway. Light wear on sole.",
    image_url: "https://picsum.photos/seed/shoes2/400/400",
    tags: ["new balance", "574", "sneakers", "shoes", "grey"],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.5 },
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [selectedListing, setSelectedListing] = useState(null);

  // Filter listings by title or tags (case-insensitive)
  const filteredListings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_LISTINGS;
    return MOCK_LISTINGS.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [query]);

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
        <p className="home-empty">No listings match "{query}"</p>
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
