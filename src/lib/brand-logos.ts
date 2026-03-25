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

export function getBrandLogo(brand: string): string | null {
  return BRAND_LOGOS[brand] || null;
}

export function getBrandInitials(brand: string): string {
  const map: Record<string, string> = {
    "Mercedes-Benz": "MB",
    Volkswagen: "VW",
  };
  return map[brand] || brand.slice(0, 2).toUpperCase();
}
