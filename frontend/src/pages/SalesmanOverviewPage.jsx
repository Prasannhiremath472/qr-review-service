import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAllQrCodes } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";

export default function SalesmanOverviewPage() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await listAllQrCodes({ page: 1, limit: 100 });
        if (cancelled) return;
        if (data.success) setQrCodes(data.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const linkedCount = qrCodes.filter((q) => q.is_linked).length;
  const unlinkedCount = qrCodes.length - linkedCount;
  const totalScans = qrCodes.reduce((sum, q) => sum + (q.scan_count || 0), 0);

  const stats = [
    { label: "QR Codes Generated", value: qrCodes.length, color: "blue" },
    { label: "Activated Shops", value: linkedCount, color: "emerald" },
    { label: "Unlinked QR Codes", value: unlinkedCount, color: "amber" },
    { label: "Total Scans", value: totalScans, color: "violet" },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Your QR code activity">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-block h-28 shimmer" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          <div className="app-card p-5 sm:p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-zinc-900">Recent QR Codes</h2>
              <Link to="/salesman/qr-codes" className="text-sm font-medium text-violet-600 hover:text-violet-800">
                View all &rarr;
              </Link>
            </div>
            {qrCodes.length === 0 ? (
              <p className="text-sm text-zinc-400 py-6 text-center">No QR codes yet.</p>
            ) : (
              <div className="space-y-1">
                {qrCodes.slice(0, 6).map((qr) => (
                  <div key={qr.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-zinc-50">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-800 truncate">{qr.label || qr.id}</p>
                      <p className="text-xs text-zinc-400 truncate">{qr.is_linked ? qr.shop_name : "Not activated"}</p>
                    </div>
                    <span className="text-xs text-zinc-400 flex-shrink-0">{qr.scan_count} scans</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

function StatCard({ label, value, color }) {
  const colorMap = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
  };
  return (
    <div className="app-card p-4 sm:p-5 fade-in">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
