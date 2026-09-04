import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const coordinatesSchema = z.object({
  lat: z.coerce
    .number({ invalid_type_error: "Latitude inválida" })
    .min(-90, "Latitude deve estar entre -90 e 90")
    .max(90, "Latitude deve estar entre -90 e 90"),
  lng: z.coerce
    .number({ invalid_type_error: "Longitude inválida" })
    .min(-180, "Longitude deve estar entre -180 e 180")
    .max(180, "Longitude deve estar entre -180 e 180"),
});

export const normalizeGatewayEui = (value: string) =>
  value
    .trim()
    .replace(/[:\-\s]/g, "")
    .toLowerCase();

const gatewayEuiSchema = z
  .string()
  .trim()
  .min(1, "Informe o Gateway EUI")
  .transform(normalizeGatewayEui)
  .refine((value) => /^[0-9a-f]{16}$/.test(value), {
    message: "Gateway EUI deve conter 16 caracteres hexadecimais",
  });

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined)
  .pipe(z.string().uuid("Tenant inválido").optional());

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const gatewaySchema = z.object({
  id: z.string(),
  tenant_id: z.string().nullable().optional().default(""),
  tenant_name: z.string().optional().default(""),
  chirpstack_tenant_id: z.string(),
  gateway_eui: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  location: coordinatesSchema,
  stats_interval_seconds: z.number().int().default(30),
  chirpstack_synced_at: z.string().nullable().optional(),
  chirpstack_last_error: z.string().optional().default(""),
  created_at: z.string(),
  updated_at: z.string(),
});

export const gatewaysResponseSchema = z.object({
  data: z.array(gatewaySchema),
  meta: paginationMetaSchema.optional(),
});

export const gatewayCreateFormSchema = z.object({
  tenant_id: optionalUuidSchema,
  chirpstack_tenant_id: optionalTextSchema,
  gateway_eui: gatewayEuiSchema,
  name: z.string().trim().min(1, "Informe o nome"),
  description: z.string().trim().default(""),
  location: coordinatesSchema,
  stats_interval_seconds: z.coerce
    .number()
    .int("Intervalo deve ser um número inteiro")
    .positive("Intervalo deve ser maior que zero")
    .default(30),
});

export const gatewayUpdateFormSchema = gatewayCreateFormSchema.omit({
  gateway_eui: true,
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Gateway = z.infer<typeof gatewaySchema>;
export type GatewaysResponse = z.infer<typeof gatewaysResponseSchema>;
export type GatewayCreateFormValues = z.input<typeof gatewayCreateFormSchema>;
export type GatewayCreatePayload = z.output<typeof gatewayCreateFormSchema>;
export type GatewayUpdateFormValues = z.input<typeof gatewayUpdateFormSchema>;
export type GatewayUpdatePayload = z.output<typeof gatewayUpdateFormSchema>;
