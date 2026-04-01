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

// CreateQRCode creates a new QR code for a shop and generates the QR image.
func (s *QRCodeService) CreateQRCode(req dto.CreateQRCodeRequest) (*dto.QRCodeResponse, error) {
	// Validate the shop exists
	shopID, err := uuid.Parse(req.ShopID)
	if err != nil {
		return nil, fmt.Errorf("invalid shop_id: %w", err)
	}
	if _, err := s.shopRepo.FindByID(shopID); err != nil {
		return nil, fmt.Errorf("shop not found: %w", err)
	}

	// Generate a unique short ID with retry on collision
	var qrID string
	for i := 0; i < 5; i++ {
		qrID, err = generateBase62ID(6)
		if err != nil {
			return nil, fmt.Errorf("failed to generate QR ID: %w", err)
		}
		// Check for collision
		if _, findErr := s.qrRepo.FindByID(qrID); findErr != nil {
			break // ID is unique
		}
		if i == 4 {
			return nil, fmt.Errorf("failed to generate unique QR ID after 5 attempts")
		}
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

	// Generate the QR code image as base64
	qrURL := fmt.Sprintf("%s/r/%s", s.baseURL, qrID)
	imageB64, err := qrgen.Generate(qrURL, 256)
	if err != nil {
		log.Warn().Err(err).Msg("failed to generate QR image, returning without image")
	}

	return &dto.QRCodeResponse{
		ID:          qrCode.ID,
		ShopID:      qrCode.ShopID.String(),
		Label:       qrCode.Label,
		ScanCount:   qrCode.ScanCount,
		IsActive:    qrCode.IsActive,
		QRCodeURL:   qrURL,
		ImageBase64: imageB64,
		CreatedAt:   qrCode.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

// GetQRCodeByID retrieves a QR code by its short ID.
func (s *QRCodeService) GetQRCodeByID(id string) (*dto.QRCodeResponse, error) {
	qrCode, err := s.qrRepo.FindByID(id)
	if err != nil {
		return nil, fmt.Errorf("QR code not found: %w", err)
	}

	qrURL := fmt.Sprintf("%s/r/%s", s.baseURL, qrCode.ID)
	return &dto.QRCodeResponse{
		ID:        qrCode.ID,
		ShopID:    qrCode.ShopID.String(),
		Label:     qrCode.Label,
		ScanCount: qrCode.ScanCount,
		IsActive:  qrCode.IsActive,
		QRCodeURL: qrURL,
		CreatedAt: qrCode.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
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
