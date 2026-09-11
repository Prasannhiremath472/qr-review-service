import { useEffect, useState } from "react";
import { getDashboard } from "../api/client.js";

// QrCodesModal shows every QR code linked to a shop (image + download),
// opened by clicking a business name in a QR codes table instead of
// navigating away to the full shop dashboard page.
export default function QrCodesModal({ shopId, shopName, onClose }) {
  const [qrCodes, setQrCodes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getDashboard(shopId, { page: 1, limit: 100 });
        if (cancelled) return;
        if (data.success) {
          setQrCodes(data.data.qr_codes);
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
                  <img
                    src={qr.image_url}
                    alt={`QR Code for ${qr.label}`}
                    className="w-full max-w-[160px] aspect-square mx-auto mb-2 rounded-lg"
                  />
                  <p className="text-sm font-medium text-zinc-700 truncate">{qr.label || qr.id}</p>
                  <p className="text-xs text-zinc-400 mb-3">Scans: {qr.scan_count}</p>
                  <a
                    href={qr.image_url}
                    download={`qr-${qr.id}.png`}
                    className="btn-ghost inline-flex items-center justify-center gap-1.5 w-full bg-zinc-700 text-white py-2 rounded-lg text-xs font-medium hover:bg-zinc-800"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
