import type { LucideIcon } from "lucide-react";
import { formatPercent } from "@/shared/domain/health";

export const SummaryCard = ({
  label,
  value,
  total,
  icon: Icon,
  className,
  caption,
}: {
  label: string;
  value: number;
  total: number;
  icon: LucideIcon;
  className: string;
  caption?: string;
}) => (
  <div className={`rounded-xl border p-4 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <Icon className="h-4 w-4" />
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs opacity-75">
        {caption ?? formatPercent(value, total)}
      </p>
    </div>
  </div>
);
