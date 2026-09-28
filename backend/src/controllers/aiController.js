const aiSuggestionService = require("../services/aiSuggestionService");
const { getShopPlan } = require("../services/planGateService");

async function getSuggestions(req, res) {
  const { business_type, city, rating } = req.body;
  if (!business_type || !city || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid request: business_type, city, and rating (1-5) are required",
    });
  }

  if (rating < 4) {
    return res.status(400).json({
      success: false,
      message: "Review suggestions are only available for ratings of 4 or higher",
    });
  }

  try {
    // better_review_quality (Pro plans) asks the model for a more detailed,
    // higher-effort suggestion; Startup plans keep the existing behavior.
    let betterQuality = false;
    if (req.body.shop_id) {
      const plan = await getShopPlan(req.body.shop_id);
      betterQuality = !!plan.better_review_quality;
    }

    const suggestions = await aiSuggestionService.generateSuggestions(
      req.body.business_name,
      business_type,
      city,
      rating,
      req.body.service_taken,
      req.body.language,
      betterQuality
    );
    res.status(200).json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to generate suggestions: " + err.message,
    });
  }
}

module.exports = { getSuggestions };
