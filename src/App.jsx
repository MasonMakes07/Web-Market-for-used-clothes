/**
 * App.jsx
 * Root application component with route definitions.
 * Handles post-login loading state while the profile check runs.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import "./App.css";

// Placeholder page — will be replaced by alexgilbreath's HomePage component
function HomePage() {
  const { user, logout, isAuthenticated, login } = useAuth();

  return (
    <section style={{ padding: "2rem" }}>
      <h1>College Marketplace</h1>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name || user?.email}!</p>
          <button onClick={logout}>Log out</button>
        </div>
      ) : (
        <div>
          <p>Browse listings or log in to start selling.</p>
          <button onClick={login}>Log in / Sign up</button>
        </div>
      )}
    </section>
  );
}

// Placeholder page — will be replaced by alexgilbreath's SignUpPage component
function SignUpPage() {
  const { user } = useAuth();

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Complete Your Profile</h1>
      <p>Welcome, {user?.name || user?.email}! Fill in your info to get started.</p>
    </section>
  );
}

// Route guard — redirects unauthenticated users to home
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;

  return children;
}

// Shown while Auth0 or profile check is loading
function LoadingScreen() {
  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <p>Loading...</p>
    </section>
  );
}

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/signup"
        element={
          <RequireAuth>
            <SignUpPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
