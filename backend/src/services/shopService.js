const prisma = require("../lib/prisma");

// createShop creates a new shop from the request payload.
async function createShop(req) {
  const businessType = req.business_type || "business";

  const shop = await prisma.shop.create({
    data: {
      name: req.name,
      ownerName: req.owner_name || "",
      businessType,
      city: req.city || "",
      reviewUrl: req.review_url,
      organizationId: req.organization_id || null,
    },
  });

  return shop;
}

// getShopById retrieves a shop by its UUID.
async function getShopById(id) {
  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) {
    throw new Error("shop not found");
  }
  return shop;
}

module.exports = { createShop, getShopById };
