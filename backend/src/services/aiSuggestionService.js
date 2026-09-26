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

// Each supported review language: the name to tell Gemini, whether the
// English-specific word-choice/banned-phrase rules apply (they don't
// transfer to Hindi/Marathi, since those phrases only exist in English),
// and offline fallback templates used when there's no Gemini key or the
// API call fails.
const LANGUAGES = {
  en: {
    name: "English",
    isEnglish: true,
    fallback: {
      withService: [
        (b, s, c) => `Stopped by ${b} for ${s} the other day and it was a really solid experience. Friendly staff and the vibe was just right. Pretty happy with the ${s} here in ${c}.`,
        (b, s, c) => `Finally got my ${s} done at ${b} in ${c} - glad we did. Everything was well put together and the service felt genuine, not rushed.`,
        (b, s, c, t) => `Went in for ${s} at ${b} not expecting much but left pleasantly surprised. Good ${t} with a nice atmosphere. Worth a visit if you're around ${c}.`,
        (b, s) => `Came here for ${s} with a couple friends and we all agreed ${b} is doing things right. Solid experience overall.`,
        (b, s) => `Really enjoyed my ${s} at ${b}. The staff was attentive without being overbearing, and the place had a comfortable feel to it.`,
      ],
      generic: [
        (b, s, c, t) => `Stopped by ${b} the other day and it was a really solid experience. Friendly staff and the vibe was just right. Pretty happy with our visit to this ${t} in ${c}.`,
        (b, s, c) => `Finally checked out ${b} in ${c} - glad we did. Everything was well put together and the service felt genuine, not rushed.`,
        (b, s, c, t) => `Walked into ${b} not expecting much but left pleasantly surprised. Good ${t} with a nice atmosphere. Worth a visit if you're around ${c}.`,
        (b, s, c, t) => `Came here with a couple friends and we all agreed ${b} is doing things right. Solid ${t} experience overall.`,
        (b) => `Really enjoyed our time at ${b}. The staff was attentive without being overbearing, and the place had a comfortable feel to it.`,
      ],
    },
  },
  hi: {
    name: "Hindi (written in Devanagari script)",
    isEnglish: false,
    fallback: {
      withService: [
        (b, s, c) => `कल ${b} में ${s} के लिए गया था, अनुभव काफी अच्छा रहा। स्टाफ बहुत फ्रेंडली था और माहौल भी बढ़िया लगा, ${c} में यह जगह वाकई अच्छी है।`,
        (b, s, c) => `${b} में ${s} करवाया, बहुत संतुष्ट हूं। काम अच्छे से हुआ और सर्विस भी जल्दी मिल गई।`,
        (b, s, c, t) => `${b} में ${s} के लिए गया था, ज्यादा उम्मीद नहीं थी लेकिन अच्छा लगा। ${c} के आसपास हो तो एक बार जरूर जाएं।`,
        (b, s) => `दोस्तों के साथ ${b} गया था ${s} के लिए, सबको पसंद आया। ओवरऑल अनुभव अच्छा रहा।`,
        (b, s) => `${b} में ${s} लिया, स्टाफ ने अच्छे से ध्यान दिया, ज्यादा दिखावा नहीं बस सही तरीके से काम किया।`,
      ],
      generic: [
        (b, s, c) => `कल ${b} गया था, अनुभव काफी अच्छा रहा। स्टाफ फ्रेंडली था और ${c} में यह जगह वाकई अच्छी लगी।`,
        (b, s, c) => `${b} को ${c} में आखिरकार देखा, अच्छा लगा। सब कुछ सही तरीके से व्यवस्थित था।`,
        (b, s, c, t) => `${b} में ज्यादा उम्मीद नहीं थी लेकिन अच्छा अनुभव रहा। ${t} के लिए ${c} में अच्छी जगह है।`,
        (b) => `दोस्तों के साथ ${b} गया था, सबको पसंद आया। अच्छा अनुभव रहा।`,
        (b) => `${b} में समय बिताना अच्छा लगा। स्टाफ ध्यान से बात करता है, माहौल भी आरामदायक है।`,
      ],
    },
  },
  mr: {
    name: "Marathi (written in Devanagari script)",
    isEnglish: false,
    fallback: {
      withService: [
        (b, s, c) => `काल ${b} मध्ये ${s} साठी गेलो होतो, अनुभव खूप छान होता. स्टाफ मैत्रीपूर्ण होता आणि वातावरण पण छान वाटलं, ${c} मध्ये ही जागा खरंच चांगली आहे.`,
        (b, s, c) => `${b} मध्ये ${s} करून घेतलं, खूप समाधानी आहे. काम व्यवस्थित झालं आणि सेवा पण लवकर मिळाली.`,
        (b, s, c, t) => `${b} मध्ये ${s} साठी गेलो होतो, फार अपेक्षा नव्हती पण छान वाटलं. ${c} च्या आसपास असाल तर नक्की जा.`,
        (b, s) => `मित्रांसोबत ${b} मध्ये ${s} साठी गेलो होतो, सर्वांना आवडलं. एकूण अनुभव चांगला होता.`,
        (b, s) => `${b} मध्ये ${s} घेतलं, स्टाफने व्यवस्थित लक्ष दिलं, जास्त दिखावा न करता नीट काम केलं.`,
      ],
      generic: [
        (b, s, c) => `काल ${b} मध्ये गेलो होतो, अनुभव खूप छान होता. स्टाफ मैत्रीपूर्ण होता आणि ${c} मध्ये ही जागा खरंच आवडली.`,
        (b, s, c) => `${b} शेवटी ${c} मध्ये बघितलं, छान वाटलं. सगळं व्यवस्थित मांडलेलं होतं.`,
        (b, s, c, t) => `${b} मध्ये फार अपेक्षा नव्हती पण चांगला अनुभव आला. ${t} साठी ${c} मध्ये चांगली जागा आहे.`,
        (b) => `मित्रांसोबत ${b} मध्ये गेलो होतो, सर्वांना आवडलं. अनुभव चांगला होता.`,
        (b) => `${b} मध्ये वेळ घालवायला छान वाटलं. स्टाफ लक्ष देऊन बोलतो, वातावरण पण आरामदायक आहे.`,
      ],
    },
  },
};

function resolveLanguage(language) {
  return LANGUAGES[language] || LANGUAGES.en;
}

// Splits whatever the customer typed into the "which service did you take?"
// field into individual keywords/phrases (comma, "and", "&", or slash
// separated), so the prompt can point the model at each one explicitly
// instead of just repeating the raw freeform string back at it.
function extractServiceKeywords(serviceTaken) {
  if (!serviceTaken) return [];
  return serviceTaken
    .split(/,|&|\/|\band\b/gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildSystemPrompt(businessName, city, serviceKeywords, lang) {
  const now = Date.now();
  const persona = PERSONAS[Math.floor((now / 1000) % PERSONAS.length)];
  const tone = TONES[Math.floor((now / 1000) % TONES.length)];
  const length = LENGTHS[Math.floor((now / 1000) % LENGTHS.length)];

  const serviceLine =
    serviceKeywords.length > 0
      ? `- The customer came in specifically for: ${serviceKeywords.map((k) => `"${k}"`).join(", ")} — build the review AROUND this. Mention it using the customer's own words (or a very close natural paraphrase, translated naturally into the target language), and describe how that specific service went. Do not invent an unrelated service or detail instead.`
      : `- Include ONE specific detail (a menu item, a feature, staff interaction, or atmosphere detail) — make it up but keep it realistic for this type of business`;

  const languageLine = `LANGUAGE: Write the ENTIRE review in ${lang.name}. Do not mix in English words except for the business name itself if it doesn't translate naturally. Use natural, everyday phrasing a native speaker would actually type on their phone — not a stiff or literal translation.`;

  // The banned-starters/banned-phrases rules below are English idioms and
  // don't transfer to Hindi/Marathi (those exact phrases simply don't
  // exist there), so they're only included for English output.
  const englishStyleRules = lang.isEnglish
    ? `
- NEVER start with "I", "We", "Had", "Great", "Amazing", "Wonderful", or "The". Mix up your sentence starters creatively.
- NEVER use these banned phrases: "highly recommend", "must visit", "hidden gem", "best in", "look no further", "hands down", "second to none", "top-notch", "exceeded expectations", "above and beyond", "will definitely be back", "can't wait to come back"
- Use casual everyday language. Real people say "pretty good", "really liked", "solid choice" — not "exceptional" or "outstanding" or "impeccable"`
    : `
- Avoid stock phrases that sound like a translated ad or a canned template — write like a real person casually describing their day to a friend.
- Vary sentence openings and structure between reviews; don't reuse the same opening word or phrase every time.`;

  return `You write Google Reviews as if you are a REAL customer. Each review must be completely unique and different from any review you have ever written.

PERSONA: You are ${persona}.
TONE: Write in a ${tone} style.
LENGTH: ${length}
${languageLine}

CRITICAL RULES:
- Write ONLY the review text. No JSON, no quotes, no labels, no prefixes, no English translation alongside it.
- Every single review must use different words, different structure, different opening.${englishStyleRules}
${serviceLine}
- Mention the business name "${businessName}" naturally (not forced)
- If city is provided, mention "${city}" naturally only if it fits — don't force it
- Small imperfections make reviews real: it's okay to mention one minor thing or use informal grammar
- Do NOT use more than one exclamation mark in the entire review
- Vary punctuation: some reviews use periods only, some use a dash or ellipsis naturally`;
}

function buildUserPrompt(businessName, businessType, city, rating, serviceTaken, serviceKeywords, lang) {
  const seed = Date.now() % 100000;
  const serviceBlock =
    serviceKeywords.length > 0
      ? `Service(s) taken (customer's own words): ${serviceTaken}\nKeywords to build the review around: ${serviceKeywords.join(", ")}\n`
      : "";
  return `Business: ${businessName}
Type: ${businessType}
City: ${city}
Rating: ${rating}/5 stars
Language: ${lang.name}
${serviceBlock}Random seed: ${seed}

Write a unique Google Review, entirely in ${lang.name}, that sounds like a real person typed it on their phone. Make it different from any standard review template.`;
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

function generateFallback(businessName, businessType, city, rating, serviceKeywords, lang) {
  const service = serviceKeywords[0] || "";
  const templates = service ? lang.fallback.withService : lang.fallback.generic;
  const idx = Date.now() % templates.length;
  const review = templates[idx](businessName, service, city, businessType);
  return { review };
}

// generateSuggestions generates a single ready-to-paste Google Review for a business.
async function generateSuggestions(businessName, businessType, city, rating, serviceTaken, language) {
  const serviceKeywords = extractServiceKeywords(serviceTaken);
  const lang = resolveLanguage(language);

  if (!config.geminiKey) {
    return generateFallback(businessName, businessType, city, rating, serviceKeywords, lang);
  }

  const systemPrompt = buildSystemPrompt(businessName, city, serviceKeywords, lang);
  const userPrompt = buildUserPrompt(businessName, businessType, city, rating, serviceTaken, serviceKeywords, lang);

  try {
    const rawContent = await callGemini(systemPrompt, userPrompt, 1.2, 300);
    let review = rawContent.trim().replace(/^"|"$/g, "");
    // The English-phrase safety filter only matters for English output —
    // running it on Hindi/Marathi text is harmless (nothing will match)
    // but skipped anyway since there's nothing for it to catch there.
    if (lang.isEnglish) {
      review = applySafetyFilterSingle(review, city);
    }
    return { review };
  } catch (err) {
    return generateFallback(businessName, businessType, city, rating, serviceKeywords, lang);
  }
}

module.exports = { generateSuggestions };
