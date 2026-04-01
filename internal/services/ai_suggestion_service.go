package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/growthOS/qr-review-service/internal/dto"
	"github.com/rs/zerolog/log"
)

// AISuggestionService generates review suggestions using the Google Gemini API.
type AISuggestionService struct {
	apiKey          string
	model           string
	client          *http.Client
	variationEngine *VariationEngine
}

// Gemini API request/response types (matching ai-marketing-engine pattern)
type geminiRequest struct {
	Contents          []geminiContent         `json:"contents"`
	SystemInstruction *geminiContent          `json:"systemInstruction,omitempty"`
	GenerationConfig  *geminiGenerationConfig `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
	Role  string       `json:"role,omitempty"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []geminiPart `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

type geminiGenerationConfig struct {
	Temperature     float64 `json:"temperature,omitempty"`
	MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
}

// NewAISuggestionService creates a new AI suggestion service.
func NewAISuggestionService(apiKey, model string, ve *VariationEngine) *AISuggestionService {
	return &AISuggestionService{
		apiKey:          apiKey,
		model:           model,
		client:          &http.Client{Timeout: 60 * time.Second},
		variationEngine: ve,
	}
}

// GenerateSuggestions generates a single ready-to-paste Google Review for a business.
func (s *AISuggestionService) GenerateSuggestions(businessType, city string, rating int) (*dto.AISuggestionResponse, error) {
	if s.apiKey == "" {
		log.Warn().Msg("Gemini API key not set, using fallback review")
		return s.generateFallback(businessType, city, rating), nil
	}

	systemPrompt := `You are a Google Review writer. Write ONE complete, authentic Google Review
that a real satisfied customer would post. The review should be ready to copy-paste directly.

RULES:
- Write 3-5 sentences, natural and genuine tone
- Mention specific details relevant to the business type
- Sound like a real person, not marketing copy
- Do NOT use phrases like "best in city", "highly recommend", "look no further"
- Do NOT use excessive exclamation marks
- Include the city name naturally (only once)
- Vary your writing style each time

Return ONLY the review text, nothing else. No JSON, no quotes, no labels.`

	userPrompt := fmt.Sprintf(`Write a Google Review for a %s in %s.
Customer gave %d/5 stars.
Timestamp: %s (use for variation)

Write as if you are a happy customer who just visited. Be specific and natural.`,
		businessType, city, rating,
		time.Now().Format("2006-01-02 15:04:05"),
	)

	rawContent, err := s.callGemini(systemPrompt, userPrompt, 0.95, 500)
	if err != nil {
		log.Warn().Err(err).Msg("Gemini API call failed, using fallback review")
		return s.generateFallback(businessType, city, rating), nil
	}

	// Clean up the response
	review := strings.TrimSpace(rawContent)
	// Remove any surrounding quotes
	review = strings.Trim(review, "\"")

	// Apply safety filter
	review = s.variationEngine.ApplySafetyFilterSingle(review, city)

	return &dto.AISuggestionResponse{Review: review}, nil
}

// callGemini sends a prompt to the Google Gemini API and returns the text response.
func (s *AISuggestionService) callGemini(systemPrompt, userPrompt string, temperature float64, maxTokens int) (string, error) {
	model := s.model
	if model == "" || strings.HasPrefix(model, "gpt") {
		model = "gemini-2.5-flash"
	}

	apiURL := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		model, s.apiKey,
	)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Role:  "user",
				Parts: []geminiPart{{Text: userPrompt}},
			},
		},
		GenerationConfig: &geminiGenerationConfig{
			Temperature:     temperature,
			MaxOutputTokens: maxTokens,
		},
	}
	if systemPrompt != "" {
		reqBody.SystemInstruction = &geminiContent{
			Parts: []geminiPart{{Text: systemPrompt}},
		}
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Gemini API call failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Gemini API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var geminiResp geminiResponse
	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", fmt.Errorf("failed to parse Gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("no content returned from Gemini")
	}

	return geminiResp.Candidates[0].Content.Parts[0].Text, nil
}

// generateFallback returns a hardcoded review when the AI API is unavailable.
func (s *AISuggestionService) generateFallback(businessType, city string, rating int) *dto.AISuggestionResponse {
	return &dto.AISuggestionResponse{
		Review: fmt.Sprintf("Had a wonderful experience at this %s in %s. The staff was friendly and attentive, and the overall quality exceeded my expectations. The atmosphere was pleasant and welcoming. Would definitely visit again!", businessType, city),
	}
}
