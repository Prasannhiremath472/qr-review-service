const crypto = require("crypto");
const db = require("../lib/db");
const { generate: generateQrImage } = require("../lib/qrgen");
const { generateBase62Id } = require("../lib/shortId");
const config = require("../config/config");

function toQrCodeResponse(qrCode, extra = {}) {
  const qrUrl = `${config.frontendUrl}/r/${qrCode.id}`;
  return {
    id: qrCode.id,
    shop_id: qrCode.shop_id || "",
    label: qrCode.label,
    scan_count: qrCode.scan_count,
    is_active: !!qrCode.is_active,
    is_linked: !!qrCode.shop_id,
    qr_code_url: qrUrl,
    created_at: qrCode.created_at.toISOString(),
    ...extra,
  };
}

// generateUniqueId creates a unique base62 ID with collision retry.
async function generateUniqueId() {
  for (let i = 0; i < 5; i++) {
    const id = generateBase62Id(6);
    const [rows] = await db.query("SELECT id FROM qr_codes WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) return id;
  }
  throw new Error("failed to generate unique QR ID after 5 attempts");
}

// createQRCode creates a new QR code, optionally linked to a shop.
async function createQRCode(req) {
  let shopId = null;

  if (req.shop_id) {
    const [shopRows] = await db.query("SELECT id FROM shops WHERE id = ?", [req.shop_id]);
    if (shopRows.length === 0) {
      throw new Error("shop not found");
    }
    shopId = req.shop_id;
  }

  const id = await generateUniqueId();

  await db.query(
    "INSERT INTO qr_codes (id, shop_id, label, is_active) VALUES (?, ?, ?, ?)",
    [id, shopId, req.label || "", true]
  );

  const [rows] = await db.query("SELECT * FROM qr_codes WHERE id = ?", [id]);

  const qrUrl = `${config.frontendUrl}/r/${id}`;
  const imageBase64 = await generateQrImage(qrUrl, 256).catch(() => "");

  return toQrCodeResponse(rows[0], { image_base64: imageBase64 });
}

// bulkCreateQRCodes generates multiple unlinked QR codes for pre-printing.
async function bulkCreateQRCodes(req) {
  const results = [];

  for (let i = 0; i < req.count; i++) {
    const id = await generateUniqueId();

    let label = req.label || "";
    if (!label) {
      label = `QR-${i + 1}`;
    } else if (req.count > 1) {
      label = `${req.label}-${i + 1}`;
    }

    await db.query(
      "INSERT INTO qr_codes (id, shop_id, label, is_active) VALUES (?, ?, ?, ?)",
      [id, null, label, true]
    );

    const [rows] = await db.query("SELECT * FROM qr_codes WHERE id = ?", [id]);

    const qrUrl = `${config.frontendUrl}/r/${id}`;
    const imageBase64 = await generateQrImage(qrUrl, 256).catch(() => "");

    results.push(toQrCodeResponse(rows[0], { image_base64: imageBase64 }));
  }

  return results;
}

// activateQRCode links an unlinked QR code to a new business.
async function activateQRCode(qrId, req) {
  const [qrRows] = await db.query("SELECT * FROM qr_codes WHERE id = ?", [qrId]);
  const qrCode = qrRows[0];
  if (!qrCode) {
    throw new Error("QR code not found");
  }
  if (qrCode.shop_id) {
    throw new Error("QR code is already linked to a business");
  }

  const businessType = req.business_type || "business";

  let ownerUserId = null;
  if (req.owner_user_id) {
    const [ownerRows] = await db.query("SELECT id, role FROM users WHERE id = ?", [req.owner_user_id]);
    const owner = ownerRows[0];
    if (!owner || owner.role !== "OWNER") {
      throw new Error("owner_user_id must reference an existing OWNER user");
    }
    ownerUserId = owner.id;
  }

  const shopId = crypto.randomUUID();
  await db.query(
    `INSERT INTO shops
       (id, name, owner_name, business_type, city, review_url, owner_user_id,
        photo_url, about_us, open_hours, whatsapp_number, contact_phone, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      shopId,
      req.business_name,
      req.owner_name || "",
      businessType,
      req.city || "",
      req.review_url,
      ownerUserId,
      req.photo_url || null,
      req.about_us || null,
      req.open_hours || "",
      req.whatsapp_number || "",
      req.contact_phone || "",
      req.address || "",
    ]
  );

  await db.query("UPDATE qr_codes SET shop_id = ? WHERE id = ?", [shopId, qrId]);

  const [shopRows] = await db.query("SELECT * FROM shops WHERE id = ?", [shopId]);
  return shopRows[0];
}

// getQRCodeById retrieves a QR code by its short ID.
async function getQRCodeById(id) {
  const [rows] = await db.query("SELECT * FROM qr_codes WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new Error("QR code not found");
  }
  return toQrCodeResponse(rows[0]);
}

module.exports = {
  createQRCode,
  bulkCreateQRCodes,
  activateQRCode,
  getQRCodeById,
};
