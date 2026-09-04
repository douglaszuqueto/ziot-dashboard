import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const deviceProfileSchema = z.object({
  id: z.string(),
  client_id: z.string().nullable().optional().default(""),
  client_name: z.string().nullable().optional().default("Global"),
  tenant_id: z.string().nullable().optional().default(""),
  tenant_name: z.string().nullable().optional().default("Global"),
  scope: z.enum(["global", "tenant"]).optional().default("tenant"),
  slug: z.string(),
  name: z.string(),
  module: z.string(),
  protocol: z.string(),
  connector: z.string(),
  normalizer_key: z.string(),
  active: z.boolean(),
  config: z.unknown().optional(),
  metadata: z.unknown().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const managedDeviceSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  tenant_id: z.string(),
  tenant_name: z.string(),
  external_id: z.string(),
  name: z.string(),
  module: z.string(),
  protocol: z.string(),
  serial_number: z.string().nullable().optional().default(""),
  join_eui: z.string().nullable().optional().default(""),
  device_profile_id: z.string().nullable().optional().default(""),
  device_profile_name: z.string().nullable().optional().default(""),
  active: z.boolean(),
  has_application_key: z.boolean(),
  last_seen_at: z.string().nullable().optional(),
  metadata: z.unknown().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const deviceProfilesResponseSchema = z.object({
  data: z.array(deviceProfileSchema),
});

export const managedDevicesResponseSchema = z.object({
  data: z.array(managedDeviceSchema),
  meta: paginationMetaSchema.optional(),
});

const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const assetFormSchema = z.object({
  tenant_id: z.string().min(1, "Selecione o tenant").uuid("Tenant inválido"),
  name: z.string().trim().min(1, "Informe o nome"),
  device_profile_id: z
    .string()
    .min(1, "Selecione o profile")
    .uuid("Device profile inválido"),
  device_eui: z.string().trim().min(1, "Informe o identificador externo"),
  serial_number: optionalTextSchema,
  join_eui: optionalTextSchema,
  application_key: optionalTextSchema,
  channel_count: z.coerce.number().int().min(0).default(0),
});

export const assetUpdateFormSchema = assetFormSchema
  .omit({ tenant_id: true, channel_count: true })
  .extend({
    clear_application_key: z.boolean().default(false),
  });

export type DeviceProfile = z.infer<typeof deviceProfileSchema>;
export type ManagedDevice = z.infer<typeof managedDeviceSchema>;
export type AssetFormValues = z.infer<typeof assetFormSchema>;
export type AssetUpdateFormValues = z.infer<typeof assetUpdateFormSchema>;
