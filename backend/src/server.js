const express = require("express");
const cors = require("cors");

const config = require("./config/config");
const { requestLogger } = require("./middleware/logging");
const { setupRoutes } = require("./routes/routes");
const { runMigrations } = require("../scripts/migrate");
const { seedAdmin } = require("../scripts/seed-admin");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
// Raised from Express's 100KB default: activation payloads carry a base64-
// encoded shop photo (already compressed client-side to ~800px/JPEG q70,
// but that can still be tens of KB as base64 text plus the rest of the form).
app.use(express.json({ limit: "2mb" }));
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
