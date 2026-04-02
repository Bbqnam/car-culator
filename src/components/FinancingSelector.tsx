import { FinancingMode } from "@/lib/car-types";
import { Banknote, CreditCard, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FinancingModeState {
  disabled?: boolean;
  hint?: string;
}

interface FinancingSelectorProps {
  value: FinancingMode;
  onChange: (mode: FinancingMode) => void;
  optionStates?: Partial<Record<FinancingMode, FinancingModeState>>;
}

export function FinancingSelector({ value, onChange, optionStates }: FinancingSelectorProps) {
  const { language } = useI18n();
  const modes: { value: FinancingMode; label: string; icon: typeof Banknote }[] = [
    { value: "cash", label: language === "sv" ? "Kontant" : "Cash", icon: Banknote },
    { value: "loan", label: language === "sv" ? "Lån" : "Loan", icon: CreditCard },
    { value: "leasing", label: language === "sv" ? "Leasing" : "Lease", icon: FileText },
  ];

  return (
    <div className="flex gap-0.5 rounded-lg bg-secondary/70 p-0.5 dark:bg-slate-900/78 dark:ring-1 dark:ring-white/6">
      {modes.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        const state = optionStates?.[m.value];
        const disabled = Boolean(state?.disabled);
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => {
              if (disabled) return;
              onChange(m.value);
            }}
            aria-disabled={disabled}
            title={state?.hint}
            className={[
              "flex-1 flex items-center justify-center gap-1.5",
              "min-h-11 text-xs font-semibold px-2 rounded-md sm:min-h-10",
              "transition-all duration-150 select-none",
              disabled && "cursor-not-allowed opacity-45",
              active
                ? "border border-border/50 bg-white text-foreground shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-50 dark:shadow-[0_8px_20px_rgba(0,0,0,0.24)]"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100",
            ].filter(Boolean).join(" ")}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
