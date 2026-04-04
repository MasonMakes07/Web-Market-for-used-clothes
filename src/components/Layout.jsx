/**
 * Layout.jsx
 * Shared page wrapper for Triton Thrift.
 * Renders the hero section (logo + Geisel illustration) at the top,
 * followed by the sticky NavBar, then the page content below.
 */

import NavBar from "./NavBar.jsx";
import "./Layout.css";

// Hero section — full-width banner image
function Hero() {
  return (
    <header className="hero">
      <img
        src="/Triton Thrift Hero.png"
        alt="Triton Thrift"
        className="hero-image"
      />
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
