import { useState } from "react";
import Icon from "./icons.jsx";
import { useSession } from "./Session.jsx";

// University authentication stays on the identity provider; local profiles are never proof of enrollment.
export default function CampusAccount() {
  const session = useSession();
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  // Show redirect errors without exposing provider details or accepting campus passwords.
  async function connect() {
    setError("");
    setRedirecting(true);
    try {
      await session.campusLogin();
    } catch {
      setError("UCSD sign-in could not start. Please try again later.");
    } finally {
      setRedirecting(false);
    }
  }

  return (
    <section className="tt-campus-account" aria-label="UCSD account">
      <span className="tt-campus-account-icon">
        <Icon name="shield" size={28} />
      </span>
      <div>
        <p className="tt-eyebrow">A COMMUNITY FOR CURRENT UCSD STUDENTS</p>
        <h2>
          {session.user
            ? "Account connected."
            : "Your campus account. Your community."}
        </h2>
        <p>
          {session.user
            ? "Sign-in is complete. Student eligibility still needs to be checked before shared marketplace access. This preview remains on your device."
            : "Join or sign in using your UCSD account. The university handles your password and Duo verification."}
        </p>
        {!session.campusConfigured && !session.user && (
          <p className="tt-campus-account-status">
            UCSD sign-up is not available yet. The university connection is
            still being set up. You can explore the device preview now.
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
          <button
            className="tt-button"
            onClick={connect}
            disabled={
              !session.campusConfigured || session.loading || redirecting
            }
          >
            <Icon name="user" size={18} />
            {redirecting ? "Opening UCSD sign-in…" : "Continue with UCSD"}
            <Icon name="arrow" size={18} />
          </button>
        )}
        {error && (
          <p className="tt-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
