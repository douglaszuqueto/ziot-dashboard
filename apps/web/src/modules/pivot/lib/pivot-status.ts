import {
  Activity,
  CircleDashed,
  CirclePause,
  type LucideIcon,
} from "lucide-react";

export interface PivotStatusMeta {
  label: string;
  icon: LucideIcon;
  // Pílula de status (mesma linguagem das telas de estufa: status = verde
  // operando, secondary = neutro/parado, alert = atenção).
  pillClassName: string;
  // Quadrado arredondado atrás do ícone do pivô no cartão.
  iconClassName: string;
  // Tile de destaque (posição / percentímetro) no cartão da lista.
  highlightClassName: string;
  highlightIconClassName: string;
  // Legenda abaixo da ilustração na página de detalhe.
  caption: string;
}

const STATUS_META: Record<string, PivotStatusMeta> = {
  running: {
    label: "Em operação",
    icon: Activity,
    pillClassName: "bg-status/10 text-status",
    iconClassName: "bg-status/10 text-status",
    highlightClassName: "bg-status/10",
    highlightIconClassName: "text-status",
    caption: "Em operação",
  },
  stopped: {
    label: "Parado",
    icon: CirclePause,
    pillClassName: "bg-secondary text-muted-foreground",
    iconClassName: "bg-primary/10 text-primary",
    highlightClassName: "bg-secondary/60",
    highlightIconClassName: "text-muted-foreground",
    caption: "Pivô parado",
  },
  unknown: {
    label: "Sem status",
    icon: CircleDashed,
    pillClassName: "bg-alert/15 text-alert",
    iconClassName: "bg-accent/20 text-accent-foreground",
    highlightClassName: "bg-accent/15",
    highlightIconClassName: "text-alert",
    caption: "Aguardando telemetria",
  },
};

// Status fora do contrato (`unknown` | `stopped` | `running`) caem na
// aparência de "atenção" mantendo o texto enviado pelo backend.
export const pivotStatusMeta = (status?: string | null): PivotStatusMeta => {
  const key = (status ?? "").trim().toLowerCase();
  return (
    STATUS_META[key] ?? {
      ...STATUS_META.unknown,
      label: status?.trim() ? status.trim() : STATUS_META.unknown.label,
    }
  );
};

export const isPivotRunning = (status?: string | null) =>
  (status ?? "").trim().toLowerCase() === "running";

// A telemetria (`running` do estado) tem prioridade sobre o status cadastral:
// com ela, a pílula passa a dizer LIGADO / DESLIGADO como no app legado.
export const resolvePivotStatus = (
  status?: string | null,
  running?: boolean | null,
) =>
  typeof running === "boolean" ? (running ? "running" : "stopped") : status;

export const pivotStatusLabel = (
  status?: string | null,
  running?: boolean | null,
) =>
  typeof running === "boolean"
    ? running
      ? "Ligado"
      : "Desligado"
    : pivotStatusMeta(status).label;
