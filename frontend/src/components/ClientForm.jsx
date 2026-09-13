import { useState } from "react";
import { uploadShopPhoto } from "../api/client.js";

const MAX_GALLERY_PHOTOS = 5;

// ClientForm collects the same business profile fields used during QR
// activation. Used by the admin "Add Client" flow, which creates a shop
// directly (a QR code can be generated/linked to it separately afterward).
export default function ClientForm({ onSubmit, submitLabel = "Add Client" }) {
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("business");
  const [city, setCity] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
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

  async function handleSubmit(e) {
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

      const result = await onSubmit({
        name: businessName.trim(),
        business_type: businessType,
        city: city.trim(),
        review_url: reviewUrl.trim(),
        owner_name: ownerName.trim(),
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

      if (!result?.success) {
        setError(result?.message || "Failed to save client");
        setSubmitting(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="app-card p-5 sm:p-6 space-y-4 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Name *</label>
          <input
            type="text"
            placeholder="e.g. Sambha Bhel"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Type</label>
          <select
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-white"
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
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Owner Name</label>
          <input
            type="text"
            placeholder="Contact person name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Google Review URL *</label>
        <input
          type="url"
          placeholder="https://g.page/r/XXXXX/review"
          value={reviewUrl}
          onChange={(e) => setReviewUrl(e.target.value)}
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>

      <div className="pt-2 border-t border-zinc-100">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
          Customer-facing page details (optional)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Logo</label>
          <div className="flex items-center gap-3">
            {logoPreview && (
              <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-cover rounded-xl flex-shrink-0" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoChange}
              className="field-input flex-1 px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50/60 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-xs file:font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Photo</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="field-input w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50/60 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-xs file:font-medium"
          />
          {photoPreview && <img src={photoPreview} alt="Preview" className="w-full h-20 object-cover rounded-xl mt-2" />}
        </div>
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
            className="field-input w-full px-3 py-2 border border-zinc-200 rounded-xl text-xs bg-zinc-50/60 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-xs file:font-medium"
          />
        )}
        {galleryFiles.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-2">
            {galleryFiles.map((file, i) => (
              <div key={i} className="relative">
                <img src={file.preview} alt={`Gallery ${i + 1}`} className="w-full h-16 object-cover rounded-lg" />
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
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">About Us</label>
        <textarea
          rows={2}
          placeholder="A short description of the business"
          value={aboutUs}
          onChange={(e) => setAboutUs(e.target.value)}
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Open Hours</label>
          <input
            type="text"
            placeholder="e.g. Mon-Sat 10am - 9pm"
            value={openHours}
            onChange={(e) => setOpenHours(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">WhatsApp Number</label>
          <input
            type="tel"
            placeholder="e.g. 919876543210"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contact Phone</label>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Contact Email</label>
          <input
            type="email"
            placeholder="e.g. contact@business.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Business Address</label>
        <input
          type="text"
          placeholder="Full address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="field-input w-full px-4 py-2.5 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60"
        />
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 px-4 py-2.5 rounded-xl">{error}</div>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-gradient text-white py-2.5 px-6 rounded-xl font-semibold text-sm inline-flex items-center gap-2"
      >
        {submitting && <Spinner />}
        {submitting ? uploadStatus || "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  );
}
