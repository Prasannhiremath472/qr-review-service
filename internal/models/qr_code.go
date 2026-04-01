package models

import (
	"time"

	"github.com/google/uuid"
)

// QRCode represents a scannable QR code linked to a shop.
// The ID is a short alphanumeric string (e.g., "abc123") for URL-friendly scanning.
type QRCode struct {
	ID        string    `gorm:"type:varchar(10);primary_key" json:"id"`
	ShopID    uuid.UUID `gorm:"type:uuid;not null;index" json:"shop_id"`
	Shop      Shop      `gorm:"foreignKey:ShopID" json:"shop,omitempty"`
	Label     string    `gorm:"size:255;default:''" json:"label"`
	ScanCount int       `gorm:"default:0" json:"scan_count"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
