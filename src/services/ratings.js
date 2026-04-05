/**
 * ratings.js
 * Service layer for the seller rating system against Supabase.
 * Handles creating ratings and fetching average scores for sellers.
 * All write operations require a userId from the auth session (Lesson 5).
 * Comment text is sanitized before insert (per CLAUDE.md security rules).
 */

import { supabase } from "../lib/supabase.js";
import { sanitizeText } from "../lib/sanitize.js";

// Submits a rating for a seller — userId is the rater, from auth session
export async function createRating(userId, ratedId, score, comment) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to leave a rating.");
  if (!ratedId) throw new Error("Rated user ID is required.");
  if (userId === ratedId) throw new Error("You cannot rate yourself.");

  if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Score must be an integer between 1 and 5.");
  }

  // Prevent duplicate ratings — one rating per rater per seller
  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("rater_id", userId)
    .eq("rated_id", ratedId)
    .maybeSingle();

  if (existing) throw new Error("You have already rated this seller.");

  const sanitizedComment = comment ? sanitizeText(String(comment).trim()) : null;

  const { data, error } = await supabase
    .from("ratings")
    .insert({
      rater_id: userId,
      rated_id: ratedId,
      score,
      comment: sanitizedComment,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to submit rating.");
  return data;
}

// Fetches the average rating and count for a seller
export async function getSellerRating(sellerId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!sellerId) throw new Error("Seller ID is required.");

  const { data, error } = await supabase
    .from("ratings")
    .select("score")
    .eq("rated_id", sellerId);

  if (error) throw new Error("Failed to fetch seller rating.");
  if (!data || data.length === 0) return { average: null, count: 0 };

  const total = data.reduce((sum, r) => sum + r.score, 0);
  return {
    average: Math.round((total / data.length) * 10) / 10,
    count: data.length,
  };
}

// Fetches all individual ratings for a seller
export async function getSellerRatings(sellerId) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!sellerId) throw new Error("Seller ID is required.");

  const { data, error } = await supabase
    .from("ratings")
    .select("*, rater:rater_id(name, avatar_url)")
    .eq("rated_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch seller ratings.");
  return data || [];
}
