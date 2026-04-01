package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/services"
)

// ShopController handles HTTP requests for shop operations.
type ShopController struct {
	service *services.ShopService
}

// NewShopController creates a new shop controller.
func NewShopController(service *services.ShopService) *ShopController {
	return &ShopController{service: service}
}

// Create handles POST /api/v1/qr-reviews/shops
func (ctrl *ShopController) Create(c *gin.Context) {
	var req dto.CreateShopRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	shop, err := ctrl.service.CreateShop(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    shop,
		"message": "Shop created successfully",
	})
}

// GetByID handles GET /api/v1/qr-reviews/shops/:id
func (ctrl *ShopController) GetByID(c *gin.Context) {
	id := c.Param("id")

	shop, err := ctrl.service.GetShopByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Shop not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    shop,
	})
}
