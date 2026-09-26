import { useEffect, useState } from "react";
import { getShopById, updateShop, uploadShopPhoto } from "../api/client.js";

const MAX_GALLERY_PHOTOS = 5;

// EditPhotosModal lets a salesman add/remove gallery photos for a business
// they've already activated, without touching any of the other profile
// fields. Existing photos (already-uploaded data URIs) and newly-picked
// local files are managed in the same list and saved together.
export default function EditPhotosModal({ shopId, shopName, onClose, onSaved }) {
  const [existingPhotos, setExistingPhotos] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getShopById(shopId);
        if (cancelled) return;
        if (data.success) {
          setExistingPhotos(Array.isArray(data.data.gallery_photos) ? data.data.gallery_photos : []);
        } else {
          setError(data.message || "Failed to load business photos");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load business photos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const totalCount = (existingPhotos?.length || 0) + newFiles.length;

  function handleFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const remaining = MAX_GALLERY_PHOTOS - totalCount;
    const combined = [...newFiles, ...files].slice(0, newFiles.length + Math.max(remaining, 0));
    setNewFiles(combined.map((f) => (f.preview ? f : Object.assign(f, { preview: URL.createObjectURL(f) }))));
    e.target.value = "";
  }

  function removeExisting(index) {
    setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewFile(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < newFiles.length; i++) {
        setUploadStatus(`Uploading photo ${i + 1} of ${newFiles.length}...`);
        const { data } = await uploadShopPhoto(newFiles[i]);
        if (data.success) uploadedUrls.push(data.data.url);
      }
      setUploadStatus("Saving...");

      const finalGallery = [...(existingPhotos || []), ...uploadedUrls].slice(0, MAX_GALLERY_PHOTOS);
      const { data } = await updateShop(shopId, { gallery_photos: finalGallery });
      if (data.success) {
        onSaved?.(finalGallery);
        onClose();
      } else {
        setError(data.message || "Failed to save photos");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="app-card fade-in max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 truncate">{shopName}</h2>
            <p className="text-xs text-zinc-500">Business photos</p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost w-8 h-8 flex-shrink-0 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-block h-24 shimmer" />
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-zinc-500">
                Gallery Photos ({totalCount}/{MAX_GALLERY_PHOTOS})
              </p>

              {totalCount > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(existingPhotos || []).map((url, i) => (
                    <div key={`existing-${i}`} className="relative">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeExisting(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 text-white rounded-full flex items-center justify-center text-xs"
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, i) => (
                    <div key={`new-${i}`} className="relative">
                      <img src={file.preview} alt={`New photo ${i + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-violet-600 text-white px-1.5 py-0.5 rounded">
                        New
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 text-white rounded-full flex items-center justify-center text-xs"
                        aria-label="Remove"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {totalCount < MAX_GALLERY_PHOTOS && (
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFilesChange}
                  className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium"
                />
              )}
              <p className="text-xs text-zinc-400">Storefront, interior, products — up to {MAX_GALLERY_PHOTOS} photos</p>

              {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-gradient w-full text-white py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2"
              >
                {saving && <Spinner />}
                {saving ? uploadStatus || "Saving..." : "Save Photos"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  );
}
