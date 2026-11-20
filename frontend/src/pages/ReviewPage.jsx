import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  resolveQrCode,
  getReviewSuggestion,
  submitFeedback,
  sendFeedbackBeacon,
  uploadCustomerPhotos,
} from "../api/client.js";
import SetupPage from "./SetupPage.jsx";
import ServiceMultiSelect from "../components/ServiceMultiSelect.jsx";
import BusinessProfile from "../components/review/BusinessProfile.jsx";
import InfinityBadge from "../components/review/InfinityBadge.jsx";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CameraIcon,
  CheckIcon,
  CopyIcon,
  GoogleG,
  HeartIcon,
  LanguagesIcon,
  RefreshIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
  WhatsAppIcon,
  XIcon,
} from "../components/review/icons.jsx";
import { LANGS, TAGS, UI, tagLabel } from "../lib/reviewI18n.js";
import { compressImage } from "../lib/imageCompress.js";
import useDocumentTitle from "../lib/useDocumentTitle.js";

// Converts a "#rrggbb" / "#rgb" brand colour to the space-separated RGB
// channels the .rv-theme tokens use. Returns null for anything unparseable
// so the default theme colour is kept.
function hexToChannels(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function themeStyle(brandColor) {
  const channels = hexToChannels(brandColor);
  return channels ? { "--rv-primary": channels } : undefined;
}

// Centered single-card layout for the loading / paused / error screens.
function StatusShell({ children }) {
  return (
    <main className="rv-theme flex min-h-screen items-center justify-center p-4 font-review">
      <div className="fade-in w-full max-w-sm rounded-3xl bg-card px-8 py-10 text-center shadow-card">{children}</div>
    </main>
  );
}

export default function ReviewPage() {
  const { qrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shopInfo, setShopInfo] = useState(null);

  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, status } = await resolveQrCode(qrId);
        if (cancelled) return;
        if (!data.success) {
          if (status === 402 && data.code === "SUBSCRIPTION_INACTIVE") {
            setPaused(true);
          } else {
            setError(data.message || "QR code not found.");
          }
        } else {
          setShopInfo(data.data);
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [qrId]);

  if (loading) {
    return (
      <main className="rv-theme min-h-screen font-review sm:px-4 sm:py-8" aria-busy="true">
        <div className="mx-auto w-full max-w-2xl overflow-hidden bg-card shadow-card sm:rounded-3xl">
          <div className="shimmer aspect-[680/453] w-full" />
          <div className="space-y-4 px-5 py-8 sm:px-10">
            <div className="shimmer mx-auto h-5 w-1/2 rounded-full" />
            <div className="shimmer mx-auto h-8 w-3/4 rounded-full" />
            <div className="shimmer mx-auto h-10 w-56 rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (paused) {
    return (
      <StatusShell>
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-star-soft text-star">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>
        <h1 className="mb-1.5 font-display text-lg font-semibold text-foreground">Temporarily Unavailable</h1>
        <p className="text-sm text-muted-foreground">
          This business's review service is temporarily paused. Please check back later.
        </p>
      </StatusShell>
    );
  }

  if (error) {
    return (
      <StatusShell>
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mb-1.5 font-display text-lg font-semibold text-foreground">Oops!</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </StatusShell>
    );
  }

  if (!shopInfo.is_linked) {
    return <SetupPage qrId={qrId} />;
  }

  return <ReviewFlow shopInfo={shopInfo} qrId={qrId} />;
}

const TYPING_CHARS_PER_TICK = 1;
const TYPING_TICK_MS = 32;
const SERVICE_DEBOUNCE_MS = 1000;
const FALLBACK_REVIEW = "Had a wonderful experience! Great service and would definitely recommend.";
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

// Copies text to the clipboard; never rejects (e.g. blocked or insecure context).
function copyToClipboard(text) {
  try {
    return navigator.clipboard.writeText(text).catch(() => {});
  } catch (err) {
    return Promise.resolve();
  }
}

function ReviewFlow({ shopInfo, qrId }) {
  useDocumentTitle(`${shopInfo.shop_name} – Leave a review`);
  const [customerName, setCustomerName] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const serviceTaken = selectedServices.join(", ");
  const [selectedTags, setSelectedTags] = useState([]);
  const [photos, setPhotos] = useState([]); // [{ id, file, preview }]
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [closed, setClosed] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [lang, setLang] = useState("en"); // page UI language
  const [reviewLang, setReviewLang] = useState("en"); // language the AI writes the review in
  const [step, setStep] = useState("review"); // review | negative | thankyou
  const [reviewText, setReviewText] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const fetchedOnce = useRef(false);
  const serviceDebounceRef = useRef(null);
  const typingIntervalRef = useRef(null);
  const requestIdRef = useRef(0);
  const reviewLangRef = useRef("en");
  const photosRef = useRef([]);
  photosRef.current = photos;

  const t = UI[lang];

  useEffect(() => {
    if (rating >= 4 && !fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchSuggestion();
    }
    return () => {
      clearTimeout(serviceDebounceRef.current);
      clearInterval(typingIntervalRef.current);
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plays the given text into `typedText` a few characters at a time, so the
  // customer sees the AI "writing" the review instead of it popping in.
  function playTypingAnimation(text) {
    clearInterval(typingIntervalRef.current);
    setTypedText("");
    setIsTyping(true);
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      i += TYPING_CHARS_PER_TICK;
      setTypedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typingIntervalRef.current);
        setIsTyping(false);
      }
    }, TYPING_TICK_MS);
  }

  async function fetchSuggestion({ service, language, highlights } = {}) {
    const requestId = ++requestIdRef.current;
    setSuggestionLoading(true);
    setCopied(false);
    try {
      const { data } = await getReviewSuggestion({
        shop_id: shopInfo.shop_id,
        business_name: shopInfo.shop_name,
        business_type: shopInfo.business_type || "business",
        city: shopInfo.city || "your city",
        rating,
        service_taken: (service ?? serviceTaken).trim(),
        highlights: highlights ?? selectedTags,
        language: language ?? reviewLangRef.current,
      });
      if (requestId !== requestIdRef.current) return; // a newer request superseded this one
      const text = data.success && data.data && data.data.review ? data.data.review : FALLBACK_REVIEW;
      setReviewText(text);
      setSuggestionLoading(false);
      playTypingAnimation(text);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setReviewText(FALLBACK_REVIEW);
      setSuggestionLoading(false);
      playTypingAnimation(FALLBACK_REVIEW);
    }
  }

  function handleSetRating(value) {
    setRating(value);
    if (value >= 4) {
      setStep("review");
      if (!reviewText) {
        fetchedOnce.current = true;
        fetchSuggestion();
      }
    } else {
      setStep("negative");
    }
  }

  // Changing the review language rewrites the review in that language.
  function handleReviewLangChange(code) {
    if (code === reviewLangRef.current) return;
    reviewLangRef.current = code;
    setReviewLang(code);
    if (rating >= 4) {
      clearTimeout(serviceDebounceRef.current);
      fetchedOnce.current = true;
      fetchSuggestion({ language: code });
    }
  }

  // The page language drives both the UI wording and the review language.
  function handlePageLangChange(code) {
    setLang(code);
    handleReviewLangChange(code);
  }

  // Regenerates the AI review a moment after the customer's service
  // selection settles (toggling a chip or adding a custom one), using the
  // selected services to make the review more specific.
  function handleServicesChange(nextServices) {
    setSelectedServices(nextServices);
    if (rating < 4) return;
    const joined = nextServices.join(", ");
    clearTimeout(serviceDebounceRef.current);
    serviceDebounceRef.current = setTimeout(() => {
      if (joined.trim()) {
        fetchedOnce.current = true;
        fetchSuggestion({ service: joined });
      }
    }, SERVICE_DEBOUNCE_MS);
  }

  // Same debounced regeneration as services: the AI weaves the liked
  // qualities into the review a moment after the selection settles.
  function handleTagsChange(nextTags) {
    setSelectedTags(nextTags);
    if (rating < 4) return;
    clearTimeout(serviceDebounceRef.current);
    serviceDebounceRef.current = setTimeout(() => {
      if (nextTags.length > 0) {
        fetchedOnce.current = true;
        fetchSuggestion({ highlights: nextTags });
      }
    }, SERVICE_DEBOUNCE_MS);
  }

  function handlePhotosPicked(e) {
    const picked = Array.from(e.target.files || []).filter(
      (f) => f.type.startsWith("image/") && f.size <= MAX_PHOTO_BYTES,
    );
    e.target.value = "";
    setPhotos((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const added = picked.slice(0, Math.max(0, room)).map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const gone = prev.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  function copyReview() {
    copyToClipboard(reviewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function copyAndContinue() {
    setContinuing(true);
    // Start the copy inside the click so the browser still counts it as a user gesture.
    const copyDone = copyToClipboard(reviewText);

    const extras = [
      customerName.trim() ? ` (name: ${customerName.trim()})` : "",
      serviceTaken.trim() ? `, service: ${serviceTaken.trim()}` : "",
      selectedTags.length ? `, liked: ${selectedTags.join(", ")}` : "",
      photos.length ? `, photos: ${photos.length}` : "",
    ].join("");
    const payload = {
      shop_id: shopInfo.shop_id,
      qr_code_id: qrId,
      rating,
      message: `Redirected to Google Review${extras}`,
    };

    // Photos upload before the redirect, but never block it: a failed or
    // slow upload (it aborts after 20s) still sends the customer to Google.
    if (photos.length > 0) {
      setUploadingPhotos(true);
      try {
        const files = await Promise.all(photos.map((p) => compressImage(p.file)));
        await uploadCustomerPhotos(qrId, files);
      } catch (err) {
        // ignore — the review itself is what matters
      }
      setUploadingPhotos(false);
    }

    await copyDone;
    sendFeedbackBeacon(payload);
    setTimeout(() => {
      window.location.href = shopInfo.review_url;
    }, 600);
  }

  async function handleSubmitFeedback() {
    setSubmittingFeedback(true);
    try {
      await submitFeedback({
        shop_id: shopInfo.shop_id,
        qr_code_id: qrId,
        rating,
        message: feedbackMessage.trim(),
      });
    } catch (err) {
      // ignore network errors, still show thank you
    } finally {
      setSubmittingFeedback(false);
    }
    setStep("thankyou");
  }

  const whatsappHref = shopInfo.whatsapp_number
    ? `https://wa.me/${shopInfo.whatsapp_number.replace(/[^0-9]/g, "")}`
    : "";

  const activeRating = hoverRating || rating;
  const showChips = step === "review";

  if (closed) {
    return (
      <main
        className="rv-theme flex min-h-screen items-center justify-center p-6 text-center font-review"
        style={themeStyle(shopInfo.brand_color)}
      >
        <div className="fade-in">
          <p className="font-display text-2xl font-semibold text-foreground">
            {t.visitThanks.replace("{name}", shopInfo.shop_name)}
          </p>
          <button
            type="button"
            onClick={() => setClosed(false)}
            className="mt-4 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            {t.backToReview}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="rv-theme min-h-screen overflow-x-hidden font-review sm:px-4 sm:py-8" style={themeStyle(shopInfo.brand_color)}>
      <div className="fade-in mx-auto w-full max-w-2xl overflow-hidden bg-card shadow-card sm:rounded-3xl">
        {/* ---------- Header ---------- */}
        <header className="relative">
          {shopInfo.photo_url ? (
            <img
              src={shopInfo.photo_url}
              alt={shopInfo.shop_name}
              width={680}
              height={453}
              className="aspect-[680/453] w-full object-cover"
            />
          ) : (
            <div className="h-44 w-full bg-primary sm:h-56" />
          )}
          <svg
            viewBox="0 0 400 40"
            preserveAspectRatio="none"
            className="absolute -bottom-px left-0 h-8 w-full fill-card sm:h-12"
            aria-hidden="true"
          >
            <path d="M0 22 C80 2 140 40 220 26 S340 8 400 20 V40 H0Z" />
          </svg>

          <button
            type="button"
            onClick={() => setClosed(true)}
            aria-label={t.closeAria}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-card text-foreground shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div
            className="absolute right-16 top-3 flex h-10 items-center gap-0.5 rounded-full bg-card p-1 shadow-md"
            role="group"
            aria-label={t.pageLanguage}
          >
            <LanguagesIcon className="mx-1.5 h-4 w-4 text-muted-foreground" />
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handlePageLangChange(l.code)}
                aria-pressed={lang === l.code}
                className={`h-8 min-w-8 rounded-full px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  lang === l.code ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                }`}
              >
                {l.short}
              </button>
            ))}
          </div>

          <div className="absolute bottom-10 right-3 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md sm:bottom-14 sm:right-5 sm:px-4 sm:py-2 sm:text-sm">
            <GoogleG className="h-4 w-4" /> {t.poweredByGoogle}
          </div>

          <div className="absolute left-4 top-4 sm:left-8 sm:top-8">
            <div className="relative">
            {shopInfo.logo_url ? (
              <img
                src={shopInfo.logo_url}
                alt={`${shopInfo.shop_name} logo`}
                width={160}
                height={160}
                className="h-24 w-24 rounded-full border-4 border-card bg-card object-cover shadow-lg sm:h-36 sm:w-36"
              />
            ) : (
              <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-card bg-card font-display text-4xl font-bold text-primary shadow-lg sm:h-36 sm:w-36 sm:text-6xl">
                {shopInfo.shop_name?.[0]}
              </div>
            )}
            {shopInfo.is_verified && (
              <span
                className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-card shadow sm:h-9 sm:w-9"
                role="img"
                aria-label={t.verified}
                title={t.verified}
              >
                <BadgeCheckIcon className="h-5 w-5 fill-primary text-primary-foreground sm:h-7 sm:w-7" />
              </span>
            )}
            </div>
          </div>
        </header>

        <div className="relative px-5 pb-6 pt-4 sm:px-10">
          {/* ---------- Rating ---------- */}
          <section className="text-center">
            <p className="mb-4 font-display text-lg font-semibold text-foreground">{shopInfo.shop_name}</p>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-4xl">{t.rateTitle}</h1>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:text-lg">
              {t.rateHelp} <HeartIcon className="h-4 w-4 shrink-0 text-destructive sm:h-5 sm:w-5" />
            </p>
            <div
              className="mt-6 flex items-center justify-center gap-1 sm:gap-3"
              role="group"
              aria-label={t.ratingAria}
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleSetRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onFocus={() => setHoverRating(n)}
                  onBlur={() => setHoverRating(0)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  aria-pressed={rating === n}
                  className="grid h-12 w-12 place-items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <StarIcon
                    filled={n <= activeRating}
                    className={`h-9 w-9 transition-colors motion-reduce:transition-none ${
                      n <= activeRating ? "text-star" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="mt-3 h-10 py-2 text-base font-medium text-muted-foreground" aria-live="polite">
              {t.ratings[activeRating]}
            </p>
          </section>

          {/* ---------- Name + services ---------- */}
          {showChips && (
            <section className="mt-2 grid gap-4">
              <label className="relative block">
                <span className="sr-only">{t.name}</span>
                <UserIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.name}
                  className="w-full rounded-2xl border border-lavender bg-muted/40 py-3 pl-11 pr-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </label>
              <ServiceMultiSelect
                options={shopInfo.services || []}
                selected={selectedServices}
                onChange={handleServicesChange}
                t={t}
              />
            </section>
          )}

          {/* ---------- What did you like? ---------- */}
          {showChips && (
            <section className="mt-6">
              <ServiceMultiSelect
                options={TAGS}
                selected={selectedTags}
                onChange={handleTagsChange}
                t={t}
                title={t.liked}
                showOptional={false}
                icon={<SparklesIcon className="h-5 w-5 fill-star text-star" />}
                renderOption={(tag) => tagLabel(lang, tag)}
              />
            </section>
          )}

          {/* ---------- Ready-made review ---------- */}
          {step === "review" && (
            <section className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display font-semibold text-foreground">{t.ready}</h3>
                <button
                  type="button"
                  onClick={() => fetchSuggestion()}
                  disabled={suggestionLoading || isTyping}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  <RefreshIcon className="h-3.5 w-3.5" /> {t.newSuggestion}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t.reviewLang}>
                <span className="text-xs text-muted-foreground">{t.reviewLang}:</span>
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleReviewLangChange(l.code)}
                    aria-pressed={reviewLang === l.code}
                    className={`rounded-full border px-3 py-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      reviewLang === l.code
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-lavender text-foreground hover:bg-muted"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 rounded-2xl border border-lavender bg-muted/40 p-4">
                {suggestionLoading ? (
                  <div role="status">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex gap-1" aria-hidden="true">
                        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-primary" />
                        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-primary/70" style={{ animationDelay: "0.3s" }} />
                        <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-primary/40" style={{ animationDelay: "0.6s" }} />
                      </span>
                      <span className="text-sm font-medium text-primary">{t.writing}</span>
                    </div>
                    <div className="space-y-2" aria-hidden="true">
                      <div className="shimmer h-4 w-full rounded-full" />
                      <div className="shimmer h-4 w-11/12 rounded-full" />
                      <div className="shimmer h-4 w-4/5 rounded-full" />
                      <div className="shimmer h-4 w-9/12 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <p className="min-h-[7.5rem] whitespace-pre-wrap text-base leading-relaxed text-foreground">
                    “{typedText}
                    {isTyping ? <span className="typing-cursor">|</span> : "”"}
                  </p>
                )}
                <button
                  type="button"
                  onClick={copyReview}
                  disabled={suggestionLoading || isTyping}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-base font-semibold transition disabled:opacity-40 ${
                    copied
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary bg-card text-primary hover:bg-primary/10"
                  }`}
                >
                  {copied ? <CheckIcon className="h-5 w-5" /> : <CopyIcon className="h-5 w-5" />}
                  {copied ? t.copied : isTyping ? t.aiWriting : t.copy}
                </button>
              </div>

              <ol className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                {t.steps.map((st, i) => (
                  <li key={st}>
                    <span className="font-semibold text-foreground">{i + 1}.</span> {st}
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={copyAndContinue}
                disabled={continuing || isTyping || suggestionLoading}
                className="mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-3 rounded-full bg-primary px-5 py-4 text-base font-medium text-primary-foreground shadow-float transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
              >
                {continuing ? (
                  <>
                    <Spinner />
                    {uploadingPhotos ? t.uploadingPhotos : t.redirecting}
                  </>
                ) : (
                  <>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card">
                      <GoogleG className="h-4 w-4" />
                    </span>
                    {t.cta} <ArrowRightIcon className="h-5 w-5" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">{t.ctaHint}</p>

              {/* ---------- Photos ---------- */}
              <div className="mt-6 rounded-2xl border-2 border-dashed border-lavender bg-muted/40 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  {photos.length < MAX_PHOTOS && (
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-lg focus-within:ring-2 focus-within:ring-primary/60">
                      <CameraIcon className="h-10 w-10 shrink-0 text-primary" strokeWidth={1.75} />
                      <span className="min-w-0">
                        <span className="block text-lg font-medium text-foreground">{t.addPhotos}</span>
                        <span className="block text-sm text-muted-foreground">{t.photosHint}</span>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotosPicked}
                        disabled={continuing}
                        className="sr-only"
                      />
                    </label>
                  )}
                  <div className="flex shrink-0 gap-2">
                    {photos.map((p, i) => (
                      <div key={p.id} className="relative h-16 w-16 overflow-hidden rounded-xl sm:h-24 sm:w-28">
                        <img src={p.preview} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          disabled={continuing}
                          aria-label={t.removePhoto}
                          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/80 text-card"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t.photosShared}</p>
              </div>
            </section>
          )}

          {/* ---------- Low rating: private feedback ---------- */}
          {step === "negative" && (
            <section className="fade-in mt-4">
              <div className="rounded-2xl border border-lavender bg-muted/40 p-4">
                <p className="font-display font-semibold text-foreground">{t.feedbackTitle}</p>
                <p className="mb-3 mt-1 text-sm text-muted-foreground">{t.feedbackHelp}</p>
                <textarea
                  rows={4}
                  placeholder={t.feedbackPlaceholder}
                  aria-label={t.feedbackTitle}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full resize-none rounded-xl border border-lavender bg-card p-3 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
                className="mx-auto mt-5 flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-base font-medium text-primary-foreground shadow-float transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
              >
                {submittingFeedback ? (
                  <>
                    <Spinner />
                    {t.submitting}
                  </>
                ) : (
                  t.submitFeedback
                )}
              </button>
            </section>
          )}

          {/* ---------- Thank you ---------- */}
          {step === "thankyou" && (
            <section className="fade-in py-6 text-center">
              <div className="pop-in mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
                <CheckIcon className="h-8 w-8" />
              </div>
              <h2 className="mb-1.5 font-display text-xl font-bold text-foreground">{t.thanks}</h2>
              <p className="text-sm text-muted-foreground">{t.thanksHelp}</p>
            </section>
          )}
        </div>

        <BusinessProfile shopInfo={shopInfo} t={t} />
      </div>

      <p className="px-4 pb-24 pt-5 text-center text-xs text-muted-foreground sm:pb-4">{t.poweredBy}</p>

      <InfinityBadge t={t} />

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label={t.chatWhatsApp}
          className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-float transition-transform hover:scale-105 hover:bg-emerald-600"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
