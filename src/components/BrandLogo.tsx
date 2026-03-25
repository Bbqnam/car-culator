import { getBrandLogo, getBrandInitials } from "@/lib/brand-logos";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md";
}

export function BrandLogo({ brand, size = "sm" }: BrandLogoProps) {
  const logo = getBrandLogo(brand);
  const dim = size === "md" ? "h-7 w-7" : "h-5 w-5";

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
  const fallbackDim = size === "md" ? "w-7 h-7" : "w-5 h-5";
  const textSize = size === "md" ? "text-[9px]" : "text-[7px]";

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
