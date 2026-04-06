package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/repositories"
	"github.com/rs/zerolog/log"
)

// RedirectController handles the QR code scan redirect flow.
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
// If the QR is linked to a shop → shows the review page.
// If the QR is unlinked → shows the setup/activation page for the salesman.
func (ctrl *RedirectController) Redirect(c *gin.Context) {
	qrID := c.Param("qr_id")

	qrCode, err := ctrl.qrRepo.FindByID(qrID)
	if err != nil {
		c.HTML(http.StatusNotFound, "review.html", gin.H{
			"Error": "QR code not found. This link may be invalid or expired.",
		})
		return
	}

	if !qrCode.IsActive {
		c.HTML(http.StatusGone, "review.html", gin.H{
			"Error": "This QR code has been deactivated.",
		})
		return
	}

	// Increment scan count asynchronously
	go func() {
		if err := ctrl.qrRepo.IncrementScanCount(qrID); err != nil {
			log.Error().Err(err).Str("qr_id", qrID).Msg("failed to increment scan count")
		}
	}()

	// If QR code is not linked to a shop, show the setup page
	if !qrCode.IsLinked() {
		c.HTML(http.StatusOK, "setup.html", gin.H{
			"QRCodeID": qrCode.ID,
		})
		return
	}

	// Look up the associated shop
	shop, err := ctrl.shopRepo.FindByID(*qrCode.ShopID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "review.html", gin.H{
			"Error": "Shop not found. Please contact the business owner.",
		})
		return
	}

	businessType := shop.BusinessType
	if businessType == "" {
		businessType = "business"
	}

	c.HTML(http.StatusOK, "review.html", gin.H{
		"ShopName":     shop.Name,
		"ShopID":       shop.ID.String(),
		"BusinessType": businessType,
		"City":         shop.City,
		"ReviewURL":    shop.ReviewURL,
		"QRCodeID":     qrCode.ID,
		"APIBaseURL":   "",
	})
}
