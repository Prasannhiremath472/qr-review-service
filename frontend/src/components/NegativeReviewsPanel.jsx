import { useEffect, useState } from "react";
import { getNegativeReviews } from "../api/client.js";

// NegativeReviewsPanel shows rating<=3 feedback for the owner's shop
// (available on every plan). On Pro plans (whatsapp_alerts), each item also
// gets a "Send to WhatsApp" button pre-filled with the review text.
export default function NegativeReviewsPanel({ shopId }) {
  const [reviews, setReviews] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await getNegativeReviews(shopId);
        if (cancelled) return;
        if (data.success) setReviews(data.data);
        else setError(data.message || "Failed to load negative reviews");
      } catch (err) {
        if (!cancelled) setError("Failed to load negative reviews");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  return (
    <div className="app-card p-5 sm:p-6 fade-in">
      <h2 className="text-base font-semibold text-zinc-900 mb-3">Negative Reviews</h2>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : reviews === null ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-block h-14 shimmer" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-zinc-400 py-6 text-center">
          No negative feedback (3★ or below) yet — nice work!
        </p>
      ) : (
        <div className="divide-y divide-zinc-50">
          {reviews.map((r) => (
            <div key={r.id} className="py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-700">{r.rating}★ feedback</p>
                {r.message && <p className="text-sm text-zinc-600 mt-0.5 leading-relaxed">{r.message}</p>}
                <p className="text-xs text-zinc-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
              </div>
              {r.whatsapp_link && (
                <a
                  href={r.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50"
                >
                  Send to WhatsApp
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
