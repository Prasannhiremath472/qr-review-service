const express = require("express");
const cors = require("cors");

const config = require("./config/config");
const { requestLogger } = require("./middleware/logging");
const { setupRoutes } = require("./routes/routes");
const { runMigrations } = require("../scripts/migrate");
const { seedAdmin } = require("../scripts/seed-admin");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
// Raised from Express's 100KB default: an activation/edit payload can carry
// up to 7 base64-encoded images in one request — photo, logo, and up to 5
// gallery photos (each pre-compressed client-side to ~800px/JPEG q70 via
// /uploads/shop-photo, but that's still commonly 200-350KB as base64 text
// per image). 2mb was cutting this close and 413'd on realistic uploads
// (verified: photo+logo+5 gallery photos from real phone camera photos
// regularly totals 2.2-2.5MB) — 10mb gives real headroom above that.
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

setupRoutes(app);

// Multer (file upload) errors land here instead of crashing with a raw stack trace.
app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
});

// Run schema migrations (and seed the admin, if configured) before accepting
// traffic. Done here rather than relying solely on npm's prestart hook,
// since some hosts launch the entry file directly and skip that hook.
async function start() {
  await runMigrations();
  await seedAdmin();

  app.listen(config.port, () => {
    console.log(`QR Review Service starting on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
