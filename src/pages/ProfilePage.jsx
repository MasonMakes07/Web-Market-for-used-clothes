/**
 * ProfilePage.jsx
 * Displays a user's public profile — avatar, bio, college,
 * meetup spots, and their listings grid.
 * Uses useProfile for current user's profile and fetchProfile for other users.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.js";
import { useListings } from "../hooks/useListings.jsx";
import ListingCard from "../components/ListingCard.jsx";
import { getCollegeLogo } from "../lib/colleges.js";
import "./ProfilePage.css";

// Formats a date as "Joined Month Year"
function formatJoinDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { profile: myProfile, isLoading: profileLoading, fetchProfile } = useProfile();
  const { listings: allListings, isLoading: listingsLoading } = useListings();
  const [showAllListings, setShowAllListings] = useState(false);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Decode the URL param — user.sub contains "|" which gets percent-encoded
  const decodedId = decodeURIComponent(id);
  const isOwnProfile = isAuthenticated && user?.sub === decodedId;

  // Determine which profile to display
  const displayProfile = isOwnProfile ? myProfile : viewedProfile;

  // Fetch other user's profile when viewing someone else's page
  useEffect(() => {
    if (isOwnProfile || !decodedId) return;

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

  // Filter listings belonging to this profile's user
  const userListings = allListings.filter((l) => l.seller_id === decodedId);
  const visibleListings = showAllListings ? userListings : userListings.slice(0, 4);

  // Cover auth loading gap (Learning.md Lesson 3)
  if (authLoading || profileLoading || viewLoading || listingsLoading) {
    return <p className="profile-loading">Loading profile...</p>;
  }

  if (!displayProfile) {
    return <p className="profile-not-found">Profile not found.</p>;
  }

  const collegeLogo = getCollegeLogo(displayProfile.college);

  // Navigate to messages (future: pass listing/seller context)
  function handleMessage() {
    if (!isAuthenticated) { login(); return; }
    navigate("/messages");
  }

  return (
    <div className="profile">
      {/* Cover photo */}
      <div className="profile-cover">
        <div className="profile-cover-placeholder" />
      </div>

      {/* Header — avatar, name, stats */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          <img
            src={displayProfile.avatar_url || "/default-avatar.png"}
            alt={displayProfile.name}
            className="profile-avatar"
          />
        </div>

        <div className="profile-header-info">
          <div className="profile-name-row">
            <h1 className="profile-name">{displayProfile.name}</h1>
            {collegeLogo && (
              <img src={collegeLogo} alt={displayProfile.college} className="profile-college-logo" />
            )}
          </div>

          <div className="profile-meta">
            {displayProfile.created_at && <span>Joined {formatJoinDate(displayProfile.created_at)}</span>}
            <span>·</span>
            <span>{userListings.length} listing{userListings.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="profile-btn profile-btn--primary" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </button>
          ) : (
            <button className="profile-btn profile-btn--primary" onClick={handleMessage}>
              Message
            </button>
          )}
        </div>
      </div>

      {/* Bio */}
      {displayProfile.bio && (
        <section className="profile-section">
          <h2 className="profile-section-title">About</h2>
          <p className="profile-bio">{displayProfile.bio}</p>
        </section>
      )}

      {/* Meetup spots */}
      {displayProfile.meetup_spots?.length > 0 && (
        <section className="profile-section">
          <h2 className="profile-section-title">Ideal Meetup Spots</h2>
          <div className="profile-spots">
            {displayProfile.meetup_spots.map((spot, i) => (
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
                <ListingCard key={listing.id} listing={listing} onClick={() => {}} />
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
    </div>
  );
}
