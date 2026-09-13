import { useEffect, useState } from "react";
import { getShopAnalytics } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 20;

export default function AdminAnalyticsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await getShopAnalytics({ page, limit: PAGE_SIZE });
      if (!cancelled && data.success) {
        setRows(data.data);
        setMeta(data.meta);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <AppLayout title="Analytics" subtitle="QR scans, review page views, and reviews per business">
      <div className="app-card overflow-hidden fade-in">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-12 shimmer" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">No businesses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">QR Scans</th>
                  <th className="px-5 py-3 font-medium">Review Page Views</th>
                  <th className="px-5 py-3 font-medium">Reviews Submitted</th>
                  <th className="px-5 py-3 font-medium">Reviews Selected (4-5★)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.shop_id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-5 py-3 font-medium text-zinc-800">{r.shop_name}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.qr_scans}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.review_page_views}</td>
                    <td className="px-5 py-3 text-zinc-600">{r.total_reviews}</td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        {r.selected_reviews}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />
      </div>
    </AppLayout>
  );
}
