import { useEffect, useState } from "react";
import { listPlans, updatePlan } from "../api/client.js";
import AppLayout from "../components/AppLayout.jsx";

const FEATURE_FIELDS = [
  { key: "mini_web", label: "Mini Web Page" },
  { key: "negative_review_alerts", label: "Negative Review Dashboard" },
  { key: "whatsapp_alerts", label: "WhatsApp Review Alerts" },
  { key: "monthly_report", label: "Monthly Report" },
  { key: "custom_brand_color", label: "Custom Brand Colour" },
  { key: "better_review_quality", label: "Better Review Quality" },
];

// AdminPlansPage lets the admin edit every plan's pricing, standee limit,
// and feature flags — fully admin-editable, no code changes needed to
// adjust what Startup/Pro include or cost.
export default function AdminPlansPage() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    const { data } = await listPlans({ all: true });
    if (data.success) setPlans(data.data);
    else setError(data.message || "Failed to load plans");
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AppLayout title="Plans & Pricing" subtitle="Edit each plan's price and included features">
      {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl mb-4">{error}</div>}
      {!plans ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton-block h-96 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSaved={refresh} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function PlanCard({ plan, onSaved }) {
  const [form, setForm] = useState(plan);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(plan);
  }, [plan]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const { data } = await updatePlan(plan.id, {
        name: form.name,
        price_monthly: Number(form.price_monthly),
        price_yearly: Number(form.price_yearly),
        standee_limit: Number(form.standee_limit),
        is_active: form.is_active,
        ...Object.fromEntries(FEATURE_FIELDS.map((f) => [f.key, !!form[f.key]])),
      });
      if (data.success) {
        setMessage("Saved");
        onSaved?.();
      } else {
        setMessage(data.message || "Failed to save");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 2500);
    }
  }

  return (
    <div className="app-card p-5 sm:p-6 space-y-4 fade-in">
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          className="field-input text-lg font-semibold text-zinc-900 border-0 bg-transparent px-0 py-0 focus:ring-0 w-full"
        />
        <label className="flex items-center gap-1.5 text-xs text-zinc-500 flex-shrink-0">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => setField("is_active", e.target.checked)}
            className="rounded"
          />
          Active
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Monthly Price (&#8377;)</label>
          <input
            type="number"
            min={0}
            value={form.price_monthly}
            onChange={(e) => setField("price_monthly", e.target.value)}
            className="field-input w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Yearly Price (&#8377;)</label>
          <input
            type="number"
            min={0}
            value={form.price_yearly}
            onChange={(e) => setField("price_yearly", e.target.value)}
            className="field-input w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 mb-1">Standee Limit</label>
        <input
          type="number"
          min={0}
          value={form.standee_limit}
          onChange={(e) => setField("standee_limit", e.target.value)}
          className="field-input w-28 px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-50/60"
        />
      </div>

      <div className="pt-2 border-t border-zinc-100 space-y-2">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Features</p>
        {FEATURE_FIELDS.map((f) => (
          <label key={f.key} className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={!!form[f.key]}
              onChange={(e) => setField(f.key, e.target.checked)}
              className="rounded"
            />
            {f.label}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn-gradient text-white py-2 px-5 rounded-xl font-semibold text-sm"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {message && <span className="text-sm text-zinc-500">{message}</span>}
      </div>
    </div>
  );
}
