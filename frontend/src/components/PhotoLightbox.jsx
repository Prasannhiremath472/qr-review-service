import { useEffect, useRef } from "react";

// PhotoLightbox shows one photo from `photos` full-screen, with prev/next
// navigation (buttons, keyboard arrows, and swipe on touch devices) and a
// close button / Escape / backdrop click to dismiss. Controlled: the parent
// owns `index` and passes `onIndexChange`/`onClose`.
export default function PhotoLightbox({ photos, index, onIndexChange, onClose, altPrefix = "Photo" }) {
  const total = photos.length;

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndexChange((index + 1) % total);
      else if (e.key === "ArrowLeft") onIndexChange((index - 1 + total) % total);
    }
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, total, onIndexChange, onClose]);

  const touchStartXRef = useRef(null);
  function handleTouchStart(e) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e) {
    if (touchStartXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) onIndexChange((index + 1) % total);
      else onIndexChange((index - 1 + total) % total);
    }
    touchStartXRef.current = null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center fade-in"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {total > 1 && (
        <span className="absolute top-4 left-4 text-white/70 text-sm font-medium">
          {index + 1} / {total}
        </span>
      )}

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index - 1 + total) % total);
          }}
          aria-label="Previous photo"
          className="absolute left-2 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      <img
        src={photos[index]}
        alt={`${altPrefix} ${index + 1}`}
        className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg pop-in"
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange((index + 1) % total);
          }}
          aria-label="Next photo"
          className="absolute right-2 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}
    </div>
  );
}
