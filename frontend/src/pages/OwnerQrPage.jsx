import { useEffect, useState } from "react";
import { getDashboard } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import OwnerShopGate from "../components/OwnerShopGate.jsx";
import Pagination from "../components/Pagination.jsx";
import StandeeCard from "../components/StandeeCard.jsx";

const PAGE_SIZE = 12;

export default function OwnerQrPage() {
  return (
    <OwnerShopGate title="My QR" subtitle="Share your QR code with customers">
      {(shop) => <QrList shop={shop} />}
    </OwnerShopGate>
  );
}

function QrList({ shop }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await getDashboard(shop.id, { page, limit: PAGE_SIZE });
      if (!cancelled && data.success) {
        setQrCodes(data.data.qr_codes);
        setMeta(data.meta);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shop.id, page]);

  function copyLink(qr) {
    navigator.clipboard.writeText(qr.scan_url).then(() => {
      setCopiedId(qr.id);
      setTimeout(() => setCopiedId(""), 2000);
    });
  }

  function whatsappShareHref(qr) {
    const text = encodeURIComponent(`Please leave us a review! ${qr.scan_url}`);
    return `https://wa.me/?text=${text}`;
  }

  return (
    <AppLayout title="My QR" subtitle={shop.name}>
      {loading ? (
        <div className="flex flex-wrap gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block h-80 w-full sm:w-72 shimmer" />
          ))}
        </div>
      ) : qrCodes.length === 0 ? (
        <div className="app-card p-12 sm:p-16 text-center fade-in">
          <p className="text-zinc-500">No QR codes linked to your business yet.</p>
          <p className="text-zinc-400 text-sm mt-1">Ask your salesman or admin to link one.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-5">
            {qrCodes.map((qr) => (
              <div key={qr.id} className="qr-card app-card p-6 text-center fade-in w-full sm:w-72">
                <div className="mb-4">
                  <StandeeCard
                    businessName={shop.name}
                    tagline={shop.tagline}
                    logoUrl={shop.logo_url}
                    qrImageUrl={qr.image_url}
                    phone={shop.contact_phone}
                    filename={`standee-${qr.id}.png`}
                  />
                </div>

                {qr.label ? (
                  <h3 className="text-base font-semibold text-zinc-800 mb-1 truncate">{qr.label}</h3>
                ) : (
                  <h3 className="text-base font-semibold text-zinc-400 mb-1">No Label</h3>
                )}

                <p className="text-sm text-zinc-400 mb-3">
                  Scans: <span className="font-semibold text-zinc-600">{qr.scan_count}</span>
                </p>

                <div className="bg-zinc-50 rounded-xl p-2.5 mb-4">
                  <p className="text-xs text-zinc-500 break-all leading-relaxed">{qr.scan_url}</p>
                </div>

                <div className="mb-2">
                  <button
                    onClick={() => copyLink(qr)}
                    className="btn-ghost w-full bg-white border border-zinc-200 text-zinc-700 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-50"
                  >
                    {copiedId === qr.id ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <a
                  href={whatsappShareHref(qr)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0012.04 2zm0 18.15h-.003a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.55-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29z" />
                  </svg>
                  Share on WhatsApp
                </a>
              </div>
            ))}
          </div>
          <div className="app-card mt-5">
            <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />
          </div>
        </>
      )}
    </AppLayout>
  );
}
