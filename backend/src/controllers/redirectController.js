const prisma = require("../lib/prisma");

// resolve handles GET /api/v1/qr-reviews/qr/:qr_id/resolve — the core QR scan
// endpoint consumed by the React frontend's /r/:qrId route.
// If the QR is linked to a shop -> returns shop info for the review page.
// If the QR is unlinked -> returns a flag so the frontend shows the setup/activation page.
async function resolve(req, res) {
  const qrId = req.params.qr_id;

  const qrCode = await prisma.qRCode.findUnique({ where: { id: qrId } });
  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: "QR code not found. This link may be invalid or expired.",
    });
  }

  if (!qrCode.isActive) {
    return res.status(410).json({
      success: false,
      message: "This QR code has been deactivated.",
    });
  }

  // Increment scan count asynchronously (fire-and-forget)
  prisma.qRCode
    .update({ where: { id: qrId }, data: { scanCount: { increment: 1 } } })
    .catch((err) => console.error("failed to increment scan count", qrId, err));

  if (!qrCode.shopId) {
    return res.status(200).json({
      success: true,
      data: { is_linked: false, qr_code_id: qrCode.id },
    });
  }

  const shop = await prisma.shop.findUnique({ where: { id: qrCode.shopId } });
  if (!shop) {
    return res.status(500).json({
      success: false,
      message: "Shop not found. Please contact the business owner.",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      is_linked: true,
      shop_name: shop.name,
      shop_id: shop.id,
      business_type: shop.businessType || "business",
      city: shop.city,
      review_url: shop.reviewUrl,
      qr_code_id: qrCode.id,
    },
  });
}

module.exports = { resolve };
