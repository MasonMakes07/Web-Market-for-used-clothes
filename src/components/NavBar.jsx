/**
 * NavBar.jsx
 * Main navigation bar for Triton Thrift.
 * Renders Sell, Search, Profile, and Messages links.
 * Becomes sticky at the top of the viewport once the hero scrolls past.
 */

import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
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
  const goTo = useProtectedNav();

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
    </nav>
  );
}
