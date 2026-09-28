const planService = require("../services/planService");

// listPlans handles GET /api/v1/qr-reviews/plans — public/authenticated list
// of active plans (used by the owner dashboard's renew/upgrade options).
// Admins get every plan, including inactive ones, via ?all=true.
async function listPlans(req, res) {
  try {
    const activeOnly = !(req.user?.role === "ADMIN" && req.query.all === "true");
    const plans = await planService.listPlans({ activeOnly });
    res.status(200).json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// update handles PATCH /api/v1/qr-reviews/plans/:id — admin-only editing of
// a plan's pricing and feature flags.
async function update(req, res) {
  try {
    const plan = await planService.updatePlan(req.params.id, req.body || {});
    res.status(200).json({ success: true, data: plan, message: "Plan updated successfully" });
  } catch (err) {
    const status = err.message === "plan not found" ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

module.exports = { listPlans, update };
