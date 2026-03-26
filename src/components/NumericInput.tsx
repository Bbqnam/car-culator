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

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between min-h-[16px]">
        <Label className="text-[11px] text-muted-foreground font-medium">{label}</Label>
        {showRequired && (
          <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wide">
            Required
          </span>
        )}
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          placeholder={placeholder ?? (required ? "Enter value…" : "0")}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className={[
            "flex h-9 w-full rounded-md px-3 py-2 text-sm transition-all outline-none",
            unit ? "pr-12" : "pr-3",
            "bg-white",
            showRequired
              ? "border border-amber-300 ring-1 ring-amber-100 placeholder:text-amber-400/50"
              : "border border-border/60 hover:border-border/90 focus:border-ring focus:ring-2 focus:ring-ring/10 placeholder:text-muted-foreground/35",
          ].join(" ")}
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground/55 pointer-events-none select-none">
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
      <div className="h-9 flex items-center justify-between px-3 rounded-md bg-secondary/40 border border-border/40">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {unit && (
          <span className="text-[11px] text-muted-foreground/60">{unit}</span>
        )}
      </div>
    </div>
  );
}
