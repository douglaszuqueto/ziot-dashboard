import { cn } from "@/lib/utils";
import { brandConfig } from "@/shared/brand";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  tone?: "dark" | "light";
}

export const BrandLogo = ({
  className,
  compact = false,
  tone = "dark",
}: BrandLogoProps) => {
  const asset =
    tone === "dark"
      ? compact
        ? brandConfig.assets.iconWhite
        : brandConfig.assets.logoWhite
      : compact
        ? brandConfig.assets.iconColor
        : brandConfig.assets.logoColor;

  return (
    <img
      src={asset}
      alt={brandConfig.name}
      className={cn("object-contain", className)}
    />
  );
};
