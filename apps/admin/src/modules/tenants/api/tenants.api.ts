import {
  type TenantFormValues,
  tenantFormSchema,
  tenantSchema,
  tenantsResponseSchema,
} from "@/modules/tenants/schemas/tenants.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface TenantFilters {
  clientId?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

const buildTenantBody = (payload: TenantFormValues) => {
  const values = tenantFormSchema.parse(payload);
  let location: unknown = {};
  if (values.location?.trim()) {
    location = JSON.parse(values.location);
  }

  return {
    client_id: values.client_id,
    slug: values.slug,
    name: values.name,
    timezone: values.timezone,
    status: values.status,
    role: values.role,
    location,
  };
};

const tenantQuery = (filters: TenantFilters) => {
  const query = new URLSearchParams();
  if (filters.clientId) query.set("client_id", filters.clientId);
  if (filters.status) query.set("status", filters.status);
  if (filters.search) query.set("search", filters.search);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("per_page", String(filters.perPage));
  return query.toString();
};

export const fetchTenants = (token: string, filters: TenantFilters) =>
  httpRequest(`/v1/admin/tenants?${tenantQuery(filters)}`, {
    authToken: token,
    schema: tenantsResponseSchema,
  });

export const fetchTenant = (token: string, id: string) =>
  httpRequest(`/v1/admin/tenants/${id}`, {
    authToken: token,
    schema: tenantSchema,
  });

export const createTenant = (token: string, payload: TenantFormValues) =>
  httpRequest("/v1/admin/tenants", {
    method: "POST",
    authToken: token,
    body: buildTenantBody(payload),
    schema: tenantSchema,
  });

export const updateTenant = (
  token: string,
  id: string,
  payload: TenantFormValues,
) =>
  httpRequest(`/v1/admin/tenants/${id}`, {
    method: "PATCH",
    authToken: token,
    body: buildTenantBody(payload),
    schema: tenantSchema,
  });
