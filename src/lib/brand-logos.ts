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
import abarthLogo from "@/assets/logos/abarth.png";
import aiwaysLogo from "@/assets/logos/aiways.png";
import alfaRomeoLogo from "@/assets/logos/alfa-romeo.png";
import alpineLogo from "@/assets/logos/alpine.png";
import bugattiLogo from "@/assets/logos/bugatti.png";
import buickLogo from "@/assets/logos/buick.png";
import dodgeLogo from "@/assets/logos/dodge.png";
import dongfengLogo from "@/assets/logos/dongfeng.png";
import elarisLogo from "@/assets/logos/elaris.svg";
import fireflyLogo from "@/assets/logos/firefly.svg";
import genesisLogo from "@/assets/logos/genesis.png";
import gmcLogo from "@/assets/logos/gmc.png";
import greatWallLogo from "@/assets/logos/great-wall.png";
import hongqiLogo from "@/assets/logos/hongqi.png";
import jaguarLogo from "@/assets/logos/jaguar.png";
import kgmLogo from "@/assets/logos/kgm.svg";
import lanciaLogo from "@/assets/logos/lancia.png";
import landRoverLogo from "@/assets/logos/land-rover.png";
import leapmotorLogo from "@/assets/logos/leapmotor.png";
import lexusLogo from "@/assets/logos/lexus.png";
import lincolnLogo from "@/assets/logos/lincoln.png";
import lotusLogo from "@/assets/logos/lotus.png";
import lynkAndCoLogo from "@/assets/logos/lynk-and-co.png";
import maxusLogo from "@/assets/logos/maxus.png";
import nioLogo from "@/assets/logos/nio.png";
import rivianLogo from "@/assets/logos/rivian.png";
import vinfastLogo from "@/assets/logos/vinfast.png";
import voyahLogo from "@/assets/logos/voyah.png";
import xpengLogo from "@/assets/logos/xpeng.png";
import zeekrLogo from "@/assets/logos/zeekr.png";
import type { SimpleIcon } from "simple-icons";
import {
  siAcura,
  siAstonmartin,
  siBentley,
  siBmw,
  siBugatti,
  siCadillac,
  siChevrolet,
  siChrysler,
  siCitroen,
  siDacia,
  siDsautomobiles,
  siFerrari,
  siFiat,
  siHonda,
  siInfiniti,
  siJeep,
  siLamborghini,
  siLucid,
  siMaserati,
  siMclaren,
  siMini,
  siMitsubishi,
  siOpel,
  siPorsche,
  siRam,
  siRollsroyce,
  siSeat,
  siSmart,
  siSubaru,
  siSuzuki,
  siVauxhall,
} from "simple-icons";

const BRAND_LOGOS: Record<string, string> = {
  Abarth: abarthLogo,
  Aiways: aiwaysLogo,
  "Alfa Romeo": alfaRomeoLogo,
  Alpine: alpineLogo,
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
  Bugatti: bugattiLogo,
  "Bugatti Rimac": bugattiLogo,
  Buick: buickLogo,
  Dodge: dodgeLogo,
  Dongfeng: dongfengLogo,
  Elaris: elarisLogo,
  firefly: fireflyLogo,
  Genesis: genesisLogo,
  GMC: gmcLogo,
  GWM: greatWallLogo,
  Hongqi: hongqiLogo,
  Jaguar: jaguarLogo,
  KGM: kgmLogo,
  Lancia: lanciaLogo,
  "Land Rover": landRoverLogo,
  Leapmotor: leapmotorLogo,
  Lexus: lexusLogo,
  Lincoln: lincolnLogo,
  Lotus: lotusLogo,
  "Lynk&Co": lynkAndCoLogo,
  Maxus: maxusLogo,
  NIO: nioLogo,
  Rivian: rivianLogo,
  VinFast: vinfastLogo,
  Voyah: voyahLogo,
  XPENG: xpengLogo,
  Zeekr: zeekrLogo,
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
  Elaris: "#ffb300",
};

const BRAND_SIMPLE_ICONS: Record<string, SimpleIcon> = {
  Acura: siAcura,
  "Aston Martin": siAstonmartin,
  Bentley: siBentley,
  BMW: siBmw,
  Bugatti: siBugatti,
  Cadillac: siCadillac,
  Chevrolet: siChevrolet,
  Chrysler: siChrysler,
  Citroen: siCitroen,
  Dacia: siDacia,
  DS: siDsautomobiles,
  Ferrari: siFerrari,
  Fiat: siFiat,
  Honda: siHonda,
  Infiniti: siInfiniti,
  Jeep: siJeep,
  Lamborghini: siLamborghini,
  Lucid: siLucid,
  Maserati: siMaserati,
  McLaren: siMclaren,
  Mini: siMini,
  Mitsubishi: siMitsubishi,
  Opel: siOpel,
  Porsche: siPorsche,
  Ram: siRam,
  "Rolls-Royce": siRollsroyce,
  SEAT: siSeat,
  smart: siSmart,
  Subaru: siSubaru,
  Suzuki: siSuzuki,
  Vauxhall: siVauxhall,
};

const BRAND_ALIASES: Record<string, string> = {
  alfa: "Alfa Romeo",
  alfaromeo: "Alfa Romeo",
  astonmartin: "Aston Martin",
  bmw: "BMW",
  bugattirimac: "Bugatti Rimac",
  byd: "BYD",
  citroen: "Citroen",
  cupra: "Cupra",
  ds: "DS",
  dsautomobiles: "DS",
  elaris: "Elaris",
  firefly: "firefly",
  gmw: "GWM",
  gwm: "GWM",
  infiniti: "Infiniti",
  kgm: "KGM",
  lynkco: "Lynk&Co",
  lynkandco: "Lynk&Co",
  mclaren: "McLaren",
  mg: "MG",
  mercedesbenz: "Mercedes-Benz",
  mini: "Mini",
  nio: "NIO",
  rollsroyce: "Rolls-Royce",
  seat: "SEAT",
  skoda: "Skoda",
  smart: "smart",
  vinfast: "VinFast",
  xpeng: "XPENG",
};

const SIMPLE_ICON_LOGO_CACHE = new Map<string, string>();

function normalizeBrandKey(brand: string): string {
  return brand
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function toTitleCaseWord(word: string): string {
  if (!word) return "";
  if (/^[A-Z0-9&-]{2,}$/.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function formatUnknownBrandName(brand: string): string {
  return brand
    .split(/(\s+|[-&/])/)
    .map((part) => {
      if (!part.trim()) return part;
      if (/^[-&/]$/.test(part)) return part;
      return toTitleCaseWord(part);
    })
    .join("")
    .trim();
}

function getGeneratedBrandAccent(brand: string): string {
  const key = normalizeBrandKey(brand);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 68%, 44%)`;
}

function encodeSvg(value: string): string {
  return encodeURIComponent(value)
    .replace(/%0A/g, "")
    .replace(/%20/g, " ");
}

function getHexChannel(value: string, start: number): number {
  return Number.parseInt(value.slice(start, start + 2), 16) / 255;
}

function toLinearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getHexLuminance(hex: string): number {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length !== 6) return 1;

  const red = toLinearChannel(getHexChannel(normalized, 0));
  const green = toLinearChannel(getHexChannel(normalized, 2));
  const blue = toLinearChannel(getHexChannel(normalized, 4));

  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

function buildSimpleIconLogo(icon: SimpleIcon): string {
  const cached = SIMPLE_ICON_LOGO_CACHE.get(icon.slug);
  if (cached) return cached;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}">
      <title>${icon.title}</title>
      <path fill="#${icon.hex}" d="${icon.path}" />
    </svg>
  `;

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeSvg(svg)}`;
  SIMPLE_ICON_LOGO_CACHE.set(icon.slug, dataUri);
  return dataUri;
}

function getBrandSimpleIcon(brand: string): SimpleIcon | null {
  return BRAND_SIMPLE_ICONS[brand] || null;
}

export function canonicalizeBrandName(brand: string): string {
  const trimmed = brand.trim();
  if (!trimmed) return trimmed;
  const alias = BRAND_ALIASES[normalizeBrandKey(trimmed)];
  if (alias) return alias;
  return formatUnknownBrandName(trimmed);
}

export function getBrandLogo(brand: string): string | null {
  const canonicalBrand = canonicalizeBrandName(brand);
  if (!canonicalBrand) return null;
  if (BRAND_LOGOS[canonicalBrand]) {
    return BRAND_LOGOS[canonicalBrand];
  }

  const simpleIcon = getBrandSimpleIcon(canonicalBrand);
  if (simpleIcon) {
    return buildSimpleIconLogo(simpleIcon);
  }

  return null;
}

export function shouldElevateBrandLogoInDarkMode(brand: string): boolean {
  const canonicalBrand = canonicalizeBrandName(brand);
  if (!canonicalBrand || BRAND_LOGOS[canonicalBrand]) {
    return false;
  }

  const simpleIcon = getBrandSimpleIcon(canonicalBrand);
  if (!simpleIcon) return false;

  return getHexLuminance(simpleIcon.hex) < 0.18;
}

export function getBrandAccent(brand: string): string {
  const canonicalBrand = canonicalizeBrandName(brand);
  if (BRAND_ACCENTS[canonicalBrand]) {
    return BRAND_ACCENTS[canonicalBrand];
  }

  const simpleIcon = getBrandSimpleIcon(canonicalBrand);
  if (simpleIcon) {
    return `#${simpleIcon.hex}`;
  }

  return getGeneratedBrandAccent(canonicalBrand);
}
