const crypto = require("crypto");
const db = require("../lib/db");

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

module.exports = { submitFeedback };
