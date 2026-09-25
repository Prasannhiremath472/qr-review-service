import { useEffect, useRef, useState } from "react";

const CARD_WIDTH = 640;
const CARD_HEIGHT = 1400;
const NAVY = "#0f1e3c";

// Google's brand colors — used for the corner swooshes, QR border quadrants,
// and the multicolor "Google" wordmark, matching the standee template.
const BLUE = "#4285f4";
const RED = "#ea4335";
const YELLOW = "#fbbc05";
const GREEN = "#34a853";

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

function drawStar(ctx, cx, cy, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawMultiGoogle(ctx, cx, y, fontSize) {
  ctx.font = `bold ${fontSize}px Arial`;
  const letters = [
    { ch: "G", color: BLUE },
    { ch: "o", color: RED },
    { ch: "o", color: YELLOW },
    { ch: "g", color: BLUE },
    { ch: "l", color: GREEN },
    { ch: "e", color: RED },
  ];
  const widths = letters.map((l) => ctx.measureText(l.ch).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0);
  let x = cx - totalWidth / 2;
  ctx.textAlign = "left";
  letters.forEach((l, i) => {
    ctx.fillStyle = l.color;
    ctx.fillText(l.ch, x, y);
    x += widths[i];
  });
  ctx.textAlign = "center";
}

// drawStandee renders the branded printable QR standee onto a canvas:
// business logo, name, tagline, the Google-colored QR frame, scan steps,
// and a phone footer. Used both for the live in-app preview and the PNG
// download, matching the printed acrylic standee template.
async function drawStandee(canvas, { businessName, tagline, logoUrl, qrImageUrl, phone }) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Corner swooshes — one Google color per corner
  function swoosh(cx, cy, r, startAngle, endAngle, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  }
  swoosh(0, 0, 150, 0, Math.PI / 2, BLUE);
  swoosh(CARD_WIDTH, 0, 150, Math.PI / 2, Math.PI, RED);
  swoosh(0, CARD_HEIGHT, 90, -Math.PI / 2, 0, YELLOW);
  swoosh(CARD_WIDTH, CARD_HEIGHT, 90, Math.PI, Math.PI * 1.5, GREEN);

  let y = 100;

  // Circular logo frame
  const logoR = 62;
  ctx.save();
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(CARD_WIDTH / 2, y, logoR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl, "anonymous");
      const maxDim = logoR * 1.5;
      const scale = Math.min(maxDim / logo.width, maxDim / logo.height);
      const w = logo.width * scale;
      const h = logo.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(CARD_WIDTH / 2, y, logoR - 4, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, CARD_WIDTH / 2 - w / 2, y - h / 2, w, h);
      ctx.restore();
    } catch (err) {
      // fall through — the empty circle frame stays
    }
  } else {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOUR", CARD_WIDTH / 2, y - 4);
    ctx.fillText("LOGO", CARD_WIDTH / 2, y + 12);
  }
  y += logoR + 60;

  // Business name
  ctx.fillStyle = NAVY;
  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.fillText((businessName || "Business Name").toUpperCase(), CARD_WIDTH / 2, y, CARD_WIDTH - 80);
  y += 34;

  // Tagline
  ctx.font = "600 15px Arial";
  ctx.fillStyle = "#71717a";
  ctx.fillText((tagline || "Your Tagline Here").toUpperCase(), CARD_WIDTH / 2, y);
  y += 55;

  // "Share Your Experience on"
  ctx.fillStyle = NAVY;
  ctx.font = "bold 34px Arial";
  ctx.fillText("Share Your Experience on", CARD_WIDTH / 2, y);
  y += 75;

  // Multicolor "Google"
  drawMultiGoogle(ctx, CARD_WIDTH / 2, y, 66);
  y += 55;

  // 5 gold stars with flanking accent dashes
  const starColor = "#fbbc05";
  const starSpacing = 52;
  const starsStartX = CARD_WIDTH / 2 - starSpacing * 2;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, starsStartX + i * starSpacing, y, 22, 9, starColor);
  }
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(starsStartX - 70, y - 12);
  ctx.lineTo(starsStartX - 45, y - 2);
  ctx.stroke();
  ctx.strokeStyle = RED;
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH - (starsStartX - 70), y - 12);
  ctx.lineTo(CARD_WIDTH - (starsStartX - 45), y - 2);
  ctx.stroke();
  y += 55;

  // QR frame — rounded square split into 4 Google-colored quadrant arcs
  const qrBoxSize = 300;
  const qrBoxX = (CARD_WIDTH - qrBoxSize) / 2;
  const qrBoxY = y;
  const qrR = 28;
  const qrLineWidth = 8;
  ctx.lineWidth = qrLineWidth;
  ctx.lineCap = "round";

  function qrEdge(color, drawFn) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    drawFn();
    ctx.stroke();
  }
  // top-left corner + left half of top edge + top half of left edge (blue)
  qrEdge(BLUE, () => {
    ctx.moveTo(qrBoxX, qrBoxY + qrBoxSize / 2);
    ctx.lineTo(qrBoxX, qrBoxY + qrR);
    ctx.arcTo(qrBoxX, qrBoxY, qrBoxX + qrR, qrBoxY, qrR);
    ctx.lineTo(qrBoxX + qrBoxSize / 2, qrBoxY);
  });
  // top-right corner + right half of top edge + top half of right edge (red)
  qrEdge(RED, () => {
    ctx.moveTo(qrBoxX + qrBoxSize / 2, qrBoxY);
    ctx.lineTo(qrBoxX + qrBoxSize - qrR, qrBoxY);
    ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + qrR, qrR);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize / 2);
  });
  // bottom-left corner + left half of bottom edge + bottom half of left edge (yellow)
  qrEdge(YELLOW, () => {
    ctx.moveTo(qrBoxX, qrBoxY + qrBoxSize / 2);
    ctx.lineTo(qrBoxX, qrBoxY + qrBoxSize - qrR);
    ctx.arcTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX + qrR, qrBoxY + qrBoxSize, qrR);
    ctx.lineTo(qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize);
  });
  // bottom-right corner + right half of bottom edge + bottom half of right edge (green)
  qrEdge(GREEN, () => {
    ctx.moveTo(qrBoxX + qrBoxSize / 2, qrBoxY + qrBoxSize);
    ctx.lineTo(qrBoxX + qrBoxSize - qrR, qrBoxY + qrBoxSize);
    ctx.arcTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - qrR, qrR);
    ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize / 2);
  });
  ctx.lineCap = "butt";

  const qrPad = 24;
  if (qrImageUrl) {
    try {
      const qr = await loadImage(qrImageUrl, "anonymous");
      ctx.drawImage(qr, qrBoxX + qrPad, qrBoxY + qrPad, qrBoxSize - qrPad * 2, qrBoxSize - qrPad * 2);
    } catch (err) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.fillText("QR CODE", CARD_WIDTH / 2, qrBoxY + qrBoxSize / 2);
    }
  }

  // "Scan Here" script callout with curved arrow, to the left of the QR box
  ctx.save();
  ctx.fillStyle = NAVY;
  ctx.font = "italic bold 22px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.translate(qrBoxX - 78, qrBoxY + qrBoxSize / 2 - 30);
  ctx.rotate(-0.05);
  ctx.fillText("Scan", 0, 0);
  ctx.fillText("Here", 0, 26);
  ctx.restore();

  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(qrBoxX - 90, qrBoxY + qrBoxSize / 2 + 5);
  ctx.quadraticCurveTo(qrBoxX - 90, qrBoxY + qrBoxSize / 2 + 45, qrBoxX - 25, qrBoxY + qrBoxSize / 2 + 48);
  ctx.stroke();
  // arrowhead
  ctx.beginPath();
  ctx.moveTo(qrBoxX - 35, qrBoxY + qrBoxSize / 2 + 40);
  ctx.lineTo(qrBoxX - 24, qrBoxY + qrBoxSize / 2 + 48);
  ctx.lineTo(qrBoxX - 36, qrBoxY + qrBoxSize / 2 + 55);
  ctx.stroke();

  y = qrBoxY + qrBoxSize + 55;

  // "SCAN TO REVIEW" pill with a small QR glyph icon
  const pillW = 320;
  const pillH = 62;
  ctx.fillStyle = NAVY;
  roundRect(ctx, CARD_WIDTH / 2 - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();

  const iconX = CARD_WIDTH / 2 - pillW / 2 + 38;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(iconX - 8, y - 8, 6, 6);
  ctx.strokeRect(iconX + 4, y - 8, 6, 6);
  ctx.strokeRect(iconX - 8, y + 4, 6, 6);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(iconX + 4, y + 4, 6, 6);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText("SCAN TO REVIEW", CARD_WIDTH / 2 + 15, y + 8);
  y += 55;

  ctx.fillStyle = "#71717a";
  ctx.font = "16px Arial";
  ctx.fillText("It only takes a few seconds.", CARD_WIDTH / 2, y);
  y += 70;

  // 3-step row: Scan / Tap / Post, each with its own accent color + glyph
  const steps = [
    { n: "1", label: "Scan", desc: "Open the QR code\non your phone", color: BLUE, bg: "#e8f0fe" },
    { n: "2", label: "Tap", desc: "Choose an AI\ndrafted review", color: YELLOW, bg: "#fef7e0" },
    { n: "3", label: "Post", desc: "Paste & share\non Google", color: GREEN, bg: "#e6f4ea" },
  ];
  const stepSpacing = CARD_WIDTH / 3;
  steps.forEach((step, i) => {
    const cx = stepSpacing * i + stepSpacing / 2;

    ctx.fillStyle = step.bg;
    ctx.beginPath();
    ctx.arc(cx, y, 42, 0, Math.PI * 2);
    ctx.fill();

    // phone glyph
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 2;
    roundRect(ctx, cx - 14, y - 22, 28, 44, 5);
    ctx.stroke();

    ctx.fillStyle = step.color;
    ctx.beginPath();
    ctx.arc(cx - 32, y - 32, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.fillText(step.n, cx - 32, y - 27);

    ctx.fillStyle = NAVY;
    ctx.font = "bold 19px Arial";
    ctx.fillText(step.label, cx, y + 62);
    ctx.fillStyle = "#71717a";
    ctx.font = "12px Arial";
    const descLines = step.desc.split("\n");
    descLines.forEach((line, li) => {
      ctx.fillText(line, cx, y + 82 + li * 15);
    });
  });
  y += 145;

  // Divider
  ctx.strokeStyle = "#e4e4e7";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(CARD_WIDTH - 60, y);
  ctx.stroke();
  y += 40;

  // Footer: "Powered by" + logo mark text + phone
  ctx.fillStyle = "#71717a";
  ctx.font = "13px Arial";
  ctx.fillText("Powered by", CARD_WIDTH / 2, y);
  y += 32;

  ctx.textAlign = "left";
  ctx.fillStyle = NAVY;
  ctx.font = "bold 18px Arial";
  ctx.fillText("INFINITY", 60, y);
  ctx.font = "11px Arial";
  ctx.fillStyle = "#71717a";
  ctx.fillText("Technology Hub", 60, y + 16);

  if (phone) {
    ctx.textAlign = "right";
    ctx.font = "bold 19px Arial";
    ctx.fillStyle = NAVY;
    ctx.fillText(phone, CARD_WIDTH - 60, y + 4);
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
