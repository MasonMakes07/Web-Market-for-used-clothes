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

  // After Auth0 login, check if user has a profile and redirect new users to /signup.
  // Uses localStorage as a fast-path cache to avoid Supabase RLS issues on anon reads.
  useEffect(() => {
    if (!isAuthenticated || !auth0User || profileChecked || isCheckingProfile) {
      return;
    }

    async function checkProfile() {
      setIsCheckingProfile(true);

      const localKey = `triton_thrift_profile_${auth0User.sub}`;

      try {
        // Fast path: if we've seen this user create a profile before, skip the DB query
        if (localStorage.getItem(localKey) === "1") {
          setProfileChecked(true);
          return;
        }

        if (!supabase) {
          // Can't check — send to signup so they can create one
          navigate("/signup", { replace: true });
          setProfileChecked(true);
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", auth0User.sub)
          .maybeSingle();

        if (data) {
          // Profile confirmed in DB — cache the result so future logins are instant
          localStorage.setItem(localKey, "1");
        } else {
          // No profile found (new user or RLS blocked the read) — go to signup
          navigate("/signup", { replace: true });
        }
      } catch (err) {
        console.error("Unexpected error during profile check:", err);
        // On unexpected error, send to signup — SignUpPage handles the duplicate case
        navigate("/signup", { replace: true });
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
