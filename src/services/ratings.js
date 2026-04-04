/**
 * ratings.js
 * Service layer for the seller rating system against Supabase.
 * Handles creating ratings and fetching average scores for sellers.
 */

// TODO: Implement Supabase queries for ratings table

// Submits a rating for a seller
// TODO: Validate score is 1-5, sanitize comment text (see CLAUDE.md)
export async function createRating(ratingData) {
  return null;
}

// Fetches the average rating for a seller
export async function getSellerRating(sellerId) {
  return null;
}

// Fetches all ratings for a seller
export async function getSellerRatings(sellerId) {
  return [];
}
