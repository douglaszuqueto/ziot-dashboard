import { z } from "zod";

export const coordinatesSchema = z
  .object({
    lat: z.number().nullable().optional(),
    lng: z.number().nullable().optional(),
  })
  .passthrough();

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.string(),
  status: z.string(),
});

export const authTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  timezone: z.string(),
  status: z.string(),
  role: z.string(),
  location: coordinatesSchema.nullish(),
  home_module: z.string().optional().default(""),
});

export const authMemberSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  user_id: z.string(),
  role: z.string(),
  status: z.string(),
});

export const authMembershipSchema = z.object({
  id: z.string(),
  tenant_id: z.string(),
  user_id: z.string(),
  role: z.string(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  is_current: z.boolean(),
  tenant: authTenantSchema,
});

export const loginRequestSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const loginResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_at: z.string().optional(),
  user: authUserSchema,
  tenant: authTenantSchema,
  member: authMemberSchema,
  memberships: z.array(authMembershipSchema).default([]),
  permissions: z.array(z.string()).default([]),
  modules: z.array(z.string()).default([]),
  policy_version: z.number().optional(),
});

export const authMeResponseSchema = z.object({
  user: authUserSchema,
  tenant: authTenantSchema,
  member: authMemberSchema,
  memberships: z.array(authMembershipSchema).default([]),
  permissions: z.array(z.string()).default([]),
  modules: z.array(z.string()).default([]),
  policy_version: z.number().optional(),
});

export const authTenantListResponseSchema = z.object({
  data: z.array(authMembershipSchema),
});

export const switchTenantRequestSchema = z
  .object({
    tenant_id: z.string().optional(),
    member_id: z.string().optional(),
  })
  .refine((value) => Boolean(value.tenant_id || value.member_id), {
    message: "tenant_id ou member_id obrigatório",
  });

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthTenant = z.infer<typeof authTenantSchema>;
export type AuthMember = z.infer<typeof authMemberSchema>;
export type AuthMembership = z.infer<typeof authMembershipSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
