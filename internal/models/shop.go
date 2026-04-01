package models

import (
	"time"

	"github.com/google/uuid"
)

// Shop represents a business that uses QR codes to collect Google Reviews.
type Shop struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name           string     `gorm:"size:255;not null" json:"name"`
	OwnerName      string     `gorm:"size:255;default:''" json:"owner_name"`
	ReviewURL      string     `gorm:"type:text;not null" json:"review_url"`
	OrganizationID *uuid.UUID `gorm:"type:uuid;index" json:"organization_id,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}
