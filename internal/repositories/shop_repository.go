package repositories

import (
	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/models"
	"gorm.io/gorm"
)

// ShopRepository defines the data access interface for shops.
type ShopRepository interface {
	Create(shop *models.Shop) error
	FindByID(id uuid.UUID) (*models.Shop, error)
	FindByOrganizationID(orgID uuid.UUID, page, pageSize int) ([]models.Shop, int64, error)
	Update(shop *models.Shop) error
	Delete(id uuid.UUID) error
}

type shopRepository struct {
	db *gorm.DB
}

// NewShopRepository creates a new shop repository backed by GORM.
func NewShopRepository(db *gorm.DB) ShopRepository {
	return &shopRepository{db: db}
}

func (r *shopRepository) Create(shop *models.Shop) error {
	return r.db.Create(shop).Error
}

func (r *shopRepository) FindByID(id uuid.UUID) (*models.Shop, error) {
	var shop models.Shop
	if err := r.db.Where("id = ?", id).First(&shop).Error; err != nil {
		return nil, err
	}
	return &shop, nil
}

func (r *shopRepository) FindByOrganizationID(orgID uuid.UUID, page, pageSize int) ([]models.Shop, int64, error) {
	var shops []models.Shop
	var total int64

	query := r.db.Where("organization_id = ?", orgID)
	query.Model(&models.Shop{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&shops).Error; err != nil {
		return nil, 0, err
	}
	return shops, total, nil
}

func (r *shopRepository) Update(shop *models.Shop) error {
	return r.db.Save(shop).Error
}

func (r *shopRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.Shop{}, "id = ?", id).Error
}
