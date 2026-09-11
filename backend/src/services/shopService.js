const crypto = require("crypto");
const db = require("../lib/db");

// createShop creates a new shop from the request payload.
async function createShop(req) {
  const businessType = req.business_type || "business";
  const id = crypto.randomUUID();

  await db.query(
    `INSERT INTO shops (id, name, owner_name, business_type, city, review_url, organization_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, req.name, req.owner_name || "", businessType, req.city || "", req.review_url, req.organization_id || null]
  );

  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  return rows[0];
}

// getShopById retrieves a shop by its UUID.
async function getShopById(id) {
  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new Error("shop not found");
  }
  return rows[0];
}

module.exports = { createShop, getShopById };
