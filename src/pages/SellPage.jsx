/**
 * SellPage.jsx
 * Create a new clothing listing. Sellers fill in title, category, condition,
 * price (with AI price hint from Browser Use), description, and a photo.
 * Submits via createListing() from useListings hook, or saves as a draft.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useListings } from "../hooks/useListings.jsx";
import { usePriceHint } from "../hooks/usePriceHint.js";
import ImageUpload from "../components/ImageUpload.jsx";
import PriceHint from "../components/PriceHint.jsx";
import { uploadListingImage } from "../services/storage.js";
import "./SellPage.css";

const CATEGORIES = ["Tops", "Bottoms", "Outerwear", "Shoes", "Accessories", "Other"];
const CONDITIONS = ["New with tags", "Like new", "Good", "Fair", "Poor"];

export default function SellPage() {
  const { user } = useAuth();
  const { createListing, saveDraft } = useListings();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState("");

  const {
    priceHint,
    isLoading: hintLoading,
    error: hintError,
    fetchPriceHint,
  } = usePriceHint();

  // Fetch price hint when title changes (debounced inside hook)
  function handleTitleChange(e) {
    const val = e.target.value;
    setTitle(val);
    fetchPriceHint(val, category);
  }

  // Re-fetch hint when category changes if title is long enough
  function handleCategoryChange(e) {
    const val = e.target.value;
    setCategory(val);
    if (title.trim().length >= 3) fetchPriceHint(title, val);
  }

  // Validates and posts the listing
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!imageUrl) {
      setError("Please upload a photo of your item.");
      return;
    }
    if (!category) {
      setError("Please select a category.");
      return;
    }
    if (!condition) {
      setError("Please select a condition.");
      return;
    }

    if (!user?.sub) {
      setError("You must be logged in to post a listing.");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a price greater than $0.00.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createListing(user.sub, {
        title: title.trim(),
        category,
        condition,
        price: parsedPrice,
        description: description.trim(),
        image_url: imageUrl,
      });
      navigate("/");
    } catch {
      setError("Failed to post listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Saves current form state as a draft (partial data allowed)
  async function handleSaveDraft() {
    setError("");
    if (!user?.sub) {
      setError("You must be logged in to save a draft.");
      return;
    }
    setIsSavingDraft(true);
    try {
      await saveDraft(user.sub, {
        title: title.trim() || null,
        category: category || null,
        condition: condition || null,
        price: price ? parseFloat(price) : null,
        description: description.trim() || null,
        image_url: imageUrl || null,
      });
      navigate("/");
    } catch {
      setError("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  }

  return (
    <div className="sell">
      <div className="sell-card">
        <h1 className="sell-title">List an Item</h1>
        <p className="sell-subtitle">Fill out the details below to post your listing.</p>

        <form className="sell-form" onSubmit={handleSubmit} noValidate>

          {/* Photo upload */}
          <section className="sell-section">
            <ImageUpload
              uploadFn={uploadListingImage}
              userId={user?.sub}
              onUpload={(url) => setImageUrl(url)}
              label="Item Photo"
              required
              className="sell-image-upload"
            />
          </section>

          {/* Title */}
          <section className="sell-section">
            <label className="sell-label" htmlFor="sell-title-input">
              Title <span className="sell-required">*</span>
            </label>
            <input
              id="sell-title-input"
              className="sell-input"
              type="text"
              placeholder={'e.g. "Vintage Levi\'s 501 Jeans"'}
              value={title}
              maxLength={120}
              onChange={handleTitleChange}
              required
            />
          </section>

          {/* Category */}
          <section className="sell-section">
            <label className="sell-label" htmlFor="sell-category">
              Category <span className="sell-required">*</span>
            </label>
            <select
              id="sell-category"
              className="sell-select"
              value={category}
              onChange={handleCategoryChange}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </section>

          {/* Condition */}
          <section className="sell-section">
            <label className="sell-label" htmlFor="sell-condition">
              Condition <span className="sell-required">*</span>
            </label>
            <select
              id="sell-condition"
              className="sell-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
            >
              <option value="">Select condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </section>

          {/* Price with AI hint */}
          <section className="sell-section">
            <label className="sell-label" htmlFor="sell-price">
              Price ($) <span className="sell-required">*</span>
            </label>
            <input
              id="sell-price"
              className="sell-input sell-input--price"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <PriceHint
              priceHint={priceHint}
              isLoading={hintLoading}
              error={hintError}
            />
          </section>

          {/* Description */}
          <section className="sell-section">
            <label className="sell-label" htmlFor="sell-description">
              Description <span className="sell-optional">(optional)</span>
            </label>
            <textarea
              id="sell-description"
              className="sell-textarea"
              placeholder="Describe your item — size, brand, any flaws..."
              value={description}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="sell-char-count">{description.length}/500</span>
          </section>

          {error && <p className="sell-error">{error}</p>}

          <div className="sell-actions">
            <button
              type="button"
              className="sell-draft-btn"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isSubmitting}
            >
              {isSavingDraft ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="submit"
              className="sell-submit-btn"
              disabled={isSubmitting || isSavingDraft}
            >
              {isSubmitting ? "Posting..." : "Post Listing"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
