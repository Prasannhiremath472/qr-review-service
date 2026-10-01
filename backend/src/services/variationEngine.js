const SYNONYMS = {
  great: ["excellent", "outstanding", "wonderful", "fantastic", "superb"],
  good: ["pleasant", "enjoyable", "satisfying", "nice", "solid"],
  amazing: ["remarkable", "impressive", "exceptional", "incredible"],
  friendly: ["welcoming", "approachable", "warm", "cordial", "helpful"],
  service: ["experience", "support", "hospitality", "care"],
  recommend: ["suggest", "endorse", "vouch for"],
  delicious: ["tasty", "flavorful", "scrumptious", "mouthwatering"],
  comfortable: ["cozy", "relaxing", "inviting", "pleasant"],
  beautiful: ["lovely", "charming", "stunning", "gorgeous"],
  clean: ["spotless", "tidy", "well-maintained", "pristine"],
  fast: ["quick", "prompt", "speedy", "efficient"],
  helpful: ["accommodating", "supportive", "attentive", "responsive"],
  loved: ["enjoyed", "appreciated", "was impressed by", "was delighted by"],
  best: ["top-notch", "first-rate", "exceptional", "premier"],
  visit: ["stop by", "check out", "experience", "try"],
};

const AI_PHRASES = [
  "i highly recommend",
  "i cannot recommend enough",
  "i can't recommend enough",
  "if you're looking for",
  "if you are looking for",
  "look no further",
  "without a doubt",
  "hands down",
  "second to none",
];

const REPLACEMENTS = [
  "a wonderful choice in",
  "one of the top options in",
  "a fantastic spot in",
  "a standout place in",
  "a gem in",
];

function splitSentences(text) {
  return text
    .split(".")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function filterBestInCitySingle(text, city) {
  const cityLower = (city || "").toLowerCase();
  if (!cityLower) return text;
  let lower = text.toLowerCase();

  const patterns = [
    `best in ${cityLower}`,
    `best ${cityLower}`,
    `the best in ${cityLower}`,
  ];

  for (const pattern of patterns) {
    if (lower.includes(pattern)) {
      const replacement =
        REPLACEMENTS[Math.floor(Math.random() * REPLACEMENTS.length)] +
        " " +
        city;
      const idx = lower.indexOf(pattern);
      text = text.slice(0, idx) + replacement + text.slice(idx + pattern.length);
      lower = text.toLowerCase();
    }
  }

  return text;
}

// applySafetyFilterSingle applies AI-sounding-phrase/style filtering to a
// single review string (NOT content moderation — see containsUnsafeContent
// below for that). Kept under its original name since it's the established
// post-generation cleanup step every review already passes through.
function applySafetyFilterSingle(text, city) {
  text = filterBestInCitySingle(text, city);

  const sentences = splitSentences(text);
  const filtered = sentences.filter((sentence) => {
    const sentenceLower = sentence.trim().toLowerCase();
    return !AI_PHRASES.some((phrase) => sentenceLower.startsWith(phrase));
  });

  if (filtered.length > 0) {
    let result = filtered.join(". ");
    if (!result.endsWith(".") && !result.endsWith("!")) {
      result += ".";
    }
    return result;
  }
  return text;
}

// Last-resort local content-safety backstop, checked after Gemini's own
// safetySettings and system-prompt rules (aiSuggestionService.js). Matches
// whole words/short phrases only (word-boundary regex), case-insensitive,
// across common obfuscations (spaced/punctuated letters), so it catches
// profanity, slurs, and sexual terms that slip through the model without
// false-positiving on ordinary review words. Not an exhaustive list — it's
// a safety net, not the primary control.
const UNSAFE_PATTERNS = [
  // Profanity / vulgar language
  /\bf+\W*u+\W*c+\W*k+\w*/i,
  /\bs+\W*h+\W*i+\W*t+\w*/i,
  /\bb+\W*i+\W*t+\W*c+\W*h+\w*/i,
  /\ba+\W*s+\W*s+\W*h+\W*o+\W*l+\W*e+\w*/i,
  /\bb+\W*a+\W*s+\W*t+\W*a+\W*r+\W*d+\w*/i,
  /\bc+\W*u+\W*n+\W*t+\w*/i,
  /\bd+\W*i+\W*c+\W*k+\w*/i,
  /\bp+\W*u+\W*s+\W*s+\W*y+\w*/i,
  /\bwhore\b/i,
  /\bslut\b/i,
  // Sexual / nudity content
  /\bsex(ual|y|ually)?\b/i,
  /\bnud(e|ity)\b/i,
  /\bporn(ography)?\b/i,
  /\berotic\b/i,
  /\borgasm\b/i,
  /\bmasturbat\w*/i,
  /\bhorny\b/i,
  // Slurs / hate speech (kept minimal and generic on purpose)
  /\brape\b/i,
  /\bn[i1]gg[ae3]r?\b/i,
  /\bf[a4]gg?[o0]t\b/i,
  // Violence / self-harm
  /\bkill\s*(yourself|myself|himself|herself)\b/i,
  /\bsuicide\b/i,
];

function containsUnsafeContent(text) {
  if (!text) return false;
  return UNSAFE_PATTERNS.some((pattern) => pattern.test(text));
}

module.exports = { applySafetyFilterSingle, containsUnsafeContent, splitSentences };
