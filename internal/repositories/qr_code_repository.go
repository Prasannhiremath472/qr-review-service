package repositories

import (
	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/models"
	"gorm.io/gorm"
)

// QRCodeRepository defines the data access interface for QR codes.
type QRCodeRepository interface {
	Create(qrCode *models.QRCode) error
	FindByID(id string) (*models.QRCode, error)
	FindByShopID(shopID uuid.UUID) ([]models.QRCode, error)
	IncrementScanCount(id string) error
	Update(qrCode *models.QRCode) error
	Delete(id string) error
}

type qrCodeRepository struct {
	db *gorm.DB
}

// NewQRCodeRepository creates a new QR code repository backed by GORM.
func NewQRCodeRepository(db *gorm.DB) QRCodeRepository {
	return &qrCodeRepository{db: db}
}

func (r *qrCodeRepository) Create(qrCode *models.QRCode) error {
	return r.db.Create(qrCode).Error
}

func (r *qrCodeRepository) FindByID(id string) (*models.QRCode, error) {
	var qrCode models.QRCode
	if err := r.db.Where("id = ?", id).First(&qrCode).Error; err != nil {
		return nil, err
	}
	return &qrCode, nil
}

func (r *qrCodeRepository) FindByShopID(shopID uuid.UUID) ([]models.QRCode, error) {
	var qrCodes []models.QRCode
	if err := r.db.Where("shop_id = ?", shopID).Order("created_at DESC").Find(&qrCodes).Error; err != nil {
		return nil, err
	}
	return qrCodes, nil
}

func (r *qrCodeRepository) FindUnlinked(limit int) ([]models.QRCode, error) {
	var qrCodes []models.QRCode
	if err := r.db.Where("shop_id IS NULL").Order("created_at DESC").Limit(limit).Find(&qrCodes).Error; err != nil {
		return nil, err
	}
	return qrCodes, nil
}

// IncrementScanCount atomically increments the scan_count for a QR code.
func (r *qrCodeRepository) IncrementScanCount(id string) error {
	return r.db.Model(&models.QRCode{}).Where("id = ?", id).
		UpdateColumn("scan_count", gorm.Expr("scan_count + 1")).Error
}

func (r *qrCodeRepository) Update(qrCode *models.QRCode) error {
	return r.db.Save(qrCode).Error
}

func (r *qrCodeRepository) Delete(id string) error {
	return r.db.Delete(&models.QRCode{}, "id = ?", id).Error
}
