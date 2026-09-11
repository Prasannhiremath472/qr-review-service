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

// applySafetyFilterSingle applies safety filtering to a single review string.
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

module.exports = { applySafetyFilterSingle, splitSentences };
