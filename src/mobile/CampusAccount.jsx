import { useState } from "react";
import Icon from "./icons.jsx";
import { useSession } from "./Session.jsx";

// University authentication stays on the identity provider; local profiles are never proof of enrollment.
export default function CampusAccount() {
  const session = useSession();
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Show redirect errors without exposing provider details or accepting campus passwords.
  async function connect(provider) {
    setError("");
    setRedirecting(true);
    try {
      await session.socialLogin(provider);
    } catch {
      setError("Sign-in could not start. Please try again later.");
    } finally {
      setRedirecting(false);
    }
  }

  return (
    <section className="tt-campus-account" aria-label="Account sign-in">
      <span className="tt-campus-account-icon">
        <Icon name="shield" size={28} />
      </span>
      <div>
        <p className="tt-eyebrow">YOUR TRITONS THRIFTS ACCOUNT</p>
        <h2>
          {session.user
            ? "Account connected."
            : "Sign in. Find your next favorite."}
        </h2>
        <p>
          {session.user
            ? "You are signed in. Listings and profile edits in this preview still save on this device."
            : "Continue with Google or Apple. Your password stays with your sign-in provider."}
        </p>
        {!session.socialConfigured && !session.user && (
          <p className="tt-campus-account-status">
            {session.ownerPreview
              ? "Your phone is connected for private AI testing. Account sign-in is separate."
              : "Google and Apple sign-in need the secure HTTPS app link. You can still use the local preview."}
          </p>
        )}
        {session.user ? (
          <button
            className="tt-button tt-button-secondary"
            onClick={() =>
              session
                .logout()
                .catch(() =>
                  setError("Sign-out could not complete. Please try again."),
                )
            }
          >
            Sign out
          </button>
        ) : (
          <div className="tt-social-actions">
            <button
              className="tt-button"
              onClick={() => connect("google")}
              disabled={
                !session.socialConfigured || session.loading || redirecting
              }
            >
              <Icon name="user" size={18} />{" "}
              {redirecting ? "Opening sign-in…" : "Continue with Google"}
            </button>
            <button
              className="tt-button tt-button-secondary"
              onClick={() => connect("apple")}
              disabled={
                !session.socialConfigured ||
                !session.appleConfigured ||
                session.loading ||
                redirecting
              }
            >
              Continue with Apple
            </button>
            {!session.appleConfigured && (
              <small>Apple sign-in needs its provider setup completed.</small>
            )}
          </div>
        )}
        {(error || session.error) && (
          <p className="tt-error" role="alert">
            {error ||
              "Account sign-in could not complete. Please try again or check the app’s sign-in configuration."}
          </p>
        )}
      </div>
    </section>
  );
}
