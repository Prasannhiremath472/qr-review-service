import { useState } from "react";

// ServicesEditor lets admin/salesman define the list of services a business
// offers (shown as tags), typed one at a time and added with Enter/comma or
// the Add button. Used by ClientForm (Add/Edit Client) and SetupPage (QR
// activation) — the resulting list is what customers pick from on the
// review page's "which service did you take?" step.
export default function ServicesEditor({ services, onChange }) {
  const [draft, setDraft] = useState("");

  function addService(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (services.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...services, trimmed]);
    setDraft("");
  }

  function removeService(index) {
    onChange(services.filter((_, i) => i !== index));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addService(draft);
    } else if (e.key === "Backspace" && !draft && services.length > 0) {
      removeService(services.length - 1);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Services Offered</label>
      <div className="field-input w-full px-2 py-2 border border-zinc-200 rounded-xl text-sm bg-zinc-50/60 flex flex-wrap gap-1.5 items-center">
        {services.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
          >
            {s}
            <button
              type="button"
              onClick={() => removeService(i)}
              className="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-violet-200"
              aria-label={`Remove ${s}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addService(draft)}
          placeholder={services.length === 0 ? "e.g. Haircut, Facial, Dine-in" : "Add another..."}
          className="flex-1 min-w-[100px] bg-transparent border-0 outline-none py-0.5 text-sm"
        />
      </div>
      <p className="text-xs text-zinc-400 mt-1.5">
        Press Enter or comma to add. Shown to customers as selectable options on the review page.
      </p>
    </div>
  );
}
