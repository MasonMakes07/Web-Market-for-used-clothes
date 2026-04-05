/**
 * EditProfilePage.jsx
 * Profile editing form for existing users.
 * Pre-fills with current profile data (bio, college, meetup spots, avatar).
 * Uses updateProfile() from useProfile hook to save changes.
 * Reuses SignUpPage.css for consistent styling.
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

export default function EditProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Pre-fill with current profile data
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || user?.picture || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bio, setBio] = useState(profile?.bio || "");
  const [college, setCollege] = useState(profile?.college || "");
  const [meetupSpots, setMeetupSpots] = useState(profile?.meetup_spots || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Update form if profile loads after mount
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setCollege(profile.college || "");
      setMeetupSpots(profile.meetup_spots || []);
      if (!avatarFile) setAvatarPreview(profile.avatar_url || user?.picture || null);
    }
  }, [profile, user?.picture, avatarFile]);

  // Revoke blob URL on unmount to prevent memory leaks
  const avatarPreviewRef = useRef(avatarPreview);
  avatarPreviewRef.current = avatarPreview;
  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current && avatarPreviewRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreviewRef.current);
      }
    };
  }, []);

  // Preview the selected avatar image before upload
  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("Image must be under 5 MB.");
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

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

  // Saves profile changes
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!user?.sub) {
      setError("You must be logged in to edit your profile.");
      return;
    }

    if (!college || !COLLEGES.some((c) => c.name === college)) {
      setError("Please select a valid college.");
      return;
    }

    let sanitizedBio = "";
    try {
      sanitizedBio = bio.trim() ? sanitizeText(bio.trim()) : "";
    } catch (err) {
      setError(err.message);
      return;
    }

    const validSpots = meetupSpots.filter((s) => MEETUP_SPOTS.includes(s));

    setIsSubmitting(true);
    try {
      // Upload new avatar if one was selected
      let avatarUrl = profile?.avatar_url || user.picture || "";
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(user.sub, avatarFile);
        } catch {
          avatarUrl = profile?.avatar_url || user.picture || "";
        }
      }

      await updateProfile({
        avatar_url: avatarUrl,
        bio: sanitizedBio,
        college,
        meetup_spots: validSpots,
      });

      navigate(`/profile/${encodeURIComponent(user.sub)}`);
    } catch {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signup">
      <div className="signup-card">
        <h1 className="signup-title">Edit Profile</h1>
        <p className="signup-subtitle">Update your profile information.</p>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          {/* Profile photo */}
          <section className="signup-section">
            <label className="signup-label">Profile Photo</label>
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
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>

        </form>
      </div>
    </div>
  );
}
