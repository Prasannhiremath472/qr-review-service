import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyShops } from "../api/client.js";
import ShopDashboard from "../components/ShopDashboard.jsx";
import AppLayout from "../components/AppLayout.jsx";

export default function OwnerDashboardPage() {
  const [shops, setShops] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getMyShops();
        if (cancelled) return;
        if (data.success) setShops(data.data);
        else setError(data.message || "Failed to load your shops");
      } catch (err) {
        if (!cancelled) setError("Failed to load your shops");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <AppLayout title="Dashboard">
        <div className="app-card fade-in max-w-sm mx-auto text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </AppLayout>
    );
  }

  if (shops === null) {
    return (
      <AppLayout title="Dashboard">
        <div className="skeleton-block h-64 shimmer" />
      </AppLayout>
    );
  }

  if (shops.length === 0) {
    return (
      <AppLayout title="Dashboard" subtitle="QR codes for collecting Google Reviews">
        <div className="app-card p-12 sm:p-16 text-center fade-in">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <p className="text-zinc-500">No shops linked to your account yet.</p>
          <p className="text-zinc-400 text-sm mt-1">Ask your salesman or admin to link a QR code to your business.</p>
        </div>
      </AppLayout>
    );
  }

  if (shops.length === 1) {
    return <ShopDashboard shopId={shops[0].id} layout="app" />;
  }

  // Multiple shops: let the owner choose which one to view
  return (
    <AppLayout title="Dashboard" subtitle="Choose a shop to view">
      <div className="space-y-4 max-w-3xl">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            to={`/dashboard/${shop.id}`}
            className="app-card fade-in flex items-center gap-4 p-5 hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
              {shop.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-zinc-900 truncate">{shop.name}</h2>
              <p className="text-sm text-zinc-500 truncate">
                {shop.businessType || "business"}
                {shop.city ? ` · ${shop.city}` : ""}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
