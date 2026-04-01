package config

import "os"

// Config holds all configuration for the QR Review service.
type Config struct {
	DatabaseURL string
	Port        string
	LogLevel    string
	GeminiKey   string // Gemini API key (env var is OPENAI_API_KEY by convention)
	GeminiModel string // Gemini model name
	BaseURL     string // Base URL for QR code generation (e.g., https://yourdomain.com)
}

// LoadConfig reads configuration from environment variables with sensible defaults.
func LoadConfig() *Config {
	return &Config{
		DatabaseURL: getEnv("DATABASE_URL", "postgres://growthos:growthos_secret@localhost:5432/growthos_qr_reviews?sslmode=disable"),
		Port:        getEnv("PORT", "8098"),
		LogLevel:    getEnv("LOG_LEVEL", "debug"),
		GeminiKey:   getEnv("OPENAI_API_KEY", ""),
		GeminiModel: getEnv("OPENAI_MODEL", "gemini-2.5-flash"),
		BaseURL:     getEnv("QR_BASE_URL", "http://localhost:8098"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
