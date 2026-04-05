/**
 * profiles.js
 * Service layer for user profile operations against Supabase.
 * Handles creating and updating profiles with input sanitization.
 * All write operations require a userId set from the auth session,
 * never from user input (per Learning.md Lesson 5).
 */

import { supabase } from "../lib/supabase.js";
import { sanitizeFields, sanitizeText, validateUrl } from "../lib/sanitize.js";

const TEXT_FIELDS = ["name", "bio", "college"];
const UPDATABLE_FIELDS = ["name", "bio", "college", "avatar_url", "meetup_spots"];

// Creates a new profile row tied to the authenticated user
export async function createProfile(userId, profileData) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to create a profile.");

  const sanitized = sanitizeFields(profileData, TEXT_FIELDS);

  if (!sanitized.name || sanitized.name.trim() === "") {
    throw new Error("Name is required.");
  }

  if (sanitized.avatar_url) {
    validateUrl(sanitized.avatar_url);
  }

  // Validate meetup_spots is an array of strings if provided
  let meetupSpots = null;
  if (sanitized.meetup_spots) {
    if (!Array.isArray(sanitized.meetup_spots)) {
      throw new Error("Meetup spots must be an array.");
    }
    meetupSpots = sanitized.meetup_spots
      .filter((s) => typeof s === "string")
      .map((s) => sanitizeText(s.trim()))
      .filter((s) => s.length > 0);
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      name: sanitized.name,
      bio: sanitized.bio || null,
      college: sanitized.college || null,
      avatar_url: sanitized.avatar_url || null,
      meetup_spots: meetupSpots,
    })
    .select()
    .single();

  if (error) {
    console.error("createProfile Supabase error:", error);
    throw new Error(`Failed to create profile: ${error.message} (code: ${error.code})`);
  }
  return data;
}

// Fetches a profile by user ID
export async function getProfile(userId) {
  if (!supabase) throw new Error("Supabase client not initialized.");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error("Failed to fetch profile.");
  return data;
}

// Updates an existing profile — only the owner can update (per Learning.md Lesson 7)
export async function updateProfile(userId, updates) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to update a profile.");

  const sanitized = sanitizeFields(updates, TEXT_FIELDS);

  // Whitelist updatable fields only (per Learning.md Lesson 6)
  const filtered = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in sanitized) {
      filtered[key] = sanitized[key];
    }
  }

  if (filtered.avatar_url) {
    validateUrl(filtered.avatar_url);
  }

  // Validate meetup_spots is an array of strings if provided
  if (filtered.meetup_spots !== undefined && filtered.meetup_spots !== null) {
    if (!Array.isArray(filtered.meetup_spots)) {
      throw new Error("Meetup spots must be an array.");
    }
    filtered.meetup_spots = filtered.meetup_spots
      .filter((s) => typeof s === "string")
      .map((s) => sanitizeText(s.trim()))
      .filter((s) => s.length > 0);
  }

  if (Object.keys(filtered).length === 0) {
    throw new Error("No valid fields to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(filtered)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error("Failed to update profile.");
  return data;
}
