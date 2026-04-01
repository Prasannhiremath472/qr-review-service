package dto

// CreateShopRequest is the payload for creating a new shop.
type CreateShopRequest struct {
	Name           string `json:"name" binding:"required"`
	OwnerName      string `json:"owner_name"`
	ReviewURL      string `json:"review_url" binding:"required,url"`
	OrganizationID string `json:"organization_id"`
}

// ShopResponse is the API response for a shop.
type ShopResponse struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	OwnerName      string `json:"owner_name"`
	ReviewURL      string `json:"review_url"`
	OrganizationID string `json:"organization_id,omitempty"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
}
