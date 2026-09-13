const crypto = require("crypto");
const db = require("../lib/db");

const PROFILE_FIELDS = [
  "owner_name",
  "business_type",
  "city",
  "review_url",
  "about_us",
  "open_hours",
  "whatsapp_number",
  "contact_phone",
  "contact_email",
  "address",
  "photo_url",
  "logo_url",
];

function parseGalleryPhotos(shop) {
  if (!shop.gallery_photos) return [];
  try {
    return JSON.parse(shop.gallery_photos);
  } catch (err) {
    return [];
  }
}

function toClientResponse(shop) {
  return {
    id: shop.id,
    name: shop.name,
    owner_name: shop.owner_name || "",
    business_type: shop.business_type || "business",
    city: shop.city || "",
    review_url: shop.review_url,
    about_us: shop.about_us || "",
    open_hours: shop.open_hours || "",
    whatsapp_number: shop.whatsapp_number || "",
    contact_phone: shop.contact_phone || "",
    contact_email: shop.contact_email || "",
    address: shop.address || "",
    photo_url: shop.photo_url || "",
    logo_url: shop.logo_url || "",
    gallery_photos: parseGalleryPhotos(shop),
    subscription_start_date: shop.subscription_start_date,
    subscription_end_date: shop.subscription_end_date,
    subscription_status: shop.subscription_status || "ACTIVE",
    created_at: shop.created_at,
  };
}

// createShop creates a new shop directly (admin "Add Client"), with the same
// profile fields collected during QR activation. Not linked to a QR code —
// one can be generated/linked separately afterward.
async function createShop(req) {
  const galleryPhotos =
    Array.isArray(req.gallery_photos) && req.gallery_photos.length > 0
      ? JSON.stringify(req.gallery_photos.slice(0, 5))
      : null;

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO shops
       (id, name, owner_name, business_type, city, review_url,
        photo_url, logo_url, gallery_photos, about_us, open_hours,
        whatsapp_number, contact_phone, contact_email, address,
        subscription_start_date, subscription_end_date, subscription_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.name,
      req.owner_name || "",
      req.business_type || "business",
      req.city || "",
      req.review_url,
      req.photo_url || null,
      req.logo_url || null,
      galleryPhotos,
      req.about_us || null,
      req.open_hours || "",
      req.whatsapp_number || "",
      req.contact_phone || "",
      req.contact_email || "",
      req.address || "",
      req.subscription_start_date || null,
      req.subscription_end_date || null,
      req.subscription_status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    ]
  );

  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  return toClientResponse(rows[0]);
}

// getShopById retrieves a shop by its UUID.
async function getShopById(id) {
  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new Error("shop not found");
  }
  return rows[0];
}

// listClients returns all shops (admin/salesman "All Clients" list), newest first.
async function listClients({ limit, skip }) {
  const [rows] = await db.query("SELECT * FROM shops ORDER BY created_at DESC LIMIT ? OFFSET ?", [
    limit,
    skip,
  ]);
  const [countRows] = await db.query("SELECT COUNT(*) AS total FROM shops");
  return { rows: rows.map(toClientResponse), total: countRows[0].total };
}

// updateShop patches profile/subscription fields on an existing shop.
async function updateShop(id, req) {
  const [existingRows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  if (existingRows.length === 0) {
    throw new Error("shop not found");
  }

  const sets = [];
  const values = [];

  if (req.name !== undefined) {
    sets.push("name = ?");
    values.push(req.name);
  }
  for (const field of PROFILE_FIELDS) {
    if (req[field] !== undefined) {
      sets.push(`${field} = ?`);
      values.push(req[field]);
    }
  }
  if (req.gallery_photos !== undefined) {
    sets.push("gallery_photos = ?");
    values.push(
      Array.isArray(req.gallery_photos) && req.gallery_photos.length > 0
        ? JSON.stringify(req.gallery_photos.slice(0, 5))
        : null
    );
  }
  if (req.subscription_start_date !== undefined) {
    sets.push("subscription_start_date = ?");
    values.push(req.subscription_start_date || null);
  }
  if (req.subscription_end_date !== undefined) {
    sets.push("subscription_end_date = ?");
    values.push(req.subscription_end_date || null);
  }
  if (req.subscription_status !== undefined) {
    sets.push("subscription_status = ?");
    values.push(req.subscription_status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE");
  }

  if (sets.length === 0) {
    return toClientResponse(existingRows[0]);
  }

  values.push(id);
  await db.query(`UPDATE shops SET ${sets.join(", ")} WHERE id = ?`, values);

  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  return toClientResponse(rows[0]);
}

module.exports = { createShop, getShopById, listClients, updateShop, toClientResponse };
