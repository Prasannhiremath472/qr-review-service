const { Jimp } = require("jimp");

const PHOTO_MAX_WIDTH = 800;
const LOGO_MAX_WIDTH = 300;
const JPEG_QUALITY = 70;

// uploadPhoto handles POST /api/v1/qr-reviews/uploads/shop-photo — admin/salesman
// only. Compresses the uploaded image and returns it as a base64 data URI,
// which the frontend stores directly on the shop (photo_url / logo_url /
// one entry of gallery_photos) on activation — avoids relying on server
// disk storage, which hosts like Hostinger wipe on every redeploy.
// Pass ?type=logo for a smaller compression target suited to an icon.
async function uploadPhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  const maxWidth = req.query.type === "logo" ? LOGO_MAX_WIDTH : PHOTO_MAX_WIDTH;

  try {
    const image = await Jimp.fromBuffer(req.file.buffer);
    if (image.bitmap.width > maxWidth) {
      image.resize({ w: maxWidth });
    }
    const dataUri = await image.getBase64("image/jpeg", { quality: JPEG_QUALITY });

    res.status(201).json({ success: true, data: { url: dataUri } });
  } catch (err) {
    res.status(400).json({ success: false, message: "Failed to process image: " + err.message });
  }
}

module.exports = { uploadPhoto };
