import { z } from "zod";

export const dashboardInventorySummarySchema = z.object({
  clients: z.number(),
  tenants: z.number(),
  users: z.number(),
  devices: z.number(),
  gateways: z.number(),
});

export const dashboardHealthSummarySchema = z.object({
  total: z.number(),
  online: z.number(),
  offline: z.number(),
  never_seen: z.number(),
  disabled: z.number(),
});

export const dashboardPacketLossSummarySchema = z.object({
  expected: z.number(),
  received: z.number(),
  lost: z.number(),
  loss_rate: z.number(),
});

export const dashboardAlertsSummarySchema = z.object({
  total: z.number(),
  critical: z.number(),
  warning: z.number(),
  info: z.number(),
});

export const dashboardDeviceErrorsSummarySchema = z.object({
  devices_with_alarms: z.number(),
  devices_with_errors: z.number(),
  alarm_count: z.number(),
  error_count: z.number(),
});

export const dashboardGatewaysSummarySchema = z.object({
  total: z.number(),
  linked: z.number(),
  unlinked: z.number(),
  sync_ok: z.number(),
  sync_error: z.number(),
});

export const dashboardOverviewMetaSchema = z.object({
  generated_at: z.string(),
  packet_loss_from: z.string(),
  packet_loss_to: z.string(),
  packet_loss_bucket: z.string(),
});

// `alerts` e `device_errors` vêm dos módulos de alertas/telemetria, que o
// backend está removendo: opcionais para a página não quebrar na transição.
export const dashboardOverviewResponseSchema = z.object({
  inventory: dashboardInventorySummarySchema,
  health: dashboardHealthSummarySchema,
  packet_loss: dashboardPacketLossSummarySchema,
  alerts: dashboardAlertsSummarySchema.optional(),
  device_errors: dashboardDeviceErrorsSummarySchema.optional(),
  gateways: dashboardGatewaysSummarySchema,
  meta: dashboardOverviewMetaSchema,
});

export const dashboardPacketLossPointSchema = z.object({
  bucket: z.string(),
  expected: z.number(),
  received: z.number(),
  lost: z.number(),
  loss_rate: z.number(),
});

export const dashboardPacketLossMetaSchema = z.object({
  from: z.string(),
  to: z.string(),
  bucket: z.enum(["hour", "day"]),
});

export const dashboardPacketLossResponseSchema = z.object({
  summary: dashboardPacketLossSummarySchema,
  series: z.array(dashboardPacketLossPointSchema),
  meta: dashboardPacketLossMetaSchema,
});

export type DashboardOverviewResponse = z.infer<
  typeof dashboardOverviewResponseSchema
>;
export type DashboardPacketLossResponse = z.infer<
  typeof dashboardPacketLossResponseSchema
>;
export type DashboardPacketLossPoint = z.infer<
  typeof dashboardPacketLossPointSchema
>;
