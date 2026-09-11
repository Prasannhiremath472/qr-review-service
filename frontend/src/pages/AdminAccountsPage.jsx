import { useEffect, useState } from "react";
import { createUser, listUsers } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;

export default function AdminAccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });

  async function refresh(targetPage = page) {
    const { data } = await listUsers({ page: targetPage, limit: PAGE_SIZE });
    if (data.success) {
      setUsers(data.data);
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

  return (
    <AppLayout title="Accounts" subtitle="Salesman, admin, and business owner logins">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-zinc-500">
          {meta.total} account{meta.total === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="btn-gradient inline-flex items-center gap-2 text-white py-2.5 px-4 rounded-xl font-semibold text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? "Close" : "New Account"}
        </button>
      </div>

      {showForm && (
        <div className="mb-5">
          <CreateUserForm
            onCreated={async () => {
              await refresh();
              setShowForm(false);
            }}
          />
        </div>
      )}

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

function CreateUserForm({ onCreated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("SALESMAN");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await createUser({ email: email.trim(), password, name: name.trim(), role });
      if (data.success) {
        await onCreated();
      } else {
        setError(data.message || "Failed to create user");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="app-card p-5 sm:p-6 space-y-4 fade-in">
      <h2 className="text-base font-semibold text-zinc-900">Create Account</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white"
          >
            <option value="ADMIN">Admin</option>
            <option value="SALESMAN">Salesman</option>
            <option value="OWNER">Business Owner</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
      >
        {submitting && <Spinner />}
        {submitting ? "Creating..." : "Create Account"}
      </button>
    </form>
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

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  );
}
