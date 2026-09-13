import { useEffect, useState } from "react";
import { listClients, updateShop } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 20;

export default function AdminSubscriptionPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [savingId, setSavingId] = useState(null);

  async function refresh(targetPage = page) {
    const { data } = await listClients({ page: targetPage, limit: PAGE_SIZE });
    if (data.success) {
      setClients(data.data);
      setMeta(data.meta);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      await refresh(page);
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function patchClient(id, patch) {
    setSavingId(id);
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await updateShop(id, patch);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppLayout title="Subscription" subtitle="Track subscription period and status per client">
      <div className="app-card overflow-hidden fade-in">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-12 shimmer" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">No clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Name</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Category</th>
                  <th className="px-5 py-3 font-medium">Start Date</th>
                  <th className="px-5 py-3 font-medium">End Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-5 py-3 font-medium text-zinc-800">{c.name}</td>
                    <td className="px-5 py-3 text-zinc-600 hidden sm:table-cell">{c.owner_name || "—"}</td>
                    <td className="px-5 py-3 text-zinc-600 capitalize hidden sm:table-cell">{c.business_type}</td>
                    <td className="px-5 py-3">
                      <input
                        type="date"
                        defaultValue={toDateInputValue(c.subscription_start_date)}
                        onChange={(e) => patchClient(c.id, { subscription_start_date: e.target.value })}
                        disabled={savingId === c.id}
                        className="field-input px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="date"
                        defaultValue={toDateInputValue(c.subscription_end_date)}
                        onChange={(e) => patchClient(c.id, { subscription_end_date: e.target.value })}
                        disabled={savingId === c.id}
                        className="field-input px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/60"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={c.subscription_status || "ACTIVE"}
                        onChange={(e) => patchClient(c.id, { subscription_status: e.target.value })}
                        disabled={savingId === c.id}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border-0 ${
                          c.subscription_status === "SUSPENDED"
                            ? "bg-red-100 text-red-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
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

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
