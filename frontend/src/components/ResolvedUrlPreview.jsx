import { useState } from "react";
import { resolveReviewUrl } from "../lib/googleReview.js";

// ResolvedUrlPreview shows the full review link that will actually be saved,
// live, whenever the salesman pastes a bare Place ID instead of a full URL —
// so they can see and copy the plaintext link before submitting.
export default function ResolvedUrlPreview({ input }) {
  const [copied, setCopied] = useState(false);
  const trimmed = (input || "").trim();
  const resolved = resolveReviewUrl(trimmed);

  if (!trimmed || resolved === trimmed) return null;

  function copy() {
    navigator.clipboard.writeText(resolved).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2">
      <p className="flex-1 min-w-0 text-xs text-zinc-500 break-all font-mono">{resolved}</p>
      <button
        type="button"
        onClick={copy}
        className="flex-shrink-0 text-xs font-medium text-violet-600 hover:text-violet-800"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
