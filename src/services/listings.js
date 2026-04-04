/**
 * listings.js
 * Service layer for listing CRUD operations against Supabase.
 * All text inputs are sanitized before insert to prevent XSS
 * and reject code-like content (per CLAUDE.md security rules).
 * All write operations require a userId for ownership enforcement.
 */

import { supabase } from "../lib/supabase.js";
import { sanitizeFields, validateUrl } from "../lib/sanitize.js";

const TEXT_FIELDS = ["title", "category", "condition", "description"];
const REQUIRED_FIELDS = ["title", "price", "category", "condition", "image_url"];
const UPDATABLE_FIELDS = ["title", "price", "category", "condition", "description", "image_url"];

// Validates that all required fields are present and valid
function validateRequired(data) {
  for (const field of REQUIRED_FIELDS) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (typeof data.price !== "number" || !Number.isFinite(data.price) || data.price < 0) {
    throw new Error("Price must be a finite, non-negative number.");
  }

  validateUrl(data.image_url);
}

// Fetches all active listings, ordered by newest first
export async function getListings() {
  if (!supabase) throw new Error("Supabase client not initialized.");

  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles:seller_id(name, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch listings.");
  return data || [];
}

// Fetches a single listing by ID
export async function getListingById(id) {
  if (!supabase) throw new Error("Supabase client not initialized.");

  const { data, error } = await supabase
    .from("listings")
    .select("*, profiles:seller_id(name, avatar_url)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error("Failed to fetch listing.");
  return data;
}

// Creates a new active listing — requires userId for seller_id
export async function createListing(userId, listingData) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to create a listing.");

  const sanitized = sanitizeFields(listingData, TEXT_FIELDS);
  validateRequired(sanitized);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title: sanitized.title,
      price: sanitized.price,
      category: sanitized.category,
      condition: sanitized.condition,
      description: sanitized.description || null,
      image_url: sanitized.image_url,
      seller_id: userId,
      status: "active",
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create listing.");
  return data;
}

// Saves a listing as a draft — requires userId for seller_id
export async function saveDraft(userId, draftData) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to save a draft.");

  const sanitized = sanitizeFields(draftData, TEXT_FIELDS);

  const { data, error } = await supabase
    .from("listings")
    .insert({
      title: sanitized.title || null,
      price: sanitized.price ?? null,
      category: sanitized.category || null,
      condition: sanitized.condition || null,
      description: sanitized.description || null,
      image_url: sanitized.image_url || null,
      seller_id: userId,
      status: "draft",
    })
    .select()
    .single();

  if (error) throw new Error("Failed to save draft.");
  return data;
}

// Updates an existing listing — only the owner can update
export async function updateListing(userId, id, updates) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to update a listing.");

  const sanitized = sanitizeFields(updates, TEXT_FIELDS);

  // Whitelist updatable fields only
  const filtered = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in sanitized) {
      filtered[key] = sanitized[key];
    }
  }

  if (filtered.image_url) validateUrl(filtered.image_url);
  if (filtered.price !== undefined) {
    if (typeof filtered.price !== "number" || !Number.isFinite(filtered.price) || filtered.price < 0) {
      throw new Error("Price must be a finite, non-negative number.");
    }
  }

  const { data, error } = await supabase
    .from("listings")
    .update(filtered)
    .eq("id", id)
    .eq("seller_id", userId)
    .select()
    .single();

  if (error) throw new Error("Failed to update listing. You may not own this listing.");
  return data;
}

// Deletes a listing by ID — only the owner can delete
export async function deleteListing(userId, id) {
  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required to delete a listing.");

  const { error, count } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", userId);

  if (error) throw new Error("Failed to delete listing. You may not own this listing.");
}
