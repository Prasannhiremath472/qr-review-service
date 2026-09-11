const express = require("express");
const cors = require("cors");

const config = require("./config/config");
const { requestLogger } = require("./middleware/logging");
const { setupRoutes } = require("./routes/routes");

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

app.listen(config.port, () => {
  console.log(`QR Review Service starting on port ${config.port}`);
});
