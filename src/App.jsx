/**
 * App.jsx
 * Root application component with route definitions.
 * Handles post-login loading state while the profile check runs.
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.jsx";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import MessagesPage from "./pages/MessagesPage.jsx";
import SellPage from "./pages/SellPage.jsx";
import EditProfilePage from "./pages/EditProfilePage.jsx";
import "./App.css";

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
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <p>Loading...</p>
    </div>
  );
}

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <EditProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route
          path="/signup"
          element={
            <RequireAuth>
              <SignUpPage />
            </RequireAuth>
          }
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <MessagesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/sell"
          element={
            <RequireAuth>
              <SellPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
