require("dotenv").config();

function getEnv(key, defaultVal) {
  const val = process.env[key];
  return val !== undefined && val !== "" ? val : defaultVal;
}

const config = {
  port: getEnv("PORT", "8098"),
  logLevel: getEnv("LOG_LEVEL", "debug"),
  geminiKey: getEnv("GEMINI_API_KEY", getEnv("OPENAI_API_KEY", "")),
  geminiModel: getEnv("GEMINI_MODEL", getEnv("OPENAI_MODEL", "gemini-2.5-flash")),
  baseUrl: getEnv("QR_BASE_URL", "http://localhost:8098"),
  frontendUrl: getEnv("FRONTEND_URL", "http://localhost:5173"),
  corsOrigin: getEnv("CORS_ORIGIN", "*"),
  jwtSecret: getEnv("JWT_SECRET", ""),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", "7d"),
};

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

module.exports = config;
