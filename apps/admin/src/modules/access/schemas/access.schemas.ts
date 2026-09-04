import { z } from "zod";

export const permissionSchema = z.object({
  code: z.string(),
  audience: z.string(),
  module: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string(),
  created_at: z.string(),
});

export const roleSchema = z.object({
  id: z.string(),
  audience: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  system: z.boolean(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  permissions: z.array(z.string()).default([]),
});

export const tenantModuleSchema = z.object({
  tenant_id: z.string(),
  module: z.string(),
  enabled: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const permissionsResponseSchema = z.object({
  data: z.array(permissionSchema),
});

export const rolesResponseSchema = z.object({
  data: z.array(roleSchema),
});

export const tenantModulesResponseSchema = z.object({
  data: z.array(tenantModuleSchema),
});

export type AccessPermission = z.infer<typeof permissionSchema>;
export type AccessRole = z.infer<typeof roleSchema>;
export type TenantModule = z.infer<typeof tenantModuleSchema>;
