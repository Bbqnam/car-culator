import { canonicalizeBrandName, getBrandLogo, shouldElevateBrandLogoInDarkMode } from "@/lib/brand-logos";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ brand, size = "sm" }: BrandLogoProps) {
  const displayBrand = canonicalizeBrandName(brand);
  const logo = getBrandLogo(displayBrand);
  const dim = size === "lg" ? "h-10 w-10" : size === "md" ? "h-8 w-8" : "h-6 w-6";
  const needsDarkModeSurface = shouldElevateBrandLogoInDarkMode(displayBrand);

  if (!logo) return null;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        dim,
        needsDarkModeSurface && "dark:rounded-md dark:bg-slate-100/92 dark:p-1 dark:ring-1 dark:ring-white/20 dark:shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
      )}
    >
      <img
        src={logo}
        alt={displayBrand}
        className="h-full w-full object-contain"
        loading="lazy"
      />
    </span>
  );
}
