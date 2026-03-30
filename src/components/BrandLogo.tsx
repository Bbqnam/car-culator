import { getBrandLogo, getBrandInitials } from "@/lib/brand-logos";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ brand, size = "sm" }: BrandLogoProps) {
  const logo = getBrandLogo(brand);
  const dim = size === "lg" ? "h-10 w-10" : size === "md" ? "h-8 w-8" : "h-6 w-6";

  if (logo) {
    return (
      <img
        src={logo}
        alt={brand}
        className={`${dim} object-contain shrink-0`}
        loading="lazy"
      />
    );
  }

  // Fallback: initials in a neutral circle
  const initials = getBrandInitials(brand);
  const fallbackDim = size === "lg" ? "w-10 h-10" : size === "md" ? "w-8 h-8" : "w-6 h-6";
  const textSize = size === "lg" ? "text-[11px]" : size === "md" ? "text-[10px]" : "text-[8px]";

  return (
    <div
      className={`${fallbackDim} rounded-full bg-muted flex items-center justify-center shrink-0`}
    >
      <span className={`${textSize} font-bold text-muted-foreground leading-none`}>
        {initials}
      </span>
    </div>
  );
}
