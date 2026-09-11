import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboard } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import TopNav from "./TopNav.jsx";
import AppLayout from "./AppLayout.jsx";
import Pagination from "./Pagination.jsx";

const HOME_BY_ROLE = {
  ADMIN: "/admin",
  SALESMAN: "/salesman",
  OWNER: "/my-shops",
};

const PAGE_SIZE = 12;

// ShopDashboard renders a shop's QR code grid. `layout` picks the surrounding
// chrome: "topnav" (bare header, used for the public /dashboard/:shopId route)
// or "app" (full sidebar, used when embedded in the owner's own Dashboard page).
export default function ShopDashboard({ shopId, layout = "topnav" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [shopName, setShopName] = useState("");
  const [qrCodes, setQrCodes] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [printCodes, setPrintCodes] = useState(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { status, data } = await getDashboard(shopId, { page, limit: PAGE_SIZE });
        if (cancelled) return;
        if (!data.success) {
          if (status === 403) {
            setForbidden(true);
          } else {
            setError(data.message || "Failed to load QR codes");
          }
        } else {
          setShopName(data.data.shop_name);
          setQrCodes(data.data.qr_codes);
          setMeta(data.meta);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load QR codes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId, page]);

  async function handlePrintAll() {
    setPrinting(true);
    try {
      const all = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const { data } = await getDashboard(shopId, { page: currentPage, limit: 100 });
        if (!data.success) break;
        all.push(...data.data.qr_codes);
        totalPages = data.meta.total_pages;
        currentPage += 1;
      } while (currentPage <= totalPages);

      setPrintCodes(all);
      requestAnimationFrame(() => {
        setTimeout(() => window.print(), 50);
      });
    } finally {
      setPrinting(false);
    }
  }

  useEffect(() => {
    function handleAfterPrint() {
      setPrintCodes(null);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  const Chrome = layout === "app" ? AppChrome : TopNavChrome;

  if (loading) {
    return (
      <Chrome shopName={shopName}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block h-80 shimmer" />
          ))}
        </div>
      </Chrome>
    );
  }

  if (forbidden) {
    const home = HOME_BY_ROLE[user?.role] || "/login";
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="app-card fade-in max-w-sm w-full text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">Not Your Shop</h1>
          <p className="text-sm text-zinc-500 mb-6">This dashboard belongs to a different account.</p>
          <Link
            to={home}
            className="btn-gradient inline-flex items-center justify-center text-white py-3 px-6 rounded-xl font-semibold text-sm"
          >
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="app-card fade-in max-w-sm w-full text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">Error</h1>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Chrome shopName={shopName}>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-zinc-500">
            {meta.total} QR code{meta.total === 1 ? "" : "s"}
          </p>
          <button
            onClick={handlePrintAll}
            disabled={printing}
            className="btn-ghost inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-50 shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            {printing ? "Preparing..." : "Print All"}
          </button>
        </div>

        {qrCodes.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-5">
              {qrCodes.map((qr) => (
                <QrCard key={qr.id} qr={qr} />
              ))}
            </div>
            <div className="app-card mt-5">
              <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />
            </div>
          </>
        ) : (
          <div className="app-card p-12 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm0 10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm10.5-10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
              </svg>
            </div>
            <p className="text-zinc-500">No QR codes created yet.</p>
          </div>
        )}
      </Chrome>

      {/* Print-only view: every QR code for this shop, regardless of on-screen pagination */}
      {printCodes && (
        <div className="print-only max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-6">{shopName}</h1>
          <div className="grid grid-cols-3 gap-6">
            {printCodes.map((qr) => (
              <QrCard key={qr.id} qr={qr} printMode />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function TopNavChrome({ shopName, children }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="no-print">
        <TopNav title={shopName} subtitle="QR codes for collecting Google Reviews" />
      </div>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 no-print">{children}</div>
    </div>
  );
}

function AppChrome({ shopName, children }) {
  return (
    <AppLayout title={shopName || "Dashboard"} subtitle="QR codes for collecting Google Reviews">
      <div className="no-print">{children}</div>
    </AppLayout>
  );
}

function QrCard({ qr, printMode }) {
  return (
    <div
      className={`qr-card app-card p-6 text-center fade-in w-full sm:w-72 ${printMode ? "shadow-none border" : ""}`}
    >
      <div className="bg-zinc-50 rounded-2xl p-3 mb-4 inline-block">
        <img src={qr.image_url} alt={`QR Code for ${qr.label}`} className="w-40 h-40 sm:w-44 sm:h-44 mx-auto rounded-lg" />
      </div>

      {qr.label ? (
        <h3 className="text-base font-semibold text-zinc-800 mb-1 truncate">{qr.label}</h3>
      ) : (
        <h3 className="text-base font-semibold text-zinc-400 mb-1">No Label</h3>
      )}

      <p className="text-sm text-zinc-400 mb-3">
        Scans: <span className="font-semibold text-zinc-600">{qr.scan_count}</span>
      </p>

      <p className="text-xs text-zinc-300 mb-3 font-mono">{qr.id}</p>

      <div className="bg-zinc-50 rounded-xl p-2.5 mb-4">
        <p className="text-xs text-zinc-500 break-all leading-relaxed">{qr.scan_url}</p>
      </div>

      {!printMode && (
        <div className="flex gap-2 no-print">
          <a
            href={qr.scan_url}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 text-center"
          >
            Test Scan
          </a>
          <a
            href={qr.image_url}
            download={`qr-${qr.id}.png`}
            className="btn-ghost flex-1 bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 text-center"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
