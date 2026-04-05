/**
 * SellPage.jsx
 * Two-column listing creation form.
 * Left: photo upload, required fields (title, price, category, condition), tags, Next button.
 * Right: description, Price Compare button (image-based eBay search via Browser Use),
 *        and three suggested price options (Faster sale / Balanced / Slower sale).
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.jsx";
import { useListings } from "../hooks/useListings.jsx";
import { usePriceHint } from "../hooks/usePriceHint.js";
import { uploadListingImage } from "../services/storage.js";
import { sanitizeText } from "../lib/sanitize.js";
import "./SellPage.css";

const GENDER_OPTS = ["Men's", "Women's"];
const SUB_CATEGORY_OPTS = ["Shirt", "Pants", "Hoodies", "Shoes", "Shorts"];
const CONDITION_OPTS = ["New", "Used - Like New", "Used - Good", "Used - Fair", "Poor"];
const MAX_TAGS = 20;

export default function SellPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { createListing } = useListings();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Photo
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [gender, setGender] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");

  // Tags
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Price Compare
  const { priceHint, isLoading: hintLoading, error: hintError, fetchPriceHint } = usePriceHint();
  const [hasSearched, setHasSearched] = useState(false);

  // ── Photo handlers ──────────────────────────────────────────────────────────

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(""); // reset until uploaded
    setError("");

    // Auto-upload immediately so the URL is ready for Price Compare
    if (!user?.sub) return;
    setIsUploading(true);
    try {
      const url = await uploadListingImage(user.sub, file);
      setImageUrl(url);
    } catch {
      setError("Photo upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // ── Tags ────────────────────────────────────────────────────────────────────

  function handleTagKeyDown(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    setTags((prev) => [...prev, tag]);
    setTagInput("");
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  // ── Price input — numbers only ──────────────────────────────────────────────

  function handlePriceChange(e) {
    const val = e.target.value.replace(/[^0-9.]/g, "");
    // Allow only one decimal point
    const parts = val.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setPrice(val);
  }

  // ── Price Compare ───────────────────────────────────────────────────────────

  function handlePriceCompare() {
    if (!title.trim()) {
      setError("Enter a title first so we can find comparable listings.");
      return;
    }
    setHasSearched(true);
    const category = gender && subCategory ? `${gender} - ${subCategory}` : gender || "";
    fetchPriceHint(title, category);
  }

  function applyPrice(value) {
    setPrice(value.toFixed(2));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleNext() {
    setError("");

    if (!user?.sub) {
      setError("You must be logged in to post a listing.");
      return;
    }
    if (!imageUrl) {
      setError("Please upload a photo first.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (!gender || !subCategory) {
      setError("Please select a category.");
      return;
    }
    if (!condition) {
      setError("Please select a condition.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a price greater than $0.00.");
      return;
    }

    // Sanitize text inputs before submission
    let cleanTitle, cleanDesc;
    try {
      cleanTitle = sanitizeText(title.trim());
      cleanDesc = description.trim() ? sanitizeText(description.trim()) : "";
    } catch (err) {
      setError(err.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await createListing(user.sub, {
        title: cleanTitle,
        category: `${gender} - ${subCategory}`,
        condition,
        price: parsedPrice,
        description: cleanDesc,
        image_url: imageUrl,
        tags,
      });
      navigate("/");
    } catch (err) {
      setError(err?.message || "Failed to post listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="sell">

      {/* ── Page header ── */}
      <div className="sell-header">
        <div className="sell-header-user">
          <img
            src={profile?.avatar_url || user?.picture || "/default-avatar.png"}
            alt={user?.name || "You"}
            className="sell-header-avatar"
          />
          <div>
            <p className="sell-header-name">{user?.name || "You"}</p>
            <p className="sell-header-sub">Listing on Marketplace</p>
          </div>
        </div>
        <button
          className="sell-next-btn sell-next-btn--top"
          onClick={handleNext}
          disabled={isSubmitting || isUploading}
        >
          {isSubmitting ? "Posting..." : "NEXT"}
        </button>
      </div>

      {error && <p className="sell-error">{error}</p>}

      {/* ── Two-column body ── */}
      <div className="sell-body">

        {/* ── Left column ── */}
        <div className="sell-left">

          {/* Photo upload */}
          <div
            className={`sell-photo-area ${imagePreview ? "sell-photo-area--filled" : ""}`}
            onClick={handlePhotoClick}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handlePhotoClick(); }}
            role="button"
            tabIndex={0}
            aria-label="Upload item photo"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Item preview" className="sell-photo-preview" />
            ) : (
              <div className="sell-photo-placeholder">
                <span className="sell-photo-icon">＋</span>
                <span className="sell-photo-label">Add photo</span>
              </div>
            )}
            {isUploading && <div className="sell-photo-uploading">Uploading...</div>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sell-file-input"
            onChange={handleFileChange}
            aria-label="Upload item photo"
          />

          {/* Required section */}
          <div className="sell-section-header">
            <p className="sell-section-title">Required</p>
            <p className="sell-section-sub">Let buyers know exactly what you are selling.</p>
          </div>

          {/* Title */}
          <input
            className="sell-field"
            type="text"
            placeholder="Title"
            value={title}
            maxLength={80}
            onChange={(e) => { setTitle(e.target.value); setHasSearched(false); }}
            aria-label="Title"
          />

          {/* Price */}
          <div className="sell-price-wrap">
            <span className="sell-price-symbol">$</span>
            <input
              className="sell-field sell-field--price"
              type="text"
              inputMode="decimal"
              placeholder="Price"
              value={price}
              onChange={handlePriceChange}
              aria-label="Price"
            />
          </div>

          {/* Category — two-level */}
          <select
            className="sell-field sell-select"
            value={gender}
            onChange={(e) => { setGender(e.target.value); setSubCategory(""); }}
            aria-label="Gender category"
          >
            <option value="">Category</option>
            {GENDER_OPTS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {gender && (
            <select
              className="sell-field sell-select"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              aria-label="Item type"
            >
              <option value="">Type</option>
              {SUB_CATEGORY_OPTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Condition */}
          <select
            className="sell-field sell-select"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            aria-label="Condition"
          >
            <option value="">Condition</option>
            {CONDITION_OPTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* More details — Tags */}
          <div className="sell-section-header" style={{ marginTop: 16 }}>
            <p className="sell-section-title">More details</p>
            <p className="sell-section-sub">Additional information about your listing.</p>
          </div>

          <input
            className="sell-field"
            type="text"
            placeholder="Tags (press Enter to add)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            disabled={tags.length >= MAX_TAGS}
            aria-label="Add tag"
          />
          <p className="sell-tags-hint">Optional. Limit: {MAX_TAGS} tags</p>

          {tags.length > 0 && (
            <div className="sell-tags">
              {tags.map((tag) => (
                <span key={tag} className="sell-tag">
                  {tag}
                  <button
                    type="button"
                    className="sell-tag-remove"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Next button (bottom) */}
          <button
            className="sell-next-btn sell-next-btn--bottom"
            onClick={handleNext}
            disabled={isSubmitting || isUploading}
          >
            {isSubmitting ? "Posting..." : "Next"}
          </button>
        </div>

        {/* ── Right column ── */}
        <div className="sell-right">

          {/* Description */}
          <textarea
            className="sell-description"
            placeholder="Description"
            value={description}
            maxLength={350}
            onChange={(e) => setDescription(e.target.value)}
            aria-label="Description"
          />
          <p className="sell-char-count">{description.length}/350</p>

          {/* Price Compare */}
          <button
            className="sell-price-compare-btn"
            type="button"
            onClick={handlePriceCompare}
            disabled={hintLoading || !title.trim()}
            title={!title.trim() ? "Enter a title first" : ""}
          >
            {hintLoading ? "Searching eBay..." : "Price Compare"}
          </button>

          {/* Suggested prices */}
          {priceHint && priceHint.source_count > 0 && (
            <div className="sell-suggested">
              <p className="sell-suggested-label">
                Suggested <span className="sell-suggested-info" title={`Based on ${priceHint.source_count} eBay sold listings`}>ⓘ</span>
              </p>
              <div className="sell-price-opts">
                <button
                  type="button"
                  className="sell-price-opt"
                  onClick={() => applyPrice(priceHint.min_price)}
                >
                  <span className="sell-price-opt-amount">${priceHint.min_price.toFixed(2)}</span>
                  <span className="sell-price-opt-label">Faster sale</span>
                </button>
                <button
                  type="button"
                  className="sell-price-opt"
                  onClick={() => applyPrice(priceHint.avg_price)}
                >
                  <span className="sell-price-opt-amount">${priceHint.avg_price.toFixed(2)}</span>
                  <span className="sell-price-opt-label">Balanced</span>
                </button>
                <button
                  type="button"
                  className="sell-price-opt"
                  onClick={() => applyPrice(priceHint.max_price)}
                >
                  <span className="sell-price-opt-amount">${priceHint.max_price.toFixed(2)}</span>
                  <span className="sell-price-opt-label">Slower sale</span>
                </button>
              </div>
            </div>
          )}

          {hintError && !hintLoading && (
            <p className="sell-no-hint">Price compare failed: {hintError}</p>
          )}

          {priceHint === null && !hintLoading && !hintError && hasSearched && (
            <p className="sell-no-hint">No comparable listings found. Set your own price.</p>
          )}
        </div>

      </div>
    </div>
  );
}
