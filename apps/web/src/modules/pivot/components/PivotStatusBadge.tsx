import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  pivotStatusLabel,
  pivotStatusMeta,
  resolvePivotStatus,
} from "@/modules/pivot/lib/pivot-status";

// Pílula de status no padrão das telas de estufa ("ONLINE" / "ATENÇÃO"):
// caixa alta, tracking largo, fundo suave na cor do estado.
export const PivotStatusBadge = ({
  status,
  running,
  withIcon = false,
  className,
}: {
  status?: string | null;
  // `running` da telemetria: quando existe, vira LIGADO / DESLIGADO.
  running?: boolean | null;
  withIcon?: boolean;
  className?: string;
}) => {
  const meta = pivotStatusMeta(resolvePivotStatus(status, running));
  const label = pivotStatusLabel(status, running);
  const Icon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        meta.pillClassName,
        className,
      )}
    >
      {withIcon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {label}
    </Badge>
  );
};
