const db = require("../lib/db");

const FEATURE_FIELDS = [
  "mini_web",
  "negative_review_alerts",
  "whatsapp_alerts",
  "monthly_report",
  "custom_brand_color",
  "better_review_quality",
];

const EDITABLE_FIELDS = [
  "name",
  "price_monthly",
  "price_yearly",
  "standee_limit",
  ...FEATURE_FIELDS,
  "is_active",
  "sort_order",
];

function toPlanResponse(plan) {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    price_monthly: plan.price_monthly,
    price_yearly: plan.price_yearly,
    standee_limit: plan.standee_limit,
    mini_web: !!plan.mini_web,
    negative_review_alerts: !!plan.negative_review_alerts,
    whatsapp_alerts: !!plan.whatsapp_alerts,
    monthly_report: !!plan.monthly_report,
    custom_brand_color: !!plan.custom_brand_color,
    better_review_quality: !!plan.better_review_quality,
    is_active: !!plan.is_active,
    sort_order: plan.sort_order,
  };
}

// listPlans returns every plan, active first then by sort_order — used by
// the admin "Plans" page and by the owner dashboard's upgrade/renew options.
async function listPlans({ activeOnly = false } = {}) {
  const where = activeOnly ? "WHERE is_active = true" : "";
  const [rows] = await db.query(`SELECT * FROM plans ${where} ORDER BY sort_order ASC`);
  return rows.map(toPlanResponse);
}

async function getPlanById(id) {
  const [rows] = await db.query("SELECT * FROM plans WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new Error("plan not found");
  }
  return rows[0];
}

// updatePlan patches editable fields (features/pricing) on an existing
// plan. The `code` (startup/pro) is fixed and never changes.
async function updatePlan(id, req) {
  const [existingRows] = await db.query("SELECT id FROM plans WHERE id = ?", [id]);
  if (existingRows.length === 0) {
    throw new Error("plan not found");
  }

  const sets = [];
  const values = [];
  for (const field of EDITABLE_FIELDS) {
    if (req[field] !== undefined) {
      sets.push(`${field} = ?`);
      values.push(FEATURE_FIELDS.includes(field) || field === "is_active" ? Boolean(req[field]) : req[field]);
    }
  }

  if (sets.length > 0) {
    values.push(id);
    await db.query(`UPDATE plans SET ${sets.join(", ")} WHERE id = ?`, values);
  }

  const [rows] = await db.query("SELECT * FROM plans WHERE id = ?", [id]);
  return toPlanResponse(rows[0]);
}

module.exports = { listPlans, getPlanById, updatePlan, toPlanResponse };
