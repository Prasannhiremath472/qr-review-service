import { useEffect, useRef, useState } from "react";

const CARD_WIDTH = 640;
const CARD_HEIGHT = 1180;
const NAVY = "#0f1e3c";
const GOLD = "#c9a24b";

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// drawStandee renders the branded printable QR standee onto a canvas:
// business logo, name, tagline, QR code, scan steps, and a phone footer.
// Used both for the live in-app preview and for the PNG download.
async function drawStandee(canvas, { businessName, tagline, logoUrl, qrImageUrl, phone }) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Top navy/gold corner accent
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(180, 0);
  ctx.lineTo(0, 130);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(200, 0);
  ctx.lineTo(0, 150);
  ctx.stroke();

  // Bottom navy/gold corner accent (mirrored) — kept small so it never
  // overlaps the footer text above it.
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH, CARD_HEIGHT);
  ctx.lineTo(CARD_WIDTH - 90, CARD_HEIGHT);
  ctx.lineTo(CARD_WIDTH, CARD_HEIGHT - 65);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH - 105, CARD_HEIGHT);
  ctx.lineTo(CARD_WIDTH, CARD_HEIGHT - 80);
  ctx.stroke();

  let y = 55;

  // Logo (or letter-avatar fallback) in a dashed placeholder box
  const logoBoxW = 260;
  const logoBoxH = 90;
  const logoBoxX = (CARD_WIDTH - logoBoxW) / 2;
  ctx.save();
  ctx.strokeStyle = "#cbd5e1";
  ctx.setLineDash([6, 5]);
  ctx.lineWidth = 2;
  roundRect(ctx, logoBoxX, y, logoBoxW, logoBoxH, 14);
  ctx.stroke();
  ctx.restore();

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl, "anonymous");
      const maxDim = 72;
      const scale = Math.min(maxDim / logo.width, maxDim / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      ctx.drawImage(logo, CARD_WIDTH / 2 - w / 2, y + logoBoxH / 2 - h / 2, w, h);
    } catch (err) {
      // fall through to no logo drawn — the dashed box stays empty
    }
  }
  y += logoBoxH + 45;

  // Business name
  ctx.fillStyle = NAVY;
  ctx.font = "bold 40px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.fillText((businessName || "Your Business").toUpperCase(), CARD_WIDTH / 2, y, CARD_WIDTH - 80);
  y += 34;

  // Tagline with flanking rules
  const taglineText = (tagline || "AI Reviews Made Simple").toUpperCase();
  ctx.font = "600 15px Arial";
  ctx.fillStyle = "#8a8f98";
  const taglineWidth = ctx.measureText(taglineText).width;
  ctx.fillText(taglineText, CARD_WIDTH / 2, y);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH / 2 - taglineWidth / 2 - 40, y - 5);
  ctx.lineTo(CARD_WIDTH / 2 - taglineWidth / 2 - 12, y - 5);
  ctx.moveTo(CARD_WIDTH / 2 + taglineWidth / 2 + 12, y - 5);
  ctx.lineTo(CARD_WIDTH / 2 + taglineWidth / 2 + 40, y - 5);
  ctx.stroke();
  y += 55;

  // "How Was Your Experience?" heading
  ctx.fillStyle = NAVY;
  ctx.font = "34px Georgia, 'Times New Roman', serif";
  ctx.fillText("How Was Your", CARD_WIDTH / 2, y);
  y += 48;
  ctx.fillStyle = GOLD;
  ctx.font = "bold 54px Georgia, 'Times New Roman', serif";
  ctx.fillText("Experience?", CARD_WIDTH / 2, y);
  y += 34;

  ctx.fillStyle = "#52525b";
  ctx.font = "18px Arial";
  ctx.fillText("Share Your Feedback With Us", CARD_WIDTH / 2, y);
  y += 40;

  // QR code box
  const qrBoxSize = 300;
  const qrBoxX = (CARD_WIDTH - qrBoxSize) / 2;
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  roundRect(ctx, qrBoxX, y, qrBoxSize, qrBoxSize, 20);
  ctx.stroke();
  ctx.restore();

  const qrPad = 20;
  if (qrImageUrl) {
    try {
      const qr = await loadImage(qrImageUrl, "anonymous");
      ctx.drawImage(qr, qrBoxX + qrPad, y + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);
    } catch (err) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.fillText("QR CODE", CARD_WIDTH / 2, y + qrBoxSize / 2);
    }
  }
  y += qrBoxSize + 55;

  // "SCAN TO REVIEW" pill
  const pillW = 340;
  const pillH = 62;
  ctx.fillStyle = NAVY;
  roundRect(ctx, CARD_WIDTH / 2 - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.fillText("SCAN TO REVIEW", CARD_WIDTH / 2, y + 8);
  y += 55;

  ctx.fillStyle = "#71717a";
  ctx.font = "16px Arial";
  ctx.fillText("It only takes a few seconds.", CARD_WIDTH / 2, y);
  y += 60;

  // 3-step row: Scan / Tap / Post
  const steps = [
    { n: "1", label: "SCAN", desc: "Open the QR code" },
    { n: "2", label: "TAP", desc: "Choose an AI review" },
    { n: "3", label: "POST", desc: "Paste on Google" },
  ];
  const stepSpacing = CARD_WIDTH / 3;
  steps.forEach((step, i) => {
    const cx = stepSpacing * i + stepSpacing / 2;
    ctx.fillStyle = "#f4f4f5";
    ctx.beginPath();
    ctx.arc(cx, y, 38, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(cx - 30, y - 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px Arial";
    ctx.fillText(step.n, cx - 30, y - 25);

    ctx.fillStyle = NAVY;
    ctx.font = "bold 17px Arial";
    ctx.fillText(step.label, cx, y + 58);
    ctx.fillStyle = "#71717a";
    ctx.font = "12px Arial";
    ctx.fillText(step.desc, cx, y + 76, stepSpacing - 20);
  });
  y += 115;

  // Divider
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(CARD_WIDTH - 60, y);
  ctx.stroke();
  y += 45;

  // Thank you
  ctx.fillStyle = NAVY;
  ctx.font = "italic 36px Georgia, 'Times New Roman', serif";
  ctx.fillText("Thank You!", CARD_WIDTH / 2, y);
  y += 28;
  ctx.fillStyle = "#71717a";
  ctx.font = "13px Arial";
  ctx.fillText("YOUR FEEDBACK MEANS A LOT TO US.", CARD_WIDTH / 2, y);
  y += 65;

  // Footer: powered by + phone
  ctx.textAlign = "left";
  ctx.fillStyle = "#3f3f46";
  ctx.font = "14px Arial";
  ctx.fillText("Powered by Infinity Technology Hub", 50, y);

  if (phone) {
    ctx.textAlign = "right";
    ctx.font = "bold 17px Arial";
    ctx.fillStyle = NAVY;
    ctx.fillText(phone, CARD_WIDTH - 110, y);
  }
}

// StandeeCard renders the branded printable standee for one QR code, live in
// the UI, and exposes a Download button that exports the same canvas as PNG.
export default function StandeeCard({ businessName, tagline, logoUrl, qrImageUrl, phone, filename }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    drawStandee(canvasRef.current, { businessName, tagline, logoUrl, qrImageUrl, phone }).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [businessName, tagline, logoUrl, qrImageUrl, phone]);

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
