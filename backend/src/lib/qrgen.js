const QRCode = require("qrcode");

// Generate creates a QR code PNG for the given URL and returns base64-encoded image data.
async function generate(url, size = 256) {
  const buffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    width: size,
    type: "png",
  });
  return buffer.toString("base64");
}

// generateBytes creates a QR code PNG and returns raw bytes (Buffer).
async function generateBytes(url, size = 512) {
  return QRCode.toBuffer(url, {
    errorCorrectionLevel: "M",
    width: size,
    type: "png",
  });
}

module.exports = { generate, generateBytes };
