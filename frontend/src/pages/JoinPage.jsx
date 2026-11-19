import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/itech-logo.jpg";
import { INFINITY } from "../lib/infinity.js";
import { ArrowLeftIcon, WhatsAppIcon } from "../components/review/icons.jsx";

const field =
  "w-full rounded-2xl border border-lavender bg-muted/40 px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary";

// "Join us" enquiry form, reached from the banner on the review page. It
// doesn't store anything: it opens WhatsApp to Infinity with the details
// pre-filled so the conversation continues there.
export default function JoinPage() {
  const [form, setForm] = useState({ name: "", phone: "", business: "", service: "", message: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.replace(/[^\d+]/g, "");
    if (!name || phone.length < 7) {
      setError("Please enter your name and a valid phone number.");
      return;
    }
    setError("");
    const text = [
      `Hi ${INFINITY.name}, I'd like to join.`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      form.business.trim() && `Business: ${form.business.trim()}`,
      form.service && `Interested in: ${form.service}`,
      form.message.trim() && `Message: ${form.message.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.location.href = `https://wa.me/${INFINITY.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  return (
    <main className="rv-theme min-h-screen font-review sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-lg bg-card px-5 py-6 shadow-card sm:rounded-3xl sm:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </button>
        <div className="mt-4 text-center">
          <img
            src={logo}
            alt={`${INFINITY.name} logo`}
            width={64}
            height={64}
            className="mx-auto h-16 w-16 rounded-full border border-border object-cover"
          />
          <h1 className="mt-3 font-display text-2xl font-semibold text-foreground">Join {INFINITY.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Share a few details — we'll continue on WhatsApp.</p>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-3">
          <input required maxLength={100} value={form.name} onChange={set("name")} placeholder="Your name *" className={field} />
          <input
            required
            type="tel"
            maxLength={20}
            value={form.phone}
            onChange={set("phone")}
            placeholder="Phone / WhatsApp number *"
            className={field}
          />
          <input maxLength={150} value={form.business} onChange={set("business")} placeholder="Business name (optional)" className={field} />
          <select value={form.service} onChange={set("service")} className={field}>
            <option value="">Service you're interested in (optional)</option>
            {INFINITY.services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <textarea
            maxLength={1000}
            rows={3}
            value={form.message}
            onChange={set("message")}
            placeholder="Anything you'd like to tell us? (optional)"
            className={field}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-base font-medium text-primary-foreground shadow-float transition hover:brightness-110 active:scale-[0.99]"
          >
            <WhatsAppIcon className="h-5 w-5" /> Send & continue on WhatsApp
          </button>
        </form>
      </div>
    </main>
  );
}
