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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[92vh] overflow-y-auto p-3 sm:p-4">
        <DialogTitle className="text-sm">{t({ en: "Configure car", sv: "Konfigurera bil" })}</DialogTitle>
        <CarCard
          car={car}
          index={carIndex}
          canRemove={canRemove}
          canDuplicate={canDuplicate}
          onChange={onChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
        />
        <div className="space-y-2">
          {!canConfirm && (
            <p className="text-[11px] text-amber-700 px-1">
              {t({
                en: "Fill required fields before saving:",
                sv: "Fyll i obligatoriska fält innan du sparar:",
              })}{" "}
              <span className="font-medium">{missingRequiredFields.join(", ")}</span>
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t({ en: "Cancel", sv: "Avbryt" })}
            </Button>
            <Button type="button" onClick={onConfirm} disabled={!canConfirm}>
              OK
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
