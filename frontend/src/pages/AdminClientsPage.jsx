import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listClients, createShop } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";
import ClientForm from "../components/ClientForm.jsx";
import QrCodesModal from "../components/QrCodesModal.jsx";

const PAGE_SIZE = 10;

export default function AdminClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "add" ? "add" : "all";

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [modalShop, setModalShop] = useState(null);

  async function refresh(targetPage = page) {
    const { data } = await listClients({ page: targetPage, limit: PAGE_SIZE });
    if (data.success) {
      setClients(data.data);
      setMeta(data.meta);
    }
  }

  useEffect(() => {
    if (tab !== "all") return;
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
  }, [page, tab]);

  function setTab(next) {
    setSearchParams(next === "all" ? {} : { tab: next });
  }

  return (
    <AppLayout title="Clients" subtitle="All businesses onboarded onto the platform">
      <div className="flex items-center gap-2 mb-5 border-b border-zinc-200">
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          All Clients
        </TabButton>
        <TabButton active={tab === "add"} onClick={() => setTab("add")}>
          Add Client
        </TabButton>
      </div>

      {tab === "add" ? (
        <div className="max-w-2xl">
          <ClientForm
            submitLabel="Add Client"
            onSubmit={async (payload) => {
              const { data } = await createShop(payload);
              if (data.success) {
                setTab("all");
                setPage(1);
                await refresh(1);
              }
              return data;
            }}
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-500 mb-3">
            {meta.total} client{meta.total === 1 ? "" : "s"}
          </p>
          <div className="app-card overflow-hidden fade-in">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-block h-12 shimmer" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <p className="text-sm text-zinc-400 py-12 text-center">
                No clients yet. Use "Add Client" to onboard your first business.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400 uppercase tracking-wide">
                      <th className="px-5 py-3 font-medium">Business</th>
                      <th className="px-5 py-3 font-medium hidden sm:table-cell">Type</th>
                      <th className="px-5 py-3 font-medium hidden sm:table-cell">City</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setModalShop({ id: c.id, name: c.name })}
                            className="text-violet-600 hover:text-violet-800 font-medium hover:underline"
                          >
                            {c.name}
                          </button>
                          <p className="text-xs text-zinc-400">{c.owner_name || "—"}</p>
                        </td>
                        <td className="px-5 py-3 text-zinc-600 capitalize hidden sm:table-cell">{c.business_type}</td>
                        <td className="px-5 py-3 text-zinc-600 hidden sm:table-cell">{c.city || "—"}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={c.subscription_status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setModalShop({ id: c.id, name: c.name })}
                            className="text-xs font-medium text-zinc-500 hover:text-violet-700"
                          >
                            View QR Codes &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />
          </div>
        </>
      )}

      {modalShop && (
        <QrCodesModal shopId={modalShop.id} shopName={modalShop.name} onClose={() => setModalShop(null)} />
      )}
    </AppLayout>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-violet-600 text-violet-700" : "border-transparent text-zinc-500 hover:text-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const active = status !== "SUSPENDED";
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
        active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
      }`}
    >
      {active ? "Active" : "Suspended"}
    </span>
  );
}
