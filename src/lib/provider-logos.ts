import folksamLogo from "@/assets/provider-logos/folksam.png";
import ifLogo from "@/assets/provider-logos/if.png";
import nordeaLogo from "@/assets/provider-logos/nordea.svg";
import swedbankLogo from "@/assets/provider-logos/swedbank.svg";
import tryggHansaLogo from "@/assets/provider-logos/trygg-hansa.svg";
import { getBrandAccent, getBrandLogo } from "@/lib/brand-logos";

export interface ProviderVisual {
  accentColor: string;
  logoSrc: string | null;
}

interface ProviderVisualEntry extends ProviderVisual {
  keys: string[];
}

const BRAND_PROVIDER_VISUALS: Record<string, ProviderVisual> = {
  Toyota: {
    logoSrc: getBrandLogo("Toyota"),
    accentColor: getBrandAccent("Toyota"),
  },
  Volvo: {
    logoSrc: getBrandLogo("Volvo"),
    accentColor: getBrandAccent("Volvo"),
  },
  Polestar: {
    logoSrc: getBrandLogo("Polestar"),
    accentColor: getBrandAccent("Polestar"),
  },
  Kia: {
    logoSrc: getBrandLogo("Kia"),
    accentColor: getBrandAccent("Kia"),
  },
};

const PROVIDER_VISUALS: ProviderVisualEntry[] = [
  {
    keys: ["swedbank"],
    logoSrc: swedbankLogo,
    accentColor: "#ec6608",
  },
  {
    keys: ["nordea"],
    logoSrc: nordeaLogo,
    accentColor: "#12284c",
  },
  {
    keys: ["ica banken", "icabanken"],
    logoSrc: null,
    accentColor: "#c41230",
  },
  {
    keys: ["seb"],
    logoSrc: null,
    accentColor: "#78be20",
  },
  {
    keys: ["handelsbanken"],
    logoSrc: null,
    accentColor: "#005b9a",
  },
  {
    keys: ["bilia", "bilia volvo", "bilia audi"],
    logoSrc: null,
    accentColor: "#111827",
  },
  {
    keys: ["blocket", "blocket mobility"],
    logoSrc: null,
    accentColor: "#1d4ed8",
  },
  {
    keys: ["riddermark bil", "riddermark"],
    logoSrc: null,
    accentColor: "#b91c1c",
  },
  {
    keys: ["aften bil", "aften", "aftén bil", "aftén"],
    logoSrc: null,
    accentColor: "#374151",
  },
  {
    keys: ["hedin automotive", "hedin"],
    logoSrc: null,
    accentColor: "#0f4c81",
  },
  {
    keys: ["handla bil", "handlabil"],
    logoSrc: null,
    accentColor: "#065f46",
  },
  {
    keys: ["ra motor", "ramotor"],
    logoSrc: null,
    accentColor: "#d97706",
  },
  {
    keys: ["rejmes"],
    logoSrc: null,
    accentColor: "#1f2937",
  },
  {
    keys: ["hedvig"],
    logoSrc: null,
    accentColor: "#ff6b35",
  },
  {
    keys: ["dina forsakringar", "dina försäkringar", "dina"],
    logoSrc: null,
    accentColor: "#0f8b8d",
  },
  {
    keys: ["volvia"],
    logoSrc: null,
    accentColor: "#1d4ed8",
  },
  {
    keys: ["if", "if skadeforsakring", "if skadeforsakring ab"],
    logoSrc: ifLogo,
    accentColor: "#005eb8",
  },
  {
    keys: ["folksam"],
    logoSrc: folksamLogo,
    accentColor: "#0063af",
  },
  {
    keys: ["trygghansa", "trygg hansa"],
    logoSrc: tryggHansaLogo,
    accentColor: "#0d5b52",
  },
  {
    keys: ["toyota financial services", "toyota sverige", "toyota"],
    ...BRAND_PROVIDER_VISUALS.Toyota,
  },
  {
    keys: ["volvo cars", "care by volvo", "volvo cars sverige", "volvo"],
    ...BRAND_PROVIDER_VISUALS.Volvo,
  },
  {
    keys: ["polestar", "polestar sverige"],
    ...BRAND_PROVIDER_VISUALS.Polestar,
  },
  {
    keys: ["kia finans", "kia sverige", "kia"],
    ...BRAND_PROVIDER_VISUALS.Kia,
  },
];

function normalizeProviderKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getProviderVisual(providerName: string): ProviderVisual {
  const normalized = normalizeProviderKey(providerName);
  const matched = PROVIDER_VISUALS.find((entry) =>
    entry.keys.some((key) => normalizeProviderKey(key) === normalized)
  );

  if (matched) {
    return {
      logoSrc: matched.logoSrc,
      accentColor: matched.accentColor,
    };
  }

  return {
    logoSrc: null,
    accentColor: "#0f766e",
  };
}
