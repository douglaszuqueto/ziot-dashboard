import { z } from "zod";

const paginationMetaSchema = z.object({
  page: z.number().default(1),
  per_page: z.number().default(10),
  total: z.number().default(0),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.string(),
  status: z.string(),
  memberships_total: z.number().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export const membershipSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  tenant_name: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  user_id: z.string(),
  role: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const usersResponseSchema = z.object({
  data: z.array(userSchema),
  meta: paginationMetaSchema.optional(),
});

export const userDetailResponseSchema = z.object({
  user: userSchema,
  memberships: z.array(membershipSchema).default([]),
});

export const membershipsResponseSchema = z.object({
  data: z.array(membershipSchema),
  meta: paginationMetaSchema.optional(),
});

const userBaseFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome"),
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail")
    .email("Informe um e-mail válido")
    .transform((value) => value.toLowerCase()),
  username: z
    .string()
    .trim()
    .min(1, "Informe o usuário")
    .transform((value) => value.toLowerCase()),
  role: z.enum(["operator"], {
    required_error: "Selecione a role",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Selecione o status",
  }),
});

export const userFormSchema = userBaseFormSchema.extend({
  tenant_id: z.string().optional(),
  password: z.string().optional(),
});

export const userCreateFormSchema = userBaseFormSchema.extend({
  tenant_id: z
    .string()
    .min(1, "Selecione o tenant inicial")
    .uuid("Tenant inválido"),
  password: z.string().trim().min(1, "Informe a senha"),
});

export const membershipFormSchema = z.object({
  tenant_id: z.string().min(1, "Selecione o tenant").uuid("Tenant inválido"),
  user_id: z.string().min(1, "Selecione o usuário").uuid("Usuário inválido"),
  role: z.enum(["operator"], {
    required_error: "Selecione a role",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Selecione o status",
  }),
});

export const userPasswordSchema = z.object({
  password: z.string().min(1, "Informe a nova senha"),
});

export type User = z.infer<typeof userSchema>;
export type Membership = z.infer<typeof membershipSchema>;
export type UserFormValues = z.infer<typeof userFormSchema>;
export type MembershipFormValues = z.infer<typeof membershipFormSchema>;
export type UserPasswordValues = z.infer<typeof userPasswordSchema>;
