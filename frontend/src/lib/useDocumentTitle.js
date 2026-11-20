import { useEffect } from "react";

// Sets the browser tab / document title for the current page and restores the
// previous title when the page unmounts, so every route gets its own title
// instead of the single static one from index.html.
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return undefined;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
