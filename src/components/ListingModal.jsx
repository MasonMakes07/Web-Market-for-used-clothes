/**
 * ListingModal.jsx
 * Popup modal shown when a listing card is clicked.
 * Displays the full item details, seller UserBar, and a Message Seller button.
 */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import UserBar from "./UserBar.jsx";
import { getCollegeLogo } from "../lib/colleges.js";
import "./ListingModal.css";

export default function ListingModal({ listing, onClose }) {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();

  // Lock body scroll and handle Escape key while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!listing) return null;

  // Close modal when clicking the backdrop (outside the content box)
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // Redirect to messages if authenticated, otherwise trigger Auth0 login
  function handleMessageSeller() {
    if (!isAuthenticated) {
      login();
    } else {
      onClose();
      navigate("/messages");
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label={listing.title}>
      <div className="modal-content">
        {/* Close button */}
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Image */}
        <div className="modal-image-wrap">
          <img
            className="modal-image"
            src={listing.image_url || "/placeholder-item.png"}
            alt={listing.title}
          />
        </div>

        {/* Details */}
        <div className="modal-details">
          <h2 className="modal-title">{listing.title}</h2>
          <span className="modal-price">
            {listing.price === 0
              ? "FREE"
              : typeof listing.price === "number" && listing.price > 0
              ? `$${listing.price.toFixed(2)}`
              : "Price unavailable"}
          </span>

          <div className="modal-badges">
            {listing.category && <span className="modal-badge">{listing.category}</span>}
            {listing.condition && <span className="modal-badge modal-badge--condition">{listing.condition}</span>}
          </div>

          {/* College logo — replaces map */}
          {listing.seller?.college && getCollegeLogo(listing.seller.college) && (
            <div className="modal-college">
              <img
                src={getCollegeLogo(listing.seller.college)}
                alt={listing.seller.college}
                className="modal-college-logo"
              />
              <span className="modal-college-name">{listing.seller.college} College</span>
            </div>
          )}

          {listing.description && (
            <p className="modal-description">{listing.description}</p>
          )}

          {listing.tags?.length > 0 && (
            <div className="modal-tags">
              {listing.tags.map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="modal-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Seller info — close modal before navigating to profile */}
          <div className="modal-seller">
            <UserBar seller={listing.seller} onNavigate={onClose} />
          </div>

          <button className="modal-message-btn" onClick={handleMessageSeller}>
            Message Seller
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
