package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/services"
)

// FeedbackController handles HTTP requests for customer feedback.
type FeedbackController struct {
	service *services.FeedbackService
}

// NewFeedbackController creates a new feedback controller.
func NewFeedbackController(service *services.FeedbackService) *FeedbackController {
	return &FeedbackController{service: service}
}

// Submit handles POST /api/v1/qr-reviews/feedback
func (ctrl *FeedbackController) Submit(c *gin.Context) {
	var req dto.SubmitFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	feedback, err := ctrl.service.SubmitFeedback(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    feedback,
		"message": "Feedback submitted successfully",
	})
}
