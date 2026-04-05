/**
 * useProfile.js
 * Profile context provider and hook for the application.
 * Manages the current user's profile state (fetch, create, update)
 * and provides a function to fetch any user's profile by ID.
 * Uses the context provider pattern (per Learning.md Lesson 2)
 * so the current user's profile is fetched once and shared.
 * All writes go through the profiles service which handles
 * sanitization and ownership checks.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  getProfile,
  createProfile as createProfileService,
  updateProfile as updateProfileService,
} from "../services/profiles.js";
import { useAuth } from "./useAuth.jsx";

const ProfileContext = createContext(null);

// Provides profile state to the entire app — mount once in main.jsx
export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.sub || null;

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);
  const fetchIdRef = useRef(0);

  // Fetches the current user's profile from Supabase (with stale-response protection)
  const fetchCurrentProfile = useCallback(async () => {
    if (!userId) return;

    const id = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const data = await getProfile(userId);
      if (id === fetchIdRef.current) setProfile(data);
    } catch (err) {
      if (id === fetchIdRef.current) setError(err.message);
    } finally {
      if (id === fetchIdRef.current) setIsLoading(false);
    }
  }, [userId]);

  // Load profile when user authenticates, clear on logout
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCurrentProfile();
    } else {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      fetchIdRef.current = 0;
    }
  }, [isAuthenticated, userId, fetchCurrentProfile]);

  // Creates a new profile for the current user (called on sign-up submission)
  const createProfile = useCallback(async (data) => {
    if (!userId) {
      setError("You must be logged in to create a profile.");
      return null;
    }

    setError(null);
    setIsMutating(true);

    try {
      const newProfile = await createProfileService(userId, data);
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [userId]);

  // Updates the current user's profile
  const updateProfile = useCallback(async (data) => {
    if (!userId) {
      setError("You must be logged in to update your profile.");
      return null;
    }

    setError(null);
    setIsMutating(true);

    try {
      const updated = await updateProfileService(userId, data);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [userId]);

  // Fetches any user's profile by ID (for viewing other users' profiles)
  const fetchProfile = useCallback(async (targetUserId) => {
    if (!targetUserId) throw new Error("User ID is required.");
    return getProfile(targetUserId);
  }, []);

  const value = {
    profile,
    isLoading: isLoading || isMutating,
    error,
    createProfile,
    updateProfile,
    fetchProfile,
    refreshProfile: fetchCurrentProfile,
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

// Consumes profile context — must be inside <ProfileProvider>
export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a <ProfileProvider>");
  }
  return ctx;
}
