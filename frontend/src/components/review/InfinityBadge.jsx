import { useState } from "react";
import logo from "../../assets/itech-logo.jpg";
import { INFINITY } from "../../lib/infinity.js";
import { ArrowUpRightIcon, XIcon } from "./icons.jsx";

// Floating "website crafted by Infinity Technology Hub" badge. Sits at the
// bottom-left so it doesn't collide with the business's WhatsApp button on
// the right. Tap to open a small card; the card can be dismissed for the
// rest of the visit.
export default function InfinityBadge({ t }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col items-start gap-2">
      {open && (
        <div className="fade-in w-64 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="flex items-start gap-3">
            <img
              src={logo}
              alt={INFINITY.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug text-foreground">{t.badgeTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t.badgeSub}</p>
            </div>
            <button
              type="button"
              onClick={() => setHidden(true)}
              aria-label={t.dismiss}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <a
            href={INFINITY.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t.badgeLink} <ArrowUpRightIcon className="h-3 w-3" />
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={INFINITY.name}
        aria-expanded={open}
        className="h-12 w-12 overflow-hidden rounded-full border-2 border-card bg-card shadow-float transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <img src={logo} alt="" width={48} height={48} className="h-full w-full object-cover" />
      </button>
    </div>
  );
}
