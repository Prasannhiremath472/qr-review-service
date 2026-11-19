import { useState } from "react";
import { CheckIcon, PlusIcon, XIcon } from "./review/icons.jsx";

// ServiceMultiSelect shows a list of predefined options as toggleable chips,
// plus an "Add" control for a custom one not in the list. Used for the
// business's services (set by admin/salesman) and for the "what did you
// like?" qualities. Selection is optional — the customer can continue with
// none selected. Styled with the review-page theme (.rv-theme), so the
// active colour follows the business's brand colour.
//   title / showOptional — heading text and whether to append "(optional)"
//   icon                 — optional icon shown before the heading
//   renderOption         — display label for an option (selected values stay as-is)
export default function ServiceMultiSelect({
  options,
  selected,
  onChange,
  t,
  title,
  showOptional = true,
  icon = null,
  renderOption = (o) => o,
}) {
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

  const chipBase =
    "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";
  const chipOn = "border-primary bg-primary/10 text-primary";
  const chipOff = "border-lavender text-foreground hover:bg-muted";

  return (
    <div>
      <h3 className="flex items-center gap-2 font-display font-semibold text-foreground">
        {icon}
        <span>
          {title ?? t.whichService}{" "}
          {showOptional && <span className="text-sm font-normal text-muted-foreground">{t.optional}</span>}
        </span>
      </h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {hasOptions &&
          options.map((service) => {
            const active = selected.includes(service);
            return (
              <button
                key={service}
                type="button"
                onClick={() => toggle(service)}
                aria-pressed={active}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {active && <CheckIcon className="h-4 w-4" />} {renderOption(service)}
              </button>
            );
          })}

        {customSelected.map((service) => (
          <span key={service} className={`${chipBase} ${chipOn} pr-2`}>
            <CheckIcon className="h-4 w-4" /> {service}
            <button
              type="button"
              onClick={() => removeCustom(service)}
              className="grid h-5 w-5 place-items-center rounded-full hover:bg-primary/15"
              aria-label={`${t.removeService} ${service}`}
            >
              <XIcon className="h-3.5 w-3.5" />
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
            placeholder={t.typeAndEnter}
            className="w-44 rounded-full border border-primary bg-muted/40 px-4 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <button type="button" onClick={() => setAddingCustom(true)} className={`${chipBase} ${chipOff}`}>
            <PlusIcon className="h-4 w-4" /> {t.add}
          </button>
        )}
      </div>
      {!hasOptions && customSelected.length === 0 && (
        <p className="mt-1.5 text-xs text-muted-foreground">{t.addHint}</p>
      )}
    </div>
  );
}
