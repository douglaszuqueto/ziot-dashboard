import {
  deviceHealthResponseSchema,
  deviceHealthSummaryResponseSchema,
} from "@/modules/reports/schemas/reports.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface DeviceHealthFilters {
  clientId?: string;
  tenantId?: string;
  module?: string;
  protocol?: string;
  search?: string;
  healthStatus?: string;
  thresholdMinutes?: number;
  page?: number;
  perPage?: number;
}

const queryFrom = (filters: DeviceHealthFilters) => {
  const query = new URLSearchParams();
  if (filters.clientId) query.set("client_id", filters.clientId);
  if (filters.tenantId) query.set("tenant_id", filters.tenantId);
  if (filters.module) query.set("module", filters.module);
  if (filters.protocol) query.set("protocol", filters.protocol);
  if (filters.search) query.set("search", filters.search);
  if (filters.healthStatus) query.set("health_status", filters.healthStatus);
  if (filters.thresholdMinutes) {
    query.set("threshold_minutes", String(filters.thresholdMinutes));
  }
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("per_page", String(filters.perPage));
  return query.toString();
};

export const fetchDeviceHealth = (
  token: string,
  filters: DeviceHealthFilters,
) =>
  httpRequest(`/v1/admin/reports/device-health?${queryFrom(filters)}`, {
    authToken: token,
    schema: deviceHealthResponseSchema,
  });

export const fetchDeviceHealthSummary = (
  token: string,
  filters: DeviceHealthFilters,
) =>
  httpRequest(`/v1/admin/reports/device-health/summary?${queryFrom(filters)}`, {
    authToken: token,
    schema: deviceHealthSummaryResponseSchema,
  });
