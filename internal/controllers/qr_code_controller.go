package controllers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/repositories"
	"github.com/growthOS/qr-review-service/internal/services"
	"github.com/growthOS/qr-review-service/pkg/qrgen"
)

// QRCodeController handles HTTP requests for QR code operations.
type QRCodeController struct {
	service  *services.QRCodeService
	qrRepo   repositories.QRCodeRepository
	shopRepo repositories.ShopRepository
	baseURL  string
}

// NewQRCodeController creates a new QR code controller.
func NewQRCodeController(service *services.QRCodeService, qrRepo repositories.QRCodeRepository, shopRepo repositories.ShopRepository, baseURL string) *QRCodeController {
	return &QRCodeController{service: service, qrRepo: qrRepo, shopRepo: shopRepo, baseURL: baseURL}
}

// Create handles POST /api/v1/qr-reviews/qr
func (ctrl *QRCodeController) Create(c *gin.Context) {
	var req dto.CreateQRCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	qrResp, err := ctrl.service.CreateQRCode(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    qrResp,
		"message": "QR code created successfully",
	})
}

// BulkCreate handles POST /api/v1/qr-reviews/qr/bulk — pre-generates unlinked QR codes.
func (ctrl *QRCodeController) BulkCreate(c *gin.Context) {
	var req dto.BulkCreateQRCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	results, err := ctrl.service.BulkCreateQRCodes(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    results,
		"message": fmt.Sprintf("%d QR codes created successfully", len(results)),
	})
}

// Activate handles POST /api/v1/qr-reviews/qr/:id/activate — links a QR code to a business.
func (ctrl *QRCodeController) Activate(c *gin.Context) {
	qrID := c.Param("id")

	var req dto.ActivateQRCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	shop, err := ctrl.service.ActivateQRCode(qrID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "QR code activated successfully",
		"data": gin.H{
			"qr_id":   qrID,
			"shop_id":  shop.ID.String(),
			"shop_name": shop.Name,
		},
	})
}

// GetByID handles GET /api/v1/qr-reviews/qr/:id
func (ctrl *QRCodeController) GetByID(c *gin.Context) {
	id := c.Param("id")

	qrResp, err := ctrl.service.GetQRCodeByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "QR code not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    qrResp,
	})
}

// Image handles GET /qr-image/:id — serves the QR code as a PNG image.
func (ctrl *QRCodeController) Image(c *gin.Context) {
	id := c.Param("id")
	qrCode, err := ctrl.qrRepo.FindByID(id)
	if err != nil || qrCode == nil {
		c.String(http.StatusNotFound, "QR code not found")
		return
	}

	qrURL := fmt.Sprintf("%s/r/%s", ctrl.baseURL, qrCode.ID)
	png, err := qrgen.GenerateBytes(qrURL, 512)
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to generate QR image")
		return
	}

	c.Data(http.StatusOK, "image/png", png)
}

// Dashboard handles GET /dashboard/:shop_id — shows all QR codes for a shop.
func (ctrl *QRCodeController) Dashboard(c *gin.Context) {
	shopIDStr := c.Param("shop_id")
	shopID, err := uuid.Parse(shopIDStr)
	if err != nil {
		c.HTML(http.StatusBadRequest, "dashboard.html", gin.H{"Error": "Invalid shop ID"})
		return
	}

	shop, err := ctrl.shopRepo.FindByID(shopID)
	if err != nil {
		c.HTML(http.StatusNotFound, "dashboard.html", gin.H{"Error": "Shop not found"})
		return
	}

	qrCodes, err := ctrl.qrRepo.FindByShopID(shopID)
	if err != nil {
		c.HTML(http.StatusInternalServerError, "dashboard.html", gin.H{"Error": "Failed to load QR codes"})
		return
	}

	type qrData struct {
		ID        string
		Label     string
		ScanCount int
		ImageURL  string
		ScanURL   string
	}
	var codes []qrData
	for _, qr := range qrCodes {
		codes = append(codes, qrData{
			ID:        qr.ID,
			Label:     qr.Label,
			ScanCount: qr.ScanCount,
			ImageURL:  fmt.Sprintf("/qr-image/%s", qr.ID),
			ScanURL:   fmt.Sprintf("%s/r/%s", ctrl.baseURL, qr.ID),
		})
	}

	c.HTML(http.StatusOK, "dashboard.html", gin.H{
		"ShopName": shop.Name,
		"ShopID":   shop.ID.String(),
		"QRCodes":  codes,
	})
}
