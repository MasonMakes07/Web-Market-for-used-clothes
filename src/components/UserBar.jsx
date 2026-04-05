/**
 * UserBar.jsx
 * Displays a seller's avatar, name, and college.
 * Clicking the bar navigates to the seller's profile page.
 * Accepts sellerId as a prop for when the join doesn't include id.
 */

import { useNavigate } from "react-router-dom";
import "./UserBar.css";

// onNavigate — optional callback called before navigating (e.g. to close a parent modal)
export default function UserBar({ seller, sellerId, onNavigate }) {
  const navigate = useNavigate();

  if (!seller) return null;

  // Use seller.id from the join if available, otherwise fall back to sellerId prop
  const profileId = seller.id || sellerId;

  function handleClick() {
    if (!profileId) return;
    if (onNavigate) onNavigate();
    navigate(`/profile/${encodeURIComponent(profileId)}`);
  }

  return (
    <button className="userbar" onClick={handleClick} aria-label={`View ${seller.name || "seller"}'s profile`}>
      <img
        className="userbar-avatar"
        src={seller.avatar_url || "/default-avatar.png"}
        alt={seller.name || "Seller"}
      />
      <div className="userbar-info">
        <span className="userbar-name">{seller.name || "Unknown"}</span>
        {seller.college && <span className="userbar-college">{seller.college}</span>}
      </div>
    </button>
  );
}
