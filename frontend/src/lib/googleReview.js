// Google Place IDs are typically 27+ chars, start with "ChIJ", and contain
// only URL-safe characters — distinct enough from a pasted URL to detect.
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,}$/;

// The review URL field starts pre-filled with this prefix so a salesman can
// just paste the Place ID straight after "placeid=" without typing the rest
// of the link by hand.
export const REVIEW_URL_PREFIX = "https://search.google.com/local/writereview?placeid=";

// resolveReviewUrl lets salesmen paste either a full Google review link or
// just the bare Place ID (what Google's Place ID Finder tool actually shows)
// and always returns a working "write a review" URL.
export function resolveReviewUrl(input) {
  const trimmed = (input || "").trim();
  if (!trimmed || trimmed === REVIEW_URL_PREFIX) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (PLACE_ID_PATTERN.test(trimmed)) {
    return `${REVIEW_URL_PREFIX}${trimmed}`;
  }

  return trimmed;
}
