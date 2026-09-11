import { useState } from "react";
import { Link } from "react-router-dom";
import { activateQrCode } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function SetupPage({ qrId }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="app-bg min-h-screen" />;
  }

  if (!user || (user.role !== "ADMIN" && user.role !== "SALESMAN")) {
    return <ActivationLoginPrompt qrId={qrId} loggedInAsWrongRole={!!user} />;
  }

  return <ActivationForm qrId={qrId} />;
}

function ActivationLoginPrompt({ qrId, loggedInAsWrongRole }) {
  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="app-card fade-in overflow-hidden max-w-md w-full">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-6 text-white">
          <h1 className="text-lg font-bold">Activate QR Code</h1>
          <p className="text-white/70 text-xs mt-0.5">QR ID: {qrId}</p>
        </div>
        <div className="px-6 py-8 sm:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
            {loggedInAsWrongRole
              ? "Only salesman or admin accounts can activate a QR code."
              : "Sign in with your salesman or admin account to activate this QR code."}
          </p>
          {!loggedInAsWrongRole && (
            <Link
              to="/login"
              state={{ from: { pathname: `/r/${qrId}` } }}
              className="btn-gradient inline-flex items-center justify-center text-white py-3 px-7 rounded-xl font-semibold text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivationForm({ qrId }) {
  const [activated, setActivated] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("business");
  const [city, setCity] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleActivate(e) {
    e.preventDefault();
    setError("");
    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }
    if (!reviewUrl.trim()) {
      setError("Google Review URL is required");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await activateQrCode(qrId, {
        business_name: businessName.trim(),
        business_type: businessType,
        city: city.trim(),
        review_url: reviewUrl.trim(),
        owner_name: ownerName.trim(),
      });

      if (data.success) {
        setActivated(true);
      } else {
        setError(data.message || "Activation failed");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function testQR() {
    window.location.href = `/r/${qrId}`;
  }

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4 py-8 sm:p-6">
      <div className="max-w-md w-full">
        {!activated ? (
          <div className="app-card overflow-hidden fade-in">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-6 text-white relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="flex items-center gap-3.5 relative">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Activate QR Code</h1>
                  <p className="text-white/70 text-xs mt-0.5">QR ID: {qrId}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleActivate} className="px-5 py-6 sm:px-7 space-y-4">
              <p className="text-sm text-zinc-500 -mt-1">
                Connect this QR code to a business. Customers scanning it will be able to leave Google Reviews.
              </p>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sambha Bhel"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-white"
                >
                  <option value="restaurant">Restaurant / Food</option>
                  <option value="salon">Salon / Spa</option>
                  <option value="hotel">Hotel / Stay</option>
                  <option value="clinic">Clinic / Hospital</option>
                  <option value="shop">Retail Shop</option>
                  <option value="gym">Gym / Fitness</option>
                  <option value="service">Service Provider</option>
                  <option value="business">Other Business</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">City</label>
                <input
                  type="text"
                  placeholder="e.g. Sangli"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Google Review URL *</label>
                <input
                  type="url"
                  placeholder="https://g.page/r/XXXXX/review"
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Search your business on Google Maps &rarr; Share &rarr; Copy link, or use the "Write a review" URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Owner Name</label>
                <input
                  type="text"
                  placeholder="Contact person name"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient w-full text-white py-4 rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <>
                    <Spinner />
                    Activating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Activate QR Code
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="app-card overflow-hidden fade-in">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-6 text-white">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center pop-in">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold">QR Code Activated!</h1>
                  <p className="text-white/70 text-xs mt-0.5">Successfully connected</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-8 text-center">
              <p className="text-zinc-800 font-semibold mb-1.5">{businessName}</p>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                This QR code is now live. Customers scanning it will see the review page.
              </p>
              <button onClick={testQR} className="btn-gradient w-full text-white py-3.5 rounded-xl font-semibold text-sm">
                Test QR Code
              </button>
            </div>
          </div>
        )}

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
