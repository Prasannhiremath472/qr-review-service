package services

import (
	"math/rand"
	"strings"
)

// VariationEngine applies linguistic variation and safety filtering to AI-generated content.
type VariationEngine struct {
	synonyms     map[string][]string
	aiPhrases    []string // Phrases that sound too AI-generated to filter out
	replacements []string // Natural alternatives for "best in {city}"
}

// NewVariationEngine creates a new variation engine with built-in synonym maps.
func NewVariationEngine() *VariationEngine {
	return &VariationEngine{
		synonyms: map[string][]string{
			"great":       {"excellent", "outstanding", "wonderful", "fantastic", "superb"},
			"good":        {"pleasant", "enjoyable", "satisfying", "nice", "solid"},
			"amazing":     {"remarkable", "impressive", "exceptional", "incredible"},
			"friendly":    {"welcoming", "approachable", "warm", "cordial", "helpful"},
			"service":     {"experience", "support", "hospitality", "care"},
			"recommend":   {"suggest", "endorse", "vouch for"},
			"delicious":   {"tasty", "flavorful", "scrumptious", "mouthwatering"},
			"comfortable": {"cozy", "relaxing", "inviting", "pleasant"},
			"beautiful":   {"lovely", "charming", "stunning", "gorgeous"},
			"clean":       {"spotless", "tidy", "well-maintained", "pristine"},
			"fast":        {"quick", "prompt", "speedy", "efficient"},
			"helpful":     {"accommodating", "supportive", "attentive", "responsive"},
			"loved":       {"enjoyed", "appreciated", "was impressed by", "was delighted by"},
			"best":        {"top-notch", "first-rate", "exceptional", "premier"},
			"visit":       {"stop by", "check out", "experience", "try"},
		},
		aiPhrases: []string{
			"i highly recommend",
			"i cannot recommend enough",
			"i can't recommend enough",
			"if you're looking for",
			"if you are looking for",
			"look no further",
			"without a doubt",
			"hands down",
			"second to none",
		},
		replacements: []string{
			"a wonderful choice in",
			"one of the top options in",
			"a fantastic spot in",
			"a standout place in",
			"a gem in",
		},
	}
}

// ApplyVariation applies synonym replacement and structural variation to drafts.
func (ve *VariationEngine) ApplyVariation(drafts []string) []string {
	result := make([]string, len(drafts))
	for i, draft := range drafts {
		// Apply synonym replacement (swap 1-2 words per draft)
		result[i] = ve.applySynonymReplacement(draft, 1+rand.Intn(2))

		// Random length variation: 30% chance of dropping second sentence from 2-sentence drafts
		sentences := splitSentences(result[i])
		if len(sentences) >= 2 && rand.Float32() < 0.3 {
			result[i] = sentences[0] + "."
		}
	}

	// Sentence restructuring: for drafts with 2+ clauses, randomly swap clause order
	for i, draft := range result {
		clauses := strings.SplitN(draft, ", ", 2)
		if len(clauses) == 2 && rand.Float32() < 0.4 {
			// Swap clause order and adjust capitalization
			first := strings.ToUpper(clauses[1][:1]) + clauses[1][1:]
			second := strings.ToLower(clauses[0][:1]) + clauses[0][1:]
			result[i] = first + ", " + second
		}
	}

	return result
}

// ApplySafetyFilterSingle applies safety filtering to a single review string.
func (ve *VariationEngine) ApplySafetyFilterSingle(text, city string) string {
	// Filter "best in {city}" patterns
	text = ve.filterBestInCitySingle(text, city)

	// Remove AI-sounding sentence starters
	sentences := splitSentences(text)
	var filtered []string
	for _, sentence := range sentences {
		sentenceLower := strings.ToLower(strings.TrimSpace(sentence))
		isAI := false
		for _, phrase := range ve.aiPhrases {
			if strings.HasPrefix(sentenceLower, phrase) {
				isAI = true
				break
			}
		}
		if !isAI {
			filtered = append(filtered, sentence)
		}
	}
	if len(filtered) > 0 {
		result := strings.Join(filtered, ". ")
		if !strings.HasSuffix(result, ".") && !strings.HasSuffix(result, "!") {
			result += "."
		}
		return result
	}
	return text
}

// applySynonymReplacement replaces up to `count` words with synonyms.
func (ve *VariationEngine) applySynonymReplacement(text string, count int) string {
	words := strings.Fields(text)
	replaced := 0

	for i, word := range words {
		if replaced >= count {
			break
		}
		// Normalize for lookup (strip trailing punctuation)
		clean := strings.ToLower(strings.TrimRight(word, ".,!?;:"))
		if synonyms, ok := ve.synonyms[clean]; ok {
			// Pick a random synonym
			synonym := synonyms[rand.Intn(len(synonyms))]

			// Preserve original capitalization
			if word[0] >= 'A' && word[0] <= 'Z' {
				synonym = strings.ToUpper(synonym[:1]) + synonym[1:]
			}

			// Preserve trailing punctuation
			suffix := word[len(clean):]
			words[i] = synonym + suffix
			replaced++
		}
	}

	return strings.Join(words, " ")
}

// filterBestInCity removes "best in {city}" patterns from a slice of strings.
func (ve *VariationEngine) filterBestInCity(texts []string, city string) []string {
	result := make([]string, len(texts))
	for i, text := range texts {
		result[i] = ve.filterBestInCitySingle(text, city)
	}
	return result
}

// filterBestInCitySingle removes "best in {city}" pattern from a single string.
func (ve *VariationEngine) filterBestInCitySingle(text, city string) string {
	lower := strings.ToLower(text)
	cityLower := strings.ToLower(city)

	// Check for "best in {city}" or "best {type} in {city}" patterns
	patterns := []string{
		"best in " + cityLower,
		"best " + cityLower,
		"the best in " + cityLower,
	}

	for _, pattern := range patterns {
		if strings.Contains(lower, pattern) {
			// Replace with a random natural alternative
			replacement := ve.replacements[rand.Intn(len(ve.replacements))] + " " + city
			// Case-insensitive replacement
			idx := strings.Index(lower, pattern)
			text = text[:idx] + replacement + text[idx+len(pattern):]
			lower = strings.ToLower(text)
		}
	}

	return text
}

// removeAIPhrases filters out sentences that start with known AI-sounding phrases.
func (ve *VariationEngine) removeAIPhrases(drafts []string) []string {
	result := make([]string, len(drafts))
	for i, draft := range drafts {
		sentences := splitSentences(draft)
		var filtered []string
		for _, sentence := range sentences {
			sentenceLower := strings.ToLower(strings.TrimSpace(sentence))
			isAI := false
			for _, phrase := range ve.aiPhrases {
				if strings.HasPrefix(sentenceLower, phrase) {
					isAI = true
					break
				}
			}
			if !isAI {
				filtered = append(filtered, sentence)
			}
		}
		if len(filtered) > 0 {
			result[i] = strings.Join(filtered, ". ")
			if !strings.HasSuffix(result[i], ".") {
				result[i] += "."
			}
		} else {
			// If all sentences were filtered, keep the original
			result[i] = draft
		}
	}
	return result
}

// wordOverlap calculates the fraction of shared words between two strings (0.0 - 1.0).
func wordOverlap(a, b string) float64 {
	wordsA := strings.Fields(strings.ToLower(a))
	wordsB := strings.Fields(strings.ToLower(b))

	if len(wordsA) == 0 || len(wordsB) == 0 {
		return 0
	}

	setB := make(map[string]bool)
	for _, w := range wordsB {
		setB[w] = true
	}

	shared := 0
	for _, w := range wordsA {
		if setB[w] {
			shared++
		}
	}

	// Use the smaller set as denominator for a stricter overlap check
	minLen := len(wordsA)
	if len(wordsB) < minLen {
		minLen = len(wordsB)
	}

	return float64(shared) / float64(minLen)
}

// splitSentences splits text into sentences on period boundaries.
func splitSentences(text string) []string {
	parts := strings.Split(text, ".")
	var sentences []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			sentences = append(sentences, trimmed)
		}
	}
	return sentences
}
