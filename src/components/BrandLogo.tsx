import { getBrandColor, getBrandInitials } from "@/lib/brand-logos";

interface BrandLogoProps {
  brand: string;
  size?: "sm" | "md";
}

export function BrandLogo({ brand, size = "sm" }: BrandLogoProps) {
  const color = getBrandColor(brand);
  const initials = getBrandInitials(brand);
  const dim = size === "md" ? "w-8 h-8" : "w-5 h-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[7px]";

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center shrink-0`}
      style={{ backgroundColor: color }}
    >
      <span className={`${textSize} font-bold text-white leading-none`}>
        {initials}
      </span>
    </div>
  );
}
