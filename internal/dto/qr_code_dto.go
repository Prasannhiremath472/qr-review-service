package dto

// CreateQRCodeRequest is the payload for creating a new QR code for a shop.
type CreateQRCodeRequest struct {
	ShopID string `json:"shop_id"`
	Label  string `json:"label"`
}

// BulkCreateQRCodeRequest is the payload for pre-generating unlinked QR codes.
type BulkCreateQRCodeRequest struct {
	Count int    `json:"count" binding:"required,min=1,max=500"`
	Label string `json:"label"`
}

// ActivateQRCodeRequest is the payload for linking a QR code to a business.
type ActivateQRCodeRequest struct {
	BusinessName string `json:"business_name" binding:"required"`
	BusinessType string `json:"business_type"`
	City         string `json:"city"`
	ReviewURL    string `json:"review_url" binding:"required"`
	OwnerName    string `json:"owner_name"`
}

// QRCodeResponse is the API response for a QR code, including the generated image.
type QRCodeResponse struct {
	ID          string `json:"id"`
	ShopID      string `json:"shop_id,omitempty"`
	Label       string `json:"label"`
	ScanCount   int    `json:"scan_count"`
	IsActive    bool   `json:"is_active"`
	IsLinked    bool   `json:"is_linked"`
	QRCodeURL   string `json:"qr_code_url"`
	ImageBase64 string `json:"image_base64,omitempty"`
	CreatedAt   string `json:"created_at"`
}
