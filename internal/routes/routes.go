package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/controllers"
)

// SetupRoutes configures all HTTP routes for the QR Review service.
func SetupRoutes(
	router *gin.Engine,
	shopCtrl *controllers.ShopController,
	qrCtrl *controllers.QRCodeController,
	feedbackCtrl *controllers.FeedbackController,
	redirectCtrl *controllers.RedirectController,
	aiCtrl *controllers.AIController,
) {
	// API routes under /api/v1/qr-reviews
	api := router.Group("/api/v1/qr-reviews")
	{
		// Shop endpoints
		api.POST("/shops", shopCtrl.Create)
		api.GET("/shops/:id", shopCtrl.GetByID)

		// QR code endpoints
		api.POST("/qr", qrCtrl.Create)
		api.GET("/qr/:id", qrCtrl.GetByID)

		// Feedback endpoint
		api.POST("/feedback", feedbackCtrl.Submit)

		// AI review suggestions endpoint
		api.POST("/ai/review-suggestions", aiCtrl.GetSuggestions)
	}

	// Public redirect endpoint — served when a QR code is scanned
	router.GET("/r/:qr_id", redirectCtrl.Redirect)

	// QR code image endpoint — serves QR as PNG
	router.GET("/qr-image/:id", qrCtrl.Image)

	// Shop dashboard — view and print all QR codes for a shop
	router.GET("/dashboard/:shop_id", qrCtrl.Dashboard)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "QR Review Service is healthy",
		})
	})
}
