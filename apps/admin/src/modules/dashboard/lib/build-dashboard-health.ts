import type {
  DeviceHealthRow,
  DeviceHealthSummary,
} from "@/modules/reports/schemas/reports.schemas";
import { createEmptyHealthSummary } from "@/shared/domain/health";

export interface TenantHealth {
  tenant_id: string;
  tenant_name: string;
  summary: DeviceHealthSummary;
}

export interface ClientHealth {
  client_id: string;
  client_name: string;
  tenants: TenantHealth[];
  summary: DeviceHealthSummary;
}

export const buildSummaryFromRows = (rows: DeviceHealthRow[]) =>
  rows.reduce<DeviceHealthSummary>((summary, row) => {
    summary.total += 1;
    summary[row.health_status] += 1;
    return summary;
  }, createEmptyHealthSummary());

export const buildClientHealth = (rows: DeviceHealthRow[]): ClientHealth[] =>
  Array.from(
    rows
      .reduce<
        Map<
          string,
          Omit<ClientHealth, "tenants"> & { tenants: Map<string, TenantHealth> }
        >
      >((clients, row) => {
        const current =
          clients.get(row.client_id) ??
          ({
            client_id: row.client_id,
            client_name: row.client_name,
            tenants: new Map<string, TenantHealth>(),
            summary: createEmptyHealthSummary(),
          } satisfies Omit<ClientHealth, "tenants"> & {
            tenants: Map<string, TenantHealth>;
          });

        const tenant =
          current.tenants.get(row.tenant_id) ??
          ({
            tenant_id: row.tenant_id,
            tenant_name: row.tenant_name,
            summary: createEmptyHealthSummary(),
          } satisfies TenantHealth);

        tenant.summary.total += 1;
        tenant.summary[row.health_status] += 1;
        current.tenants.set(row.tenant_id, tenant);

        current.summary.total += 1;
        current.summary[row.health_status] += 1;
        clients.set(row.client_id, current);

        return clients;
      }, new Map())
      .values(),
  )
    .map((client) => ({
      ...client,
      tenants: Array.from(client.tenants.values()).sort((left, right) =>
        left.tenant_name.localeCompare(right.tenant_name),
      ),
    }))
    .sort((left, right) => left.client_name.localeCompare(right.client_name));
