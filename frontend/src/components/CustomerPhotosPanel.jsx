import { useEffect, useState } from "react";
import { deleteCustomerPhoto, listCustomerPhotos } from "../api/client.js";
import PhotoLightbox from "./PhotoLightbox.jsx";

// CustomerPhotosPanel shows the photos customers attached on the review page
// (newest 24). The owner can open one full-size or delete it.
export default function CustomerPhotosPanel({ shopId, shopName }) {
  const [photos, setPhotos] = useState(null);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await listCustomerPhotos(shopId);
        if (cancelled) return;
        if (data.success) setPhotos(data.data);
        else setError(data.message || "Failed to load customer photos");
      } catch (err) {
        if (!cancelled) setError("Failed to load customer photos");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  async function handleDelete(photo) {
    if (!window.confirm("Delete this photo?")) return;
    setDeletingId(photo.id);
    try {
      const { data } = await deleteCustomerPhoto(shopId, photo.id);
      if (data.success) setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      else setError(data.message || "Failed to delete photo");
    } catch (err) {
      setError("Failed to delete photo");
    }
    setDeletingId(null);
  }

  return (
    <div className="app-card p-5 sm:p-6 fade-in">
      <h2 className="text-base font-semibold text-zinc-900">Customer Photos</h2>
      <p className="text-xs text-zinc-400 mt-0.5 mb-3">Photos customers added when leaving a review.</p>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : photos === null ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-block aspect-square shimmer" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <p className="text-sm text-zinc-400 py-6 text-center">No customer photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <button type="button" onClick={() => setLightboxIndex(i)} className="block w-full h-full">
                <img
                  src={p.url}
                  alt={`Customer photo ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(p)}
                disabled={deletingId === p.id}
                aria-label="Delete photo"
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-black/80 disabled:opacity-50"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && photos && photos[lightboxIndex] && (
        <PhotoLightbox
          photos={photos.map((p) => p.url)}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          altPrefix={shopName || "Customer"}
        />
      )}
    </div>
  );
}
