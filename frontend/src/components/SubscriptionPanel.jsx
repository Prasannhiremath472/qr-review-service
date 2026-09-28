import { useEffect, useState } from "react";
import { listPlans } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import RazorpayCheckoutButton from "./RazorpayCheckoutButton.jsx";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function isLapsed(shop) {
  if (shop.subscription_status === "SUSPENDED") return true;
  if (!shop.subscription_end_date) return false;
  return new Date(shop.subscription_end_date).getTime() < Date.now();
}

// SubscriptionPanel shows the shop's current plan/subscription status and,
// via Razorpay Standard Checkout, lets the owner renew or switch plans. On
// a verified payment it calls onRenewed(shop_id) so the caller can refresh
// the shop (new plan_id/subscription dates) and re-enable QR review service.
export default function SubscriptionPanel({ shop, onRenewed }) {
  const { user } = useAuth();
  const [plans, setPlans] = useState(null);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [selectedPlanId, setSelectedPlanId] = useState(shop.plan_id || "");
  const [status, setStatus] = useState(null); // { type: 'error'|'success', message }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await listPlans();
      if (!cancelled && data.success) {
        setPlans(data.data);
        setSelectedPlanId((prev) => prev || shop.plan_id || data.data[0]?.id || "");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop.id]);

  const lapsed = isLapsed(shop);
  const currentPlan = plans?.find((p) => p.id === shop.plan_id);
  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
  const price = selectedPlan ? (billingCycle === "YEARLY" ? selectedPlan.price_yearly : selectedPlan.price_monthly) : 0;

  return (
    <div className="app-card p-5 sm:p-6 fade-in space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold text-zinc-900">Subscription</h2>
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-full ${
            lapsed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {lapsed ? "Renewal Needed" : "Active"}
        </span>
      </div>

      {lapsed && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3">
          Your QR review service is currently paused because your subscription has ended. Customers scanning your QR
          code won't be able to leave a review until you renew below.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-zinc-400 text-xs mb-1">Current Plan</p>
          <p className="font-medium text-zinc-800">{currentPlan?.name || "—"}</p>
        </div>
        <div>
          <p className="text-zinc-400 text-xs mb-1">Start Date</p>
          <p className="font-medium text-zinc-800">{formatDate(shop.subscription_start_date)}</p>
        </div>
        <div>
          <p className="text-zinc-400 text-xs mb-1">End Date</p>
          <p className="font-medium text-zinc-800">{formatDate(shop.subscription_end_date)}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Renew or Change Plan</p>

        {!plans ? (
          <div className="skeleton-block h-24 shimmer" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`text-left rounded-xl border-2 p-4 transition-colors ${
                    selectedPlanId === plan.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <p className="font-semibold text-zinc-900">{plan.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    &#8377;{plan.price_monthly}/mo &middot; &#8377;{plan.price_yearly}/yr
                  </p>
                  <ul className="text-xs text-zinc-500 mt-2 space-y-0.5">
                    <li>{plan.standee_limit} standee{plan.standee_limit === 1 ? "" : "s"}</li>
                    {plan.mini_web && <li>Mini web page</li>}
                    {plan.whatsapp_alerts && <li>WhatsApp review alerts</li>}
                    {plan.monthly_report && <li>Monthly report</li>}
                    {plan.custom_brand_color && <li>Custom brand colour</li>}
                    {plan.better_review_quality && <li>Better review quality</li>}
                  </ul>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
              <p className="text-sm text-zinc-500 ml-auto">
                Total: <span className="font-semibold text-zinc-800">&#8377;{price}</span>
              </p>
            </div>

            {status && (
              <div
                className={`text-sm rounded-xl px-4 py-2.5 ${
                  status.type === "error" ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50"
                }`}
              >
                {status.message}
              </div>
            )}

            <RazorpayCheckoutButton
              shopId={shop.id}
              planId={selectedPlanId}
              billingCycle={billingCycle}
              label={lapsed ? "Renew Subscription" : "Pay & Update Plan"}
              ownerName={user?.name}
              ownerEmail={user?.email}
              ownerContact={shop.contact_phone}
              onSuccess={() => {
                setStatus({ type: "success", message: "Payment successful! Your subscription is now active." });
                onRenewed?.();
              }}
              onError={(message) => setStatus({ type: "error", message })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function BillingToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-200 p-1 bg-zinc-50">
      {["MONTHLY", "YEARLY"].map((cycle) => (
        <button
          key={cycle}
          type="button"
          onClick={() => onChange(cycle)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            value === cycle ? "bg-white shadow-sm text-violet-700" : "text-zinc-500"
          }`}
        >
          {cycle === "MONTHLY" ? "Monthly" : "Yearly"}
        </button>
      ))}
    </div>
  );
}
