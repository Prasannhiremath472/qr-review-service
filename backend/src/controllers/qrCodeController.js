const qrCodeService = require("../services/qrCodeService");
const prisma = require("../lib/prisma");
const { generateBytes } = require("../lib/qrgen");
const config = require("../config/config");
const { parsePagination, paginationMeta } = require("../lib/pagination");

async function create(req, res) {
  try {
    const qrResp = await qrCodeService.createQRCode(req.body || {});
    res.status(201).json({
      success: true,
      data: qrResp,
      message: "QR code created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function bulkCreate(req, res) {
  const { count } = req.body || {};
  if (!count || count < 1 || count > 500) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: count must be between 1 and 500",
    });
  }

  try {
    const results = await qrCodeService.bulkCreateQRCodes(req.body);
    res.status(201).json({
      success: true,
      data: results,
      message: `${results.length} QR codes created successfully`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function activate(req, res) {
  const qrId = req.params.id;
  const { business_name, review_url } = req.body || {};
  if (!business_name || !review_url) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: business_name and review_url are required",
    });
  }

  try {
    const shop = await qrCodeService.activateQRCode(qrId, req.body);
    res.status(200).json({
      success: true,
      message: "QR code activated successfully",
      data: {
        qr_id: qrId,
        shop_id: shop.id,
        shop_name: shop.name,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getById(req, res) {
  try {
    const qrResp = await qrCodeService.getQRCodeById(req.params.id);
    res.status(200).json({ success: true, data: qrResp });
  } catch (err) {
    res.status(404).json({ success: false, message: "QR code not found" });
  }
}

async function image(req, res) {
  const id = req.params.id;
  try {
    const qrCode = await prisma.qRCode.findUnique({ where: { id } });
    if (!qrCode) {
      return res.status(404).send("QR code not found");
    }

    const qrUrl = `${config.frontendUrl}/r/${qrCode.id}`;
    const png = await generateBytes(qrUrl, 512);
    res.set("Content-Type", "image/png");
    res.status(200).send(png);
  } catch (err) {
    res.status(500).send("Failed to generate QR image");
  }
}

// dashboard returns JSON data for all QR codes belonging to a shop (consumed by the React frontend).
async function dashboard(req, res) {
  const shopId = req.params.shop_id;

  try {
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    if (req.user.role === "OWNER" && shop.ownerUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden: not your shop" });
    }

    const { page, limit, skip } = parsePagination(req.query);

    const [qrCodes, total] = await Promise.all([
      prisma.qRCode.findMany({
        where: { shopId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.qRCode.count({ where: { shopId } }),
    ]);

    const codes = qrCodes.map((qr) => ({
      id: qr.id,
      label: qr.label,
      scan_count: qr.scanCount,
      image_url: `${config.baseUrl}/qr-image/${qr.id}`,
      scan_url: `${config.frontendUrl}/r/${qr.id}`,
    }));

    res.status(200).json({
      success: true,
      data: {
        shop_name: shop.name,
        shop_id: shop.id,
        qr_codes: codes,
      },
      meta: paginationMeta(page, limit, total),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load QR codes" });
  }
}

// listAll returns every QR code with its linked shop (if any) — admin/salesman only.
async function listAll(req, res) {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [qrCodes, total] = await Promise.all([
      prisma.qRCode.findMany({
        orderBy: { createdAt: "desc" },
        include: { shop: { select: { id: true, name: true } } },
        skip,
        take: limit,
      }),
      prisma.qRCode.count(),
    ]);

    const results = qrCodes.map((qr) => ({
      id: qr.id,
      label: qr.label,
      scan_count: qr.scanCount,
      is_active: qr.isActive,
      is_linked: !!qr.shopId,
      shop_id: qr.shopId || "",
      shop_name: qr.shop?.name || "",
      scan_url: `${config.frontendUrl}/r/${qr.id}`,
      created_at: qr.createdAt.toISOString(),
    }));

    res.status(200).json({ success: true, data: results, meta: paginationMeta(page, limit, total) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { create, bulkCreate, activate, getById, image, dashboard, listAll };
