/**
 * UserBar.jsx
 * Displays a seller's avatar, name, college, and star rating.
 * Clicking the bar navigates to the seller's profile page.
 */

import { useNavigate } from "react-router-dom";
import "./UserBar.css";

// Renders a star rating display (e.g. ★ 4.5)
function StarRating({ rating }) {
  return (
    <span className="userbar-rating">
      ★ {typeof rating === "number" ? rating.toFixed(1) : "No ratings"}
    </span>
  );
}

// onNavigate — optional callback called before navigating (e.g. to close a parent modal)
export default function UserBar({ seller, onNavigate }) {
  const navigate = useNavigate();

  if (!seller) return null;

  function handleClick() {
    if (onNavigate) onNavigate();
    navigate(`/profile/${encodeURIComponent(seller.id)}`);
  }

  return (
    <button className="userbar" onClick={handleClick} aria-label={`View ${seller.name}'s profile`}>
      <img
        className="userbar-avatar"
        src={seller.avatar_url || "/default-avatar.png"}
        alt={seller.name}
      />
      <div className="userbar-info">
        <span className="userbar-name">{seller.name}</span>
        <span className="userbar-college">{seller.college}</span>
      </div>
      <StarRating rating={seller.rating} />
    </button>
  );
}
