import {
  type AssetFormValues,
  type AssetUpdateFormValues,
  assetFormSchema,
  assetUpdateFormSchema,
  deviceProfilesResponseSchema,
  managedDeviceSchema,
  managedDevicesResponseSchema,
} from "@/modules/inventory/schemas/inventory.schemas";
import { httpRequest } from "@/shared/api/http-client";

// Só devices: o catálogo de sensores/telemetria foi removido do backend.
export type AssetKind = "devices";

export interface InventoryFilters {
  clientId?: string;
  tenantId?: string;
  module?: string;
  protocol?: string;
  search?: string;
  active?: string;
  page?: number;
  perPage?: number;
}

const queryFrom = (filters: InventoryFilters) => {
  const query = new URLSearchParams();
  if (filters.clientId) query.set("client_id", filters.clientId);
  if (filters.tenantId) query.set("tenant_id", filters.tenantId);
  if (filters.module) query.set("module", filters.module);
  if (filters.protocol) query.set("protocol", filters.protocol);
  if (filters.search) query.set("search", filters.search);
  if (filters.active) query.set("active", filters.active);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("per_page", String(filters.perPage));
  return query.toString();
};

export const fetchDeviceProfiles = (token: string, filters: InventoryFilters) =>
  httpRequest(`/v1/admin/device-profiles?${queryFrom(filters)}`, {
    authToken: token,
    schema: deviceProfilesResponseSchema,
  });

export const fetchAssets = (
  token: string,
  kind: AssetKind,
  filters: InventoryFilters,
) =>
  httpRequest(`/v1/admin/${kind}?${queryFrom(filters)}`, {
    authToken: token,
    schema: managedDevicesResponseSchema,
  });

export const fetchAsset = (token: string, kind: AssetKind, id: string) =>
  httpRequest(`/v1/admin/${kind}/${id}`, {
    authToken: token,
    schema: managedDeviceSchema,
  });

export const createAsset = (
  token: string,
  kind: AssetKind,
  payload: AssetFormValues,
) =>
  httpRequest(`/v1/admin/${kind}`, {
    method: "POST",
    authToken: token,
    body: assetFormSchema.parse(payload),
    schema: managedDeviceSchema,
  });

export const updateAsset = (
  token: string,
  kind: AssetKind,
  id: string,
  payload: AssetUpdateFormValues,
) =>
  httpRequest(`/v1/admin/${kind}/${id}`, {
    method: "PATCH",
    authToken: token,
    body: assetUpdateFormSchema.parse(payload),
    schema: managedDeviceSchema,
  });

export const transferAsset = (
  token: string,
  kind: AssetKind,
  id: string,
  tenantId: string,
) =>
  httpRequest(`/v1/admin/${kind}/${id}/transfer`, {
    method: "POST",
    authToken: token,
    body: { tenant_id: tenantId },
    schema: managedDeviceSchema,
  });

export const updateAssetStatus = (
  token: string,
  kind: AssetKind,
  id: string,
  active: boolean,
) =>
  httpRequest(`/v1/admin/${kind}/${id}/status`, {
    method: "POST",
    authToken: token,
    body: { active },
    schema: managedDeviceSchema,
  });
