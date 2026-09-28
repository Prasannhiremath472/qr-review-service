const db = require("../lib/db");

// getShopPlan returns the shop's plan row (feature flags + limits), or the
// Startup plan's shape as a safe fallback if the shop has no plan_id set
// (shouldn't normally happen — migration 008 backfills every shop).
const FALLBACK_PLAN = {
  code: "startup",
  name: "Startup",
  standee_limit: 1,
  mini_web: true,
  negative_review_alerts: true,
  whatsapp_alerts: false,
  monthly_report: false,
  custom_brand_color: false,
  better_review_quality: false,
};

async function getShopPlan(shopId) {
  const [rows] = await db.query(
    `SELECT p.* FROM shops s JOIN plans p ON p.id = s.plan_id WHERE s.id = ?`,
    [shopId]
  );
  return rows[0] || FALLBACK_PLAN;
}

// isSubscriptionActive checks both the manual SUSPENDED flag and whether the
// paid period has actually lapsed (end date in the past).
function isSubscriptionActive(shop) {
  if (shop.subscription_status === "SUSPENDED") return false;
  if (!shop.subscription_end_date) return true;
  return new Date(shop.subscription_end_date).getTime() >= Date.now();
}

module.exports = { getShopPlan, isSubscriptionActive };
