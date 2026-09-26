const QRCode = require("qrcode");

// Margin is in QR "modules" (the library defaults to 4, which reads as a
// thick white border around the code) — 2 is the smallest that still scans
// reliably across phone cameras while keeping the border thin.
const QUIET_ZONE_MARGIN = 2;

// Generate creates a QR code PNG for the given URL and returns base64-encoded image data.
async function generate(url, size = 256) {
  const buffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    width: size,
    margin: QUIET_ZONE_MARGIN,
    type: "png",
  });
  return buffer.toString("base64");
}

// generateBytes creates a QR code PNG and returns raw bytes (Buffer).
async function generateBytes(url, size = 512) {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    width: size,
    margin: QUIET_ZONE_MARGIN,
    type: "png",
  });
}

module.exports = { generate, generateBytes };
