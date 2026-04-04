/**
 * ProfilePage.jsx
 * Displays a user's public profile — photo, bio, ratings, and listings.
 * TODO (Issue #8): Build full profile layout with useProfile hook.
 */

import { useParams } from "react-router-dom";

export default function ProfilePage() {
  const { id } = useParams();

  return (
    <div>
      <p>Profile page for user {id} — coming soon.</p>
    </div>
  );
}
