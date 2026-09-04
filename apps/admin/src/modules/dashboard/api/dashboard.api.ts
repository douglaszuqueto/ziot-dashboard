import {
  dashboardOverviewResponseSchema,
  dashboardPacketLossResponseSchema,
} from "@/modules/dashboard/schemas/dashboard.schemas";
import { httpRequest } from "@/shared/api/http-client";

export type PacketLossBucket = "hour" | "day";

export interface DashboardFilters {
  clientId?: string;
  tenantId?: string;
  module?: string;
  protocol?: string;
}

export interface DashboardOverviewFilters extends DashboardFilters {
  packetLossHours?: number;
}

export interface PacketLossFilters extends DashboardFilters {
  from?: string;
  to?: string;
  bucket?: PacketLossBucket;
}

const appendDashboardFilters = (
  query: URLSearchParams,
  filters: DashboardFilters,
) => {
  if (filters.clientId) query.set("client_id", filters.clientId);
  if (filters.tenantId) query.set("tenant_id", filters.tenantId);
  if (filters.module) query.set("module", filters.module);
  if (filters.protocol) query.set("protocol", filters.protocol);
};

const overviewQueryFrom = (filters: DashboardOverviewFilters) => {
  const query = new URLSearchParams();
  appendDashboardFilters(query, filters);
  if (filters.packetLossHours) {
    query.set("packet_loss_hours", String(filters.packetLossHours));
  }
  return query.toString();
};

const packetLossQueryFrom = (filters: PacketLossFilters) => {
  const query = new URLSearchParams();
  appendDashboardFilters(query, filters);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.bucket) query.set("bucket", filters.bucket);
  return query.toString();
};

export const fetchDashboardOverview = (
  token: string,
  filters: DashboardOverviewFilters,
) =>
  httpRequest(`/v1/admin/dashboard/overview?${overviewQueryFrom(filters)}`, {
    authToken: token,
    schema: dashboardOverviewResponseSchema,
  });

export const fetchDashboardPacketLoss = (
  token: string,
  filters: PacketLossFilters,
) =>
  httpRequest(
    `/v1/admin/dashboard/packet-loss?${packetLossQueryFrom(filters)}`,
    {
      authToken: token,
      schema: dashboardPacketLossResponseSchema,
    },
  );
