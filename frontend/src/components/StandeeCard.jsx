import { useEffect, useRef, useState } from "react";

// Coordinates below are measured directly from public/standdee.jpeg's native
// 1066x1600 pixel space (blue/red logo-circle ring, dark business-name/
// tagline text bands, and the Google-quadrant QR border) — everything
// decorative (swooshes, stars, "Scan Here", step icons, footer) is baked
// into that image and drawn as-is; only the logo, name, tagline, and QR
// are dynamic, overlaid at these exact spots.
const TEMPLATE_URL = "/standdee.jpeg";
const TEMPLATE_WIDTH = 1066;
const TEMPLATE_HEIGHT = 1600;

// Printed standee target: 4in x 6in at 300 DPI, so it sticks to a standard
// acrylic desk stand at the right physical size. The template is already a
// ~2:3 ratio, so this is a straight upscale — coordinates below are scaled
// by the same factor so the overlay still lines up with the template art.
const PRINT_DPI = 300;
const CARD_WIDTH = 4 * PRINT_DPI;
const CARD_HEIGHT = 6 * PRINT_DPI;
const SCALE_X = CARD_WIDTH / TEMPLATE_WIDTH;
const SCALE_Y = CARD_HEIGHT / TEMPLATE_HEIGHT;

const NAVY = "#0f1e3c";

const LOGO_CENTER_X = 533 * SCALE_X;
const LOGO_CENTER_Y = 130 * SCALE_Y;
const LOGO_RADIUS = 88 * SCALE_Y;

const NAME_CENTER_Y = 248 * SCALE_Y;
const TAGLINE_CENTER_Y = 296 * SCALE_Y;

const QR_BOX = {
  x: 339 * SCALE_X,
  y: 607 * SCALE_Y,
  w: 365 * SCALE_X,
  h: 342 * SCALE_Y,
};

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

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
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

  // Logo — clipped to a circle. Paints over the template's gray "YOUR LOGO
  // HERE" ring first so a real logo shows with no border around it.
  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl, "anonymous");
      const maxDim = LOGO_RADIUS * 1.7;
      const scale = Math.min(maxDim / logo.width, maxDim / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(LOGO_CENTER_X, LOGO_CENTER_Y, LOGO_RADIUS + 6, 0, Math.PI * 2);
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
  const NAME_PATCH_W = 620 * SCALE_X;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD_WIDTH / 2 - NAME_PATCH_W / 2, NAME_CENTER_Y - 30 * SCALE_Y, NAME_PATCH_W, 60 * SCALE_Y);
  ctx.fillStyle = NAVY;
  ctx.font = `bold ${46 * SCALE_Y}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText(
    (businessName || "Business Name").toUpperCase(),
    CARD_WIDTH / 2,
    NAME_CENTER_Y + 15 * SCALE_Y,
    NAME_PATCH_W - 20 * SCALE_X
  );

  // Tagline
  const TAGLINE_PATCH_W = 480 * SCALE_X;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(CARD_WIDTH / 2 - TAGLINE_PATCH_W / 2, TAGLINE_CENTER_Y - 15 * SCALE_Y, TAGLINE_PATCH_W, 30 * SCALE_Y);
  ctx.fillStyle = "#71717a";
  ctx.font = `600 ${17 * SCALE_Y}px Arial`;
  ctx.fillText(
    (tagline || "Your Tagline Here").toUpperCase(),
    CARD_WIDTH / 2,
    TAGLINE_CENTER_Y + 6 * SCALE_Y,
    TAGLINE_PATCH_W - 20 * SCALE_X
  );

  // QR code, inset within the template's colored frame — enough pad that
  // the colored border stays fully visible on every side, with its own
  // corners rounded to match the frame.
  if (qrImageUrl) {
    try {
      const qr = await loadImage(qrImageUrl, "anonymous");
      const padX = 4 * SCALE_X;
      const padTop = 14 * SCALE_Y;
      const padBottom = 4 * SCALE_Y;
      const qx = QR_BOX.x + padX;
      const qy = QR_BOX.y + padTop;
      const qw = QR_BOX.w - padX * 2;
      const qh = QR_BOX.h - padTop - padBottom;
      const qrRadius = 18 * SCALE_X;
      ctx.save();
      roundRectPath(ctx, qx, qy, qw, qh, qrRadius);
      ctx.clip();
      ctx.drawImage(qr, qx, qy, qw, qh);
      ctx.restore();
    } catch (err) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = `${20 * SCALE_Y}px Arial`;
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
      <p className="text-[11px] text-zinc-400 -mt-1.5">Prints at 4&quot; x 6&quot; (300 DPI)</p>
    </div>
  );
}
