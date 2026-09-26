const aiSuggestionService = require("../services/aiSuggestionService");

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
    const suggestions = await aiSuggestionService.generateSuggestions(
      req.body.business_name,
      business_type,
      city,
      rating,
      req.body.service_taken,
      req.body.language
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
