/** Simple SVG-based brand logo initials for the car database */

const BRAND_COLORS: Record<string, string> = {
  Volvo: "#003057",
  Tesla: "#cc0000",
  Volkswagen: "#001e50",
  BMW: "#0066b1",
  Toyota: "#eb0a1e",
  Kia: "#05141f",
  Hyundai: "#002c5f",
  Skoda: "#4ba82e",
  Polestar: "#1a1a1a",
  "Mercedes-Benz": "#333333",
  Audi: "#bb0a30",
  Ford: "#003399",
  Renault: "#ffcc00",
  Mazda: "#910a2a",
  Cupra: "#003e51",
  Nissan: "#c3002f",
  Peugeot: "#1f3c73",
  SEAT: "#e31937",
  MG: "#1b4332",
  BYD: "#b71c1c",
};

const BRAND_INITIALS: Record<string, string> = {
  "Mercedes-Benz": "MB",
  Volkswagen: "VW",
};

export function getBrandColor(brand: string): string {
  return BRAND_COLORS[brand] || "#666666";
}

export function getBrandInitials(brand: string): string {
  return BRAND_INITIALS[brand] || brand.slice(0, 2).toUpperCase();
}
