const db = require("../lib/db");

// resolve handles GET /api/v1/qr-reviews/qr/:qr_id/resolve — the core QR scan
// endpoint consumed by the React frontend's /r/:qrId route.
// If the QR is linked to a shop -> returns shop info for the review page.
// If the QR is unlinked -> returns a flag so the frontend shows the setup/activation page.
async function resolve(req, res) {
  const qrId = req.params.qr_id;

  const [qrRows] = await db.query("SELECT * FROM qr_codes WHERE id = ?", [qrId]);
  const qrCode = qrRows[0];
  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: "QR code not found. This link may be invalid or expired.",
    });
  }

  if (!qrCode.is_active) {
    return res.status(410).json({
      success: false,
      message: "This QR code has been deactivated.",
    });
  }

  // Increment scan count asynchronously (fire-and-forget)
  db.query("UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?", [qrId]).catch((err) =>
    console.error("failed to increment scan count", qrId, err)
  );

  if (!qrCode.shop_id) {
    return res.status(200).json({
      success: true,
      data: { is_linked: false, qr_code_id: qrCode.id },
    });
  }

  const [shopRows] = await db.query("SELECT * FROM shops WHERE id = ?", [qrCode.shop_id]);
  const shop = shopRows[0];
  if (!shop) {
    return res.status(500).json({
      success: false,
      message: "Shop not found. Please contact the business owner.",
    });
  }

  let galleryPhotos = [];
  if (shop.gallery_photos) {
    try {
      galleryPhotos = JSON.parse(shop.gallery_photos);
    } catch (err) {
      galleryPhotos = [];
    }
  }

  res.status(200).json({
    success: true,
    data: {
      is_linked: true,
      shop_name: shop.name,
      shop_id: shop.id,
      business_type: shop.business_type || "business",
      city: shop.city,
      review_url: shop.review_url,
      qr_code_id: qrCode.id,
      photo_url: shop.photo_url || "",
      logo_url: shop.logo_url || "",
      gallery_photos: galleryPhotos,
      about_us: shop.about_us || "",
      open_hours: shop.open_hours || "",
      whatsapp_number: shop.whatsapp_number || "",
      contact_phone: shop.contact_phone || "",
      contact_email: shop.contact_email || "",
      address: shop.address || "",
      owner_name: shop.owner_name || "",
    },
  });
}

module.exports = { resolve };
