import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface NumericInputProps {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}

function formatDisplay(val: number, step: number): string {
  if (val === 0) return "";
  if (step < 1) {
    return val.toLocaleString("sv-SE", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    });
  }
  return val.toLocaleString("sv-SE");
}

export function NumericInput({
  label,
  unit,
  value,
  onChange,
  min = 0,
  step = 1,
  hint,
  required,
  placeholder,
}: NumericInputProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setRaw(formatDisplay(value, step));
    }
  }, [value, editing, step]);

  const handleFocus = () => {
    setEditing(true);
    setRaw(value === 0 ? "" : String(value));
  };

  const handleBlur = () => {
    setEditing(false);
    const parsed = parseFloat(raw.replace(/\s/g, "").replace(",", "."));
    if (isNaN(parsed)) {
      onChange(min);
    } else {
      onChange(Math.max(min, parsed));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRaw(e.target.value);
  };

  const isEmpty = value === 0;
  const showRequired = required && isEmpty;
  const displayValue = editing ? raw : formatDisplay(value, step);
  const resolvedPlaceholder = placeholder ?? (required ? "" : "0");

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between min-h-[16px]">
        <Label className="text-[11px] text-muted-foreground font-medium leading-tight">
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </Label>
      </div>
      <div
        className={[
          "flex min-h-[2.25rem] h-auto w-full overflow-hidden rounded-md bg-white transition-all",
          showRequired
            ? "border border-amber-300 ring-1 ring-amber-100"
            : "border border-border/60 hover:border-border/90 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/10",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder={resolvedPlaceholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={[
            "h-full w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none",
            showRequired ? "placeholder:text-amber-400/60" : "placeholder:text-muted-foreground/35",
          ].join(" ")}
        />
        {unit && (
          <span className="shrink-0 border-l border-border/50 px-2 text-[11px] text-muted-foreground/65 inline-flex items-center whitespace-nowrap">
            {unit}
          </span>
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-muted-foreground/60 leading-tight">{hint}</p>
      )}
    </div>
  );
}

export function ReadonlyField({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">{label}</Label>
      <div className="min-h-[2.25rem] h-auto py-2 flex items-center justify-between px-3 rounded-md bg-secondary/40 border border-border/40">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {unit && (
          <span className="text-[11px] text-muted-foreground/60">{unit}</span>
        )}
      </div>
    </div>
  );
}
