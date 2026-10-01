import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard, createQrCode, linkQrCode } from "../api/client.js";
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

  async function loadQrCodes() {
    try {
      const { data } = await getDashboard(shopId, { page: 1, limit: 100 });
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
      setError("Failed to load QR codes");
    }
  }

  useEffect(() => {
    loadQrCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ) : (
            <>
              {qrCodes.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-4">No QR codes linked to this business yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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

              <AttachQrPanel shopId={shopId} onAttached={loadQrCodes} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// AttachQrPanel lets admin/salesman give this shop a QR code either way: a
// brand-new one generated and linked on the spot, or an existing unlinked
// QR code (e.g. pre-printed stock) linked by its ID.
function AttachQrPanel({ shopId, onAttached }) {
  const [mode, setMode] = useState(null); // null | "generate" | "link"
  const [label, setLabel] = useState("");
  const [existingId, setExistingId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await createQrCode({ shop_id: shopId, label: label.trim() });
      if (data.success) {
        setMode(null);
        setLabel("");
        await onAttached();
      } else {
        setError(data.message || "Failed to generate QR code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLink(e) {
    e.preventDefault();
    setError("");
    const id = existingId.trim();
    if (!id) {
      setError("Enter the QR code ID");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await linkQrCode(id, shopId);
      if (data.success) {
        setMode(null);
        setExistingId("");
        await onAttached();
      } else {
        setError(data.message || "Failed to link QR code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mode) {
    return (
      <div className="flex items-center gap-2 pt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={() => setMode("generate")}
          className="flex-1 text-xs font-medium text-violet-600 hover:text-violet-800 px-3 py-2 rounded-lg hover:bg-violet-50 border border-violet-200"
        >
          + Generate New QR
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className="flex-1 text-xs font-medium text-zinc-600 hover:text-violet-700 px-3 py-2 rounded-lg hover:bg-zinc-50 border border-zinc-200"
        >
          Link Existing QR
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={mode === "generate" ? handleGenerate : handleLink}
      className="pt-3 border-t border-zinc-100 space-y-2.5"
    >
      {mode === "generate" ? (
        <input
          type="text"
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (optional)"
          className="field-input w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50/60"
        />
      ) : (
        <input
          type="text"
          autoFocus
          value={existingId}
          onChange={(e) => setExistingId(e.target.value)}
          placeholder="Unlinked QR code ID (e.g. Mrcr71)"
          className="field-input w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50/60 font-mono"
        />
      )}

      {error && <div className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-gradient flex-1 text-white py-2 rounded-lg font-semibold text-xs"
        >
          {submitting ? "Saving..." : mode === "generate" ? "Generate & Attach" : "Link QR Code"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(null);
            setError("");
          }}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700 px-3 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
