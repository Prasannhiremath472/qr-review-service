// Google Place IDs are typically 27+ chars, start with "ChIJ", and contain
// only URL-safe characters — distinct enough from a pasted URL to detect.
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

// resolveReviewUrl lets salesmen paste either a full Google review link or
// just the bare Place ID (what Google's Place ID Finder tool actually shows)
// and always returns a working "write a review" URL.
export function resolveReviewUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (PLACE_ID_PATTERN.test(trimmed)) {
    return `https://search.google.com/local/writereview?placeid=${trimmed}`;
  }

  return trimmed;
}
