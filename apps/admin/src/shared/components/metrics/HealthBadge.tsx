import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type HealthStatus, healthLabels } from "@/shared/domain/health";

export const HealthBadge = ({ value }: { value: HealthStatus }) => (
  <Badge
    variant="outline"
    className={cn(
      "rounded-full",
      value === "online" && "border-success/20 bg-success/10 text-success",
      value === "offline" && "border-alert/20 bg-alert/10 text-alert",
      value === "never_seen" && "border-amber-200 bg-amber-50 text-amber-700",
      value === "disabled" && "border-border bg-muted text-muted-foreground",
    )}
  >
    {healthLabels[value]}
  </Badge>
);
