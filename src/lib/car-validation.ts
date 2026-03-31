import { CarInput } from "@/lib/car-types";

export function getMissingRequiredFields(
  car: CarInput,
  t: (text: { en: string; sv: string }) => string,
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

  if (car.financingMode === "loan" && car.loan.loanTermMonths <= 0) {
    missing.push(t({ en: "Loan term", sv: "Löptid" }));
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

export function isCarReadyToSave(
  car: CarInput,
  t: (text: { en: string; sv: string }) => string,
): boolean {
  return getMissingRequiredFields(car, t).length === 0;
}
