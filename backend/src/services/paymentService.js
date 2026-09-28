const crypto = require("crypto");
const Razorpay = require("razorpay");
const db = require("../lib/db");
const config = require("../config/config");
const planService = require("./planService");

const MIN_AMOUNT_PAISE = 100;
const BILLING_CYCLES = ["MONTHLY", "YEARLY"];

let razorpayClient = null;
function getRazorpayClient() {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error("Razorpay is not configured (missing RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)");
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id: config.razorpayKeyId, key_secret: config.razorpayKeySecret });
  }
  return razorpayClient;
}

// createOrder creates a Razorpay order for a shop renewing/upgrading to the
// given plan + billing cycle, and records it locally as CREATED (pending).
async function createOrder({ shopId, planId, billingCycle }) {
  if (!BILLING_CYCLES.includes(billingCycle)) {
    throw new Error("billing_cycle must be MONTHLY or YEARLY");
  }

  const [shopRows] = await db.query("SELECT id FROM shops WHERE id = ?", [shopId]);
  if (shopRows.length === 0) {
    throw new Error("shop not found");
  }

  const plan = await planService.getPlanById(planId);
  if (!plan.is_active) {
    throw new Error("This plan is not currently available");
  }

  const rupees = billingCycle === "YEARLY" ? plan.price_yearly : plan.price_monthly;
  const amountPaise = Math.round(Number(rupees) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < MIN_AMOUNT_PAISE) {
    throw new Error("Invalid plan amount");
  }

  const receipt = `shop_${shopId}_${Date.now()}`;
  const razorpay = getRazorpayClient();

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { shop_id: shopId, plan_id: planId, billing_cycle: billingCycle },
    });
  } catch (err) {
    const message = err?.error?.description || err.message || "Razorpay order creation failed";
    const wrapped = new Error(message);
    wrapped.isRazorpayError = true;
    throw wrapped;
  }

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO payments
       (id, shop_id, plan_id, billing_cycle, amount, currency, razorpay_order_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'CREATED')`,
    [id, shopId, planId, billingCycle, amountPaise, order.currency, order.id]
  );

  return {
    payment_id: id,
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: config.razorpayKeyId,
  };
}

// verifyPayment checks the HMAC-SHA256 signature Razorpay returns after
// checkout, and if valid, marks the payment PAID and extends the shop's
// subscription (start date only set the first time; end date always
// extended by one billing period from "now", not stacked from the old end
// date — so a renewal after expiry doesn't silently grant free backdated
// time, and an early renewal simply resets the clock from today).
async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    const err = new Error("razorpay_order_id, razorpay_payment_id, and razorpay_signature are required");
    err.isBadRequest = true;
    throw err;
  }

  const [paymentRows] = await db.query("SELECT * FROM payments WHERE razorpay_order_id = ?", [razorpay_order_id]);
  const payment = paymentRows[0];
  if (!payment) {
    const err = new Error("Payment order not found");
    err.isBadRequest = true;
    throw err;
  }

  // Already processed (e.g. the checkout handler fired twice, or a replayed
  // callback) — don't extend the subscription a second time for one payment.
  if (payment.status === "PAID") {
    return { shop_id: payment.shop_id, plan_id: payment.plan_id, subscription_end_date: null, already_processed: true };
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    await db.query("UPDATE payments SET status = 'FAILED', razorpay_payment_id = ? WHERE id = ?", [
      razorpay_payment_id,
      payment.id,
    ]);
    const err = new Error("Payment signature verification failed");
    err.isBadRequest = true;
    throw err;
  }

  await db.query(
    "UPDATE payments SET status = 'PAID', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?",
    [razorpay_payment_id, razorpay_signature, payment.id]
  );

  const periodDays = payment.billing_cycle === "YEARLY" ? 365 : 30;
  const now = new Date();
  const newEnd = new Date(now);
  newEnd.setDate(newEnd.getDate() + periodDays);

  await db.query(
    `UPDATE shops
     SET plan_id = ?,
         subscription_status = 'ACTIVE',
         subscription_start_date = COALESCE(subscription_start_date, ?),
         subscription_end_date = ?
     WHERE id = ?`,
    [payment.plan_id, now, newEnd, payment.shop_id]
  );

  return { shop_id: payment.shop_id, plan_id: payment.plan_id, subscription_end_date: newEnd };
}

module.exports = { createOrder, verifyPayment };
