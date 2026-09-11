const feedbackService = require("../services/feedbackService");

async function submit(req, res) {
  const { shop_id, rating } = req.body;
  if (!shop_id || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: "Invalid request: shop_id and rating (1-5) are required",
    });
  }

  try {
    const feedback = await feedbackService.submitFeedback(req.body);
    res.status(201).json({
      success: true,
      data: feedback,
      message: "Feedback submitted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { submit };
