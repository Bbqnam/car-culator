import { FormEvent } from "react";
import { CarInput } from "@/lib/car-types";
import { CarCard } from "@/components/CarCard";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface AddCarModalProps {
  open: boolean;
  car: CarInput | null;
  carIndex: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  canDuplicate: boolean;
}

function getMissingRequiredFields(
  car: CarInput,
  t: (text: { en: string; sv: string }) => string
): string[] {
  const missing: string[] = [];

  if (!car.brand.trim()) missing.push(t({ en: "Brand", sv: "Märke" }));
  if (!car.model.trim()) missing.push(t({ en: "Model", sv: "Modell" }));
  if (car.purchasePrice <= 0) missing.push(t({ en: "Purchase price", sv: "Köpesumma" }));
  if (car.fuelConsumption <= 0) missing.push(t({ en: "Consumption", sv: "Förbrukning" }));
  if (car.annualMileage <= 0) missing.push(t({ en: "Annual mileage", sv: "Årlig körsträcka" }));
  if (car.fuelPrice <= 0) missing.push(t({ en: "Fuel price", sv: "Bränslepris" }));

  if ((car.financingMode === "cash" || car.financingMode === "loan") && car.ownershipYears <= 0) {
    missing.push(t({ en: "Ownership period", sv: "Ägandetid" }));
  }

  if (car.financingMode === "loan") {
    if (car.loan.loanTermMonths <= 0) {
      missing.push(t({ en: "Loan term", sv: "Löptid" }));
    }
  }

  if (car.financingMode === "leasing") {
    if (car.leasing.monthlyLeaseCost <= 0) {
      missing.push(t({ en: "Monthly fee", sv: "Månadsavgift" }));
    }
    if (car.leasing.leaseDurationMonths <= 0) {
      missing.push(t({ en: "Contract term", sv: "Avtalstid" }));
    }
    if (car.leasing.includedMileage <= 0) {
      missing.push(t({ en: "Included mileage", sv: "Inkluderad körsträcka" }));
    }
  }

  return missing;
}

export function AddCarModal({
  open,
  car,
  carIndex,
  onOpenChange,
  onConfirm,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  canDuplicate,
}: AddCarModalProps) {
  const { t } = useI18n();
  if (!car) return null;
  const missingRequiredFields = getMissingRequiredFields(car, t);
  const canConfirm = missingRequiredFields.length === 0;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-x-0 border-b-0 p-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[92vh] sm:w-[90vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border">
        <div className="border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm">
          <DialogTitle className="text-sm sm:text-base">
            {t({ en: "Configure car", sv: "Konfigurera bil" })}
          </DialogTitle>
          <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">
            {t({
              en: "This opens full screen on smaller devices so the form is easier to use.",
              sv: "Detta visas i helskärm på mindre enheter så formuläret blir enklare att använda.",
            })}
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="space-y-2">
              <CarCard
                car={car}
                index={carIndex}
                canRemove={canRemove}
                canDuplicate={canDuplicate}
                onChange={onChange}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
              />
              {!canConfirm && (
                <p className="text-[11px] text-amber-700 px-1">
                  {t({
                    en: "Fill required fields before saving:",
                    sv: "Fyll i obligatoriska fält innan du sparar:",
                  })}{" "}
                  <span className="font-medium">{missingRequiredFields.join(", ")}</span>
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t({ en: "Cancel", sv: "Avbryt" })}
            </Button>
            <Button type="submit" disabled={!canConfirm} className="w-full sm:w-auto">
              OK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
