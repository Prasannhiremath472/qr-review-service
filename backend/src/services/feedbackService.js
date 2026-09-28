const crypto = require("crypto");
const db = require("../lib/db");

const NEGATIVE_RATING_MAX = 3;

// submitFeedback stores customer feedback. Typically called when rating < 4.
async function submitFeedback(req) {
  const id = crypto.randomUUID();

  await db.query(
    "INSERT INTO feedback (id, shop_id, qr_code_id, rating, message) VALUES (?, ?, ?, ?, ?)",
    [id, req.shop_id, req.qr_code_id || null, req.rating, req.message || ""]
  );

  const [rows] = await db.query("SELECT * FROM feedback WHERE id = ?", [id]);
  return rows[0];
}

// buildWhatsAppLink returns a wa.me click-to-chat link pre-filled with the
// negative review, or null if the shop has no WhatsApp number on file.
function buildWhatsAppLink(whatsappNumber, shopName, item) {
  if (!whatsappNumber) return null;
  const digits = whatsappNumber.replace(/[^0-9]/g, "");
  if (!digits) return null;

  const text = `New ${item.rating}★ feedback for ${shopName}:\n"${item.message || "(no message)"}"`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// listNegativeReviews returns rating<=3 feedback for a shop (owner
// dashboard's "Negative Reviews" section), each with a ready-to-open
// WhatsApp link when the shop has a WhatsApp number.
async function listNegativeReviews(shopId) {
  const [shopRows] = await db.query("SELECT name, whatsapp_number FROM shops WHERE id = ?", [shopId]);
  const shop = shopRows[0];
  if (!shop) {
    throw new Error("shop not found");
  }

  const [rows] = await db.query(
    `SELECT id, rating, message, qr_code_id, created_at FROM feedback
     WHERE shop_id = ? AND rating <= ? ORDER BY created_at DESC LIMIT 50`,
    [shopId, NEGATIVE_RATING_MAX]
  );

  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    message: r.message || "",
    created_at: r.created_at,
    whatsapp_link: buildWhatsAppLink(shop.whatsapp_number, shop.name, r),
  }));
}

// getMonthlyReport aggregates the current calendar month's activity for a
// shop (Pro-plan owner dashboard summary): scans, review page views,
// reviews submitted, and a rating breakdown.
async function getMonthlyReport(shopId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [[scanRow]] = await db.query(
    `SELECT COALESCE(SUM(qc.scan_count), 0) AS qr_scans
     FROM qr_codes qc WHERE qc.shop_id = ?`,
    [shopId]
  );
  const [[feedbackRow]] = await db.query(
    `SELECT
       COUNT(*) AS total_reviews,
       COALESCE(SUM(rating >= 4), 0) AS positive_reviews,
       COALESCE(SUM(rating <= 3), 0) AS negative_reviews,
       COALESCE(AVG(rating), 0) AS avg_rating
     FROM feedback WHERE shop_id = ? AND created_at >= ?`,
    [shopId, monthStart]
  );

  return {
    period_start: monthStart,
    period_end: now,
    qr_scans: Number(scanRow.qr_scans) || 0,
    total_reviews: Number(feedbackRow.total_reviews) || 0,
    positive_reviews: Number(feedbackRow.positive_reviews) || 0,
    negative_reviews: Number(feedbackRow.negative_reviews) || 0,
    average_rating: Number(Number(feedbackRow.avg_rating).toFixed(2)) || 0,
  };
}

module.exports = { submitFeedback, listNegativeReviews, getMonthlyReport };
