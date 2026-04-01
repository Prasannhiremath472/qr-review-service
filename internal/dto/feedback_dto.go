package dto

// SubmitFeedbackRequest is the payload for submitting customer feedback.
type SubmitFeedbackRequest struct {
	ShopID   string `json:"shop_id" binding:"required"`
	QRCodeID string `json:"qr_code_id"`
	Rating   int    `json:"rating" binding:"required,min=1,max=5"`
	Message  string `json:"message"`
}
