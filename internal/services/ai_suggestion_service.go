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
func (s *AISuggestionService) GenerateSuggestions(businessName, businessType, city string, rating int) (*dto.AISuggestionResponse, error) {
	if s.apiKey == "" {
		log.Warn().Msg("Gemini API key not set, using fallback review")
		return s.generateFallback(businessName, businessType, city, rating), nil
	}

	// Pick a random writing persona and style for each request
	personas := []string{
		"a college student who visited with friends",
		"a working professional who stopped by during lunch",
		"a parent who brought their family",
		"a local regular who visits often",
		"a first-time visitor from out of town",
		"a foodie who loves trying new places",
		"a couple on a casual date night",
		"someone celebrating a small occasion",
	}
	tones := []string{
		"casual and chatty, like texting a friend",
		"short and to the point, like a busy person",
		"warm and detailed, sharing a personal story",
		"enthusiastic but genuine, naturally upbeat",
		"relaxed and conversational, easygoing vibe",
		"straightforward and honest, no fluff",
	}
	lengths := []string{
		"Write exactly 2 sentences.",
		"Write exactly 3 sentences.",
		"Write 3-4 sentences.",
		"Write 2-3 short sentences.",
	}

	now := time.Now()
	personaIdx := (now.UnixNano() / 1e6) % int64(len(personas))
	toneIdx := (now.UnixNano() / 1e7) % int64(len(tones))
	lengthIdx := (now.UnixNano() / 1e8) % int64(len(lengths))

	systemPrompt := fmt.Sprintf(`You write Google Reviews as if you are a REAL customer. Each review must be completely unique and different from any review you have ever written.

PERSONA: You are %s.
TONE: Write in a %s style.
LENGTH: %s

CRITICAL RULES:
- Write ONLY the review text. No JSON, no quotes, no labels, no prefixes.
- Every single review must use different words, different structure, different opening.
- NEVER start with "I", "We", "Had", "Great", "Amazing", "Wonderful", or "The". Mix up your sentence starters creatively.
- NEVER use these banned phrases: "highly recommend", "must visit", "hidden gem", "best in", "look no further", "hands down", "second to none", "top-notch", "exceeded expectations", "above and beyond", "will definitely be back", "can't wait to come back"
- Use casual everyday language. Real people say "pretty good", "really liked", "solid choice" — not "exceptional" or "outstanding" or "impeccable"
- Include ONE specific detail (a menu item, a feature, staff interaction, or atmosphere detail) — make it up but keep it realistic for this type of business
- Mention the business name "%s" naturally (not forced)
- If city is provided, mention "%s" naturally only if it fits — don't force it
- Small imperfections make reviews real: it's okay to mention one minor thing or use informal grammar
- Do NOT use more than one exclamation mark in the entire review
- Vary punctuation: some reviews use periods only, some use a dash or ellipsis naturally`,
		personas[personaIdx], tones[toneIdx], lengths[lengthIdx], businessName, city)

	userPrompt := fmt.Sprintf(`Business: %s
Type: %s
City: %s
Rating: %d/5 stars
Random seed: %d

Write a unique Google Review that sounds like a real person typed it on their phone. Make it different from any standard review template.`,
		businessName, businessType, city, rating,
		now.UnixNano()%100000,
	)

	rawContent, err := s.callGemini(systemPrompt, userPrompt, 1.2, 300)
	if err != nil {
		log.Warn().Err(err).Msg("Gemini API call failed, using fallback review")
		return s.generateFallback(businessName, businessType, city, rating), nil
	}

	// Clean up the response
	review := strings.TrimSpace(rawContent)
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
func (s *AISuggestionService) generateFallback(businessName, businessType, city string, rating int) *dto.AISuggestionResponse {
	fallbacks := []string{
		fmt.Sprintf("Stopped by %s the other day and it was a really solid experience. Friendly staff and the vibe was just right. Pretty happy with our visit to this %s in %s.", businessName, businessType, city),
		fmt.Sprintf("Finally checked out %s in %s - glad we did. Everything was well put together and the service felt genuine, not rushed.", businessName, city),
		fmt.Sprintf("Walked into %s not expecting much but left pleasantly surprised. Good %s with a nice atmosphere. Worth a visit if you're around %s.", businessName, businessType, city),
		fmt.Sprintf("Came here with a couple friends and we all agreed %s is doing things right. Solid %s experience overall.", businessName, businessType),
		fmt.Sprintf("Really enjoyed our time at %s. The staff was attentive without being overbearing, and the place had a comfortable feel to it.", businessName),
	}
	idx := time.Now().UnixNano() % int64(len(fallbacks))
	return &dto.AISuggestionResponse{
		Review: fallbacks[idx],
	}
}
