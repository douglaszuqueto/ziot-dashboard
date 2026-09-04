import { z } from "zod";

export const adminSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  username: z.string(),
  role: z.string(),
  status: z.string(),
  last_login_at: z.string().nullable().optional(),
  password_changed_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const adminSessionResponseSchema = z.object({
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  expires_at: z.string().optional(),
  admin: adminSchema,
  permissions: z.array(z.string()).default([]),
  policy_version: z.number().optional(),
});

export const adminMeResponseSchema = z.object({
  admin: adminSchema,
  permissions: z.array(z.string()).default([]),
  policy_version: z.number().optional(),
});

export const changePasswordResponseSchema = z.object({
  admin: adminSchema,
  changed_at: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  policy_version: z.number().optional(),
});

export type Admin = z.infer<typeof adminSchema>;
export type AdminSessionResponse = z.infer<typeof adminSessionResponseSchema>;
export type AdminMeResponse = z.infer<typeof adminMeResponseSchema>;
