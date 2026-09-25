import { useState } from "react";
import { Link } from "react-router-dom";
import { activateQrCode, uploadShopPhoto } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { BUSINESS_TYPES } from "../constants/businessTypes.js";
import { resolveReviewUrl, REVIEW_URL_PREFIX } from "../lib/googleReview.js";
import ResolvedUrlPreview from "../components/ResolvedUrlPreview.jsx";

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

const MAX_GALLERY_PHOTOS = 5;
const CUSTOM_TYPE_VALUE = "__custom__";

function ActivationForm({ qrId }) {
  const [activated, setActivated] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("business");
  const [isCustomType, setIsCustomType] = useState(false);
  const [city, setCity] = useState("");
  const [reviewUrl, setReviewUrl] = useState(REVIEW_URL_PREFIX);
  const [ownerName, setOwnerName] = useState("");
  const [tagline, setTagline] = useState("");
  const [aboutUs, setAboutUs] = useState("");
  const [openHours, setOpenHours] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function handleGalleryChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const combined = [...galleryFiles, ...files].slice(0, MAX_GALLERY_PHOTOS);
    setGalleryFiles(
      combined.map((f) => (f.preview ? f : Object.assign(f, { preview: URL.createObjectURL(f) })))
    );
    e.target.value = "";
  }

  function removeGalleryFile(index) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleActivate(e) {
    e.preventDefault();
    setError("");
    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }
    if (!resolveReviewUrl(reviewUrl)) {
      setError("Google Review URL or Place ID is required");
      return;
    }
    if (isCustomType && !businessType.trim()) {
      setError("Enter a business type or pick one from the list");
      return;
    }

    setSubmitting(true);
    try {
      let logoUrl = "";
      if (logoFile) {
        setUploadStatus("Uploading logo...");
        const { data: uploadData } = await uploadShopPhoto(logoFile, "logo");
        if (uploadData.success) logoUrl = uploadData.data.url;
      }

      let photoUrl = "";
      if (photoFile) {
        setUploadStatus("Uploading photo...");
        const { data: uploadData } = await uploadShopPhoto(photoFile);
        if (uploadData.success) photoUrl = uploadData.data.url;
      }

      const galleryUrls = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        setUploadStatus(`Uploading gallery photo ${i + 1} of ${galleryFiles.length}...`);
        const { data: uploadData } = await uploadShopPhoto(galleryFiles[i]);
        if (uploadData.success) galleryUrls.push(uploadData.data.url);
      }
      setUploadStatus("");

      const { data } = await activateQrCode(qrId, {
        business_name: businessName.trim(),
        business_type: businessType,
        city: city.trim(),
        review_url: resolveReviewUrl(reviewUrl),
        owner_name: ownerName.trim(),
        tagline: tagline.trim(),
        about_us: aboutUs.trim(),
        open_hours: openHours.trim(),
        whatsapp_number: whatsappNumber.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        address: address.trim(),
        logo_url: logoUrl,
        photo_url: photoUrl,
        gallery_photos: galleryUrls,
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
                  value={isCustomType ? CUSTOM_TYPE_VALUE : businessType}
                  onChange={(e) => {
                    if (e.target.value === CUSTOM_TYPE_VALUE) {
                      setIsCustomType(true);
                      setBusinessType("");
                    } else {
                      setIsCustomType(false);
                      setBusinessType(e.target.value);
                    }
                  }}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-white"
                >
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                  <option value={CUSTOM_TYPE_VALUE}>+ Add custom type...</option>
                </select>
                {isCustomType && (
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter business type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60 mt-2"
                  />
                )}
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
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Google Review URL or Place ID *</label>
                <input
                  type="text"
                  value={reviewUrl}
                  onChange={(e) => setReviewUrl(e.target.value)}
                  onFocus={(e) => {
                    if (e.target.value === REVIEW_URL_PREFIX) {
                      const end = e.target.value.length;
                      e.target.setSelectionRange(end, end);
                    }
                  }}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60 font-mono"
                />
                <ResolvedUrlPreview input={reviewUrl} />
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Find the Place ID via{" "}
                  <a
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 hover:underline"
                  >
                    Google's Place ID Finder
                  </a>{" "}
                  and paste it right after <code className="font-mono">placeid=</code> &mdash; or paste a full review
                  link to replace this entirely.
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Great Food, Great Vibes"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
                <p className="text-xs text-zinc-400 mt-1.5">Shown on the printable QR standee card</p>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                  Optional — for the customer-facing page
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Logo</label>
                <div className="flex items-center gap-3">
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleLogoChange}
                    className="field-input flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium"
                  />
                </div>
                <p className="text-xs text-zinc-400 mt-1.5">Shown as a small icon on the review page header</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Photo</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium"
                />
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-2" />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Gallery Photos ({galleryFiles.length}/{MAX_GALLERY_PHOTOS})
                </label>
                {galleryFiles.length < MAX_GALLERY_PHOTOS && (
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryChange}
                    className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium"
                  />
                )}
                {galleryFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {galleryFiles.map((file, i) => (
                      <div key={i} className="relative">
                        <img src={file.preview} alt={`Gallery ${i + 1}`} className="w-full h-20 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeGalleryFile(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 text-white rounded-full flex items-center justify-center text-xs"
                          aria-label="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-zinc-400 mt-1.5">Storefront, interior, products — up to {MAX_GALLERY_PHOTOS} photos</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">About Us</label>
                <textarea
                  rows={3}
                  placeholder="A short description of the business"
                  value={aboutUs}
                  onChange={(e) => setAboutUs(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Open Hours</label>
                <input
                  type="text"
                  placeholder="e.g. Mon-Sat 10am - 9pm"
                  value={openHours}
                  onChange={(e) => setOpenHours(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. contact@business.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="field-input w-full px-4 py-3 border border-zinc-200 rounded-xl text-[15px] bg-zinc-50/60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Address</label>
                <input
                  type="text"
                  placeholder="Full address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
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
                    {uploadStatus || "Activating..."}
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

        <p className="text-center text-xs text-zinc-400 mt-5">Powered by Infinity Technology Hub</p>
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
