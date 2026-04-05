/**
 * SignUpPage.jsx
 * Shown after Auth0 OAuth login when the user has no profile yet.
 * Collects profile photo, bio, college (via logo cards), and ideal meetup spots.
 * Submits to createProfile() then redirects to the home page.
 *
 * TODO: Wire createProfile() from useProfile hook (Issue #15) when Mason's implementation is ready.
 * TODO: Wire uploadAvatar() from storage service (Issue #13) when Mason's implementation is ready.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.jsx";
import { uploadAvatar } from "../services/storage.js";
import { sanitizeText } from "../lib/sanitize.js";
import { COLLEGES } from "../lib/colleges.js";
import "./SignUpPage.css";

const MEETUP_SPOTS = [
  "Geisel Library",
  "Price Center",
  "Sun God Lawn",
  "Panda Express",
  "PC Loop",
];

export default function SignUpPage() {
  const { user } = useAuth();
  const { createProfile } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [meetupSpots, setMeetupSpots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Revoke blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // Preview the selected avatar image before upload
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      setError("Image must be under 5 MB.");
      return;
    }

    // Revoke the old preview URL before creating a new one
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  // Toggle a meetup spot on or off
  function toggleMeetupSpot(spot) {
    setMeetupSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!avatarFile) {
      setError("A profile photo is required.");
      return;
    }
    if (!college) {
      setError("Please select your college.");
      return;
    }

    // Sanitize bio using the project's sanitizeText (catches code patterns, strips HTML)
    const sanitizedBio = bio.trim() ? sanitizeText(bio.trim()) : "";

    setIsSubmitting(true);
    try {
      // Upload avatar to Supabase Storage
      let avatarUrl;
      try {
        avatarUrl = await uploadAvatar(user.sub, avatarFile);
      } catch {
        setError("Failed to upload photo. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Create the profile row
      await createProfile({
        name: user.name,
        avatar_url: avatarUrl,
        bio: sanitizedBio,
        college,
        meetup_spots: meetupSpots,
      });
      navigate("/");
    } catch {
      setError("Failed to create profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signup">
      <div className="signup-card">
        <h1 className="signup-title">Complete Your Profile</h1>
        <p className="signup-subtitle">Welcome, {user?.name || user?.email}! Tell us a bit about yourself.</p>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          {/* Profile photo */}
          <section className="signup-section">
            <label className="signup-label">Profile Photo <span className="signup-required">*</span></label>
            <div
              className="signup-avatar-wrap"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
              role="button"
              tabIndex={0}
              aria-label="Upload profile photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="signup-avatar-preview" />
              ) : (
                <div className="signup-avatar-placeholder">
                  <span className="signup-avatar-icon">+</span>
                  <span>Add photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="signup-file-input"
              onChange={handleAvatarChange}
              aria-label="Upload profile photo"
            />
          </section>

          {/* Bio */}
          <section className="signup-section">
            <label className="signup-label" htmlFor="bio">About You <span className="signup-optional">(optional)</span></label>
            <textarea
              id="bio"
              className="signup-textarea"
              placeholder="What's your major?"
              value={bio}
              maxLength={300}
              onChange={(e) => setBio(e.target.value)}
            />
            <span className="signup-char-count">{bio.length}/300</span>
          </section>

          {/* College selector */}
          <section className="signup-section">
            <label className="signup-label">Your College <span className="signup-required">*</span></label>
            <div className="signup-colleges">
              {COLLEGES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={`signup-college-card ${college === c.name ? "signup-college-card--selected" : ""}`}
                  onClick={() => setCollege(c.name)}
                  aria-pressed={college === c.name}
                >
                  <img src={c.logo} alt={c.name} className="signup-college-logo" />
                  <span className="signup-college-name">{c.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Meetup spots */}
          <section className="signup-section">
            <label className="signup-label">Ideal Meetup Spots <span className="signup-optional">(optional)</span></label>
            <div className="signup-spots">
              {MEETUP_SPOTS.map((spot) => (
                <button
                  key={spot}
                  type="button"
                  className={`signup-spot-btn ${meetupSpots.includes(spot) ? "signup-spot-btn--selected" : ""}`}
                  onClick={() => toggleMeetupSpot(spot)}
                  aria-pressed={meetupSpots.includes(spot)}
                >
                  {spot}
                </button>
              ))}
            </div>
          </section>

          {error && <p className="signup-error">{error}</p>}

          <button
            type="submit"
            className="signup-submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Get Started"}
          </button>

        </form>
      </div>
    </div>
  );
}
