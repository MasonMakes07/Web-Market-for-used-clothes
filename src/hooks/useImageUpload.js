/**
 * useImageUpload.js
 * Hook for managing image file selection, preview, and upload state.
 * Each instance is independent (no context provider needed since
 * upload state is local to each form, per Learning.md Lesson 2).
 * Accepts an uploadFn so it works with both uploadAvatar and uploadListingImage.
 */

import { useState, useCallback, useEffect, useRef } from "react";

// Allowed MIME types — matches storage.js validation
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Client-side validation for instant feedback before upload
function validateFileClient(file) {
  if (!file) {
    return "No file selected.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size is 5MB.";
  }
  return null;
}

// Manages file selection, preview, and upload for a single image input
export function useImageUpload(uploadFn) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);
  const uploadingRef = useRef(false);

  // Revoke object URL on unmount or when preview changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  // Validates and stores the selected file, generates a preview URL
  const selectFile = useCallback((selectedFile) => {
    setError(null);
    setUploadedUrl(null);

    const validationError = validateFileClient(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    // Revoke previous preview URL
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }

    const url = URL.createObjectURL(selectedFile);
    previewRef.current = url;
    setFile(selectedFile);
    setPreviewUrl(url);
  }, []);

  // Uploads the selected file using the provided uploadFn (ref guard prevents double-click race)
  const upload = useCallback(async (userId) => {
    if (uploadingRef.current || !file) {
      if (!file) setError("No file selected.");
      return null;
    }
    if (!userId) {
      setError("Not authenticated.");
      return null;
    }

    uploadingRef.current = true;
    setIsUploading(true);
    setError(null);

    try {
      const publicUrl = await uploadFn(userId, file);
      setUploadedUrl(publicUrl);
      return publicUrl;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      uploadingRef.current = false;
      setIsUploading(false);
    }
  }, [file, uploadFn]);

  // Resets all state and revokes the preview URL
  const clear = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setIsUploading(false);
    setError(null);
  }, []);

  return {
    file,
    previewUrl,
    uploadedUrl,
    isUploading,
    error,
    selectFile,
    upload,
    clear,
  };
}
