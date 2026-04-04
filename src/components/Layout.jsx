/**
 * Layout.jsx
 * Shared page wrapper for Triton Thrift.
 * Renders the hero section (logo + Geisel illustration) at the top,
 * followed by the sticky NavBar, then the page content below.
 */

import NavBar from "./NavBar.jsx";
import "./Layout.css";

// Hero section with the Triton Thrift logo and Geisel Library illustration
function Hero() {
  return (
    <header className="hero">
      <div className="hero-corners">
        <span className="hero-corner hero-corner--left" />
        <span className="hero-corner hero-corner--right" />
      </div>

      <div className="hero-content">
        <span className="hero-title hero-title--left">TRITON</span>

        {/* Replace src with the actual Geisel illustration asset when available */}
        <div className="hero-logo">
          <img
            src="/geisel.png"
            alt="Geisel Library"
            className="hero-geisel"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>

        <span className="hero-title hero-title--right">THRIFT</span>
      </div>
    </header>
  );
}

export default function Layout({ children }) {
  return (
    <div className="layout">
      <Hero />
      <NavBar />
      <main className="layout-main">{children}</main>
    </div>
  );
}
