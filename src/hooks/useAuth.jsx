/**
 * useAuth.js
 * Auth context provider and hook for the application.
 * Wraps Auth0 state, runs a single post-login profile check,
 * and shares the result to all components via React context.
 * New users are redirected to /signup, returning users to /.
 */

import { useAuth0 } from "@auth0/auth0-react";
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

// Provides auth state to the entire app — mount once in main.jsx
export function AuthProvider({ children }) {
  const {
    loginWithRedirect,
    logout: auth0Logout,
    user: auth0User,
    isAuthenticated,
    isLoading: auth0Loading,
  } = useAuth0();

  const navigate = useNavigate();
  const [profileChecked, setProfileChecked] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // After Auth0 login, check if user has a Supabase profile row
  useEffect(() => {
    if (!isAuthenticated || !auth0User || profileChecked || isCheckingProfile) {
      return;
    }

    // Queries profiles table and redirects based on result
    async function checkProfile() {
      setIsCheckingProfile(true);

      try {
        if (!supabase) {
          console.error("Supabase client not initialized — skipping profile check.");
          setProfileChecked(true);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", auth0User.sub)
          .maybeSingle();

        if (error) {
          console.error("Error checking profile:", error.message);
          setProfileChecked(true);
          return;
        }

        if (!data) {
          // New user — send to signup to complete their profile
          navigate("/signup", { replace: true });
        }
        // Existing user — stay on current page (don't force-navigate to /)
      } catch (err) {
        console.error("Unexpected error during profile check:", err);
      } finally {
        setProfileChecked(true);
        setIsCheckingProfile(false);
      }
    }

    checkProfile();
  }, [isAuthenticated, auth0User, profileChecked, isCheckingProfile, navigate]);

  // Triggers Auth0 redirect login
  function login() {
    loginWithRedirect();
  }

  // Clears Auth0 session and redirects to origin
  function logout() {
    auth0Logout({
      logoutParams: { returnTo: window.location.origin },
    });
  }

  const value = {
    login,
    logout,
    user: auth0User || null,
    isLoading: auth0Loading || isCheckingProfile || (isAuthenticated && !profileChecked),
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Consumes auth context — must be inside <AuthProvider>
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
