const shopService = require("../services/shopService");
const db = require("../lib/db");

async function create(req, res) {
  const { name, review_url } = req.body;
  if (!name || !review_url) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: name and review_url are required",
    });
  }

  try {
    const shop = await shopService.createShop(req.body);
    res.status(201).json({
      success: true,
      data: shop,
      message: "Shop created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const shop = await shopService.getShopById(req.params.id);
    res.status(200).json({ success: true, data: shop });
  } catch (err) {
    res.status(404).json({ success: false, message: "Shop not found" });
  }
}

// listMine handles GET /api/v1/qr-reviews/shops/mine — the shops owned by the logged-in OWNER.
async function listMine(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM shops WHERE owner_user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { create, getById, listMine };
