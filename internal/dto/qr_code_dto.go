package dto

// CreateQRCodeRequest is the payload for creating a new QR code for a shop.
type CreateQRCodeRequest struct {
	ShopID string `json:"shop_id" binding:"required"`
	Label  string `json:"label"`
}

// QRCodeResponse is the API response for a QR code, including the generated image.
type QRCodeResponse struct {
	ID          string `json:"id"`
	ShopID      string `json:"shop_id"`
	Label       string `json:"label"`
	ScanCount   int    `json:"scan_count"`
	IsActive    bool   `json:"is_active"`
	QRCodeURL   string `json:"qr_code_url"`
	ImageBase64 string `json:"image_base64,omitempty"`
	CreatedAt   string `json:"created_at"`
}
