import { FuelType } from "./car-types";

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
      { model: "330e", purchasePrice: 480000, fuelType: "petrol", fuelConsumption: 2.0, taxCost: 500, serviceCost: 6000 },
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
      { model: "Corolla 1.8 Hybrid", purchasePrice: 290000, fuelType: "petrol", fuelConsumption: 4.5, taxCost: 1100, serviceCost: 3800 },
      { model: "Corolla Cross Hybrid", purchasePrice: 350000, fuelType: "petrol", fuelConsumption: 5.0, taxCost: 1200, serviceCost: 4000 },
      { model: "RAV4 2.5 Hybrid", purchasePrice: 410000, fuelType: "petrol", fuelConsumption: 5.6, taxCost: 1500, serviceCost: 4200 },
      { model: "Yaris 1.5 Hybrid", purchasePrice: 230000, fuelType: "petrol", fuelConsumption: 3.8, taxCost: 900, serviceCost: 3200 },
      { model: "bZ4X", purchasePrice: 460000, fuelType: "electric", fuelConsumption: 16.7, taxCost: 360, serviceCost: 2800 },
      { model: "C-HR Hybrid", purchasePrice: 340000, fuelType: "petrol", fuelConsumption: 4.8, taxCost: 1100, serviceCost: 3800 },
      { model: "Camry Hybrid", purchasePrice: 380000, fuelType: "petrol", fuelConsumption: 4.9, taxCost: 1300, serviceCost: 4000 },
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
      { model: "Kuga 2.5 PHEV", purchasePrice: 410000, fuelType: "petrol", fuelConsumption: 1.4, taxCost: 500, serviceCost: 4500 },
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

export function getModels(brand: string): CarModel[] {
  return carDatabase.find((b) => b.brand === brand)?.models ?? [];
}

export function findCarModel(brand: string, model: string): CarModel | undefined {
  return carDatabase.find((b) => b.brand === brand)?.models.find((m) => m.model === model);
}

export function getDefaultFuelPrice(fuelType: FuelType): number {
  switch (fuelType) {
    case "petrol": return 18.5;
    case "diesel": return 20.0;
    case "electric": return 2.2;
  }
}
