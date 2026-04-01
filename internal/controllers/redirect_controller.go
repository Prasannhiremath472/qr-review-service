package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/repositories"
	"github.com/rs/zerolog/log"
)

// RedirectController handles the QR code scan redirect flow.
// When a QR code is scanned, it serves the review page instead of redirecting directly,
// so the customer can rate their experience first.
type RedirectController struct {
	qrRepo   repositories.QRCodeRepository
	shopRepo repositories.ShopRepository
}

// NewRedirectController creates a new redirect controller.
func NewRedirectController(qrRepo repositories.QRCodeRepository, shopRepo repositories.ShopRepository) *RedirectController {
	return &RedirectController{
		qrRepo:   qrRepo,
		shopRepo: shopRepo,
	}
}

// Redirect handles GET /r/:qr_id — the core QR scan endpoint.
// It increments the scan count, looks up the shop, and serves the review page.
func (ctrl *RedirectController) Redirect(c *gin.Context) {
	qrID := c.Param("qr_id")

	// Look up the QR code
	qrCode, err := ctrl.qrRepo.FindByID(qrID)
	if err != nil {
		c.HTML(http.StatusNotFound, "review.html", gin.H{
			"Error": "QR code not found. This link may be invalid or expired.",
		})
		return
	}

	// Check if QR code is active
	if !qrCode.IsActive {
		c.HTML(http.StatusGone, "review.html", gin.H{
			"Error": "This QR code has been deactivated.",
		})
		return
	}

	// Increment scan count asynchronously (fire-and-forget)
	go func() {
		if err := ctrl.qrRepo.IncrementScanCount(qrID); err != nil {
			log.Error().Err(err).Str("qr_id", qrID).Msg("failed to increment scan count")
		}
	}()

	// Look up the associated shop
	shop, err := ctrl.shopRepo.FindByID(qrCode.ShopID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "review.html", gin.H{
			"Error": "Shop not found. Please contact the business owner.",
		})
		return
	}

	// Serve the review page with shop data injected
	c.HTML(http.StatusOK, "review.html", gin.H{
		"ShopName":   shop.Name,
		"ShopID":     shop.ID.String(),
		"ReviewURL":  shop.ReviewURL,
		"QRCodeID":   qrCode.ID,
		"APIBaseURL": "", // Same origin, no prefix needed
	})
}
