import { useState } from "react";
import { createPaymentOrder, verifyPayment } from "../api/client.js";

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

let scriptLoadPromise = null;
function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Failed to load Razorpay checkout"));
    };
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

// RazorpayCheckoutButton creates an order for {shopId, planId, billingCycle},
// opens Razorpay Standard Checkout, verifies the payment signature on
// success, and calls onSuccess/onError/onDismiss accordingly.
export default function RazorpayCheckoutButton({
  shopId,
  planId,
  billingCycle,
  label,
  ownerName,
  ownerEmail,
  ownerContact,
  className,
  onSuccess,
  onError,
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!RAZORPAY_KEY_ID) {
      onError?.("Payments are not configured. Please contact support.");
      return;
    }

    setLoading(true);
    try {
      await loadCheckoutScript();

      const { data: orderData } = await createPaymentOrder({
        shop_id: shopId,
        plan_id: planId,
        billing_cycle: billingCycle,
      });
      if (!orderData.success) {
        onError?.(orderData.message || "Failed to start payment");
        setLoading(false);
        return;
      }

      const { order_id, amount, currency, key_id } = orderData.data;

      const rzp = new window.Razorpay({
        key: key_id || RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id,
        name: "ReviewGenie",
        description: `${billingCycle === "YEARLY" ? "Yearly" : "Monthly"} subscription`,
        prefill: {
          name: ownerName || "",
          email: ownerEmail || "",
          contact: ownerContact || "",
        },
        handler: async (response) => {
          try {
            const { data: verifyData } = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyData.success) {
              onSuccess?.(verifyData.data);
            } else {
              onError?.(verifyData.message || "Payment verification failed");
            }
          } catch (err) {
            onError?.("Payment verification failed. If money was deducted, contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: { color: "#7c3aed" },
      });

      rzp.on("payment.failed", (response) => {
        setLoading(false);
        onError?.(response?.error?.description || "Payment failed");
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      onError?.(err.message || "Failed to start payment");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className || "btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm inline-flex items-center gap-2"}
    >
      {loading && <Spinner />}
      {loading ? "Opening..." : label}
    </button>
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
