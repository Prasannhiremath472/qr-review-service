import AppLayout from "../components/AppLayout.jsx";
import OwnerShopGate from "../components/OwnerShopGate.jsx";

export default function OwnerBusinessPage() {
  return (
    <OwnerShopGate title="My Business" subtitle="Your business profile">
      {(shop) => <BusinessProfile shop={shop} />}
    </OwnerShopGate>
  );
}

function BusinessProfile({ shop }) {
  return (
    <AppLayout title="My Business" subtitle={shop.name}>
      <div className="max-w-3xl space-y-5">
        <div className="app-card overflow-hidden fade-in">
          {shop.photo_url && <img src={shop.photo_url} alt={shop.name} className="w-full h-48 object-cover" />}
          <div className="p-5 sm:p-6 flex items-center gap-4">
            {shop.logo_url ? (
              <img src={shop.logo_url} alt="Logo" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-bold flex-shrink-0">
                {shop.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-zinc-900 truncate">{shop.name}</h2>
              <p className="text-sm text-zinc-500 capitalize">
                {shop.business_type || "business"}
                {shop.city ? ` · ${shop.city}` : ""}
              </p>
            </div>
          </div>
        </div>

        {Array.isArray(shop.gallery_photos) && shop.gallery_photos.length > 0 && (
          <div className="app-card p-5 sm:p-6 fade-in">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">Gallery</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {shop.gallery_photos.map((url, i) => (
                <img key={i} src={url} alt={`Gallery ${i + 1}`} className="w-full h-20 sm:h-24 object-cover rounded-lg" />
              ))}
            </div>
          </div>
        )}

        <div className="app-card p-5 sm:p-6 fade-in space-y-4">
          <Field label="About Us" value={shop.about_us} multiline />
          <Field label="Open Hours" value={shop.open_hours} />
          <Field label="Google Review URL" value={shop.review_url} link />
          <Field label="Owner Name" value={shop.owner_name} />
        </div>

        <div className="app-card p-5 sm:p-6 fade-in space-y-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Contact Details</h3>
          <Field label="WhatsApp Number" value={shop.whatsapp_number} />
          <Field label="Contact Phone" value={shop.contact_phone} />
          <Field label="Contact Email" value={shop.contact_email} />
          <Field label="Business Address" value={shop.address} multiline />
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          These details were collected during QR activation and are shown on your customer-facing review page.
          Contact your salesman or admin to make changes.
        </p>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, multiline, link }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-400 mb-1">{label}</p>
      {value ? (
        link ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-violet-600 hover:text-violet-800 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className={`text-sm text-zinc-800 ${multiline ? "leading-relaxed whitespace-pre-line" : ""}`}>{value}</p>
        )
      ) : (
        <p className="text-sm text-zinc-300">Not set</p>
      )}
    </div>
  );
}
