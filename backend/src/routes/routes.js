const express = require("express");

const shopController = require("../controllers/shopController");
const qrCodeController = require("../controllers/qrCodeController");
const feedbackController = require("../controllers/feedbackController");
const redirectController = require("../controllers/redirectController");
const aiController = require("../controllers/aiController");
const authController = require("../controllers/authController");
const uploadController = require("../controllers/uploadController");
const { requireAuth, requireRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

function setupRoutes(app) {
  const api = express.Router();

  // Auth endpoints
  api.post("/auth/login", authController.login);
  api.get("/auth/me", requireAuth, authController.me);
  api.post("/auth/users", requireAuth, requireRole("ADMIN"), authController.createUser);
  api.get("/auth/users", requireAuth, requireRole("ADMIN", "SALESMAN"), authController.listUsers);

  // Shop endpoints (admin management)
  api.post("/shops", requireAuth, requireRole("ADMIN"), shopController.create);
  api.get("/shops/mine", requireAuth, requireRole("OWNER"), shopController.listMine);
  api.get("/shops/:id", requireAuth, requireRole("ADMIN", "SALESMAN"), shopController.getById);

  // QR code endpoints
  api.post("/qr", requireAuth, requireRole("ADMIN", "SALESMAN"), qrCodeController.create);
  api.post("/qr/bulk", requireAuth, requireRole("ADMIN", "SALESMAN"), qrCodeController.bulkCreate);
  api.post("/qr/:id/activate", requireAuth, requireRole("ADMIN", "SALESMAN"), qrCodeController.activate);
  api.get("/qr/:id", requireAuth, requireRole("ADMIN", "SALESMAN"), qrCodeController.getById);
  api.get("/qr", requireAuth, requireRole("ADMIN", "SALESMAN"), qrCodeController.listAll);

  // Public — customer scans a QR code
  api.get("/qr/:qr_id/resolve", redirectController.resolve);

  // Public — customer submits feedback / requests an AI review suggestion
  api.post("/feedback", feedbackController.submit);
  api.post("/ai/review-suggestions", aiController.getSuggestions);

  // Dashboard data endpoint — admin/salesman can view any shop; owner only their own
  api.get("/dashboard/:shop_id", requireAuth, qrCodeController.dashboard);

  // Business photo upload (admin/salesman) — used during QR activation
  api.post(
    "/uploads/shop-photo",
    requireAuth,
    requireRole("ADMIN", "SALESMAN"),
    upload.single("photo"),
    uploadController.uploadPhoto
  );

  app.use("/api/v1/qr-reviews", api);

  // QR code image endpoint - serves QR as PNG (public, embedded in review/dashboard pages)
  app.get("/qr-image/:id", qrCodeController.image);

  // Health check
  app.get("/health", (req, res) => {
    res.status(200).json({ success: true, message: "QR Review Service is healthy" });
  });
}

module.exports = { setupRoutes };
