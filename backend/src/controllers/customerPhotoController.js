const crypto = require("crypto");
const { Jimp } = require("jimp");
const db = require("../lib/db");
const { isSubscriptionActive } = require("../services/planGateService");

const MAX_WIDTH = 800;
const JPEG_QUALITY = 65;
// Per shop, only the newest photos are kept, so an abusive visitor can't
// grow the table without bound (each photo is roughly 50-200KB of base64).
const MAX_PHOTOS_PER_SHOP = 100;
const LIST_LIMIT = 24;

// Upload rate limit per QR code (not per IP: behind a proxy every visitor
// can share one IP). In-memory, resets on restart — a cheap flood guard.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_REQUESTS = 30;
const hits = new Map();

function allowUpload(key) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_REQUESTS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// Drop stale keys now and then so the map can't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of hits) {
    if (!times.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(key);
  }
}, RATE_WINDOW_MS).unref();

// upload handles POST /api/v1/qr-reviews/qr/:qr_id/customer-photos — public,
// called by the review page when the customer continues to Google with
// photos attached (multipart field "photos", up to 4 images). Only works for
// an active QR code linked to a shop whose subscription is active.
async function upload(req, res) {
  const qrId = req.params.qr_id;
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ success: false, message: "No photos uploaded" });
  }

  try {
    if (!allowUpload(qrId)) {
      return res.status(429).json({ success: false, message: "Too many uploads. Please try again later." });
    }

    const [qrRows] = await db.query("SELECT id, shop_id, is_active FROM qr_codes WHERE id = ?", [qrId]);
    const qr = qrRows[0];
    if (!qr || !qr.shop_id) {
      return res.status(404).json({ success: false, message: "QR code not found" });
    }
    if (!qr.is_active) {
      return res.status(410).json({ success: false, message: "This QR code has been deactivated." });
    }
    const [shopRows] = await db.query("SELECT * FROM shops WHERE id = ?", [qr.shop_id]);
    const shop = shopRows[0];
    if (!shop || !isSubscriptionActive(shop)) {
      return res.status(402).json({ success: false, message: "This business is not accepting photos right now." });
    }

    // Re-encode every file: this validates that it really is an image and
    // caps its size, whatever the client claimed.
    const saved = [];
    for (const file of files) {
      try {
        const image = await Jimp.fromBuffer(file.buffer);
        if (image.bitmap.width > MAX_WIDTH) image.resize({ w: MAX_WIDTH });
        saved.push(await image.getBase64("image/jpeg", { quality: JPEG_QUALITY }));
      } catch (err) {
        // skip files that aren't decodable images
      }
    }
    if (saved.length === 0) {
      return res.status(400).json({ success: false, message: "None of the files could be read as images" });
    }

    for (const photo of saved) {
      await db.query("INSERT INTO customer_photos (id, shop_id, qr_code_id, photo) VALUES (?, ?, ?, ?)", [
        crypto.randomUUID(),
        shop.id,
        qr.id,
        photo,
      ]);
    }

    await db.query(
      `DELETE FROM customer_photos WHERE shop_id = ? AND id NOT IN (
         SELECT id FROM (
           SELECT id FROM customer_photos WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT ?
         ) keep
       )`,
      [shop.id, shop.id, MAX_PHOTOS_PER_SHOP]
    );

    res.status(201).json({ success: true, data: { saved: saved.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save photos" });
  }
}

async function assertShopAccess(req, shopId) {
  const [rows] = await db.query("SELECT id, owner_user_id FROM shops WHERE id = ?", [shopId]);
  const shop = rows[0];
  if (!shop) {
    const err = new Error("Shop not found");
    err.status = 404;
    throw err;
  }
  if (req.user.role === "OWNER" && shop.owner_user_id !== req.user.id) {
    const err = new Error("Forbidden: not your shop");
    err.status = 403;
    throw err;
  }
}

// list handles GET /api/v1/qr-reviews/shops/:shop_id/customer-photos — the
// newest customer-submitted photos, for the owner/admin dashboard.
async function list(req, res) {
  try {
    await assertShopAccess(req, req.params.shop_id);
    const [rows] = await db.query(
      "SELECT id, photo, created_at FROM customer_photos WHERE shop_id = ? ORDER BY created_at DESC, id DESC LIMIT ?",
      [req.params.shop_id, LIST_LIMIT]
    );
    res.status(200).json({
      success: true,
      data: rows.map((r) => ({ id: r.id, url: r.photo, created_at: r.created_at })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

// remove handles DELETE /api/v1/qr-reviews/shops/:shop_id/customer-photos/:photo_id.
async function remove(req, res) {
  try {
    await assertShopAccess(req, req.params.shop_id);
    const [result] = await db.query("DELETE FROM customer_photos WHERE id = ? AND shop_id = ?", [
      req.params.photo_id,
      req.params.shop_id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
}

module.exports = { upload, list, remove };
