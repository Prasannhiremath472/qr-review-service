package main

import (
	"fmt"
	"html/template"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/growthOS/qr-review-service/internal/config"
	"github.com/growthOS/qr-review-service/internal/controllers"
	"github.com/growthOS/qr-review-service/internal/middleware"
	"github.com/growthOS/qr-review-service/internal/models"
	"github.com/growthOS/qr-review-service/internal/repositories"
	"github.com/growthOS/qr-review-service/internal/routes"
	"github.com/growthOS/qr-review-service/internal/services"
	"github.com/growthOS/qr-review-service/web"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env from project root
	godotenv.Load("../../.env")
	cfg := config.LoadConfig()

	// Configure zerolog
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if cfg.LogLevel == "debug" {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	log.Info().Msg("connected to database")

	// Auto-migrate models
	if err := db.AutoMigrate(&models.Shop{}, &models.QRCode{}, &models.Feedback{}); err != nil {
		log.Fatal().Err(err).Msg("failed to migrate database")
	}

	// Initialize repositories
	shopRepo := repositories.NewShopRepository(db)
	qrRepo := repositories.NewQRCodeRepository(db)
	feedbackRepo := repositories.NewFeedbackRepository(db)

	// Initialize services
	variationEngine := services.NewVariationEngine()
	aiService := services.NewAISuggestionService(cfg.GeminiKey, cfg.GeminiModel, variationEngine)
	shopService := services.NewShopService(shopRepo)
	qrService := services.NewQRCodeService(qrRepo, shopRepo, cfg.BaseURL)
	feedbackService := services.NewFeedbackService(feedbackRepo)

	// Initialize controllers
	shopCtrl := controllers.NewShopController(shopService)
	qrCtrl := controllers.NewQRCodeController(qrService, qrRepo, shopRepo, cfg.BaseURL)
	feedbackCtrl := controllers.NewFeedbackController(feedbackService)
	redirectCtrl := controllers.NewRedirectController(qrRepo, shopRepo)
	aiCtrl := controllers.NewAIController(aiService)

	// Setup Gin router
	router := gin.Default()

	// Load embedded HTML templates
	tmpl := template.Must(template.ParseFS(web.TemplateFS, "templates/*.html"))
	router.SetHTMLTemplate(tmpl)

	// Add logging middleware
	router.Use(middleware.RequestLogger())

	// Setup all routes
	routes.SetupRoutes(router, shopCtrl, qrCtrl, feedbackCtrl, redirectCtrl, aiCtrl)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Info().Str("port", cfg.Port).Msg("QR Review Service starting")
	if err := router.Run(addr); err != nil {
		log.Fatal().Err(err).Msg("failed to start QR Review Service")
	}
}
