/**
 * ProfilePage.jsx
 * Displays a user's public profile — cover photo, avatar, bio, college,
 * meetup spots, ratings, and their listings grid.
 *
 * TODO: Replace MOCK_PROFILE with useProfile(id) hook (Issue #15) when Mason's implementation is ready.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import ListingCard from "../components/ListingCard.jsx";
import { getCollegeLogo } from "../lib/colleges.js";
import "./ProfilePage.css";

// ---------------------------------------------------------------------------
// Mock data — matches the real DB shape (profiles + listings)
// Replace with: const { profile } = useProfile(id);
// ---------------------------------------------------------------------------
const MOCK_PROFILE = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  name: "Demo Seller",
  avatar_url: "https://i.pravatar.cc/150?img=1",
  cover_url: null,
  college: "Warren",
  bio: "Hey! I'm a Warren student selling clothes I no longer wear. Everything is priced to sell fast!",
  meetup_spots: ["Geisel Library", "Price Center", "PC Loop"],
  created_at: "2026-01-15T00:00:00Z",
  follower_count: 17,
  rating: 4.8,
  rating_count: 24,
  listings: [
    { id: "1", title: "Vintage Levi Denim Jacket", price: 35, category: "Outerwear", condition: "Like New", description: "Classic 90s Levis trucker jacket.", image_url: "https://picsum.photos/seed/jacket1/400/400", tags: ["denim", "vintage"], created_at: new Date().toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
    { id: "2", title: "Nike Air Force 1 Size 10", price: 55, category: "Shoes", condition: "Good", description: "White AF1s.", image_url: "https://picsum.photos/seed/shoes1/400/400", tags: ["nike", "sneakers"], created_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
    { id: "3", title: "Floral Summer Dress", price: 18, category: "Dresses", condition: "Like New", description: "Worn once.", image_url: "https://picsum.photos/seed/dress1/400/400", tags: ["dress", "summer"], created_at: new Date(Date.now() - 5 * 86400000).toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
    { id: "4", title: "Black Cargo Pants", price: 22, category: "Bottoms", condition: "Good", description: "H&M cargos.", image_url: "https://picsum.photos/seed/cargo1/400/400", tags: ["cargo", "pants"], created_at: new Date(Date.now() - 7 * 86400000).toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
    { id: "5", title: "Patagonia Fleece Pullover", price: 45, category: "Outerwear", condition: "Like New", description: "Classic snap-T.", image_url: "https://picsum.photos/seed/fleece1/400/400", tags: ["patagonia", "fleece"], created_at: new Date(Date.now() - 10 * 86400000).toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
    { id: "6", title: "High Waist Mom Jeans", price: 28, category: "Bottoms", condition: "Good", description: "Light wash.", image_url: "https://picsum.photos/seed/jeans1/400/400", tags: ["jeans", "women"], created_at: new Date(Date.now() - 14 * 86400000).toISOString(), status: "active", seller: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Demo Seller", avatar_url: "https://i.pravatar.cc/150?img=1", college: "Warren", rating: 4.8 } },
  ],
};

// Formats a date as "Joined Month Year"
function formatJoinDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Renders filled stars based on rating (e.g. 4.8 → "★★★★★ 4.8")
function StarRating({ rating, count }) {
  const filled = typeof rating === "number" ? Math.min(5, Math.max(0, Math.round(rating))) : 0;
  return (
    <div className="profile-rating">
      <span className="profile-stars">{"★".repeat(filled)}{"☆".repeat(5 - filled)}</span>
      <span className="profile-rating-score">{typeof rating === "number" ? rating.toFixed(1) : "—"}</span>
      {count > 0 && <span className="profile-rating-count">({count} reviews)</span>}
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [showAllListings, setShowAllListings] = useState(false);

  // TODO: Replace with real useProfile(id) call
  const profile = MOCK_PROFILE;

  // Decode the URL param before comparing — user.sub contains "|" which gets percent-encoded
  const isOwnProfile = isAuthenticated && user?.sub === decodeURIComponent(id);

  // Cover auth loading gap so buttons don't flash wrong state (Learning.md Lesson 3)
  if (isLoading) return null;

  if (!profile) {
    return <p className="profile-not-found">Profile not found.</p>;
  }

  const collegeLogo = getCollegeLogo(profile.college);
  const visibleListings = showAllListings ? profile.listings : profile.listings.slice(0, 4);

  function handleMessage() {
    if (!isAuthenticated) { login(); return; }
    navigate("/messages");
  }

  return (
    <div className="profile">
      {/* Cover photo */}
      <div className="profile-cover">
        {profile.cover_url
          ? <img src={profile.cover_url} alt="Cover" className="profile-cover-img" />
          : <div className="profile-cover-placeholder" />
        }
      </div>

      {/* Header — avatar, name, stats */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <img
            src={profile.avatar_url || "/default-avatar.png"}
            alt={profile.name}
            className="profile-avatar"
          />
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{profile.name}</h1>
            {collegeLogo && (
              <img src={collegeLogo} alt={profile.college} className="profile-college-logo" />
            )}
          </div>

          <StarRating rating={profile.rating} count={profile.rating_count} />

          <div className="profile-meta">
            <span>Joined {formatJoinDate(profile.created_at)}</span>
            <span>·</span>
            <span>{profile.follower_count} followers</span>
            <span>·</span>
            <span>{profile.listings.length} listings</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="profile-btn profile-btn--primary">Edit Profile</button>
          ) : (
            <>
              <button className="profile-btn profile-btn--primary" onClick={handleMessage}>Message</button>
              <button className="profile-btn profile-btn--secondary">Leave a Rating</button>
            </>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <section className="profile-section">
          <h2 className="profile-section-title">About</h2>
          <p className="profile-bio">{profile.bio}</p>
        </section>
      )}

      {/* Meetup spots */}
      {profile.meetup_spots?.length > 0 && (
        <section className="profile-section">
          <h2 className="profile-section-title">Ideal Meetup Spots</h2>
          <div className="profile-spots">
            {profile.meetup_spots.map((spot, i) => (
              <span key={`${spot}-${i}`} className="profile-spot-badge">{spot}</span>
            ))}
          </div>
        </section>
      )}

      {/* Listings grid */}
      <section className="profile-section">
        <h2 className="profile-section-title">Listings</h2>
        {profile.listings.length === 0 ? (
          <p className="profile-empty">No listings yet.</p>
        ) : (
          <>
            <div className="profile-grid">
              {visibleListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onClick={() => {}} />
              ))}
            </div>
            {profile.listings.length > 4 && (
              <button
                className="profile-show-more"
                onClick={() => setShowAllListings((v) => !v)}
              >
                {showAllListings ? "Show Less" : `View All ${profile.listings.length} Listings`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  );
}
