import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  tenants_total: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const clientsResponseSchema = z.object({
  data: z.array(clientSchema),
  meta: paginationMetaSchema.optional(),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, "Informe o nome"),
});

export type Client = z.infer<typeof clientSchema>;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
