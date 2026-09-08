const DATABASE = "triton-thrift-phone-v1";

// IndexedDB stores compressed photos without localStorage's small string quota.
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("app");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Device storage is unavailable."));
  });
}

// Reads the versioned preview state; callers must not overwrite unread data.
export async function readState() {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("app").objectStore("app").get("state");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(new Error("Could not load your saved items."));
    });
  } finally {
    db.close();
  }
}

// Resolves only after the transaction commits, including quota/error handling.
export async function writeState(state) {
  const db = await database();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction("app", "readwrite");
      transaction.objectStore("app").put(state, "state");
      transaction.oncomplete = resolve;
      transaction.onerror = () =>
        reject(new Error("Could not save. Your device storage may be full."));
      transaction.onabort = () =>
        reject(new Error("Save interrupted. Please try again."));
    });
  } finally {
    db.close();
  }
}

// Uses canvas to resize an uploaded image before it is stored or sent for scanning.
export async function preparePhoto(file) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type))
    throw new Error(
      "Choose a JPEG, PNG, or WebP photo. If an HEIC photo fails, export it as JPEG.",
    );
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => resolve(photo);
      photo.onerror = () =>
        reject(new Error("This photo could not be opened. Try a JPEG or PNG."));
      photo.src = url;
    });
    const ratio = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}
