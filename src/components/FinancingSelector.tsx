import { FinancingMode } from "@/lib/car-types";
import { Banknote, CreditCard, FileText } from "lucide-react";

interface FinancingSelectorProps {
  value: FinancingMode;
  onChange: (mode: FinancingMode) => void;
}

const modes: { value: FinancingMode; label: string; icon: typeof Banknote }[] = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "loan", label: "Loan", icon: CreditCard },
  { value: "leasing", label: "Lease", icon: FileText },
];

export function FinancingSelector({ value, onChange }: FinancingSelectorProps) {
  return (
    <div className="flex rounded-lg bg-secondary/60 p-0.5 gap-0.5">
      {modes.map((m) => {
        const active = value === m.value;
        const Icon = m.icon;
        return (
          <button
            key={m.value}
            onClick={() => onChange(m.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 rounded-md transition-all ${
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
