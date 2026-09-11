const prisma = require("../lib/prisma");

// submitFeedback stores customer feedback. Typically called when rating < 4.
async function submitFeedback(req) {
  const feedback = await prisma.feedback.create({
    data: {
      shopId: req.shop_id,
      qrCodeId: req.qr_code_id || null,
      rating: req.rating,
      message: req.message || "",
    },
  });

  return feedback;
}

module.exports = { submitFeedback };
