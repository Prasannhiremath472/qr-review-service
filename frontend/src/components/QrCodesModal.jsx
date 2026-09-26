import { useEffect, useState } from "react";
import { getDashboard } from "../api/client.js";
import StandeeCard from "./StandeeCard.jsx";
import EditPhotosModal from "./EditPhotosModal.jsx";

// QrCodesModal shows every QR code linked to a shop, rendered as the
// branded printable standee (logo, name, tagline, QR, phone), opened by
// clicking a business name in a QR codes table instead of navigating away
// to the full shop dashboard page.
export default function QrCodesModal({ shopId, shopName, onClose }) {
  const [qrCodes, setQrCodes] = useState(null);
  const [shopMeta, setShopMeta] = useState(null);
  const [error, setError] = useState("");
  const [editingPhotos, setEditingPhotos] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getDashboard(shopId, { page: 1, limit: 100 });
        if (cancelled) return;
        if (data.success) {
          setQrCodes(data.data.qr_codes);
          setShopMeta({
            logo_url: data.data.logo_url,
            tagline: data.data.tagline,
            contact_phone: data.data.contact_phone,
          });
        } else {
          setError(data.message || "Failed to load QR codes");
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load QR codes");
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

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="app-card fade-in max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 truncate">{shopName}</h2>
            <p className="text-xs text-zinc-500">QR codes for this business</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditingPhotos(true)}
              className="btn-ghost inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 px-2.5 py-1.5 rounded-lg hover:bg-violet-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 16.5V19.5a2.25 2.25 0 002.25 2.25H18.75A2.25 2.25 0 0021 19.5V16.5M4.5 4.5h15A1.5 1.5 0 0121 6v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 15V6a1.5 1.5 0 011.5-1.5z" />
              </svg>
              Edit Photos
            </button>
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
        </div>

        <div className="p-5 overflow-y-auto">
          {error ? (
            <p className="text-sm text-red-600 text-center py-6">{error}</p>
          ) : qrCodes === null ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton-block h-48 shimmer" />
              ))}
            </div>
          ) : qrCodes.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">No QR codes linked to this business.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="border border-zinc-200 rounded-xl p-3 text-center">
                  <StandeeCard
                    businessName={shopName}
                    tagline={shopMeta?.tagline}
                    logoUrl={shopMeta?.logo_url}
                    qrImageUrl={qr.image_url}
                    phone={shopMeta?.contact_phone}
                    filename={`standee-${qr.id}.png`}
                  />
                  <p className="text-sm font-medium text-zinc-700 truncate mt-2">{qr.label || qr.id}</p>
                  <p className="text-xs text-zinc-400">Scans: {qr.scan_count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingPhotos && (
        <div onClick={(e) => e.stopPropagation()}>
          <EditPhotosModal
            shopId={shopId}
            shopName={shopName}
            onClose={() => setEditingPhotos(false)}
          />
        </div>
      )}
    </div>
  );
}
