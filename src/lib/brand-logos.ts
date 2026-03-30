import volvoLogo from "@/assets/logos/volvo.png";
import teslaLogo from "@/assets/logos/tesla.png";
import volkswagenLogo from "@/assets/logos/volkswagen.png";
import bmwLogo from "@/assets/logos/bmw.png";
import toyotaLogo from "@/assets/logos/toyota.png";
import kiaLogo from "@/assets/logos/kia.png";
import hyundaiLogo from "@/assets/logos/hyundai.png";
import skodaLogo from "@/assets/logos/skoda.png";
import polestarLogo from "@/assets/logos/polestar.png";
import mercedesLogo from "@/assets/logos/mercedes-benz.png";
import audiLogo from "@/assets/logos/audi.png";
import fordLogo from "@/assets/logos/ford.png";
import renaultLogo from "@/assets/logos/renault.png";
import mazdaLogo from "@/assets/logos/mazda.png";
import cupraLogo from "@/assets/logos/cupra.png";
import nissanLogo from "@/assets/logos/nissan.png";
import peugeotLogo from "@/assets/logos/peugeot.png";
import seatLogo from "@/assets/logos/seat.png";
import mgLogo from "@/assets/logos/mg.png";
import bydLogo from "@/assets/logos/byd.png";

const BRAND_LOGOS: Record<string, string> = {
  Volvo: volvoLogo,
  Tesla: teslaLogo,
  Volkswagen: volkswagenLogo,
  BMW: bmwLogo,
  Toyota: toyotaLogo,
  Kia: kiaLogo,
  Hyundai: hyundaiLogo,
  Skoda: skodaLogo,
  Polestar: polestarLogo,
  "Mercedes-Benz": mercedesLogo,
  Audi: audiLogo,
  Ford: fordLogo,
  Renault: renaultLogo,
  Mazda: mazdaLogo,
  Cupra: cupraLogo,
  Nissan: nissanLogo,
  Peugeot: peugeotLogo,
  SEAT: seatLogo,
  MG: mgLogo,
  BYD: bydLogo,
};

const BRAND_ACCENTS: Record<string, string> = {
  Volvo: "#0f5fb3",
  Tesla: "#cc0000",
  Volkswagen: "#0d3f8f",
  BMW: "#1f6ed4",
  Toyota: "#c8102e",
  Kia: "#ab1e2d",
  Hyundai: "#003e7e",
  Skoda: "#0f7f4f",
  Polestar: "#5b6168",
  "Mercedes-Benz": "#111111",
  Audi: "#bb0a30",
  Ford: "#003478",
  Renault: "#b07a00",
  Mazda: "#9e2236",
  Cupra: "#a05a2c",
  Nissan: "#5f6368",
  Peugeot: "#003f7f",
  SEAT: "#c41230",
  MG: "#b1131a",
  BYD: "#cc1f2f",
};

export function getBrandLogo(brand: string): string | null {
  return BRAND_LOGOS[brand] || null;
}

export function getBrandAccent(brand: string): string {
  return BRAND_ACCENTS[brand] || "#1f2937";
}

export function getBrandInitials(brand: string): string {
  const map: Record<string, string> = {
    "Mercedes-Benz": "MB",
    Volkswagen: "VW",
  };
  return map[brand] || brand.slice(0, 2).toUpperCase();
}
