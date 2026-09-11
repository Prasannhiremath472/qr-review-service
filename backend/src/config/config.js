require("dotenv").config();

function getEnv(key, defaultVal) {
  const val = process.env[key];
  return val !== undefined && val !== "" ? val : defaultVal;
}

// buildDatabaseUrl returns DATABASE_URL directly if set, otherwise composes
// one from Hostinger's separate DATABASE_USER / DATABASE_PASSWORD /
// DATABASE_NAME variables (its Node.js panel injects those and does not
// allow adding a custom DATABASE_URL).
function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME, DATABASE_HOST } = process.env;
  if (!DATABASE_USER || !DATABASE_PASSWORD || !DATABASE_NAME) {
    throw new Error(
      "Set DATABASE_URL, or all of DATABASE_USER / DATABASE_PASSWORD / DATABASE_NAME"
    );
  }

  const host = DATABASE_HOST || "localhost";
  const user = encodeURIComponent(DATABASE_USER);
  const password = encodeURIComponent(DATABASE_PASSWORD);
  return `mysql://${user}:${password}@${host}:3306/${DATABASE_NAME}`;
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
  databaseUrl: buildDatabaseUrl(),
};

if (!config.jwtSecret) {
  throw new Error("JWT_SECRET environment variable is required");
}

module.exports = config;
