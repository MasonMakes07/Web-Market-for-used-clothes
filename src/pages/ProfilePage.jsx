/**
 * ProfilePage.jsx
 * Displays a user's public profile — avatar, bio, college, rating,
 * meetup spots, reviews, and their listings grid.
 * Own profile shows "Edit Profile" button; other profiles show "Message".
 * Uses useProfile for current user and fetchProfile for other users.
 * Ratings fetched from ratings service (getSellerRating, getSellerRatings).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.jsx";
import { useListings } from "../hooks/useListings.jsx";
import { getSellerRating, getSellerRatings } from "../services/ratings.js";
import ListingCard from "../components/ListingCard.jsx";
import ListingModal from "../components/ListingModal.jsx";
import { getCollegeLogo } from "../lib/colleges.js";
import "./ProfilePage.css";

// Formats a date as "Joined Month Year"
function formatJoinDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Renders filled/empty stars for a given score (1-5)
function StarDisplay({ score }) {
  const stars = [];
  const rounded = Math.round(score);
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} className={i <= rounded ? "star star--filled" : "star star--empty"}>
        &#9733;
      </span>
    );
  }
  return <span className="star-display">{stars}</span>;
}

// Formats a review date as "Mon DD, YYYY"
function formatReviewDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { profile: myProfile, isLoading: profileLoading, fetchProfile } = useProfile();
  const { listings: allListings, isLoading: listingsLoading } = useListings();

  const [showAllListings, setShowAllListings] = useState(false);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewLoading, setViewLoading] = useState(!!id);
  const [selectedListing, setSelectedListing] = useState(null);

  // Rating state
  const [ratingData, setRatingData] = useState({ average: null, count: 0 });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Stale-response protection (Learning.md Lesson 8)
  const ratingsFetchIdRef = useRef(0);

  // Decode the URL param — user.sub contains "|" which gets percent-encoded
  const decodedId = decodeURIComponent(id);
  const isOwnProfile = isAuthenticated && user?.sub === decodedId;

  // Determine which profile to display
  const displayProfile = isOwnProfile ? myProfile : viewedProfile;

  // Fallback to Auth0 data when viewing own profile without a Supabase row
  const effectiveProfile = displayProfile
    || (isOwnProfile && user
      ? { name: user.name || user.email || "User", avatar_url: user.picture, bio: null, college: null, meetup_spots: [], created_at: null }
      : null);
  const isIncompleteProfile = isOwnProfile && !displayProfile && !!effectiveProfile;

  // Fetch other user's profile when viewing someone else's page
  useEffect(() => {
    if (isOwnProfile || !decodedId) {
      setViewLoading(false);
      return;
    }

    let cancelled = false;
    setViewLoading(true);

    fetchProfile(decodedId)
      .then((data) => {
        if (!cancelled) setViewedProfile(data);
      })
      .catch(() => {
        if (!cancelled) setViewedProfile(null);
      })
      .finally(() => {
        if (!cancelled) setViewLoading(false);
      });

    return () => { cancelled = true; };
  }, [decodedId, isOwnProfile, fetchProfile]);

  // Fetch ratings and reviews for the profile being viewed
  const fetchRatings = useCallback(async () => {
    if (!decodedId) return;

    const id = ++ratingsFetchIdRef.current;
    setReviewsLoading(true);

    try {
      const [rating, allReviews] = await Promise.all([
        getSellerRating(decodedId),
        getSellerRatings(decodedId),
      ]);
      if (id === ratingsFetchIdRef.current) {
        setRatingData(rating);
        setReviews(allReviews);
      }
    } catch {
      if (id === ratingsFetchIdRef.current) {
        setRatingData({ average: null, count: 0 });
        setReviews([]);
      }
    } finally {
      if (id === ratingsFetchIdRef.current) setReviewsLoading(false);
    }
  }, [decodedId]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  // Filter listings belonging to this profile's user
  const userListings = allListings.filter((l) => l.seller_id === decodedId);
  const visibleListings = showAllListings ? userListings : userListings.slice(0, 4);
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  // Cover auth loading gap (Learning.md Lesson 3)
  if (authLoading || profileLoading || viewLoading || listingsLoading) {
    return <p className="profile-loading">Loading profile...</p>;
  }

  if (!effectiveProfile) {
    return <p className="profile-not-found">Profile not found.</p>;
  }

  const collegeLogo = getCollegeLogo(effectiveProfile.college);

  // Navigate to messages with seller context
  function handleMessage() {
    if (!isAuthenticated) { login(); return; }
    navigate("/messages", { state: { sellerId: decodedId } });
  }

  return (
    <div className="profile">
      {/* Cover photo */}
      <div className="profile-cover">
        <div className="profile-cover-placeholder" />
      </div>

      {/* Header — avatar, name, rating, stats */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <img
            src={effectiveProfile.avatar_url || "/default-avatar.png"}
            alt={effectiveProfile.name}
            className="profile-avatar"
          />
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{effectiveProfile.name}</h1>
            {collegeLogo && (
              <img src={collegeLogo} alt={effectiveProfile.college} className="profile-college-logo" />
            )}
          </div>

          {/* Star rating summary */}
          {ratingData.average !== null && (
            <div className="profile-rating">
              <StarDisplay score={ratingData.average} />
              <span className="profile-rating-score">{ratingData.average.toFixed(1)}</span>
              <span className="profile-rating-count">({ratingData.count})</span>
            </div>
          )}

          <div className="profile-meta">
            {effectiveProfile.created_at && (
              <>
                <span>Joined {formatJoinDate(effectiveProfile.created_at)}</span>
                <span>·</span>
              </>
            )}
            <span>{userListings.length} listing{userListings.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          {isOwnProfile && displayProfile ? (
            <button className="profile-btn profile-btn--primary" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </button>
          ) : !isOwnProfile ? (
            <button className="profile-btn profile-btn--primary" onClick={handleMessage}>
              Message
            </button>
          ) : null}
        </div>
      </div>

      {/* Incomplete profile banner — shown when user has no Supabase profile yet */}
      {isIncompleteProfile && (
        <section className="profile-section">
          <div className="profile-incomplete-banner">
            <p>Your profile is not complete yet. Add your college, bio, and meetup spots.</p>
            <button className="profile-btn profile-btn--primary" onClick={() => navigate("/signup")}>
              Complete Your Profile
            </button>
          </div>
        </section>
      )}

      {/* About Me */}
      {effectiveProfile.bio && (
        <section className="profile-section">
          <h2 className="profile-section-title">About Me</h2>
          <p className="profile-bio">{effectiveProfile.bio}</p>
        </section>
      )}

      {/* Meetup spots */}
      {effectiveProfile.meetup_spots?.length > 0 && (
        <section className="profile-section">
          <h2 className="profile-section-title">Ideal Meetup Spots</h2>
          <div className="profile-spots">
            {effectiveProfile.meetup_spots.map((spot, i) => (
              <span key={`${spot}-${i}`} className="profile-spot-badge">{spot}</span>
            ))}
          </div>
        </section>
      )}

      {/* Listings grid */}
      <section className="profile-section">
        <h2 className="profile-section-title">Listings</h2>
        {userListings.length === 0 ? (
          <p className="profile-empty">No listings yet.</p>
        ) : (
          <>
            <div className="profile-grid">
              {visibleListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onClick={setSelectedListing} />
              ))}
            </div>
            {userListings.length > 4 && (
              <button
                className="profile-show-more"
                onClick={() => setShowAllListings((v) => !v)}
              >
                {showAllListings ? "Show Less" : `View All ${userListings.length} Listings`}
              </button>
            )}
          </>
        )}
      </section>

      {/* Reviews section */}
      <section className="profile-section">
        <h2 className="profile-section-title">
          Reviews{ratingData.count > 0 ? ` (${ratingData.count})` : ""}
        </h2>
        {reviewsLoading ? (
          <p className="profile-empty">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="profile-empty">No reviews yet.</p>
        ) : (
          <>
            <div className="profile-reviews">
              {visibleReviews.map((review) => (
                <div key={review.id} className="profile-review-card">
                  <div className="profile-review-header">
                    <img
                      src={review.rater?.avatar_url || "/default-avatar.png"}
                      alt={review.rater?.name || "Reviewer"}
                      className="profile-review-avatar"
                    />
                    <div className="profile-review-meta">
                      <span className="profile-review-name">{review.rater?.name || "Anonymous"}</span>
                      <span className="profile-review-date">
                        {review.created_at ? formatReviewDate(review.created_at) : ""}
                      </span>
                    </div>
                  </div>
                  <div className="profile-review-stars">
                    <StarDisplay score={review.score} />
                  </div>
                  {review.comment && (
                    <p className="profile-review-comment">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
            {reviews.length > 3 && (
              <button
                className="profile-show-more"
                onClick={() => setShowAllReviews((v) => !v)}
              >
                {showAllReviews ? "Show Less" : `View All ${reviews.length} Reviews`}
              </button>
            )}
          </>
        )}
      </section>

      {/* Listing modal — opens when a listing card is clicked */}
      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
