import { Activity, CircleOff, Clock3, Server, Wifi } from "lucide-react";
import type { DeviceHealthSummary } from "@/modules/reports/schemas/reports.schemas";

export const HEALTH_THRESHOLD_MINUTES = 30;

export const healthLabels = {
  online: "Online",
  offline: "Offline",
  never_seen: "Nunca visto",
  disabled: "Desativado",
} as const;

export const emptyHealthSummary: DeviceHealthSummary = {
  total: 0,
  online: 0,
  offline: 0,
  never_seen: 0,
  disabled: 0,
};

export const healthSummaryCards = [
  {
    key: "total",
    label: "Total monitorado",
    icon: Server,
    className: "border-border bg-white text-foreground",
  },
  {
    key: "online",
    label: "Online",
    icon: Wifi,
    className: "border-success/20 bg-success/10 text-success",
  },
  {
    key: "offline",
    label: "Offline",
    icon: Activity,
    className: "border-alert/20 bg-alert/10 text-alert",
  },
  {
    key: "never_seen",
    label: "Nunca visto",
    icon: Clock3,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    key: "disabled",
    label: "Desativado",
    icon: CircleOff,
    className: "border-border bg-muted text-muted-foreground",
  },
] as const;

export type HealthStatus = keyof typeof healthLabels;
export type HealthSummaryKey = keyof DeviceHealthSummary;

export const healthStatusKeys = healthSummaryCards.filter(
  ({ key }) => key !== "total",
);

export const formatPercent = (value: number, total: number) => {
  if (!total) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
};

export const createEmptyHealthSummary = (): DeviceHealthSummary => ({
  ...emptyHealthSummary,
});
