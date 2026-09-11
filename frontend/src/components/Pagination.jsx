export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = getPageList(page, totalPages);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-zinc-100 flex-wrap">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="btn-ghost text-sm font-medium text-zinc-600 disabled:text-zinc-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-zinc-100 disabled:hover:bg-transparent"
      >
        &larr; Prev
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} className="px-2 text-sm text-zinc-400">
              &hellip;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                p === page ? "bg-violet-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-ghost text-sm font-medium text-zinc-600 disabled:text-zinc-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg hover:bg-zinc-100 disabled:hover:bg-transparent"
      >
        Next &rarr;
      </button>
    </div>
  );
}

function getPageList(current, total) {
  const delta = 1;
  const range = [];
  const rangeWithDots = [];
  let last;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (last) {
      if (i - last === 2) {
        rangeWithDots.push(last + 1);
      } else if (i - last > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    last = i;
  }

  return rangeWithDots;
}
