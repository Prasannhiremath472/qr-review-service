package dto

// AISuggestionRequest is the input for generating a review.
type AISuggestionRequest struct {
	BusinessType string `json:"business_type" binding:"required"`
	City         string `json:"city" binding:"required"`
	Rating       int    `json:"rating" binding:"required,min=1,max=5"`
}

// AISuggestionResponse contains a single ready-to-paste Google Review.
type AISuggestionResponse struct {
	Review string `json:"review"` // One complete, copy-paste ready review
}
