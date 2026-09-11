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

app.listen(config.port, () => {
  console.log(`QR Review Service starting on port ${config.port}`);
});
