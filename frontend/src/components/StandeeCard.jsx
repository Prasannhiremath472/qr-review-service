import { useEffect, useRef, useState } from "react";

// Coordinates below are measured directly from public/standdee.jpeg's native
// 1066x1600 pixel space (blue/red logo-circle ring, dark business-name/
// tagline text bands, and the Google-quadrant QR border) — everything
// decorative (swooshes, stars, "Scan Here", step icons, footer) is baked
// into that image and drawn as-is; only the logo, name, tagline, and QR
// are dynamic, overlaid at these exact spots.
const TEMPLATE_URL = "/standdee.jpeg";
const CARD_WIDTH = 1066;
const CARD_HEIGHT = 1600;
const NAVY = "#0f1e3c";

const LOGO_CENTER_X = 533;
const LOGO_CENTER_Y = 130;
const LOGO_RADIUS = 88;

const NAME_CENTER_Y = 248;
const TAGLINE_CENTER_Y = 296;

const QR_BOX = { x: 339, y: 607, w: 365, h: 342 };

function loadImage(src, crossOrigin) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error("no src"));
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// drawStandee composites the business logo, name, tagline, and QR code
// onto the fixed standee template image. Used both for the live in-app
// preview and for the PNG download.
async function drawStandee(canvas, { businessName, tagline, logoUrl, qrImageUrl }) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  const template = await loadImage(TEMPLATE_URL);
  ctx.drawImage(template, 0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Logo — clipped to the circle already drawn on the template
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl, "anonymous");
      const maxDim = LOGO_RADIUS * 1.7;
      const scale = Math.min(maxDim / logo.width, maxDim / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(LOGO_CENTER_X, LOGO_CENTER_Y, LOGO_RADIUS - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.drawImage(logo, LOGO_CENTER_X - w / 2, LOGO_CENTER_Y - h / 2, w, h);
      ctx.restore();
    } catch (err) {
      // no logo provided or it failed to load — leave the template's
      // "YOUR LOGO HERE" placeholder circle showing through
    }
  }

  // Business name — clear just the placeholder text's own patch (well
  // clear of the corner swooshes, which only reach the outer ~230px).
  const NAME_PATCH_W = 620;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD_WIDTH / 2 - NAME_PATCH_W / 2, NAME_CENTER_Y - 30, NAME_PATCH_W, 60);
  ctx.fillStyle = NAVY;
  ctx.font = "bold 46px Arial";
  ctx.textAlign = "center";
  ctx.fillText((businessName || "Business Name").toUpperCase(), CARD_WIDTH / 2, NAME_CENTER_Y + 15, NAME_PATCH_W - 20);

  // Tagline
  const TAGLINE_PATCH_W = 480;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD_WIDTH / 2 - TAGLINE_PATCH_W / 2, TAGLINE_CENTER_Y - 15, TAGLINE_PATCH_W, 30);
  ctx.fillStyle = "#71717a";
  ctx.font = "600 17px Arial";
  ctx.fillText((tagline || "Your Tagline Here").toUpperCase(), CARD_WIDTH / 2, TAGLINE_CENTER_Y + 6, TAGLINE_PATCH_W - 20);

  // QR code, inset within the template's colored frame
  if (qrImageUrl) {
    try {
      const qr = await loadImage(qrImageUrl, "anonymous");
      const pad = 24;
      ctx.drawImage(qr, QR_BOX.x + pad, QR_BOX.y + pad, QR_BOX.w - pad * 2, QR_BOX.h - pad * 2);
    } catch (err) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "20px Arial";
      ctx.fillText("QR CODE", QR_BOX.x + QR_BOX.w / 2, QR_BOX.y + QR_BOX.h / 2);
    }
  }
}

// StandeeCard renders the branded printable standee for one QR code, live in
// the UI, and exposes a Download button that exports the same canvas as PNG.
export default function StandeeCard({ businessName, tagline, logoUrl, qrImageUrl, filename }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    drawStandee(canvasRef.current, { businessName, tagline, logoUrl, qrImageUrl }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [businessName, tagline, logoUrl, qrImageUrl]);

  function handleDownload() {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "qr-standee.png";
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[280px] h-auto rounded-lg border border-zinc-200 shadow-sm"
      />
      <button
        type="button"
        onClick={handleDownload}
        disabled={!ready}
        className="btn-ghost w-full max-w-[280px] inline-flex items-center justify-center gap-1.5 bg-zinc-700 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {ready ? "Download Standee" : "Rendering..."}
      </button>
    </div>
  );
}
