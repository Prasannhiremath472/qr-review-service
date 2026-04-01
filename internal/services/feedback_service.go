package services

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/models"
	"github.com/growthOS/qr-review-service/internal/repositories"
)

// FeedbackService handles business logic for customer feedback.
type FeedbackService struct {
	repo repositories.FeedbackRepository
}

// NewFeedbackService creates a new feedback service.
func NewFeedbackService(repo repositories.FeedbackRepository) *FeedbackService {
	return &FeedbackService{repo: repo}
}

// SubmitFeedback stores customer feedback. Typically called when rating < 4.
func (s *FeedbackService) SubmitFeedback(req dto.SubmitFeedbackRequest) (*models.Feedback, error) {
	shopID, err := uuid.Parse(req.ShopID)
	if err != nil {
		return nil, fmt.Errorf("invalid shop_id: %w", err)
	}

	feedback := &models.Feedback{
		ID:      uuid.New(),
		ShopID:  shopID,
		Rating:  req.Rating,
		Message: req.Message,
	}

	// Optionally link to the QR code that initiated the flow
	if req.QRCodeID != "" {
		feedback.QRCodeID = &req.QRCodeID
	}

	if err := s.repo.Create(feedback); err != nil {
		return nil, fmt.Errorf("failed to submit feedback: %w", err)
	}
	return feedback, nil
}
