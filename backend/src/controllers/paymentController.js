const paymentService = require("../services/paymentService");
const db = require("../lib/db");

// createOrder handles POST /api/v1/qr-reviews/payments/create-order — the
// logged-in OWNER pays for their own shop; admin/salesman may also trigger
// it on a shop's behalf (e.g. offline collection reconciliation).
async function createOrder(req, res) {
  const { shop_id, plan_id, billing_cycle } = req.body || {};
  if (!shop_id || !plan_id || !billing_cycle) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: shop_id, plan_id, and billing_cycle are required",
    });
  }

  try {
    if (req.user.role === "OWNER") {
      const [rows] = await db.query("SELECT owner_user_id FROM shops WHERE id = ?", [shop_id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Shop not found" });
      }
      if (rows[0].owner_user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Forbidden: not your shop" });
      }
    }

    const order = await paymentService.createOrder({ shopId: shop_id, planId: plan_id, billingCycle: billing_cycle });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err.message === "shop not found" || err.message === "plan not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.message.includes("Razorpay is not configured") || err.isRazorpayError) {
      return res.status(err.isRazorpayError ? 500 : 401).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: err.message });
  }
}

// verifyPayment handles POST /api/v1/qr-reviews/payments/verify — checks the
// Razorpay checkout response signature and, if valid, activates the shop's
// subscription for the paid plan/cycle.
async function verifyPayment(req, res) {
  try {
    const result = await paymentService.verifyPayment(req.body || {});
    res.status(200).json({ success: true, data: result, message: "Payment verified, subscription activated" });
  } catch (err) {
    if (err.isBadRequest) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createOrder, verifyPayment };
