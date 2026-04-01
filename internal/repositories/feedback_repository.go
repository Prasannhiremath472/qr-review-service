package repositories

import (
	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/models"
	"gorm.io/gorm"
)

// FeedbackRepository defines the data access interface for feedback.
type FeedbackRepository interface {
	Create(feedback *models.Feedback) error
	FindByShopID(shopID uuid.UUID, page, pageSize int) ([]models.Feedback, int64, error)
	FindByQRCodeID(qrCodeID string) ([]models.Feedback, error)
}

type feedbackRepository struct {
	db *gorm.DB
}

// NewFeedbackRepository creates a new feedback repository backed by GORM.
func NewFeedbackRepository(db *gorm.DB) FeedbackRepository {
	return &feedbackRepository{db: db}
}

func (r *feedbackRepository) Create(feedback *models.Feedback) error {
	return r.db.Create(feedback).Error
}

func (r *feedbackRepository) FindByShopID(shopID uuid.UUID, page, pageSize int) ([]models.Feedback, int64, error) {
	var feedbacks []models.Feedback
	var total int64

	query := r.db.Where("shop_id = ?", shopID)
	query.Model(&models.Feedback{}).Count(&total)

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		return nil, 0, err
	}
	return feedbacks, total, nil
}

func (r *feedbackRepository) FindByQRCodeID(qrCodeID string) ([]models.Feedback, error) {
	var feedbacks []models.Feedback
	if err := r.db.Where("qr_code_id = ?", qrCodeID).Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		return nil, err
	}
	return feedbacks, nil
}
