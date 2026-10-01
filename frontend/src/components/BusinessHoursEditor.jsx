const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_OPEN = "10:00";
const DEFAULT_CLOSE = "21:00";

function emptyWeek() {
  return DAY_LABELS.map((_, day) => ({ day, closed: false, open: DEFAULT_OPEN, close: DEFAULT_CLOSE }));
}

// BusinessHoursEditor is a 7-row Google-Business-Profile-style hours
// editor: each day gets an open/close time or a Closed toggle. `hours` is
// either null (not set yet) or a full 7-entry array; `onChange` always
// receives a full 7-entry array. Used by ClientForm (Add/Edit Client) and
// SetupPage (QR activation).
export default function BusinessHoursEditor({ hours, onChange }) {
  const week = Array.isArray(hours) && hours.length === 7 ? hours : null;

  function startEditing() {
    onChange(emptyWeek());
  }

  function updateDay(day, patch) {
    const base = week || emptyWeek();
    onChange(base.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  }

  function copyMondayToAll() {
    if (!week) return;
    const monday = week.find((d) => d.day === 1);
    if (!monday) return;
    onChange(week.map((d) => (d.day === 0 ? d : { ...d, closed: monday.closed, open: monday.open, close: monday.close })));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-zinc-700">Business Hours</label>
        {week && (
          <button
            type="button"
            onClick={copyMondayToAll}
            className="text-xs font-medium text-violet-600 hover:text-violet-800"
          >
            Copy Monday to all days
          </button>
        )}
      </div>

      {!week ? (
        <button
          type="button"
          onClick={startEditing}
          className="field-input w-full px-4 py-2.5 border border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:border-violet-300 hover:text-violet-600 text-left"
        >
          + Set hours for each day
        </button>
      ) : (
        <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-100 overflow-hidden">
          {week.map((d) => (
            <div key={d.day} className="flex items-center gap-2.5 px-3.5 py-2.5 bg-zinc-50/60">
              <span className="w-[72px] sm:w-24 text-sm font-medium text-zinc-700 flex-shrink-0">
                {DAY_LABELS[d.day].slice(0, 3)}
              </span>

              {d.closed ? (
                <span className="flex-1 text-sm text-zinc-400">Closed</span>
              ) : (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="time"
                    value={d.open || DEFAULT_OPEN}
                    onChange={(e) => updateDay(d.day, { open: e.target.value })}
                    className="field-input flex-1 min-w-0 px-2 py-1.5 border border-zinc-200 rounded-lg text-xs sm:text-sm bg-white"
                  />
                  <span className="text-zinc-400 text-xs">to</span>
                  <input
                    type="time"
                    value={d.close || DEFAULT_CLOSE}
                    onChange={(e) => updateDay(d.day, { close: e.target.value })}
                    className="field-input flex-1 min-w-0 px-2 py-1.5 border border-zinc-200 rounded-lg text-xs sm:text-sm bg-white"
                  />
                </div>
              )}

              <label className="flex items-center gap-1.5 text-xs text-zinc-500 flex-shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.closed}
                  onChange={(e) => updateDay(d.day, { closed: e.target.checked })}
                  className="rounded"
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-zinc-400 mt-1.5">
        Shown on your review page as a weekly hours list, with today highlighted and an open/closed status.
      </p>
    </div>
  );
}
