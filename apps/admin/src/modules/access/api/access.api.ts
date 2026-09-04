import {
  permissionsResponseSchema,
  roleSchema,
  rolesResponseSchema,
  tenantModulesResponseSchema,
} from "@/modules/access/schemas/access.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface RolePayload {
  audience: string;
  code: string;
  name: string;
  description: string;
  status: string;
  permissions: string[];
}

export const fetchPermissions = (token: string, audience = "") => {
  const query = new URLSearchParams();
  if (audience) query.set("audience", audience);
  return httpRequest(`/v1/admin/access/permissions?${query.toString()}`, {
    authToken: token,
    schema: permissionsResponseSchema,
  });
};

export const fetchRoles = (token: string, audience = "") => {
  const query = new URLSearchParams();
  if (audience) query.set("audience", audience);
  return httpRequest(`/v1/admin/access/roles?${query.toString()}`, {
    authToken: token,
    schema: rolesResponseSchema,
  });
};

export const createRole = (token: string, payload: RolePayload) =>
  httpRequest("/v1/admin/access/roles", {
    method: "POST",
    authToken: token,
    body: payload,
    schema: roleSchema,
  });

export const updateRole = (token: string, id: string, payload: RolePayload) =>
  httpRequest(`/v1/admin/access/roles/${id}`, {
    method: "PATCH",
    authToken: token,
    body: payload,
    schema: roleSchema,
  });

export const fetchTenantModules = (token: string, tenantId: string) =>
  httpRequest(`/v1/admin/tenants/${tenantId}/modules`, {
    authToken: token,
    schema: tenantModulesResponseSchema,
  });

export const updateTenantModules = (
  token: string,
  tenantId: string,
  modules: Record<string, boolean>,
) =>
  httpRequest(`/v1/admin/tenants/${tenantId}/modules`, {
    method: "PUT",
    authToken: token,
    body: { modules },
    schema: tenantModulesResponseSchema,
  });
