const prisma = require("../lib/prisma");
const { generate: generateQrImage } = require("../lib/qrgen");
const { generateBase62Id } = require("../lib/shortId");
const config = require("../config/config");

function toQrCodeResponse(qrCode, extra = {}) {
  const qrUrl = `${config.frontendUrl}/r/${qrCode.id}`;
  return {
    id: qrCode.id,
    shop_id: qrCode.shopId || "",
    label: qrCode.label,
    scan_count: qrCode.scanCount,
    is_active: qrCode.isActive,
    is_linked: !!qrCode.shopId,
    qr_code_url: qrUrl,
    created_at: qrCode.createdAt.toISOString(),
    ...extra,
  };
}

// generateUniqueId creates a unique base62 ID with collision retry.
async function generateUniqueId() {
  for (let i = 0; i < 5; i++) {
    const id = generateBase62Id(6);
    const existing = await prisma.qRCode.findUnique({ where: { id } });
    if (!existing) return id;
  }
  throw new Error("failed to generate unique QR ID after 5 attempts");
}

// createQRCode creates a new QR code, optionally linked to a shop.
async function createQRCode(req) {
  let shopId = null;

  if (req.shop_id) {
    const shop = await prisma.shop.findUnique({ where: { id: req.shop_id } });
    if (!shop) {
      throw new Error("shop not found");
    }
    shopId = req.shop_id;
  }

  const id = await generateUniqueId();

  const qrCode = await prisma.qRCode.create({
    data: {
      id,
      shopId,
      label: req.label || "",
      isActive: true,
    },
  });

  const qrUrl = `${config.frontendUrl}/r/${id}`;
  const imageBase64 = await generateQrImage(qrUrl, 256).catch(() => "");

  return toQrCodeResponse(qrCode, { image_base64: imageBase64 });
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

    const qrCode = await prisma.qRCode.create({
      data: {
        id,
        shopId: null,
        label,
        isActive: true,
      },
    });

    const qrUrl = `${config.frontendUrl}/r/${id}`;
    const imageBase64 = await generateQrImage(qrUrl, 256).catch(() => "");

    results.push(toQrCodeResponse(qrCode, { image_base64: imageBase64 }));
  }

  return results;
}

// activateQRCode links an unlinked QR code to a new business.
async function activateQRCode(qrId, req) {
  const qrCode = await prisma.qRCode.findUnique({ where: { id: qrId } });
  if (!qrCode) {
    throw new Error("QR code not found");
  }
  if (qrCode.shopId) {
    throw new Error("QR code is already linked to a business");
  }

  const businessType = req.business_type || "business";

  let ownerUserId = null;
  if (req.owner_user_id) {
    const owner = await prisma.user.findUnique({ where: { id: req.owner_user_id } });
    if (!owner || owner.role !== "OWNER") {
      throw new Error("owner_user_id must reference an existing OWNER user");
    }
    ownerUserId = owner.id;
  }

  const shop = await prisma.shop.create({
    data: {
      name: req.business_name,
      ownerName: req.owner_name || "",
      businessType,
      city: req.city || "",
      reviewUrl: req.review_url,
      ownerUserId,
    },
  });

  await prisma.qRCode.update({
    where: { id: qrId },
    data: { shopId: shop.id },
  });

  return shop;
}

// getQRCodeById retrieves a QR code by its short ID.
async function getQRCodeById(id) {
  const qrCode = await prisma.qRCode.findUnique({ where: { id } });
  if (!qrCode) {
    throw new Error("QR code not found");
  }
  return toQrCodeResponse(qrCode);
}

module.exports = {
  createQRCode,
  bulkCreateQRCodes,
  activateQRCode,
  getQRCodeById,
};
