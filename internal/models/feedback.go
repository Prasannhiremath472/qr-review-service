package models

import (
	"time"

	"github.com/google/uuid"
)

// Feedback stores customer feedback collected through the QR review flow.
// Negative feedback (rating < 4) is stored internally instead of directing to Google.
type Feedback struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ShopID    uuid.UUID `gorm:"type:uuid;not null;index" json:"shop_id"`
	QRCodeID  *string   `gorm:"type:varchar(10);index" json:"qr_code_id,omitempty"`
	Rating    int       `gorm:"not null" json:"rating"`
	Message   string    `gorm:"type:text;default:''" json:"message"`
	CreatedAt time.Time `json:"created_at"`
}
