import { useEffect, useState } from "react";
import { getMonthlyReport } from "../api/client.js";

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

// MonthlyReportPanel is a Pro-plan-only owner dashboard summary. Renders
// nothing for Startup plans (backend returns 403) instead of an error box,
// since this is an expected, not exceptional, state for those shops.
export default function MonthlyReportPanel({ shopId }) {
  const [report, setReport] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, status } = await getMonthlyReport(shopId);
        if (cancelled) return;
        if (data.success) {
          setReport(data.data);
        } else if (status === 403) {
          setUnavailable(true);
        }
      } catch (err) {
        if (!cancelled) setUnavailable(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (unavailable) return null;

  return (
    <div className="app-card p-5 sm:p-6 fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-zinc-900">Monthly Report</h2>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-violet-100 text-violet-700">Pro</span>
      </div>
      {!report ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-block h-16 shimmer" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-400 mb-3">
            {formatDate(report.period_start)} &ndash; {formatDate(report.period_end)}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="QR Scans" value={report.qr_scans} />
            <Stat label="Reviews" value={report.total_reviews} />
            <Stat label="Avg Rating" value={report.average_rating || "—"} />
            <Stat label="Negative" value={report.negative_reviews} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-50 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
