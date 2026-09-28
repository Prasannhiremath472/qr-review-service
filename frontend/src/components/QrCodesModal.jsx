import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import StandeeCard from "./StandeeCard.jsx";

const EDIT_PATH_BY_ROLE = {
  ADMIN: (shopId) => `/admin/clients/${shopId}/edit`,
  SALESMAN: (shopId) => `/salesman/clients/${shopId}/edit`,
};

// QrCodesModal shows every QR code linked to a shop, rendered as the
// branded printable standee (logo, name, tagline, QR, phone), opened by
// clicking a business name in a QR codes table instead of navigating away
// to the full shop dashboard page.
export default function QrCodesModal({ shopId, shopName, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState(null);
  const [shopMeta, setShopMeta] = useState(null);
  const [error, setError] = useState("");

  const editPath = EDIT_PATH_BY_ROLE[user?.role]?.(shopId);

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
            {editPath && (
              <button
                onClick={() => navigate(editPath)}
                className="btn-ghost inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-800 px-2.5 py-1.5 rounded-lg hover:bg-violet-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit Details
              </button>
            )}
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
    </div>
  );
}
