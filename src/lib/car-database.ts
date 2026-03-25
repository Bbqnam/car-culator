import { FuelType } from "./car-types";

export interface CarModel {
  model: string;
  purchasePrice: number;
  fuelType: FuelType;
  fuelConsumption: number; // L/100km or kWh/100km
  taxCost: number;
  serviceCost: number;
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
    ],
  },
  {
    brand: "Tesla",
    models: [
      { model: "Model 3", purchasePrice: 420000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 3000 },
      { model: "Model Y", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 3200 },
      { model: "Model S", purchasePrice: 950000, fuelType: "electric", fuelConsumption: 18, taxCost: 360, serviceCost: 4500 },
    ],
  },
  {
    brand: "Volkswagen",
    models: [
      { model: "Golf 1.5 TSI", purchasePrice: 310000, fuelType: "petrol", fuelConsumption: 6.0, taxCost: 1400, serviceCost: 4500 },
      { model: "ID.4", purchasePrice: 430000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2800 },
      { model: "ID.3", purchasePrice: 370000, fuelType: "electric", fuelConsumption: 15.5, taxCost: 360, serviceCost: 2500 },
      { model: "Tiguan 2.0 TDI", purchasePrice: 420000, fuelType: "diesel", fuelConsumption: 5.8, taxCost: 2000, serviceCost: 5200 },
      { model: "Passat 2.0 TDI", purchasePrice: 380000, fuelType: "diesel", fuelConsumption: 5.2, taxCost: 1800, serviceCost: 4800 },
    ],
  },
  {
    brand: "BMW",
    models: [
      { model: "320i", purchasePrice: 420000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1900, serviceCost: 6500 },
      { model: "iX3", purchasePrice: 580000, fuelType: "electric", fuelConsumption: 18.5, taxCost: 360, serviceCost: 3500 },
      { model: "X1 sDrive18i", purchasePrice: 390000, fuelType: "petrol", fuelConsumption: 7.0, taxCost: 1700, serviceCost: 5500 },
      { model: "i4 eDrive40", purchasePrice: 560000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 3800 },
    ],
  },
  {
    brand: "Toyota",
    models: [
      { model: "Corolla 1.8 Hybrid", purchasePrice: 290000, fuelType: "petrol", fuelConsumption: 4.5, taxCost: 1100, serviceCost: 3800 },
      { model: "RAV4 2.5 Hybrid", purchasePrice: 410000, fuelType: "petrol", fuelConsumption: 5.6, taxCost: 1500, serviceCost: 4200 },
      { model: "Yaris 1.5 Hybrid", purchasePrice: 230000, fuelType: "petrol", fuelConsumption: 3.8, taxCost: 900, serviceCost: 3200 },
      { model: "bZ4X", purchasePrice: 460000, fuelType: "electric", fuelConsumption: 16.7, taxCost: 360, serviceCost: 2800 },
    ],
  },
  {
    brand: "Kia",
    models: [
      { model: "EV6", purchasePrice: 510000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 2800 },
      { model: "Niro EV", purchasePrice: 400000, fuelType: "electric", fuelConsumption: 15, taxCost: 360, serviceCost: 2500 },
      { model: "Sportage 1.6 T-GDI", purchasePrice: 370000, fuelType: "petrol", fuelConsumption: 7.5, taxCost: 1600, serviceCost: 4000 },
      { model: "Ceed 1.5 T-GDI", purchasePrice: 280000, fuelType: "petrol", fuelConsumption: 6.2, taxCost: 1300, serviceCost: 3500 },
    ],
  },
  {
    brand: "Hyundai",
    models: [
      { model: "Ioniq 5", purchasePrice: 470000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 2800 },
      { model: "Kona Electric", purchasePrice: 380000, fuelType: "electric", fuelConsumption: 14.5, taxCost: 360, serviceCost: 2500 },
      { model: "Tucson 1.6 T-GDI", purchasePrice: 380000, fuelType: "petrol", fuelConsumption: 7.3, taxCost: 1600, serviceCost: 4200 },
      { model: "i20 1.2", purchasePrice: 200000, fuelType: "petrol", fuelConsumption: 5.5, taxCost: 1000, serviceCost: 3000 },
    ],
  },
  {
    brand: "Skoda",
    models: [
      { model: "Octavia 1.5 TSI", purchasePrice: 300000, fuelType: "petrol", fuelConsumption: 5.9, taxCost: 1400, serviceCost: 4000 },
      { model: "Enyaq iV", purchasePrice: 430000, fuelType: "electric", fuelConsumption: 16.5, taxCost: 360, serviceCost: 2800 },
      { model: "Kodiaq 2.0 TDI", purchasePrice: 420000, fuelType: "diesel", fuelConsumption: 6.0, taxCost: 2100, serviceCost: 5000 },
    ],
  },
  {
    brand: "Polestar",
    models: [
      { model: "Polestar 2", purchasePrice: 480000, fuelType: "electric", fuelConsumption: 16, taxCost: 360, serviceCost: 3200 },
      { model: "Polestar 4", purchasePrice: 600000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3500 },
    ],
  },
  {
    brand: "Mercedes-Benz",
    models: [
      { model: "A 200", purchasePrice: 350000, fuelType: "petrol", fuelConsumption: 6.5, taxCost: 1700, serviceCost: 6500 },
      { model: "C 300", purchasePrice: 480000, fuelType: "petrol", fuelConsumption: 7.2, taxCost: 2100, serviceCost: 7500 },
      { model: "EQA 250", purchasePrice: 490000, fuelType: "electric", fuelConsumption: 17, taxCost: 360, serviceCost: 3800 },
      { model: "EQB 250+", purchasePrice: 530000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 4000 },
    ],
  },
  {
    brand: "Audi",
    models: [
      { model: "A3 35 TFSI", purchasePrice: 350000, fuelType: "petrol", fuelConsumption: 6.2, taxCost: 1600, serviceCost: 6000 },
      { model: "Q4 e-tron", purchasePrice: 500000, fuelType: "electric", fuelConsumption: 17.5, taxCost: 360, serviceCost: 3500 },
      { model: "A4 40 TFSI", purchasePrice: 430000, fuelType: "petrol", fuelConsumption: 6.8, taxCost: 1900, serviceCost: 6500 },
    ],
  },
];

export function getBrands(): string[] {
  return carDatabase.map((b) => b.brand);
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
