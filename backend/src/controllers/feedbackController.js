const feedbackService = require("../services/feedbackService");
const db = require("../lib/db");

// listActivity handles GET /api/v1/qr-reviews/shops/:shop_id/activity — a
// simple recent-activity feed for the OWNER's "Notifications" page, built
// from existing feedback rows (no separate notifications table).
async function listActivity(req, res) {
  const shopId = req.params.shop_id;

  try {
    const [shopRows] = await db.query("SELECT id, owner_user_id FROM shops WHERE id = ?", [shopId]);
    const shop = shopRows[0];
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    if (req.user.role === "OWNER" && shop.owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your shop" });
    }

    const [rows] = await db.query(
      "SELECT id, rating, message, qr_code_id, created_at FROM feedback WHERE shop_id = ? ORDER BY created_at DESC LIMIT 50",
      [shopId]
    );

    const activity = rows.map((r) => ({
      id: r.id,
      type: r.rating >= 4 ? "positive_review" : "feedback",
      rating: r.rating,
      message: r.message || "",
      created_at: r.created_at,
    }));

    res.status(200).json({ success: true, data: activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function submit(req, res) {
  const { shop_id, rating } = req.body;
  if (!shop_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: shop_id and rating (1-5) are required",
    });
  }

  try {
    const feedback = await feedbackService.submitFeedback(req.body);
    res.status(201).json({
      success: true,
      data: feedback,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { submit, listActivity };
