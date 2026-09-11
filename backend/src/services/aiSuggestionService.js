const config = require("../config/config");
const { applySafetyFilterSingle } = require("./variationEngine");

const PERSONAS = [
  "a college student who visited with friends",
  "a working professional who stopped by during lunch",
  "a parent who brought their family",
  "a local regular who visits often",
  "a first-time visitor from out of town",
  "a foodie who loves trying new places",
  "a couple on a casual date night",
  "someone celebrating a small occasion",
];

const TONES = [
  "casual and chatty, like texting a friend",
  "short and to the point, like a busy person",
  "warm and detailed, sharing a personal story",
  "enthusiastic but genuine, naturally upbeat",
  "relaxed and conversational, easygoing vibe",
  "straightforward and honest, no fluff",
];

const LENGTHS = [
  "Write exactly 2 sentences.",
  "Write exactly 3 sentences.",
  "Write 3-4 sentences.",
  "Write 2-3 short sentences.",
];

const FALLBACK_TIMEOUT_MS = 60000;

function buildSystemPrompt(businessName, city) {
  const now = Date.now();
  const persona = PERSONAS[Math.floor((now / 1000) % PERSONAS.length)];
  const tone = TONES[Math.floor((now / 1000) % TONES.length)];
  const length = LENGTHS[Math.floor((now / 1000) % LENGTHS.length)];

  return `You write Google Reviews as if you are a REAL customer. Each review must be completely unique and different from any review you have ever written.

PERSONA: You are ${persona}.
TONE: Write in a ${tone} style.
LENGTH: ${length}

CRITICAL RULES:
- Write ONLY the review text. No JSON, no quotes, no labels, no prefixes.
- Every single review must use different words, different structure, different opening.
- NEVER start with "I", "We", "Had", "Great", "Amazing", "Wonderful", or "The". Mix up your sentence starters creatively.
- NEVER use these banned phrases: "highly recommend", "must visit", "hidden gem", "best in", "look no further", "hands down", "second to none", "top-notch", "exceeded expectations", "above and beyond", "will definitely be back", "can't wait to come back"
- Use casual everyday language. Real people say "pretty good", "really liked", "solid choice" — not "exceptional" or "outstanding" or "impeccable"
- Include ONE specific detail (a menu item, a feature, staff interaction, or atmosphere detail) — make it up but keep it realistic for this type of business
- Mention the business name "${businessName}" naturally (not forced)
- If city is provided, mention "${city}" naturally only if it fits — don't force it
- Small imperfections make reviews real: it's okay to mention one minor thing or use informal grammar
- Do NOT use more than one exclamation mark in the entire review
- Vary punctuation: some reviews use periods only, some use a dash or ellipsis naturally`;
}

function buildUserPrompt(businessName, businessType, city, rating) {
  const seed = Date.now() % 100000;
  return `Business: ${businessName}
Type: ${businessType}
City: ${city}
Rating: ${rating}/5 stars
Random seed: ${seed}

Write a unique Google Review that sounds like a real person typed it on their phone. Make it different from any standard review template.`;
}

async function callGemini(systemPrompt, userPrompt, temperature, maxTokens) {
  let model = config.geminiModel;
  if (!model || model.startsWith("gpt")) {
    model = "gemini-2.5-flash";
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiKey}`;

  const reqBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (systemPrompt) {
    reqBody.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT_MS);

  let resp;
  try {
    resp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  const respBody = await resp.text();

  if (!resp.ok) {
    throw new Error(`Gemini API returned status ${resp.status}: ${respBody}`);
  }

  const parsed = JSON.parse(respBody);
  const parts = parsed?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    throw new Error("no content returned from Gemini");
  }

  return parts[0].text;
}

function generateFallback(businessName, businessType, city, rating) {
  const fallbacks = [
    `Stopped by ${businessName} the other day and it was a really solid experience. Friendly staff and the vibe was just right. Pretty happy with our visit to this ${businessType} in ${city}.`,
    `Finally checked out ${businessName} in ${city} - glad we did. Everything was well put together and the service felt genuine, not rushed.`,
    `Walked into ${businessName} not expecting much but left pleasantly surprised. Good ${businessType} with a nice atmosphere. Worth a visit if you're around ${city}.`,
    `Came here with a couple friends and we all agreed ${businessName} is doing things right. Solid ${businessType} experience overall.`,
    `Really enjoyed our time at ${businessName}. The staff was attentive without being overbearing, and the place had a comfortable feel to it.`,
  ];
  const idx = Date.now() % fallbacks.length;
  return { review: fallbacks[idx] };
}

// generateSuggestions generates a single ready-to-paste Google Review for a business.
async function generateSuggestions(businessName, businessType, city, rating) {
  if (!config.geminiKey) {
    return generateFallback(businessName, businessType, city, rating);
  }

  const systemPrompt = buildSystemPrompt(businessName, city);
  const userPrompt = buildUserPrompt(businessName, businessType, city, rating);

  try {
    const rawContent = await callGemini(systemPrompt, userPrompt, 1.2, 300);
    let review = rawContent.trim().replace(/^"|"$/g, "");
    review = applySafetyFilterSingle(review, city);
    return { review };
  } catch (err) {
    return generateFallback(businessName, businessType, city, rating);
  }
}

module.exports = { generateSuggestions };
