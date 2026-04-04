/**
 * SignUpPage.jsx
 * Sign-up info page — shown after OAuth login when no profile exists yet.
 * Collects profile photo, bio, college, and ideal meetup spots.
 * TODO (Issue #7): Build full sign-up form with createProfile hook.
 */

import { useAuth } from "../hooks/useAuth.jsx";

export default function SignUpPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2>Complete Your Profile</h2>
      <p>Welcome, {user?.name || user?.email}! Sign-up form coming soon.</p>
    </div>
  );
}
