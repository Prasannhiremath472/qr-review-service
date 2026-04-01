package web

import "embed"

// TemplateFS embeds the HTML templates into the binary so they are available
// even when running inside a minimal Docker container.
//
//go:embed templates/*.html
var TemplateFS embed.FS
