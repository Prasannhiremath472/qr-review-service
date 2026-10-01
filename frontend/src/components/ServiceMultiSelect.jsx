import { useState } from "react";

// ServiceMultiSelect shows the business's predefined services (set by
// admin/salesman) as toggleable chips, plus a "+ Add" control for a custom
// service not in the list. Replaces the old free-text "which service did
// you take?" input on the customer-facing review page. Selection is
// optional — the customer can continue with none selected.
export default function ServiceMultiSelect({ options, selected, onChange, brandColor }) {
  const [addingCustom, setAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const hasOptions = Array.isArray(options) && options.length > 0;

  function toggle(service) {
    if (selected.includes(service)) {
      onChange(selected.filter((s) => s !== service));
    } else {
      onChange([...selected, service]);
    }
  }

  function removeCustom(service) {
    onChange(selected.filter((s) => s !== service));
  }

  function commitCustom() {
    const trimmed = customValue.trim();
    setAddingCustom(false);
    setCustomValue("");
    if (!trimmed) return;
    if (selected.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...selected, trimmed]);
  }

  function handleCustomKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCustom();
    } else if (e.key === "Escape") {
      setAddingCustom(false);
      setCustomValue("");
    }
  }

  // Custom-added services are anything selected that isn't one of the
  // predefined options — shown as their own removable chips.
  const customSelected = selected.filter((s) => !options.includes(s));

  const chipActiveStyle = brandColor
    ? { backgroundColor: brandColor, borderColor: brandColor, color: "#fff" }
    : undefined;

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1.5">
        Which service did you take? <span className="text-zinc-300">(optional)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {hasOptions &&
          options.map((service) => {
            const active = selected.includes(service);
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggle(service)}
                aria-pressed={active}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  active
                    ? brandColor
                      ? ""
                      : "bg-violet-600 border-violet-600 text-white"
                    : "bg-white border-zinc-200 text-zinc-600 hover:border-violet-300"
                }`}
                style={active ? chipActiveStyle : undefined}
              >
                {service}
              </button>
            );
          })}

        {customSelected.map((service) => (
          <span
            key={service}
            className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium border"
            style={chipActiveStyle || { backgroundColor: "#7c3aed", borderColor: "#7c3aed", color: "#fff" }}
          >
            {service}
            <button
              type="button"
              onClick={() => removeCustom(service)}
              className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-white/20"
              aria-label={`Remove ${service}`}
            >
              &times;
            </button>
          </span>
        ))}

        {addingCustom ? (
          <input
            type="text"
            autoFocus
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            onBlur={commitCustom}
            placeholder="Type & press Enter"
            className="field-input px-3 py-1.5 border border-zinc-200 rounded-full text-sm bg-zinc-50/60 w-36"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-zinc-300 text-zinc-500 hover:border-violet-300 hover:text-violet-600"
          >
            + Add
          </button>
        )}
      </div>
      {!hasOptions && (
        <p className="text-xs text-zinc-400 mt-1.5">
          {customSelected.length === 0 ? "Tap “+ Add” to mention what you came in for." : ""}
        </p>
      )}
    </div>
  );
}
