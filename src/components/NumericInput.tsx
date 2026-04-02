import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        <div className="flex items-center gap-1.5 min-w-0">
          <Label className="text-[11px] text-muted-foreground font-medium leading-tight">
            {label}
            {required && <span className="ml-1 text-amber-500">*</span>}
          </Label>
          {hint && <FieldHint text={hint} />}
        </div>
      </div>
      <div
        className={[
          "flex min-h-11 h-auto w-full overflow-hidden rounded-md bg-card/95 text-foreground transition-all sm:min-h-[2.5rem] dark:bg-slate-950/88",
          showRequired
            ? "border border-amber-300 ring-1 ring-amber-100 dark:border-amber-400/45 dark:ring-amber-500/12"
            : "border border-border/60 hover:border-border/90 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/10 dark:border-white/10 dark:hover:border-white/18 dark:focus-within:border-emerald-400/35 dark:focus-within:ring-emerald-500/12",
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
            "h-full w-full min-w-0 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none",
            showRequired
              ? "placeholder:text-amber-400/60 dark:placeholder:text-amber-300/45"
              : "placeholder:text-muted-foreground/35 dark:placeholder:text-slate-500",
          ].join(" ")}
        />
        {unit && (
          <span className="inline-flex shrink-0 items-center whitespace-nowrap border-l border-border/50 px-3 text-[11px] text-muted-foreground/65 dark:border-white/10 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function ReadonlyField({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between min-h-[16px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Label className="text-[11px] text-muted-foreground font-medium leading-tight">
            {label}
          </Label>
          {hint && <FieldHint text={hint} />}
        </div>
      </div>
      <div className="flex min-h-11 h-auto items-center justify-between rounded-md border border-border/40 bg-secondary/40 px-3 py-2.5 sm:min-h-[2.5rem] dark:border-white/10 dark:bg-slate-950/65">
        <span className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
          {value}
        </span>
        {unit && (
          <span className="whitespace-nowrap text-[11px] text-muted-foreground/60 dark:text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}

function FieldHint({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={120}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border/70 text-[10px] font-bold leading-none text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            aria-label="Field help"
          >
            ?
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-[11px] leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
