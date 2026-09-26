const shopService = require("../services/shopService");
const db = require("../lib/db");
const { parsePagination, paginationMeta } = require("../lib/pagination");

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
      message: "Client created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const shop = await shopService.getShopById(req.params.id);
    res.status(200).json({ success: true, data: shopService.toClientResponse(shop) });
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
    res.status(200).json({ success: true, data: rows.map(shopService.toClientResponse) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// myAnalytics handles GET /api/v1/qr-reviews/shops/:id/analytics — same shape as
// the admin analytics row, scoped to a single shop the OWNER must own.
async function myAnalytics(req, res) {
  try {
    const shopId = req.params.id;
    const [shopRows] = await db.query("SELECT id, name, owner_user_id, review_views FROM shops WHERE id = ?", [
      shopId,
    ]);
    const shop = shopRows[0];
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }
    if (req.user.role === "OWNER" && shop.owner_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your shop" });
    }

    const [[scanRow]] = await db.query(
      "SELECT COALESCE(SUM(scan_count), 0) AS qr_scans FROM qr_codes WHERE shop_id = ?",
      [shopId]
    );
    const [[feedbackRow]] = await db.query(
      "SELECT COUNT(*) AS total_reviews, COALESCE(SUM(rating >= 4), 0) AS selected_reviews FROM feedback WHERE shop_id = ?",
      [shopId]
    );

    res.status(200).json({
      success: true,
      data: {
        shop_id: shop.id,
        shop_name: shop.name,
        qr_scans: Number(scanRow.qr_scans) || 0,
        review_page_views: shop.review_views || 0,
        total_reviews: Number(feedbackRow.total_reviews) || 0,
        selected_reviews: Number(feedbackRow.selected_reviews) || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// listClients handles GET /api/v1/qr-reviews/shops — admin/salesman "All Clients" list.
async function listClients(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { rows, total } = await shopService.listClients({ limit, skip });
    res.status(200).json({ success: true, data: rows, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// update handles PATCH /api/v1/qr-reviews/shops/:id — profile + subscription fields.
async function update(req, res) {
  try {
    const shop = await shopService.updateShop(req.params.id, req.body || {});
    res.status(200).json({ success: true, data: shop, message: "Client updated successfully" });
  } catch (err) {
    const status = err.message === "shop not found" ? 404 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
}

// analytics handles GET /api/v1/qr-reviews/shops/analytics — per-shop QR scans,
// review page views, total reviews submitted, and reviews with a 4-5 star rating.
async function analytics(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [rows] = await db.query(
      `SELECT
         s.id, s.name, s.review_views,
         COALESCE(qr.scan_count, 0) AS qr_scans,
         COALESCE(fb.total_reviews, 0) AS total_reviews,
         COALESCE(fb.selected_reviews, 0) AS selected_reviews
       FROM shops s
       LEFT JOIN (
         SELECT shop_id, SUM(scan_count) AS scan_count
         FROM qr_codes
         GROUP BY shop_id
       ) qr ON qr.shop_id = s.id
       LEFT JOIN (
         SELECT shop_id, COUNT(*) AS total_reviews, SUM(rating >= 4) AS selected_reviews
         FROM feedback
         GROUP BY shop_id
       ) fb ON fb.shop_id = s.id
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, skip]
    );
    const [countRows] = await db.query("SELECT COUNT(*) AS total FROM shops");

    const results = rows.map((r) => ({
      shop_id: r.id,
      shop_name: r.name,
      qr_scans: Number(r.qr_scans) || 0,
      review_page_views: r.review_views || 0,
      total_reviews: Number(r.total_reviews) || 0,
      selected_reviews: Number(r.selected_reviews) || 0,
    }));

    res.status(200).json({ success: true, data: results, meta: paginationMeta(page, limit, countRows[0].total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { create, getById, listMine, listClients, update, analytics, myAnalytics };
