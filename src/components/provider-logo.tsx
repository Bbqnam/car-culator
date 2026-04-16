import bmwLogo from "@/assets/logos/bmw.png";
import mercedesLogo from "@/assets/logos/mercedes-benz.png";
import polestarLogo from "@/assets/logos/polestar.png";
import volvoLogo from "@/assets/logos/volvo.png";
import { cn } from "@/lib/utils";

const PROVIDER_LOGOS: Record<string, { src: string; alt: string; bg?: string }> = {
  "bmw-financial-services": { src: bmwLogo, alt: "BMW logo", bg: "bg-white" },
  "volvo-cars": { src: volvoLogo, alt: "Volvo logo", bg: "bg-white" },
  polestar: { src: polestarLogo, alt: "Polestar logo", bg: "bg-white" },
  "mercedes-benz": { src: mercedesLogo, alt: "Mercedes-Benz logo", bg: "bg-white" },
};

const PROVIDER_WORDMARKS: Record<string, { label: string; bg: string; text: string }> = {
  "ica-banken": { label: "ICA", bg: "bg-[#e4002b]", text: "text-white" },
  "hedin-automotive": { label: "HEDIN", bg: "bg-[#111827]", text: "text-white" },
  kvdbil: { label: "KVD", bg: "bg-[#0b6bcb]", text: "text-white" },
};

export function ProviderLogo({
  providerId,
  name,
  small = false,
}: {
  providerId: string;
  name: string;
  small?: boolean;
}) {
  const image = PROVIDER_LOGOS[providerId];
  const wordmark = PROVIDER_WORDMARKS[providerId];

  if (image) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-border/70 overflow-hidden shrink-0",
          image.bg ?? "bg-white",
          small ? "h-6 w-6 p-1" : "h-8 w-8 p-1.5"
        )}
      >
        <img src={image.src} alt={image.alt} className="max-h-full max-w-full object-contain" />
      </span>
    );
  }

  if (wordmark) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border border-border/70 font-bold shrink-0",
          wordmark.bg,
          wordmark.text,
          small ? "h-6 min-w-6 px-1.5 text-[8px]" : "h-8 min-w-8 px-2 text-[9px]"
        )}
        title={name}
      >
        {wordmark.label}
      </span>
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border/70 bg-secondary text-muted-foreground font-semibold shrink-0",
        small ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[10px]"
      )}
      title={name}
    >
      {initials}
    </span>
  );
}
