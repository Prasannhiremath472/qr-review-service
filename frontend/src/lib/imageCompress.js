// Downscales a photo in the browser before upload (phone cameras produce
// 4-8MB files), re-encoding it as JPEG. Falls back to the original file if the
// browser can't decode it, so the server gets the final say.
export async function compressImage(file, maxSide = 1280, quality = 0.8) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob) return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (err) {
    // fall through to the original file
  }
  return file;
}
