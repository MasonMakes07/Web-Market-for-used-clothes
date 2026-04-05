/**
 * EditProfilePage.jsx
 * Pre-filled form that lets the current user update their profile.
 * Shares the same layout and CSS as SignUpPage.
 * Submits to updateProfile() then redirects back to the user's profile.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.jsx";
import { uploadAvatar } from "../services/storage.js";
import { sanitizeText } from "../lib/sanitize.js";
import { COLLEGES } from "../lib/colleges.js";
import { MEETUP_SPOTS } from "../lib/meetupSpots.js";
import "./SignUpPage.css";

export default function EditProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Pre-fill from existing profile
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || user?.picture || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bio, setBio] = useState(profile?.bio || "");
  const [college, setCollege] = useState(profile?.college || "");
  const [meetupSpots, setMeetupSpots] = useState(profile?.meetup_spots || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Revoke blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (avatarFile) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  // Preview selected avatar before upload
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    if (avatarFile) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  // Toggle a meetup spot on or off (stores the name string)
  function toggleMeetupSpot(spotName) {
    setMeetupSpots((prev) =>
      prev.includes(spotName) ? prev.filter((s) => s !== spotName) : [...prev, spotName]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!college) {
      setError("Please select your college.");
      return;
    }

    const sanitizedBio = bio.trim() ? sanitizeText(bio.trim()) : "";

    setIsSubmitting(true);
    try {
      let avatarUrl = profile?.avatar_url || user?.picture || "";

      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(user.sub, avatarFile);
        } catch {
          // Upload failed — keep existing avatar silently
        }
      }

      await updateProfile({
        name: profile?.name || user?.name,
        avatar_url: avatarUrl,
        bio: sanitizedBio,
        college,
        meetup_spots: meetupSpots,
      });

      navigate(`/profile/${encodeURIComponent(user.sub)}`);
    } catch (err) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signup">
      <div className="signup-card">
        <h1 className="signup-title">Edit Profile</h1>
        <p className="signup-subtitle">Update your info below.</p>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          {/* Profile photo */}
          <section className="signup-section">
            <label className="signup-label">Profile Photo <span className="signup-optional">(optional)</span></label>
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
                  key={spot.name}
                  type="button"
                  className={`signup-spot-card ${meetupSpots.includes(spot.name) ? "signup-spot-card--selected" : ""}`}
                  onClick={() => toggleMeetupSpot(spot.name)}
                  aria-pressed={meetupSpots.includes(spot.name)}
                >
                  <img src={spot.image} alt={spot.name} className="signup-spot-img" />
                  <span className="signup-spot-name">{spot.name}</span>
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
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>

        </form>
      </div>
    </div>
  );
}
