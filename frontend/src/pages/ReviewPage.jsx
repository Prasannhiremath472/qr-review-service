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
      message: "Redirected to Google Review",
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

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4 py-8 sm:p-6">
      <div className="max-w-md w-full">
        <div className="app-card overflow-hidden fade-in">
          <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-purple-700 px-6 py-6 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="flex items-center gap-3.5 relative">
              <div className="w-13 h-13 w-[52px] h-[52px] bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {shopInfo.shop_name?.[0]}
              </div>
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

        <p className="text-center text-xs text-zinc-400 mt-5">Powered by GrowthOS</p>
      </div>
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
