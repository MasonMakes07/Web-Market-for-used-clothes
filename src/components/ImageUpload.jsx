/**
 * ImageUpload.jsx
 * Reusable image upload component with preview, validation feedback,
 * and loading state. Works with both avatar and listing image uploads
 * by accepting an uploadFn prop (uploadAvatar or uploadListingImage).
 */

import { useRef } from "react";
import { useImageUpload } from "../hooks/useImageUpload.js";

// Renders a file picker with instant preview and validation errors
export default function ImageUpload({
  uploadFn,
  userId,
  onUpload,
  label = "Upload Image",
  required = false,
  className = "",
  existingUrl = null,
}) {
  const {
    previewUrl,
    uploadedUrl,
    isUploading,
    error,
    selectFile,
    upload,
    clear,
  } = useImageUpload(uploadFn);

  const inputRef = useRef(null);

  // Handles file input change — validates and sets preview
  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      selectFile(selectedFile);
    }
  }

  // Triggers upload and passes the URL to the parent via onUpload callback
  async function handleUpload() {
    const url = await upload(userId);
    if (url && onUpload) {
      onUpload(url);
    }
  }

  // Clears file selection and resets the input
  function handleClear() {
    clear();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const displayUrl = previewUrl || uploadedUrl || existingUrl;

  return (
    <div className={`image-upload ${className}`}>
      <label className="image-upload__label">
        {label}
        {required && <span className="image-upload__required"> *</span>}
      </label>

      {displayUrl && (
        <div className="image-upload__preview">
          <img
            src={displayUrl}
            alt="Preview"
            className="image-upload__img"
          />
        </div>
      )}

      <div className="image-upload__controls">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={isUploading}
          className="image-upload__input"
        />

        {previewUrl && !uploadedUrl && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="image-upload__btn image-upload__btn--upload"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        )}

        {(previewUrl || uploadedUrl) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isUploading}
            className="image-upload__btn image-upload__btn--clear"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="image-upload__error">{error}</p>}
      {uploadedUrl && <p className="image-upload__success">Upload complete</p>}
    </div>
  );
}
