import { FUEL_TYPE_ORDER, FuelType, PriceSource } from "./car-types";

export interface CarModel {
  model: string;
  purchasePrice: number;
  fuelType: FuelType;
  fuelConsumption: number;
  taxCost: number;
  serviceCost: number;
  /** Annual depreciation rate — e.g. electric cars hold value differently */
  depreciationProfile?: "standard" | "slow" | "fast";
}

export interface CarBrand {
  brand: string;
  models: CarModel[];
}

export interface HistoricalPriceEstimate {
  priceSek: number | null;
  sampleSize: number;
  basis: "exact_model" | "similar_model" | "brand_fuel" | "brand" | "brand_anchor" | "fuel_type" | "global" | "none";
}

export interface PurchasePriceEstimate {
  priceSek: number;
  sampleSize: number;
  basis: HistoricalPriceEstimate["basis"] | "local_model";
  priceSource: PriceSource;
}

const BRAND_NAME_ALIASES: Record<string, string> = {
  "alfa romeo": "Alfa Romeo",
  "aston martin": "Aston Martin",
  "bugatti rimac": "Bugatti",
  "great wall": "Great Wall",
  "gwm": "Great Wall",
  "land rover": "Land Rover",
  "mercedes benz": "Mercedes-Benz",
  "mercedes-benz": "Mercedes-Benz",
  "rolls royce": "Rolls-Royce",
  "vw": "Volkswagen",
};

const BRAND_PRICE_ANCHORS: Partial<Record<string, Partial<Record<FuelType, number>>>> = {
  "Alfa Romeo": { petrol: 620000, diesel: 660000, hybrid: 760000, electric: 820000 },
  "Aston Martin": { petrol: 2900000, hybrid: 3400000, electric: 3200000 },
  Bentley: { petrol: 2600000, hybrid: 2900000, electric: 2500000 },
  Bugatti: { petrol: 18000000, hybrid: 20000000, electric: 28000000 },
  Buick: { petrol: 480000, hybrid: 540000, electric: 560000 },
  Cadillac: { petrol: 780000, diesel: 820000, hybrid: 860000, electric: 980000 },
  Chevrolet: { petrol: 520000, diesel: 540000, hybrid: 620000, electric: 580000 },
  Corvette: { petrol: 1400000, hybrid: 1700000 },
  Ferrari: { petrol: 3800000, hybrid: 4500000, electric: 4200000 },
  GMC: { petrol: 700000, diesel: 760000, electric: 900000 },
  Jaguar: { petrol: 920000, diesel: 980000, hybrid: 1100000, electric: 980000 },
  Lamborghini: { petrol: 4500000, hybrid: 5200000, electric: 4800000 },
  Lexus: { petrol: 760000, hybrid: 820000, electric: 840000 },
  Lincoln: { petrol: 850000, hybrid: 920000, electric: 980000 },
  Lotus: { petrol: 1300000, hybrid: 1450000, electric: 1150000 },
  Maserati: { petrol: 1500000, hybrid: 1650000, electric: 1850000 },
  McLaren: { petrol: 3300000, hybrid: 4200000, electric: 3800000 },
  Porsche: { petrol: 1250000, diesel: 1180000, hybrid: 1350000, electric: 1100000 },
  "Rolls-Royce": { petrol: 4200000, hybrid: 4500000, electric: 5200000 },
};

export const carDatabase: CarBrand[] = [
  {
    brand: "Volvo",
    models: [
      { model: "XC40 T2", purchasePrice: 380000, fuelType: "petrol", fuelConsumption: 7.2, taxCost: 1800, serviceCost: 5000 },
      { model: "XC40 Recharge", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 18, taxCost: 360, serviceCost: 3200 },
      { model: "XC60 B5", purchasePrice: 520000, fuelType: "petrol", fuelConsumption: 8.1, taxCost: 2200, serviceCost: 6000 },
      { model: "XC90 B5", purchasePrice: 720000, fuelType: "diesel", fuelConsumption: 6.8, taxCost: 2800, serviceCost: 7500 },
      { model: "EX30", purchasePrice: 370000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 2800 },
      { model: "EX90", purchasePrice: 890000, fuelType: "electric", fuelConsumption: 20, taxCost: 360, serviceCost: 4000 },
      { model: "S60 B4", purchasePrice: 410000, fuelType: "petrol", fuelConsumption: 6.9, taxCost: 1700, serviceCost: 5200 },
    ],
  },
  {
    brand: "Tesla",
    models: [
      { model: "Model 3", purchasePrice: 420000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 3000 },
      { model: "Model 3 Long Range", purchasePrice: 490000, fuelType: "electric", fuelConsumption: 14, taxCost: 360, serviceCost: 3000 },
      { model: "Model Y", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 3200 },
      { model: "Model Y Long Range", purchasePrice: 540000, fuelType: "electric", fuelConsumption: 15.5, taxCost: 360, serviceCost: 3200 },
      { model: "Model S", purchasePrice: 950000, fuelType: "electric", fuelConsumption: 18, taxCost: 360, serviceCost: 4500 },
    ],
  },
  {
    brand: "Volkswagen",
    models: [
      { model: "Golf 1.5 TSI", purchasePrice: 310000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1400, serviceCost: 4500 },
      { model: "Golf GTI", purchasePrice: 420000, fuelType: "petrol", fuelConsumption: 7.5, taxCost: 2200, serviceCost: 5500 },
      { model: "ID.3", purchasePrice: 370000, fuelType: "electric", fuelConsumption: 15.5, taxCost: 360, serviceCost: 2500 },
      { model: "ID.4", purchasePrice: 430000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2800 },
      { model: "ID.7", purchasePrice: 520000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 3000 },
      { model: "Tiguan 2.0 TDI", purchasePrice: 420000, fuelType: "diesel", fuelConsumption: 5.8, taxCost: 2000, serviceCost: 5200 },
      { model: "Passat 2.0 TDI", purchasePrice: 380000, fuelType: "diesel", fuelConsumption: 5.2, taxCost: 1800, serviceCost: 4800 },
      { model: "Polo 1.0 TSI", purchasePrice: 220000, fuelType: "petrol", fuelConsumption: 5.3, taxCost: 1000, serviceCost: 3500 },
      { model: "T-Roc 1.5 TSI", purchasePrice: 320000, fuelType: "petrol", fuelConsumption: 6.4, taxCost: 1500, serviceCost: 4500 },
    ],
  },
  {
    brand: "BMW",
    models: [
      { model: "320i", purchasePrice: 420000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1900, serviceCost: 6500 },
      { model: "330e", purchasePrice: 480000, fuelType: "hybrid", fuelConsumption: 2.0, taxCost: 500, serviceCost: 6000 },
      { model: "iX3", purchasePrice: 580000, fuelType: "electric", fuelConsumption: 18.5, taxCost: 360, serviceCost: 3500 },
      { model: "iX1", purchasePrice: 470000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3200 },
      { model: "X1 sDrive18i", purchasePrice: 390000, fuelType: "petrol", fuelConsumption: 7.0, taxCost: 1700, serviceCost: 5500 },
      { model: "i4 eDrive40", purchasePrice: 560000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 3800 },
      { model: "i5 eDrive40", purchasePrice: 650000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 4000 },
      { model: "X3 xDrive20i", purchasePrice: 490000, fuelType: "petrol", fuelConsumption: 7.8, taxCost: 2100, serviceCost: 6000 },
    ],
  },
  {
    brand: "Toyota",
    models: [
      { model: "Corolla 1.8 Hybrid", purchasePrice: 290000, fuelType: "hybrid", fuelConsumption: 4.5, taxCost: 1100, serviceCost: 3800 },
      { model: "Corolla Cross Hybrid", purchasePrice: 350000, fuelType: "hybrid", fuelConsumption: 5.0, taxCost: 1200, serviceCost: 4000 },
      { model: "RAV4 2.5 Hybrid", purchasePrice: 410000, fuelType: "hybrid", fuelConsumption: 5.6, taxCost: 1500, serviceCost: 4200 },
      { model: "Yaris 1.5 Hybrid", purchasePrice: 230000, fuelType: "hybrid", fuelConsumption: 3.8, taxCost: 900, serviceCost: 3200 },
      { model: "bZ4X", purchasePrice: 460000, fuelType: "electric", fuelConsumption: 16.7, taxCost: 360, serviceCost: 2800 },
      { model: "C-HR Hybrid", purchasePrice: 340000, fuelType: "hybrid", fuelConsumption: 4.8, taxCost: 1100, serviceCost: 3800 },
      { model: "Camry Hybrid", purchasePrice: 380000, fuelType: "hybrid", fuelConsumption: 4.9, taxCost: 1300, serviceCost: 4000 },
    ],
  },
  {
    brand: "Kia",
    models: [
      { model: "EV6", purchasePrice: 510000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 2800 },
      { model: "EV9", purchasePrice: 720000, fuelType: "electric", fuelConsumption: 21, taxCost: 360, serviceCost: 3500 },
      { model: "Niro EV", purchasePrice: 400000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 2500 },
      { model: "Sportage 1.6 T-GDI", purchasePrice: 370000, fuelType: "petrol", fuelConsumption: 7.5, taxCost: 1600, serviceCost: 4000 },
      { model: "Ceed 1.5 T-GDI", purchasePrice: 280000, fuelType: "petrol", fuelConsumption: 6.2, taxCost: 1300, serviceCost: 3500 },
      { model: "Picanto 1.0", purchasePrice: 170000, fuelType: "petrol", fuelConsumption: 4.8, taxCost: 800, serviceCost: 2500 },
    ],
  },
  {
    brand: "Hyundai",
    models: [
      { model: "Ioniq 5", purchasePrice: 470000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2800 },
      { model: "Ioniq 6", purchasePrice: 510000, fuelType: "electric", fuelConsumption: 14, taxCost: 360, serviceCost: 2800 },
      { model: "Kona Electric", purchasePrice: 380000, fuelType: "electric", fuelConsumption: 14.5, taxCost: 360, serviceCost: 2500 },
      { model: "Tucson 1.6 T-GDI", purchasePrice: 380000, fuelType: "petrol", fuelConsumption: 7.3, taxCost: 1600, serviceCost: 4200 },
      { model: "i20 1.2", purchasePrice: 200000, fuelType: "petrol", fuelConsumption: 5.5, taxCost: 1000, serviceCost: 3000 },
      { model: "i30 1.5 T-GDI", purchasePrice: 280000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1300, serviceCost: 3500 },
    ],
  },
  {
    brand: "Skoda",
    models: [
      { model: "Octavia 1.5 TSI", purchasePrice: 300000, fuelType: "petrol", fuelConsumption: 5.9, taxCost: 1400, serviceCost: 4000 },
      { model: "Octavia RS 2.0 TSI", purchasePrice: 400000, fuelType: "petrol", fuelConsumption: 7.2, taxCost: 2000, serviceCost: 5000 },
      { model: "Enyaq iV", purchasePrice: 430000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 2800 },
      { model: "Kodiaq 2.0 TDI", purchasePrice: 420000, fuelType: "diesel", fuelConsumption: 6.0, taxCost: 2100, serviceCost: 5000 },
      { model: "Fabia 1.0 TSI", purchasePrice: 200000, fuelType: "petrol", fuelConsumption: 5.0, taxCost: 900, serviceCost: 3200 },
      { model: "Superb 2.0 TDI", purchasePrice: 380000, fuelType: "diesel", fuelConsumption: 5.0, taxCost: 1700, serviceCost: 4500 },
    ],
  },
  {
    brand: "Polestar",
    models: [
      { model: "Polestar 2", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 3200 },
      { model: "Polestar 3", purchasePrice: 750000, fuelType: "electric", fuelConsumption: 19, taxCost: 360, serviceCost: 4000 },
      { model: "Polestar 4", purchasePrice: 600000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3500 },
    ],
  },
  {
    brand: "Mercedes-Benz",
    models: [
      { model: "A 200", purchasePrice: 350000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1700, serviceCost: 6500 },
      { model: "C 200", purchasePrice: 430000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1900, serviceCost: 7000 },
      { model: "C 300", purchasePrice: 480000, fuelType: "petrol", fuelConsumption: 7.2, taxCost: 2100, serviceCost: 7500 },
      { model: "EQA 250", purchasePrice: 490000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3800 },
      { model: "EQB 250+", purchasePrice: 530000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 4000 },
      { model: "GLC 300", purchasePrice: 550000, fuelType: "petrol", fuelConsumption: 8.0, taxCost: 2400, serviceCost: 7500 },
      { model: "EQE 300", purchasePrice: 650000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 4200 },
    ],
  },
  {
    brand: "Audi",
    models: [
      { model: "A3 35 TFSI", purchasePrice: 350000, fuelType: "petrol", fuelConsumption: 6.2, taxCost: 1600, serviceCost: 6000 },
      { model: "A4 40 TFSI", purchasePrice: 430000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1900, serviceCost: 6500 },
      { model: "Q4 e-tron", purchasePrice: 500000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 3500 },
      { model: "Q8 e-tron", purchasePrice: 750000, fuelType: "electric", fuelConsumption: 20, taxCost: 360, serviceCost: 4500 },
      { model: "Q3 35 TFSI", purchasePrice: 390000, fuelType: "petrol", fuelConsumption: 7.0, taxCost: 1700, serviceCost: 5800 },
      { model: "A6 40 TDI", purchasePrice: 520000, fuelType: "diesel", fuelConsumption: 5.5, taxCost: 2100, serviceCost: 7000 },
    ],
  },
  {
    brand: "Ford",
    models: [
      { model: "Focus 1.0 EcoBoost", purchasePrice: 280000, fuelType: "petrol", fuelConsumption: 5.8, taxCost: 1300, serviceCost: 4000 },
      { model: "Puma 1.0 EcoBoost", purchasePrice: 300000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1400, serviceCost: 4200 },
      { model: "Kuga 2.5 PHEV", purchasePrice: 410000, fuelType: "hybrid", fuelConsumption: 1.4, taxCost: 500, serviceCost: 4500 },
      { model: "Mustang Mach-E", purchasePrice: 520000, fuelType: "electric", fuelConsumption: 18, taxCost: 360, serviceCost: 3200 },
      { model: "Explorer EV", purchasePrice: 550000, fuelType: "electric", fuelConsumption: 19, taxCost: 360, serviceCost: 3500 },
    ],
  },
  {
    brand: "Renault",
    models: [
      { model: "Clio 1.0 TCe", purchasePrice: 210000, fuelType: "petrol", fuelConsumption: 5.5, taxCost: 1000, serviceCost: 3200 },
      { model: "Mégane E-Tech", purchasePrice: 400000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 2800 },
      { model: "Captur 1.3 TCe", purchasePrice: 270000, fuelType: "petrol", fuelConsumption: 6.3, taxCost: 1300, serviceCost: 3800 },
      { model: "Scenic E-Tech", purchasePrice: 470000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3000 },
      { model: "Austral 1.3 TCe", purchasePrice: 340000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1500, serviceCost: 4200 },
    ],
  },
  {
    brand: "Mazda",
    models: [
      { model: "CX-30 2.0 Skyactiv-G", purchasePrice: 310000, fuelType: "petrol", fuelConsumption: 6.4, taxCost: 1400, serviceCost: 4200 },
      { model: "CX-5 2.0 Skyactiv-G", purchasePrice: 360000, fuelType: "petrol", fuelConsumption: 7.1, taxCost: 1600, serviceCost: 4500 },
      { model: "3 2.0 Skyactiv-G", purchasePrice: 290000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1300, serviceCost: 4000 },
      { model: "CX-60 3.3 e-Skyactiv D", purchasePrice: 480000, fuelType: "diesel", fuelConsumption: 5.3, taxCost: 2000, serviceCost: 5500 },
      { model: "MX-30 EV", purchasePrice: 350000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2800 },
    ],
  },
  {
    brand: "Cupra",
    models: [
      { model: "Born", purchasePrice: 400000, fuelType: "electric", fuelConsumption: 15.5, taxCost: 360, serviceCost: 2800 },
      { model: "Formentor 1.5 TSI", purchasePrice: 370000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1600, serviceCost: 4800 },
      { model: "Leon 1.5 TSI", purchasePrice: 330000, fuelType: "petrol", fuelConsumption: 6.3, taxCost: 1500, serviceCost: 4500 },
      { model: "Tavascan", purchasePrice: 520000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 3200 },
    ],
  },
  {
    brand: "Nissan",
    models: [
      { model: "Qashqai 1.3 DIG-T", purchasePrice: 340000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1500, serviceCost: 4200 },
      { model: "Leaf", purchasePrice: 350000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 2500 },
      { model: "Ariya", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 3000 },
      { model: "Juke 1.0 DIG-T", purchasePrice: 260000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1200, serviceCost: 3800 },
    ],
  },
  {
    brand: "Peugeot",
    models: [
      { model: "208 1.2 PureTech", purchasePrice: 220000, fuelType: "petrol", fuelConsumption: 5.2, taxCost: 1000, serviceCost: 3200 },
      { model: "e-208", purchasePrice: 350000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 2500 },
      { model: "2008 1.2 PureTech", purchasePrice: 280000, fuelType: "petrol", fuelConsumption: 5.8, taxCost: 1300, serviceCost: 3800 },
      { model: "e-308", purchasePrice: 420000, fuelType: "electric", fuelConsumption: 15.5, taxCost: 360, serviceCost: 2800 },
      { model: "3008 1.2 PureTech", purchasePrice: 370000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1500, serviceCost: 4200 },
    ],
  },
  {
    brand: "SEAT",
    models: [
      { model: "Ibiza 1.0 TSI", purchasePrice: 200000, fuelType: "petrol", fuelConsumption: 5.2, taxCost: 900, serviceCost: 3200 },
      { model: "Leon 1.5 TSI", purchasePrice: 290000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1300, serviceCost: 4000 },
      { model: "Arona 1.0 TSI", purchasePrice: 240000, fuelType: "petrol", fuelConsumption: 5.5, taxCost: 1100, serviceCost: 3500 },
      { model: "Ateca 1.5 TSI", purchasePrice: 320000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1500, serviceCost: 4200 },
    ],
  },
  {
    brand: "MG",
    models: [
      { model: "MG4", purchasePrice: 300000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 2200 },
      { model: "ZS EV", purchasePrice: 280000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2200 },
      { model: "Marvel R", purchasePrice: 380000, fuelType: "electric", fuelConsumption: 18, taxCost: 360, serviceCost: 2500 },
    ],
  },
  {
    brand: "BYD",
    models: [
      { model: "Atto 3", purchasePrice: 370000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 2200 },
      { model: "Seal", purchasePrice: 450000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 2500 },
      { model: "Dolphin", purchasePrice: 280000, fuelType: "electric", fuelConsumption: 14, taxCost: 360, serviceCost: 2000 },
      { model: "Tang", purchasePrice: 550000, fuelType: "electric", fuelConsumption: 20, taxCost: 360, serviceCost: 3000 },
    ],
  },
];

export function getBrands(): string[] {
  return carDatabase.map((b) => b.brand).sort();
}

function canonicalizeDatabaseBrand(brand: string): string {
  const trimmedBrand = brand.trim();
  if (!trimmedBrand) return "";

  return BRAND_NAME_ALIASES[trimmedBrand.toLowerCase()] ?? trimmedBrand;
}

export function getModels(brand: string): CarModel[] {
  const canonicalBrand = canonicalizeDatabaseBrand(brand);
  return carDatabase.find((b) => b.brand === canonicalBrand)?.models ?? [];
}

export function findCarModel(brand: string, model: string): CarModel | undefined {
  const canonicalBrand = canonicalizeDatabaseBrand(brand);
  return carDatabase.find((b) => b.brand === canonicalBrand)?.models.find((m) => m.model === model);
}

function normalizeModelKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function inferFuelTypeFromText(value: string): FuelType | null {
  const normalized = value.toLowerCase();

  if (
    /\b(296 gtb|296 gts|296 speciale|296 speciale a|sf90|revuelto|artura|e-ray|e-hybrid|urus se)\b/.test(normalized)
  ) {
    return "hybrid";
  }

  if (
    /\b(electric|bev|battery electric)\b/.test(normalized) ||
    normalized.includes("mach-e") ||
    normalized.includes(" e-tron") ||
    normalized.startsWith("e-")
  ) {
    return "electric";
  }

  if (/\b(hybrid|phev|plug-in|plugin|hev)\b/.test(normalized)) {
    return "hybrid";
  }

  if (/\b(diesel|tdi|dci|hdi|cdi|crdi|d-4d|ecoblue|multijet)\b/.test(normalized)) {
    return "diesel";
  }

  if (/\b(petrol|gasoline|tsi|tfsi|gdi|ecoboost|puretech|skyactiv-g)\b/.test(normalized)) {
    return "petrol";
  }

  // Many FuelEconomy option labels for combustion cars only expose engine specs.
  if (
    /\b\d+\s*cyl\b/.test(normalized) ||
    /\b\d+(?:[.,]\d+)?\s*l\b/.test(normalized) ||
    /\bturbo\b/.test(normalized)
  ) {
    return "petrol";
  }

  return null;
}

function getModelTokens(model: string): string[] {
  return model
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function averagePurchasePrice(models: CarModel[]): number | null {
  if (models.length === 0) return null;
  const total = models.reduce((sum, item) => sum + item.purchasePrice, 0);
  return Math.round(total / models.length / 1000) * 1000;
}

function roundToNearestThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

function getModelYearMultiplier(modelYear: number, fuelType: FuelType): number {
  if (!Number.isFinite(modelYear) || modelYear <= 0) return 1;

  const currentYear = new Date().getFullYear();
  const ageYears = Math.max(0, currentYear - modelYear);
  const futureYears = Math.max(0, modelYear - currentYear);

  const firstYearRetention = fuelType === "electric"
    ? 0.82
    : fuelType === "hybrid"
      ? 0.85
      : fuelType === "diesel"
        ? 0.86
        : 0.87;
  const annualRetention = fuelType === "electric"
    ? 0.89
    : fuelType === "hybrid"
      ? 0.91
      : fuelType === "diesel"
        ? 0.92
        : 0.91;
  const floor = fuelType === "electric" ? 0.18 : 0.15;

  if (ageYears === 0) {
    return 1 + Math.min(futureYears, 2) * 0.04;
  }

  if (ageYears === 1) {
    return firstYearRetention;
  }

  return Math.max(floor, firstYearRetention * Math.pow(annualRetention, ageYears - 1));
}

function applyModelYearAdjustment(priceSek: number, modelYear: number, fuelType: FuelType): number {
  return roundToNearestThousand(priceSek * getModelYearMultiplier(modelYear, fuelType));
}

function getBrandPriceAnchor(brand: string, fuelType: FuelType): number | null {
  const anchors = BRAND_PRICE_ANCHORS[canonicalizeDatabaseBrand(brand)];
  if (!anchors) return null;

  return anchors[fuelType] ?? anchors.petrol ?? anchors.hybrid ?? anchors.electric ?? anchors.diesel ?? null;
}

export function inferAvailableFuelTypes(
  brand: string,
  model: string,
  optionLabels: string[] = [],
): FuelType[] {
  const exactModel = findCarModel(brand, model);
  if (exactModel) return [exactModel.fuelType];

  const inferredModelFuelType = inferFuelTypeFromText(model);
  if (inferredModelFuelType) return [inferredModelFuelType];

  const brandModels = getModels(brand);
  const normalizedModel = normalizeModelKey(model);
  const modelTokens = new Set(getModelTokens(model));
  const availableFuelTypes = new Set<FuelType>();

  brandModels.forEach((item) => {
    const candidateKey = normalizeModelKey(item.model);
    if (!candidateKey) return;

    const candidateTokens = getModelTokens(item.model);
    const matchesFamily =
      candidateKey.includes(normalizedModel) ||
      normalizedModel.includes(candidateKey) ||
      candidateTokens.some((token) => modelTokens.has(token));

    if (matchesFamily) {
      availableFuelTypes.add(item.fuelType);
    }
  });

  optionLabels.forEach((label) => {
    const inferredFuelType = inferFuelTypeFromText(`${model} ${label}`);
    if (inferredFuelType) {
      availableFuelTypes.add(inferredFuelType);
    }
  });

  if (availableFuelTypes.size === 0) {
    return [...FUEL_TYPE_ORDER];
  }

  return FUEL_TYPE_ORDER.filter((fuelType) => availableFuelTypes.has(fuelType));
}

export function findHistoricalPriceEstimate(
  brand: string,
  model: string,
  fuelType: FuelType,
): HistoricalPriceEstimate {
  const brandModels = getModels(brand);
  const normalizedModel = normalizeModelKey(model);
  const modelTokens = new Set(getModelTokens(model));

  const exactModelMatches = brandModels.filter((item) => normalizeModelKey(item.model) === normalizedModel);
  const exactPrice = averagePurchasePrice(exactModelMatches);
  if (exactPrice) {
    return { priceSek: exactPrice, sampleSize: exactModelMatches.length, basis: "exact_model" };
  }

  const similarModelMatches = brandModels.filter((item) => {
    const candidateKey = normalizeModelKey(item.model);
    if (!candidateKey) return false;
    if (candidateKey.includes(normalizedModel) || normalizedModel.includes(candidateKey)) return true;

    const candidateTokens = getModelTokens(item.model);
    return candidateTokens.some((token) => modelTokens.has(token));
  });
  const similarPrice = averagePurchasePrice(similarModelMatches);
  if (similarPrice) {
    return { priceSek: similarPrice, sampleSize: similarModelMatches.length, basis: "similar_model" };
  }

  const brandFuelMatches = brandModels.filter((item) => item.fuelType === fuelType);
  const brandFuelPrice = averagePurchasePrice(brandFuelMatches);
  if (brandFuelPrice) {
    return { priceSek: brandFuelPrice, sampleSize: brandFuelMatches.length, basis: "brand_fuel" };
  }

  const brandPrice = averagePurchasePrice(brandModels);
  if (brandPrice) {
    return { priceSek: brandPrice, sampleSize: brandModels.length, basis: "brand" };
  }

  const brandAnchorPrice = getBrandPriceAnchor(brand, fuelType);
  if (brandAnchorPrice) {
    return { priceSek: brandAnchorPrice, sampleSize: 1, basis: "brand_anchor" };
  }

  const allModels = carDatabase.flatMap((item) => item.models);
  const fuelTypeMatches = allModels.filter((item) => item.fuelType === fuelType);
  const fuelTypePrice = averagePurchasePrice(fuelTypeMatches);
  if (fuelTypePrice) {
    return { priceSek: fuelTypePrice, sampleSize: fuelTypeMatches.length, basis: "fuel_type" };
  }

  const globalPrice = averagePurchasePrice(allModels);
  if (globalPrice) {
    return { priceSek: globalPrice, sampleSize: allModels.length, basis: "global" };
  }

  return { priceSek: null, sampleSize: 0, basis: "none" };
}

export function estimatePurchasePrice(
  brand: string,
  model: string,
  fuelType: FuelType,
  modelYear: number,
): PurchasePriceEstimate {
  const exactModel = findCarModel(brand, model);
  if (exactModel) {
    return {
      priceSek: applyModelYearAdjustment(exactModel.purchasePrice, modelYear, exactModel.fuelType),
      sampleSize: 1,
      basis: "local_model",
      priceSource: "historical_average",
    };
  }

  const historicalEstimate = findHistoricalPriceEstimate(brand, model, fuelType);
  if (!historicalEstimate.priceSek) {
    return {
      priceSek: 0,
      sampleSize: historicalEstimate.sampleSize,
      basis: historicalEstimate.basis,
      priceSource: "missing",
    };
  }

  return {
    priceSek: applyModelYearAdjustment(historicalEstimate.priceSek, modelYear, fuelType),
    sampleSize: historicalEstimate.sampleSize,
    basis: historicalEstimate.basis,
    priceSource: "historical_average",
  };
}

export function getDefaultFuelPrice(fuelType: FuelType): number {
  switch (fuelType) {
    case "petrol": return 18.5;
    case "diesel": return 20.0;
    case "hybrid": return 18.5;
    case "electric": return 2.2;
  }
}
