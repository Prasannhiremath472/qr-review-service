import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  resolveQrCode,
  getReviewSuggestion,
  submitFeedback,
  sendFeedbackBeacon,
} from "../api/client.js";
import SetupPage from "./SetupPage.jsx";

const RATING_LABELS = { 1: "Very Poor", 2: "Poor", 3: "Average", 4: "Good", 5: "Excellent" };

export default function ReviewPage() {
  const { qrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shopInfo, setShopInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await resolveQrCode(qrId);
        if (cancelled) return;
        if (!data.success) {
          setError(data.message || "QR code not found.");
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
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <div className="app-card overflow-hidden">
            <div className="skeleton-block h-24 shimmer rounded-none" />
            <div className="p-6 space-y-4">
              <div className="skeleton-block h-4 w-1/2 mx-auto shimmer" />
              <div className="skeleton-block h-10 w-56 mx-auto shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center p-4">
        <div className="app-card fade-in max-w-sm w-full text-center px-8 py-10">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-zinc-900 mb-1.5">Oops!</h1>
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!shopInfo.is_linked) {
    return <SetupPage qrId={qrId} />;
  }

  return <ReviewFlow shopInfo={shopInfo} qrId={qrId} />;
}

function ReviewFlow({ shopInfo, qrId }) {
  const [customerName, setCustomerName] = useState("");
  const [serviceTaken, setServiceTaken] = useState("");
  const [rating, setRating] = useState(5);
  const [step, setStep] = useState("review"); // review | negative | thankyou
  const [reviewText, setReviewText] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (rating >= 4 && !fetchedOnce.current) {
      fetchedOnce.current = true;
      fetchSuggestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchSuggestion() {
    setSuggestionLoading(true);
    try {
      const { data } = await getReviewSuggestion({
        business_name: shopInfo.shop_name,
        business_type: shopInfo.business_type || "business",
        city: shopInfo.city || "your city",
        rating,
        service_taken: serviceTaken.trim(),
      });
      if (data.success && data.data && data.data.review) {
        setReviewText(data.data.review);
      } else {
        setReviewText("Had a wonderful experience! Great service and would definitely recommend.");
      }
    } catch (err) {
      setReviewText("Had a wonderful experience! Great service and would definitely recommend.");
    } finally {
      setSuggestionLoading(false);
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

  function copyReview() {
    navigator.clipboard.writeText(reviewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyAndContinue() {
    setContinuing(true);
    const payload = {
      shop_id: shopInfo.shop_id,
      qr_code_id: qrId,
      rating,
      message: `Redirected to Google Review${customerName.trim() ? ` (name: ${customerName.trim()})` : ""}${
        serviceTaken.trim() ? `, service: ${serviceTaken.trim()}` : ""
      }`,
    };

    const redirect = () => {
      sendFeedbackBeacon(payload);
      setTimeout(() => {
        window.location.href = shopInfo.review_url;
      }, 600);
    };

    navigator.clipboard.writeText(reviewText).then(redirect).catch(redirect);
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

  return (
    <div className="app-bg min-h-screen flex flex-col items-center p-4 py-8 sm:p-6">
      <div className="max-w-md w-full">
        <div className="app-card overflow-hidden fade-in">
          <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 px-6 py-6 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center gap-3.5 relative">
              {shopInfo.logo_url ? (
                <img
                  src={shopInfo.logo_url}
                  alt={`${shopInfo.shop_name} logo`}
                  className="w-[52px] h-[52px] rounded-2xl object-cover flex-shrink-0 bg-white/20"
                />
              ) : (
                <div className="w-[52px] h-[52px] bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {shopInfo.shop_name?.[0]}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight truncate">{shopInfo.shop_name}</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-amber-300 text-sm tracking-tight">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                  <span className="text-white/70 text-xs">Google Reviews</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-5 py-6 sm:px-7">
            <div className="space-y-3.5 mb-5">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="field-input w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Which service did you take?</label>
                <input
                  type="text"
                  placeholder="e.g. Haircut, Facial, Dine-in"
                  value={serviceTaken}
                  onChange={(e) => setServiceTaken(e.target.value)}
                  className="field-input w-full px-3.5 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-zinc-500 text-sm mb-3.5">Rate your experience</p>
              <div className="flex justify-center gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className={`star text-4xl sm:text-[2.75rem] ${n <= rating ? "active" : "inactive"}`}
                    onClick={() => handleSetRating(n)}
                  >
                    &#9733;
                  </button>
                ))}
              </div>
              <p className="text-xs text-violet-600 font-semibold mt-2 tracking-wide">{RATING_LABELS[rating]}</p>
            </div>

            {step === "review" && (
              <div>
                {suggestionLoading ? (
                  <div className="mb-4">
                    <div className="review-card rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1">
                          <span className="pulse-dot w-2 h-2 bg-violet-500 rounded-full inline-block"></span>
                          <span className="pulse-dot w-2 h-2 bg-violet-400 rounded-full inline-block" style={{ animationDelay: "0.3s" }}></span>
                          <span className="pulse-dot w-2 h-2 bg-violet-300 rounded-full inline-block" style={{ animationDelay: "0.6s" }}></span>
                        </div>
                        <span className="text-sm text-violet-600 font-medium">Writing your review...</span>
                      </div>
                      <div className="space-y-2">
                        <div className="shimmer h-4 rounded-full w-full"></div>
                        <div className="shimmer h-4 rounded-full w-11/12"></div>
                        <div className="shimmer h-4 rounded-full w-4/5"></div>
                        <div className="shimmer h-4 rounded-full w-9/12"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="slide-up mb-4">
                      <div className="review-card rounded-2xl p-4 relative">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Your Review</span>
                          <button
                            onClick={copyReview}
                            className="btn-ghost flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 px-2 py-1 rounded-lg hover:bg-violet-100"
                          >
                            {copied ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                            <span>{copied ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                        <textarea
                          rows={5}
                          readOnly
                          value={reviewText}
                          className="w-full bg-transparent text-[15px] text-zinc-700 leading-relaxed resize-none border-0 focus:ring-0 p-0"
                        />
                      </div>
                    </div>

                    <div className="slide-up">
                      <button
                        onClick={copyAndContinue}
                        disabled={continuing}
                        className="btn-gradient w-full text-white py-4 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2"
                      >
                        {continuing ? (
                          <>
                            <Spinner />
                            Copied! Redirecting...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy Review &amp; Continue
                          </>
                        )}
                      </button>
                      <p className="text-xs text-zinc-400 text-center mt-3">
                        Review will be copied. Paste it on Google Reviews page.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === "negative" && (
              <div className="fade-in">
                <div className="review-card rounded-2xl p-4 mb-4">
                  <p className="text-sm font-semibold text-zinc-700 mb-1.5">We value your feedback</p>
                  <p className="text-xs text-zinc-500 mb-3">Tell us how we can improve your experience</p>
                  <textarea
                    rows={4}
                    placeholder="Share your thoughts..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    className="field-input w-full p-3 bg-white border border-violet-200 rounded-xl text-[15px] text-zinc-700 placeholder-zinc-400 resize-none"
                  />
                </div>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={submittingFeedback}
                  className="btn-gradient w-full text-white py-4 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2"
                >
                  {submittingFeedback ? (
                    <>
                      <Spinner />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </div>
            )}

            {step === "thankyou" && (
              <div className="fade-in text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 pop-in">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-1.5">Thank You!</h2>
                <p className="text-zinc-500 text-sm">Your feedback means a lot to us.</p>
              </div>
            )}
          </div>
        </div>

        <BusinessInfoSection shopInfo={shopInfo} />

        <p className="text-center text-xs text-zinc-400 mt-5">Powered by GrowthOS</p>
      </div>

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/40 flex items-center justify-center transition-transform hover:scale-105 z-20"
        >
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0012.04 2zm0 18.15h-.003a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 012.41 5.83c0 4.55-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.36-.77-1.86-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.06 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.23-.17-.48-.29z" />
          </svg>
        </a>
      )}
    </div>
  );
}

function BusinessInfoSection({ shopInfo }) {
  const hasPhoto = !!shopInfo.photo_url;
  const hasGallery = Array.isArray(shopInfo.gallery_photos) && shopInfo.gallery_photos.length > 0;
  const hasAboutUs = !!shopInfo.about_us;
  const hasHours = !!shopInfo.open_hours;
  const hasFooterInfo = shopInfo.owner_name || shopInfo.contact_phone || shopInfo.contact_email || shopInfo.address;

  if (!hasPhoto && !hasGallery && !hasAboutUs && !hasHours && !hasFooterInfo) {
    return null;
  }

  return (
    <div className="app-card overflow-hidden fade-in mt-5">
      {hasPhoto && (
        <img src={shopInfo.photo_url} alt={shopInfo.shop_name} className="w-full h-44 object-cover" />
      )}

      {hasGallery && (
        <div className="px-5 pt-5 sm:px-7">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Gallery</h3>
          <div className="grid grid-cols-3 gap-2">
            {shopInfo.gallery_photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${shopInfo.shop_name} photo ${i + 1}`}
                className="w-full h-20 sm:h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {(hasAboutUs || hasHours) && (
        <div className="px-5 py-5 sm:px-7 space-y-4">
          {hasAboutUs && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">About Us</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">{shopInfo.about_us}</p>
            </div>
          )}
          {hasHours && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">Open Hours</h3>
              <p className="text-sm text-zinc-600 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-zinc-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                {shopInfo.open_hours}
              </p>
            </div>
          )}
        </div>
      )}

      {hasFooterInfo && (
        <div className="px-5 py-4 sm:px-7 bg-zinc-50 border-t border-zinc-100 space-y-1.5">
          {shopInfo.owner_name && (
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-600">Owner:</span> {shopInfo.owner_name}
            </p>
          )}
          {shopInfo.contact_phone && (
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <a href={`tel:${shopInfo.contact_phone}`} className="hover:text-violet-600">
                {shopInfo.contact_phone}
              </a>
            </p>
          )}
          {shopInfo.contact_email && (
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <a href={`mailto:${shopInfo.contact_email}`} className="hover:text-violet-600">
                {shopInfo.contact_email}
              </a>
            </p>
          )}
          {shopInfo.address && (
            <p className="text-xs text-zinc-500 flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {shopInfo.address}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  );
}
