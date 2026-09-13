import { useEffect, useState } from "react";
import { getShopActivity } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import OwnerShopGate from "../components/OwnerShopGate.jsx";

export default function OwnerNotificationsPage() {
  return (
    <OwnerShopGate title="Notifications" subtitle="Recent activity on your business">
      {(shop) => <ActivityFeed shop={shop} />}
    </OwnerShopGate>
  );
}

function ActivityFeed({ shop }) {
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getShopActivity(shop.id);
        if (cancelled) return;
        if (data.success) setActivity(data.data);
        else setError(data.message || "Failed to load activity");
      } catch (err) {
        if (!cancelled) setError("Failed to load activity");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shop.id]);

  return (
    <AppLayout title="Notifications" subtitle={shop.name}>
      <div className="app-card overflow-hidden fade-in max-w-2xl">
        {error ? (
          <p className="text-sm text-red-600 text-center py-12">{error}</p>
        ) : activity === null ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-14 shimmer" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-12">
            No activity yet. You'll see customer reviews and feedback here.
          </p>
        ) : (
          <div className="divide-y divide-zinc-50">
            {activity.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function ActivityRow({ item }) {
  const positive = item.type === "positive_review";
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          positive ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
        }`}
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {positive ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          )}
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-800">
          {positive ? `${item.rating}★ review submitted` : `${item.rating}★ feedback received`}
        </p>
        {item.message && <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">{item.message}</p>}
        <p className="text-xs text-zinc-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}
