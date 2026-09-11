import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkCreateQrCodes, listAllQrCodes } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;

export default function SalesmanQrCodesPage() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, total_pages: 1 });
  const [showForm, setShowForm] = useState(false);

  async function refresh(targetPage = page) {
    const { data } = await listAllQrCodes({ page: targetPage, limit: PAGE_SIZE });
    if (data.success) {
      setQrCodes(data.data);
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
    <AppLayout title="QR Codes" subtitle="Generate and activate QR codes">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {meta.total} QR code{meta.total === 1 ? "" : "s"}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-gradient inline-flex items-center gap-2 text-white py-2.5 px-4 rounded-xl font-semibold text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {showForm ? "Close" : "Generate QR Codes"}
          </button>
        </div>

        {showForm && (
          <BulkQrForm
            onGenerated={async () => {
              setPage(1);
              await refresh(1);
            }}
          />
        )}

        <LookupQrCard />

        <div className="app-card overflow-hidden fade-in">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-block h-12 shimmer" />
              ))}
            </div>
          ) : qrCodes.length === 0 ? (
            <p className="text-sm text-zinc-400 py-12 text-center">No QR codes yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-left text-xs text-zinc-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Label / ID</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium hidden sm:table-cell">Business</th>
                    <th className="px-5 py-3 font-medium">Scans</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {qrCodes.map((qr) => (
                    <tr key={qr.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60">
                      <td className="px-5 py-3">
                        <p className="font-medium text-zinc-800">{qr.label || "—"}</p>
                        <p className="text-xs text-zinc-400 font-mono">{qr.id}</p>
                      </td>
                      <td className="px-5 py-3">
                        {qr.is_linked ? (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                            Activated
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                            Unlinked
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-600 hidden sm:table-cell">
                        {qr.is_linked ? (
                          <a href={`/dashboard/${qr.shop_id}`} className="text-violet-600 hover:text-violet-800 font-medium">
                            {qr.shop_name}
                          </a>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-zinc-600">{qr.scan_count}</td>
                      <td className="px-5 py-3 text-right">
                        <a
                          href={qr.scan_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-zinc-500 hover:text-violet-700"
                        >
                          Open &rarr;
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} totalPages={meta.total_pages} onChange={setPage} />
        </div>
      </div>
    </AppLayout>
  );
}

function LookupQrCard() {
  const [qrId, setQrId] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const id = qrId.trim();
    if (id) navigate(`/r/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="app-card p-5 sm:p-6 flex flex-wrap gap-3 items-end fade-in">
      <div className="flex-1 min-w-[180px]">
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Activate a QR code</label>
        <input
          type="text"
          value={qrId}
          onChange={(e) => setQrId(e.target.value)}
          placeholder="Enter QR code ID"
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>
      <button
        type="submit"
        className="btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm"
      >
        Open
      </button>
    </form>
  );
}

function BulkQrForm({ onGenerated }) {
  const [count, setCount] = useState(10);
  const [label, setLabel] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResults(null);
    setSubmitting(true);

    try {
      const { data } = await bulkCreateQrCodes({ count: Number(count), label: label.trim() });
      if (data.success) {
        setResults(data.data);
        await onGenerated();
      } else {
        setError(data.message || "Failed to generate QR codes");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-card p-5 sm:p-6 space-y-4 fade-in">
      <h2 className="text-base font-semibold text-zinc-900">Bulk-Generate QR Codes</h2>

      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 sm:gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Count</label>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="field-input w-24 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Label prefix</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Batch1"
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
        >
          {submitting && <Spinner />}
          {submitting ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}

      {results && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {results.map((qr) => (
            <div key={qr.id} className="border border-zinc-200 rounded-xl p-3 text-center bg-zinc-50/50">
              <img
                src={`data:image/png;base64,${qr.image_base64}`}
                alt={`QR ${qr.id}`}
                className="w-full max-w-[110px] aspect-square mx-auto mb-2 rounded-lg"
              />
              <p className="text-xs font-mono text-zinc-500">{qr.id}</p>
              <p className="text-xs text-zinc-400 truncate">{qr.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
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
