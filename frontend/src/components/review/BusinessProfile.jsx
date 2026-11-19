import { useState } from "react";
import { Link } from "react-router-dom";
import PhotoLightbox from "../PhotoLightbox.jsx";
import {
  ArrowUpRightIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  ClockIcon,
  HomeIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneIcon,
  UserIcon,
  UserPlusIcon,
  WhatsAppIcon,
  CheckIcon,
} from "./icons.jsx";

// Business "website" block shown under the review card: identity header,
// quick contact actions, about, services, gallery, hours, contact details and
// a section nav. Every section renders only when the business has the data.
export default function BusinessProfile({ shopInfo, t }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const services = Array.isArray(shopInfo.services) ? shopInfo.services : [];
  const gallery = Array.isArray(shopInfo.gallery_photos) ? shopInfo.gallery_photos : [];
  const hasAbout = !!shopInfo.about_us;
  const hasHours =
    (Array.isArray(shopInfo.business_hours) && shopInfo.business_hours.length > 0) || !!shopInfo.open_hours;
  const hasAddress = !!shopInfo.address;
  const hasContact = !!(shopInfo.contact_phone || shopInfo.contact_email || shopInfo.whatsapp_number);
  const hasVisitInfo = !!shopInfo.owner_name || hasAddress || hasHours;

  const mapsHref = hasAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopInfo.address)}`
    : "";
  const waHref = shopInfo.whatsapp_number ? `https://wa.me/${shopInfo.whatsapp_number.replace(/[^0-9]/g, "")}` : "";
  const telHref = shopInfo.contact_phone ? `tel:${shopInfo.contact_phone}` : "";
  const mailHref = shopInfo.contact_email ? `mailto:${shopInfo.contact_email}` : "";

  const category = (shopInfo.business_type || "").replace(/_/g, " ");

  const actions = [
    telHref && { key: "call", icon: PhoneIcon, label: t.call, href: telHref },
    waHref && { key: "wa", icon: WhatsAppIcon, label: t.whatsapp, href: waHref, external: true },
    mapsHref && { key: "dir", icon: NavigationIcon, label: t.directions, href: mapsHref, external: true },
    mailHref && { key: "mail", icon: MailIcon, label: t.email, href: mailHref },
  ].filter(Boolean);

  const contactRows = [
    telHref && { key: "phone", icon: PhoneIcon, value: shopInfo.contact_phone, href: telHref },
    waHref && { key: "wa", icon: WhatsAppIcon, value: t.chatWhatsApp, href: waHref, external: true },
    mailHref && { key: "mail", icon: MailIcon, value: shopInfo.contact_email, href: mailHref },
  ].filter(Boolean);

  const navItems = [
    { icon: HomeIcon, label: t.home, href: "#business-home" },
    hasAbout && { icon: InfoIcon, label: t.about, href: "#business-about" },
    services.length > 0 && { icon: BriefcaseIcon, label: t.services, href: "#business-services" },
    (hasContact || hasVisitInfo) && { icon: MailIcon, label: t.contact, href: "#business-contact" },
  ].filter(Boolean);

  return (
    <section aria-label="Business details" className="mt-8 border-t border-border bg-muted/40 text-foreground">
      <header
        id="business-home"
        className="scroll-mt-6 border-b-4 border-star bg-card px-5 pb-7 pt-8 text-center sm:px-10"
      >
        {shopInfo.logo_url ? (
          <img
            src={shopInfo.logo_url}
            alt={`${shopInfo.shop_name} logo`}
            width={80}
            height={80}
            className="mx-auto h-20 w-20 rounded-full border-2 border-border object-cover shadow-sm"
          />
        ) : null}
        <h2 className="mx-auto mt-4 max-w-md font-display text-2xl font-semibold leading-tight">{shopInfo.shop_name}</h2>
        {category && <p className="mt-2 text-sm capitalize text-muted-foreground">{category}</p>}
        {shopInfo.city && <p className="mt-3 text-xs text-muted-foreground">{shopInfo.city}</p>}
        <div className="mx-auto mt-4 h-0.5 w-10 bg-star" />
      </header>

      {(actions.length > 0 || contactRows.length > 0) && (
        <div className="px-5 py-5 sm:px-10">
          {actions.length > 0 && (
            <nav
              aria-label={t.quickContact}
              className={`grid gap-2 ${contactRows.length ? "border-b border-border pb-5" : ""}`}
              style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
            >
              {actions.map(({ key, icon: Icon, label, href, external }) => (
                <a
                  key={key}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="group flex flex-col items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-star-soft text-foreground transition group-hover:bg-star/30">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </a>
              ))}
            </nav>
          )}
          {contactRows.length > 0 && (
            <div className="mt-5 grid gap-3">
              {contactRows.map(({ key, icon: Icon, value, href, external }) => (
                <a
                  key={key}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className="flex min-h-12 items-center gap-3 rounded-full border border-border bg-card px-3 py-2 text-left shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-star-soft text-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 break-all text-sm">{value}</span>
                  <ArrowUpRightIcon className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {hasAbout && (
        <section id="business-about" className="scroll-mt-6 border-t border-border px-5 py-6 sm:px-10">
          <h2 className="font-display text-lg font-semibold">{t.about}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{shopInfo.about_us}</p>
        </section>
      )}

      {services.length > 0 && (
        <section id="business-services" className="scroll-mt-6 border-t border-border bg-card px-5 py-6 sm:px-10">
          <h2 className="font-display text-lg font-semibold">{t.services}</h2>
          <ul className="mt-3 grid gap-x-6 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service} className="flex items-start gap-3 border-b border-border py-4 last:border-b-0">
                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.6} />
                <span className="text-sm font-medium leading-6">{service}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="border-t border-border px-5 py-6 sm:px-10">
        <Link
          to="/join"
          className="group relative block overflow-hidden rounded-3xl bg-primary p-5 text-primary-foreground shadow-float transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 sm:p-6"
        >
          <span aria-hidden="true" className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-star/30" />
          <span aria-hidden="true" className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-primary-foreground/10" />
          <div className="relative flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-star text-foreground shadow-md">
              <UserPlusIcon className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <span className="inline-block rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
                {t.joinTag}
              </span>
              <p className="mt-1.5 font-display text-xl font-bold leading-tight sm:text-2xl">{t.joinTitle}</p>
              <p className="mt-1 text-sm text-primary-foreground/80">{t.joinText}</p>
            </div>
          </div>
          <span className="relative mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-card py-3 text-base font-semibold text-primary transition group-hover:gap-3">
            {t.joinCta} <ArrowUpRightIcon className="h-5 w-5" />
          </span>
        </Link>
      </div>

      {gallery.length > 0 && (
        <section className="border-t border-border px-5 py-6 sm:px-10">
          <h2 className="font-display text-lg font-semibold">{t.gallery}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative aspect-square overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <img
                  src={url}
                  alt={`${shopInfo.shop_name} photo ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {(hasContact || hasVisitInfo) && (
        <section id="business-contact" className="scroll-mt-6 border-t border-border bg-card px-5 py-6 sm:px-10">
          <h2 className="font-display text-lg font-semibold">{t.visit}</h2>
          <div className="mt-4 grid gap-4 text-sm leading-6">
            {shopInfo.owner_name && (
              <p className="flex items-center gap-3">
                <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                {shopInfo.owner_name}
              </p>
            )}
            {hasAddress && (
              <div className="flex items-start gap-3">
                <MapPinIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>{shopInfo.address}</p>
              </div>
            )}
            {hasHours && (
              <div className="flex items-start gap-3">
                <ClockIcon className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {Array.isArray(shopInfo.business_hours) && shopInfo.business_hours.length > 0 ? (
                    <WeeklyHours businessHours={shopInfo.business_hours} t={t} />
                  ) : (
                    <p className="text-muted-foreground">{shopInfo.open_hours}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <NavigationIcon className="h-4 w-4" /> {t.getDirections} <ArrowUpRightIcon className="h-4 w-4" />
            </a>
          )}
        </section>
      )}

      {navItems.length > 1 && (
        <nav
          aria-label={t.sections}
          className="grid border-t border-star/40 bg-star-soft px-3 py-3"
          style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
        >
          {navItems.map(({ icon: Icon, label, href }) => (
            <a
              key={href}
              href={href}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs transition hover:bg-star/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={gallery}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          altPrefix={shopInfo.shop_name}
        />
      )}
    </section>
  );
}

function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// Checks the given day's entry against the current time, handling overnight
// ranges (close < open means it crosses midnight into the next day).
function isOpenNow(entry, nowMinutes) {
  if (!entry || entry.closed || !entry.open || !entry.close) return false;
  const [oh, om] = entry.open.split(":").map(Number);
  const [ch, cm] = entry.close.split(":").map(Number);
  const openMin = oh * 60 + om;
  const closeMin = ch * 60 + cm;
  if (closeMin > openMin) return nowMinutes >= openMin && nowMinutes < closeMin;
  return nowMinutes >= openMin || nowMinutes < closeMin;
}

// Google-Business-Profile-style hours: today's status on one line,
// expandable into the full week with today highlighted.
function WeeklyHours({ businessHours, t }) {
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const todayIndex = now.getDay(); // 0=Sunday, matches business_hours' day field
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const byDay = new Map(businessHours.map((d) => [d.day, d]));
  const today = byDay.get(todayIndex);
  const openNow = isOpenNow(today, nowMinutes);
  const todayLabel =
    !today || today.closed ? t.closedToday : `${formatTime12h(today.open)} – ${formatTime12h(today.close)}`;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className={`font-semibold ${openNow ? "text-emerald-700" : "text-destructive"}`}>
            {openNow ? t.openNow : t.closed}
          </span>
          <span className="text-muted-foreground">&middot;</span>
          <span className="truncate text-muted-foreground">{todayLabel}</span>
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="fade-in mt-3 space-y-1">
          {t.days.map((label, day) => {
            const entry = byDay.get(day);
            const isToday = day === todayIndex;
            return (
              <div
                key={day}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                  isToday ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                <span>{label}</span>
                <span>{!entry || entry.closed ? t.closed : `${formatTime12h(entry.open)} – ${formatTime12h(entry.close)}`}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
