/**
 * sanitize.js
 * Input sanitization utilities for user-submitted text.
 * Strips HTML/script tags and rejects input that looks like code.
 * Used by services before inserting data into Supabase.
 */

// Patterns that indicate code-like input (tightened to reduce false positives)
const CODE_PATTERNS = [
  /<script[\s>]/i,
  /<\/script>/i,
  /javascript:/i,
  /data:\s*text\/html/i,
  /\bon(click|load|error|mouseover|focus|blur|submit|change|input|keydown|keyup)\s*=/i,
  /eval\s*\(/i,
  /document\.(cookie|write|createElement|getElementById)/i,
  /window\.(location|open|eval)/i,
  /innerHTML\s*=/i,
  /\bimport\s*\(/i,
  /<(iframe|object|embed|form|svg)/i,
];

// Returns true if the input looks like it contains code
export function looksLikeCode(input) {
  if (typeof input !== "string") return false;
  return CODE_PATTERNS.some((pattern) => pattern.test(input));
}

// Strips HTML tags from a string (handles unclosed tags)
export function stripHtml(input) {
  if (typeof input !== "string") return input;
  return input.replace(/<[^>]*>?/g, "").trim();
}

// Sanitizes a single text field — strips HTML and rejects code
export function sanitizeText(input) {
  if (typeof input !== "string") return input;

  if (looksLikeCode(input)) {
    throw new Error("Input contains potentially unsafe content and was rejected.");
  }

  return stripHtml(input);
}

// Sanitizes an object's string fields and returns a new copy
export function sanitizeFields(obj, fieldNames) {
  const sanitized = { ...obj };
  for (const field of fieldNames) {
    if (typeof sanitized[field] === "string") {
      sanitized[field] = sanitizeText(sanitized[field]);
    }
  }
  return sanitized;
}

// Validates that a URL starts with https://
export function validateUrl(url) {
  if (typeof url !== "string") {
    throw new Error("URL must be a string.");
  }
  if (!/^https:\/\/.+/i.test(url)) {
    throw new Error("URL must start with https://.");
  }
  return url;
}
