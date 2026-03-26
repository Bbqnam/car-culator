import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumericInputProps {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}

function formatDisplay(val: number): string {
  if (val === 0) return "0";
  return val.toLocaleString("sv-SE");
}

export function NumericInput({ label, unit, value, onChange, min = 0, step = 1 }: NumericInputProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setRaw(formatDisplay(value));
    }
  }, [value, editing]);

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

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <input
          ref={inputRef}
          type={editing ? "text" : "text"}
          inputMode="decimal"
          value={editing ? raw : formatDisplay(value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          step={step}
          className="flex h-9 w-full rounded-md px-3 py-2 text-sm pr-12 bg-secondary/50 border-0 ring-0 outline-none focus-visible:ring-1 focus-visible:ring-accent/40 transition-colors"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReadonlyField({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="h-9 flex items-center text-sm text-muted-foreground px-3 rounded-md bg-secondary/30">
        {value}{unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
}
