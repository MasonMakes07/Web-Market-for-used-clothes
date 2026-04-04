/**
 * storage.js
 * Service layer for file uploads to Supabase Storage.
 * Handles uploading and retrieving profile avatars and listing images.
 */

// TODO: Implement Supabase Storage uploads

// Uploads a profile avatar and returns the public URL
// TODO: Validate file type (allow only image/*), max size (5MB), sanitize filename
export async function uploadAvatar(userId, file) {
  return null;
}

// Uploads a listing image and returns the public URL
// TODO: Validate file type (allow only image/*), max size (5MB), sanitize filename
export async function uploadListingImage(listingId, file) {
  return null;
}

// Gets the public URL for a stored file
export function getPublicUrl(bucket, path) {
  return "";
}
