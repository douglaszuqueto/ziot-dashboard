import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const deviceHealthRowSchema = z.object({
  device_id: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  tenant_id: z.string(),
  tenant_name: z.string(),
  external_id: z.string(),
  name: z.string(),
  module: z.string(),
  protocol: z.string(),
  active: z.boolean(),
  health_status: z.enum(["online", "offline", "never_seen", "disabled"]),
  last_reported_at: z.string().nullable().optional(),
});

export const deviceHealthSummarySchema = z.object({
  total: z.number(),
  online: z.number(),
  offline: z.number(),
  never_seen: z.number(),
  disabled: z.number(),
});

export const deviceHealthResponseSchema = z.object({
  threshold_minutes: z.number(),
  data: z.array(deviceHealthRowSchema),
  meta: paginationMetaSchema.optional(),
});

export const deviceHealthSummaryResponseSchema = z.object({
  threshold_minutes: z.number(),
  summary: deviceHealthSummarySchema,
});

export type DeviceHealthRow = z.infer<typeof deviceHealthRowSchema>;
export type DeviceHealthSummary = z.infer<typeof deviceHealthSummarySchema>;
