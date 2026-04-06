package models

import (
	"time"

	"github.com/google/uuid"
)

// QRCode represents a scannable QR code that can be linked to a shop.
// ShopID is nullable — unlinked QR codes are pre-printed and activated by salesmen.
type QRCode struct {
	ID        string     `gorm:"type:varchar(10);primary_key" json:"id"`
	ShopID    *uuid.UUID `gorm:"type:uuid;index" json:"shop_id"`
	Shop      *Shop      `gorm:"foreignKey:ShopID" json:"shop,omitempty"`
	Label     string     `gorm:"size:255;default:''" json:"label"`
	ScanCount int        `gorm:"default:0" json:"scan_count"`
	IsActive  bool       `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// IsLinked returns true if the QR code is connected to a shop.
func (q *QRCode) IsLinked() bool {
	return q.ShopID != nil
}
