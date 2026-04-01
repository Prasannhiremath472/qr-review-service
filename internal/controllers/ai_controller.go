package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/services"
)

// AIController handles HTTP requests for AI review suggestion generation.
type AIController struct {
	service *services.AISuggestionService
}

// NewAIController creates a new AI controller.
func NewAIController(service *services.AISuggestionService) *AIController {
	return &AIController{service: service}
}

// GetSuggestions handles POST /api/v1/qr-reviews/ai/review-suggestions
func (ctrl *AIController) GetSuggestions(c *gin.Context) {
	var req dto.AISuggestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	// Only generate suggestions for positive ratings
	if req.Rating < 4 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Review suggestions are only available for ratings of 4 or higher",
		})
		return
	}

	suggestions, err := ctrl.service.GenerateSuggestions(req.BusinessType, req.City, req.Rating)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate suggestions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    suggestions,
	})
}
