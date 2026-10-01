const crypto = require("crypto");
const db = require("../lib/db");

const PROFILE_FIELDS = [
  "owner_name",
  "business_type",
  "tagline",
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
  "brand_color",
];

function parseGalleryPhotos(shop) {
  if (!shop.gallery_photos) return [];
  try {
    return JSON.parse(shop.gallery_photos);
  } catch (err) {
    return [];
  }
}

function parseServices(shop) {
  if (!shop.services) return [];
  try {
    return JSON.parse(shop.services);
  } catch (err) {
    return [];
  }
}

// serviceListToJson normalizes a services array into a JSON string for
// storage: trims each entry, drops empties, and de-dupes case-insensitively.
function serviceListToJson(services) {
  if (!Array.isArray(services) || services.length === 0) return null;
  const seen = new Set();
  const cleaned = [];
  for (const s of services) {
    const trimmed = String(s || "").trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
}

function parseBusinessHours(shop) {
  if (!shop.business_hours) return null;
  try {
    return JSON.parse(shop.business_hours);
  } catch (err) {
    return null;
  }
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

// businessHoursToJson normalizes the 7-day hours array into a JSON string
// for storage (Google Business Profile style: one open/close time per day,
// or Closed). Returns null if every day is unset/invalid, so the review
// page falls back to the free-text open_hours field instead of showing an
// empty structured list.
function businessHoursToJson(businessHours) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) return null;

  const byDay = new Map();
  for (const entry of businessHours) {
    const day = Number(entry?.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    byDay.set(day, entry);
  }

  const cleaned = [];
  for (let day = 0; day < 7; day++) {
    const entry = byDay.get(day);
    if (!entry) continue;

    if (entry.closed) {
      cleaned.push({ day, closed: true, open: null, close: null });
      continue;
    }

    const open = TIME_RE.test(entry.open) ? entry.open : null;
    const close = TIME_RE.test(entry.close) ? entry.close : null;
    if (!open || !close) continue; // incomplete day — omit rather than store a half-filled entry
    cleaned.push({ day, closed: false, open, close });
  }

  return cleaned.length > 0 ? JSON.stringify(cleaned) : null;
}

function toClientResponse(shop) {
  return {
    id: shop.id,
    name: shop.name,
    owner_name: shop.owner_name || "",
    business_type: shop.business_type || "business",
    tagline: shop.tagline || "",
    city: shop.city || "",
    review_url: shop.review_url,
    about_us: shop.about_us || "",
    open_hours: shop.open_hours || "",
    business_hours: parseBusinessHours(shop),
    whatsapp_number: shop.whatsapp_number || "",
    contact_phone: shop.contact_phone || "",
    contact_email: shop.contact_email || "",
    address: shop.address || "",
    photo_url: shop.photo_url || "",
    logo_url: shop.logo_url || "",
    gallery_photos: parseGalleryPhotos(shop),
    services: parseServices(shop),
    brand_color: shop.brand_color || "",
    plan_id: shop.plan_id || null,
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
  const services = serviceListToJson(req.services);
  const businessHours = businessHoursToJson(req.business_hours);

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO shops
       (id, name, owner_name, business_type, tagline, services, city, review_url,
        photo_url, logo_url, gallery_photos, about_us, open_hours, business_hours,
        whatsapp_number, contact_phone, contact_email, address,
        subscription_start_date, subscription_end_date, subscription_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.name,
      req.owner_name || "",
      req.business_type || "business",
      req.tagline || "",
      services,
      req.city || "",
      req.review_url,
      req.photo_url || null,
      req.logo_url || null,
      galleryPhotos,
      req.about_us || null,
      req.open_hours || "",
      businessHours,
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
  if (req.services !== undefined) {
    sets.push("services = ?");
    values.push(serviceListToJson(req.services));
  }
  if (req.business_hours !== undefined) {
    sets.push("business_hours = ?");
    values.push(businessHoursToJson(req.business_hours));
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
  if (req.plan_id !== undefined) {
    sets.push("plan_id = ?");
    values.push(req.plan_id || null);
  }

  if (sets.length === 0) {
    return toClientResponse(existingRows[0]);
  }

  values.push(id);
  await db.query(`UPDATE shops SET ${sets.join(", ")} WHERE id = ?`, values);

  const [rows] = await db.query("SELECT * FROM shops WHERE id = ?", [id]);
  return toClientResponse(rows[0]);
}

// deleteShop removes a shop (admin/salesman "delete client"). Its QR codes
// are unlinked rather than deleted (shops.id FK is ON DELETE SET NULL on
// qr_codes.shop_id — the physical standees stay reusable), and payment
// records cascade-delete automatically (payments.shop_id FK). Feedback
// history has no meaning without the shop, so it's deleted explicitly here
// first — its FK is ON DELETE RESTRICT, which would otherwise block this.
async function deleteShop(id) {
  const [existingRows] = await db.query("SELECT id FROM shops WHERE id = ?", [id]);
  if (existingRows.length === 0) {
    throw new Error("shop not found");
  }

  await db.query("DELETE FROM feedback WHERE shop_id = ?", [id]);
  await db.query("DELETE FROM shops WHERE id = ?", [id]);
}

module.exports = {
  createShop,
  getShopById,
  listClients,
  updateShop,
  deleteShop,
  toClientResponse,
  serviceListToJson,
  businessHoursToJson,
};
