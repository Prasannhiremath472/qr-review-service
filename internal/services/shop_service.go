package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/models"
	"github.com/growthOS/qr-review-service/internal/repositories"
)

// ShopService handles business logic for shops.
type ShopService struct {
	repo repositories.ShopRepository
}

// NewShopService creates a new shop service.
func NewShopService(repo repositories.ShopRepository) *ShopService {
	return &ShopService{repo: repo}
}

// CreateShop creates a new shop from the request payload.
func (s *ShopService) CreateShop(req dto.CreateShopRequest) (*models.Shop, error) {
	businessType := req.BusinessType
	if businessType == "" {
		businessType = "business"
	}

	shop := &models.Shop{
		ID:           uuid.New(),
		Name:         req.Name,
		OwnerName:    req.OwnerName,
		BusinessType: businessType,
		City:         req.City,
		ReviewURL:    req.ReviewURL,
	}

	// Parse optional organization ID for multi-tenant support
	if req.OrganizationID != "" {
		orgID, err := uuid.Parse(req.OrganizationID)
		if err != nil {
			return nil, fmt.Errorf("invalid organization_id: %w", err)
		}
		shop.OrganizationID = &orgID
	}

	if err := s.repo.Create(shop); err != nil {
		return nil, fmt.Errorf("failed to create shop: %w", err)
	}
	return shop, nil
}

// GetShopByID retrieves a shop by its UUID.
func (s *ShopService) GetShopByID(id string) (*models.Shop, error) {
	uid, err := uuid.Parse(id)
	if err != nil {
		return nil, fmt.Errorf("invalid shop id: %w", err)
	}
	return s.repo.FindByID(uid)
}
