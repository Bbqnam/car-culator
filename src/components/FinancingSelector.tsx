import { FinancingMode } from "@/lib/car-types";
import { Banknote, CreditCard, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FinancingSelectorProps {
  value: FinancingMode;
  onChange: (mode: FinancingMode) => void;
}

export function FinancingSelector({ value, onChange }: FinancingSelectorProps) {
  const { language } = useI18n();
  const modes: { value: FinancingMode; label: string; icon: typeof Banknote }[] = [
    { value: "cash", label: language === "sv" ? "Kontant" : "Cash", icon: Banknote },
    { value: "loan", label: language === "sv" ? "Lån" : "Loan", icon: CreditCard },
    { value: "leasing", label: language === "sv" ? "Leasing" : "Lease", icon: FileText },
  ];

  return (
    <div className="flex rounded-lg bg-secondary/70 p-0.5 gap-0.5">
      {modes.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={[
              "flex-1 flex items-center justify-center gap-1.5",
              "text-xs font-semibold py-2 px-2 rounded-md",
              "transition-all duration-150 select-none",
              active
                ? "bg-white text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-white/60",
            ].join(" ")}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
