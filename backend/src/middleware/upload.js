const multer = require("multer");

// Files are held in memory only (never written to disk) — the controller
// compresses them and stores the result as base64 directly in the database,
// so uploaded photos survive redeploys on hosts that wipe local disk state.
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
    }
    cb(null, true);
  },
});

module.exports = { upload };
