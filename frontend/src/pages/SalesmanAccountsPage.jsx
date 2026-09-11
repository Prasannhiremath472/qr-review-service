import { useEffect, useState } from "react";
import { listUsers } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;

export default function SalesmanAccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await listUsers({ page, limit: PAGE_SIZE });
      if (cancelled) return;
      if (data.success) {
        setUsers(data.data);
        setMeta(data.meta);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <AppLayout title="Accounts" subtitle="Salesman, admin, and business owner logins">
      <p className="text-sm text-zinc-500 mb-5">
        {meta.total} account{meta.total === 1 ? "" : "s"}
      </p>

      <div className="app-card overflow-hidden fade-in">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-12 shimmer" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-zinc-400 py-12 text-center">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400 uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(u.name || u.email)[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-zinc-800 truncate">{u.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-600">{u.email}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400 hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
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

function RoleBadge({ role }) {
  const styles = {
    ADMIN: "bg-violet-100 text-violet-700",
    SALESMAN: "bg-blue-100 text-blue-700",
    OWNER: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${styles[role] || "bg-zinc-100 text-zinc-600"}`}>
      {role}
    </span>
  );
}
