const express = require("express");
const cors = require("cors");

const config = require("./config/config");
const { requestLogger } = require("./middleware/logging");
const { setupRoutes } = require("./routes/routes");

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
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
