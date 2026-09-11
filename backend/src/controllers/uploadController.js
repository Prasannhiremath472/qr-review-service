const { Jimp } = require("jimp");

const MAX_WIDTH = 800;
const JPEG_QUALITY = 70;

// uploadPhoto handles POST /api/v1/qr-reviews/uploads/shop-photo — admin/salesman
// only. Compresses the uploaded image and returns it as a base64 data URI,
// which the frontend stores directly as the shop's photo_url on activation —
// avoids relying on server disk storage, which hosts like Hostinger wipe on
// every redeploy.
async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    const image = await Jimp.fromBuffer(req.file.buffer);
    if (image.bitmap.width > MAX_WIDTH) {
      image.resize({ w: MAX_WIDTH });
    }
    const dataUri = await image.getBase64("image/jpeg", { quality: JPEG_QUALITY });

    res.status(201).json({ success: true, data: { url: dataUri } });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to process image: " + err.message });
  }
}

module.exports = { uploadPhoto };
