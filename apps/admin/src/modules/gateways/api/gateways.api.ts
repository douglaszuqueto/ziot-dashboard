import {
  type GatewayCreateFormValues,
  type GatewayUpdateFormValues,
  gatewayCreateFormSchema,
  gatewaySchema,
  gatewaysResponseSchema,
  gatewayUpdateFormSchema,
} from "@/modules/gateways/schemas/gateways.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface GatewayFilters {
  tenantId?: string;
  chirpstackTenantId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

const queryFrom = (filters: GatewayFilters) => {
  const query = new URLSearchParams();
  if (filters.tenantId) query.set("tenant_id", filters.tenantId);
  if (filters.chirpstackTenantId) {
    query.set("chirpstack_tenant_id", filters.chirpstackTenantId);
  }
  if (filters.search) query.set("search", filters.search);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("per_page", String(filters.perPage));
  return query.toString();
};

export const fetchGateways = (token: string, filters: GatewayFilters) =>
  httpRequest(`/v1/admin/lorawan-gateways?${queryFrom(filters)}`, {
    authToken: token,
    schema: gatewaysResponseSchema,
  });

export const fetchGateway = (token: string, id: string) =>
  httpRequest(`/v1/admin/lorawan-gateways/${id}`, {
    authToken: token,
    schema: gatewaySchema,
  });

export const createGateway = (
  token: string,
  payload: GatewayCreateFormValues,
) =>
  httpRequest("/v1/admin/lorawan-gateways", {
    method: "POST",
    authToken: token,
    body: gatewayCreateFormSchema.parse(payload),
    schema: gatewaySchema,
  });

export const updateGateway = (
  token: string,
  id: string,
  payload: GatewayUpdateFormValues,
) =>
  httpRequest(`/v1/admin/lorawan-gateways/${id}`, {
    method: "PATCH",
    authToken: token,
    body: gatewayUpdateFormSchema.parse(payload),
    schema: gatewaySchema,
  });

export const deleteGateway = (token: string, id: string) =>
  httpRequest<void>(`/v1/admin/lorawan-gateways/${id}`, {
    method: "DELETE",
    authToken: token,
  });

export const syncGateway = (token: string, id: string) =>
  httpRequest(`/v1/admin/lorawan-gateways/${id}/sync`, {
    method: "POST",
    authToken: token,
    schema: gatewaySchema,
  });
