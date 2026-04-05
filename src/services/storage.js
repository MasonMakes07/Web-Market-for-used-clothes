/**
 * storage.js
 * Service layer for file uploads to Supabase Storage.
 * Handles uploading and retrieving profile avatars and listing images.
 * Validates file type and size before uploading.
 */

import { supabase } from "../lib/supabase.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Validates file type and size before upload
function validateFile(file) {
  if (!file) {
    throw new Error("No file provided.");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }
}

// Generates a safe filename using a timestamp and random string
function safeName(originalName) {
  const ext = originalName.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${rand}.${ext}`;
}

// Strips characters invalid in storage paths (e.g. "|" in Auth0 IDs like "google-oauth2|123")
function safeFolder(userId) {
  return userId.replace(/[^a-zA-Z0-9\-_]/g, "-");
}

// Uploads a profile avatar and returns the public URL
export async function uploadAvatar(userId, file) {
  validateFile(file);

  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required for avatar upload.");

  const path = `${safeFolder(userId)}/${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Avatar upload failed: ${error.message}`);

  return getPublicUrl("avatars", path);
}

// Uploads a listing image and returns the public URL
// Uses userId as the folder since listingId may not exist yet at upload time
export async function uploadListingImage(userId, file) {
  validateFile(file);

  if (!supabase) throw new Error("Supabase client not initialized.");
  if (!userId) throw new Error("User ID is required for image upload.");

  const path = `${safeFolder(userId)}/${safeName(file.name)}`;
  const { error } = await supabase.storage
    .from("listing-images")
    .upload(path, file, { upsert: true });

  if (error) throw new Error(`Listing image upload failed: ${error.message}`);

  return getPublicUrl("listing-images", path);
}

// Gets the public URL for a stored file
export function getPublicUrl(bucket, path) {
  if (!supabase) return "";

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || "";
}
