import { canonicalizeBrandName, getBrandLogo } from "@/lib/brand-logos";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ brand, size = "sm" }: BrandLogoProps) {
  const displayBrand = canonicalizeBrandName(brand);
  const logo = getBrandLogo(displayBrand);
  const dim = size === "lg" ? "h-10 w-10" : size === "md" ? "h-8 w-8" : "h-6 w-6";

  if (!logo) return null;

  return (
    <img
      src={logo}
      alt={displayBrand}
      className={`${dim} object-contain shrink-0`}
      loading="lazy"
    />
  );
}
