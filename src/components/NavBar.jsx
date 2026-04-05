/**
 * NavBar.jsx
 * Main navigation bar for Triton Thrift.
 * Renders Sell, Search, Profile, and Messages links.
 * Becomes sticky at the top of the viewport once the hero scrolls past.
 */

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useProfile } from "../hooks/useProfile.jsx";
import { useMessages } from "../hooks/useMessages.jsx";
import "./NavBar.css";

// Redirects unauthenticated users to login before accessing protected nav actions
function useProtectedNav() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  return function goTo(path) {
    if (!isAuthenticated) {
      login();
    } else {
      navigate(path);
    }
  };
}

export default function NavBar() {
  const { user, isAuthenticated, login } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useMessages();
  const goTo = useProtectedNav();
  const avatarSrc = profile?.avatar_url || user?.picture || "/default-avatar.png";

  return (
    <nav className="navbar">
      <button className="nav-btn" onClick={() => goTo("/sell")}>
        Sell
      </button>

      <Link className="nav-btn" to="/?search=true">
        Search
      </Link>

      <button
        className="nav-btn"
        onClick={() =>
          isAuthenticated && user
            ? goTo(`/profile/${encodeURIComponent(user.sub)}`)
            : login()
        }
      >
        Profile
      </button>

      <button className="nav-btn" onClick={() => goTo("/messages")}>
        Messages
      </button>

      {isAuthenticated && (
        <button
          className="nav-notif-btn"
          onClick={() => goTo("/messages")}
          aria-label={`${unreadCount} unread messages`}
        >
          <img src="/Notification.png" alt="Notifications" className="nav-notif-icon" />
          {unreadCount > 0 && (
            <span className="nav-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
      )}

      {/* Login / avatar — right side */}
      {isAuthenticated && user ? (
        <button
          className="nav-avatar-btn"
          onClick={() => goTo(`/profile/${encodeURIComponent(user.sub)}`)}
          aria-label="Your profile"
        >
          <img
            src={avatarSrc}
            alt={user.name}
            className="nav-avatar"
          />
        </button>
      ) : (
        <button className="nav-login-btn" onClick={login}>
          Log in / Sign up
        </button>
      )}
    </nav>
  );
}
