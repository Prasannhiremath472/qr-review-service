import { useEffect, useState } from "react";
import { getMyShopAnalytics } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import OwnerShopGate from "../components/OwnerShopGate.jsx";

export default function OwnerOverviewPage() {
  return (
    <OwnerShopGate title="Dashboard & Analytics" subtitle="How your business is performing">
      {(shop) => <Overview shop={shop} />}
    </OwnerShopGate>
  );
}

function Overview({ shop }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await getMyShopAnalytics(shop.id);
      if (!cancelled && data.success) setStats(data.data);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  const cards = [
    { label: "QR Scans", value: stats?.qr_scans ?? 0, color: "blue", icon: "qr" },
    { label: "Review Page Views", value: stats?.review_page_views ?? 0, color: "violet", icon: "eye" },
    { label: "Reviews Submitted", value: stats?.total_reviews ?? 0, color: "amber", icon: "message" },
    { label: "Reviews Selected (4-5★)", value: stats?.selected_reviews ?? 0, color: "emerald", icon: "star" },
  ];

  return (
    <AppLayout title="Dashboard & Analytics" subtitle={shop.name}>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-block h-28 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <StatCard key={c.label} {...c} />
          ))}
        </div>
      )}

      <div className="app-card p-5 sm:p-6 mt-5 fade-in">
        <h2 className="text-base font-semibold text-zinc-900 mb-3">Subscription</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-zinc-400 text-xs mb-1">Start Date</p>
            <p className="font-medium text-zinc-800">{formatDate(shop.subscription_start_date)}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs mb-1">End Date</p>
            <p className="font-medium text-zinc-800">{formatDate(shop.subscription_end_date)}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs mb-1">Status</p>
            <span
              className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
                shop.subscription_status === "SUSPENDED"
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {shop.subscription_status === "SUSPENDED" ? "Suspended" : "Active"}
            </span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

const ICONS = {
  qr: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3.75 4.5A.75.75 0 014.5 3.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm0 10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5zm10.5-10.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75v-4.5z" />
  ),
  eye: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  message: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  ),
  star: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

function StatCard({ label, value, color, icon }) {
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
          {ICONS[icon]}
        </svg>
      </div>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
