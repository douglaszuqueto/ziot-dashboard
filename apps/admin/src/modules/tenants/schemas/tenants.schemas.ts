import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const tenantSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  slug: z.string(),
  name: z.string(),
  timezone: z.string(),
  status: z.string(),
  role: z.string(),
  location: z.unknown().nullable().optional(),
  home_module: z.string().optional().default(""),
  users_total: z.number().default(0),
  devices_total: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const tenantsResponseSchema = z.object({
  data: z.array(tenantSchema),
  meta: paginationMetaSchema.optional(),
});

const locationSchema = z
  .string()
  .trim()
  .default("{}")
  .superRefine((value, context) => {
    if (!value) {
      return;
    }

    try {
      const parsed = JSON.parse(value) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Localização deve ser um objeto JSON",
        });
        return;
      }

      const coordinates = parsed as { lat?: unknown; lng?: unknown };
      const hasLat = coordinates.lat !== undefined;
      const hasLng = coordinates.lng !== undefined;

      if (hasLat !== hasLng) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe lat e lng juntos",
        });
        return;
      }

      if (!hasLat || !hasLng) {
        return;
      }

      const lat = Number(coordinates.lat);
      const lng = Number(coordinates.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "lat e lng devem ser numéricos",
        });
        return;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Coordenadas fora do intervalo válido",
        });
      }
    } catch {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Localização deve ser um JSON válido",
      });
    }
  });

export const tenantFormSchema = z.object({
  client_id: z.string().min(1, "Selecione o cliente").uuid("Cliente inválido"),
  slug: z.string().trim().min(1, "Informe o slug"),
  name: z.string().trim().min(1, "Informe o nome"),
  timezone: z.string().trim().min(1, "Selecione o timezone").default("UTC"),
  status: z.enum(["active", "inactive"], {
    required_error: "Selecione o status",
  }),
  role: z.enum(["operator"], {
    required_error: "Selecione a role",
  }),
  location: locationSchema,
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantFormValues = z.infer<typeof tenantFormSchema>;
