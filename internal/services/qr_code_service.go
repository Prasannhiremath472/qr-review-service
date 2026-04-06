package services

import (
	"crypto/rand"
	"fmt"
	"math/big"

	"github.com/google/uuid"
	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/growthOS/qr-review-service/internal/models"
	"github.com/growthOS/qr-review-service/internal/repositories"
	"github.com/growthOS/qr-review-service/pkg/qrgen"
	"github.com/rs/zerolog/log"
)

// base62 characters used for short QR code IDs
const base62Chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

// QRCodeService handles business logic for QR codes.
type QRCodeService struct {
	qrRepo   repositories.QRCodeRepository
	shopRepo repositories.ShopRepository
	baseURL  string
}

// NewQRCodeService creates a new QR code service.
func NewQRCodeService(qrRepo repositories.QRCodeRepository, shopRepo repositories.ShopRepository, baseURL string) *QRCodeService {
	return &QRCodeService{
		qrRepo:   qrRepo,
		shopRepo: shopRepo,
		baseURL:  baseURL,
	}
}

// CreateQRCode creates a new QR code, optionally linked to a shop.
func (s *QRCodeService) CreateQRCode(req dto.CreateQRCodeRequest) (*dto.QRCodeResponse, error) {
	var shopID *uuid.UUID

	// If shop_id provided, validate the shop exists
	if req.ShopID != "" {
		sid, err := uuid.Parse(req.ShopID)
		if err != nil {
			return nil, fmt.Errorf("invalid shop_id: %w", err)
		}
		if _, err := s.shopRepo.FindByID(sid); err != nil {
			return nil, fmt.Errorf("shop not found: %w", err)
		}
		shopID = &sid
	}

	// Generate a unique short ID
	qrID, err := s.generateUniqueID()
	if err != nil {
		return nil, err
	}

	qrCode := &models.QRCode{
		ID:       qrID,
		ShopID:   shopID,
		Label:    req.Label,
		IsActive: true,
	}

	if err := s.qrRepo.Create(qrCode); err != nil {
		return nil, fmt.Errorf("failed to create QR code: %w", err)
	}

	// Generate the QR code image
	qrURL := fmt.Sprintf("%s/r/%s", s.baseURL, qrID)
	imageB64, err := qrgen.Generate(qrURL, 256)
	if err != nil {
		log.Warn().Err(err).Msg("failed to generate QR image")
	}

	shopIDStr := ""
	if shopID != nil {
		shopIDStr = shopID.String()
	}

	return &dto.QRCodeResponse{
		ID:          qrCode.ID,
		ShopID:      shopIDStr,
		Label:       qrCode.Label,
		ScanCount:   qrCode.ScanCount,
		IsActive:    qrCode.IsActive,
		IsLinked:    shopID != nil,
		QRCodeURL:   qrURL,
		ImageBase64: imageB64,
		CreatedAt:   qrCode.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

// BulkCreateQRCodes generates multiple unlinked QR codes for pre-printing.
func (s *QRCodeService) BulkCreateQRCodes(req dto.BulkCreateQRCodeRequest) ([]dto.QRCodeResponse, error) {
	var results []dto.QRCodeResponse

	for i := 0; i < req.Count; i++ {
		qrID, err := s.generateUniqueID()
		if err != nil {
			return nil, err
		}

		label := req.Label
		if label == "" {
			label = fmt.Sprintf("QR-%d", i+1)
		} else if req.Count > 1 {
			label = fmt.Sprintf("%s-%d", req.Label, i+1)
		}

		qrCode := &models.QRCode{
			ID:       qrID,
			ShopID:   nil, // Unlinked
			Label:    label,
			IsActive: true,
		}

		if err := s.qrRepo.Create(qrCode); err != nil {
			return nil, fmt.Errorf("failed to create QR code %d: %w", i+1, err)
		}

		qrURL := fmt.Sprintf("%s/r/%s", s.baseURL, qrID)
		imageB64, _ := qrgen.Generate(qrURL, 256)

		results = append(results, dto.QRCodeResponse{
			ID:          qrCode.ID,
			Label:       qrCode.Label,
			IsActive:    true,
			IsLinked:    false,
			QRCodeURL:   qrURL,
			ImageBase64: imageB64,
			CreatedAt:   qrCode.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	return results, nil
}

// ActivateQRCode links an unlinked QR code to a new business.
func (s *QRCodeService) ActivateQRCode(qrID string, req dto.ActivateQRCodeRequest) (*models.Shop, error) {
	qrCode, err := s.qrRepo.FindByID(qrID)
	if err != nil {
		return nil, fmt.Errorf("QR code not found: %w", err)
	}

	if qrCode.IsLinked() {
		return nil, fmt.Errorf("QR code is already linked to a business")
	}

	businessType := req.BusinessType
	if businessType == "" {
		businessType = "business"
	}

	// Create the shop
	shop := &models.Shop{
		ID:           uuid.New(),
		Name:         req.BusinessName,
		OwnerName:    req.OwnerName,
		BusinessType: businessType,
		City:         req.City,
		ReviewURL:    req.ReviewURL,
	}

	if err := s.shopRepo.Create(shop); err != nil {
		return nil, fmt.Errorf("failed to create shop: %w", err)
	}

	// Link QR code to the shop
	qrCode.ShopID = &shop.ID
	if err := s.qrRepo.Update(qrCode); err != nil {
		return nil, fmt.Errorf("failed to link QR code: %w", err)
	}

	return shop, nil
}

// GetQRCodeByID retrieves a QR code by its short ID.
func (s *QRCodeService) GetQRCodeByID(id string) (*dto.QRCodeResponse, error) {
	qrCode, err := s.qrRepo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("QR code not found: %w", err)
	}

	qrURL := fmt.Sprintf("%s/r/%s", s.baseURL, qrCode.ID)
	shopIDStr := ""
	if qrCode.ShopID != nil {
		shopIDStr = qrCode.ShopID.String()
	}

	return &dto.QRCodeResponse{
		ID:        qrCode.ID,
		ShopID:    shopIDStr,
		Label:     qrCode.Label,
		ScanCount: qrCode.ScanCount,
		IsActive:  qrCode.IsActive,
		IsLinked:  qrCode.IsLinked(),
		QRCodeURL: qrURL,
		CreatedAt: qrCode.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

// generateUniqueID creates a unique base62 ID with collision retry.
func (s *QRCodeService) generateUniqueID() (string, error) {
	for i := 0; i < 5; i++ {
		qrID, err := generateBase62ID(6)
		if err != nil {
			return "", fmt.Errorf("failed to generate QR ID: %w", err)
		}
		if _, findErr := s.qrRepo.FindByID(qrID); findErr != nil {
			return qrID, nil // ID is unique
		}
	}
	return "", fmt.Errorf("failed to generate unique QR ID after 5 attempts")
}

// generateBase62ID creates a cryptographically random base62 string of the given length.
func generateBase62ID(length int) (string, error) {
	result := make([]byte, length)
	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(base62Chars))))
		if err != nil {
			return "", err
		}
		result[i] = base62Chars[num.Int64()]
	}
	return string(result), nil
}
