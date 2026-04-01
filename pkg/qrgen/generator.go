package qrgen

import (
	"encoding/base64"

	qrcode "github.com/skip2/go-qrcode"
)

// Generate creates a QR code PNG for the given URL and returns base64-encoded image data.
// The size parameter controls the width/height in pixels.
func Generate(url string, size int) (string, error) {
	png, err := qrcode.Encode(url, qrcode.Medium, size)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(png), nil
}

// GenerateBytes creates a QR code PNG and returns raw bytes.
func GenerateBytes(url string, size int) ([]byte, error) {
	return qrcode.Encode(url, qrcode.Medium, size)
}
