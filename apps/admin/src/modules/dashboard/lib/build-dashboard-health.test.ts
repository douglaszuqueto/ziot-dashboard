import { describe, expect, it } from "vitest";
import {
  buildClientHealth,
  buildSummaryFromRows,
} from "@/modules/dashboard/lib/build-dashboard-health";
import type { DeviceHealthRow } from "@/modules/reports/schemas/reports.schemas";

const row = (overrides: Partial<DeviceHealthRow> = {}): DeviceHealthRow => ({
  device_id: crypto.randomUUID(),
  client_id: "client-a",
  client_name: "Cliente A",
  tenant_id: "tenant-a",
  tenant_name: "Tenant A",
  external_id: "dev-1",
  name: "Device 1",
  module: "irrigation",
  protocol: "mqtt",
  active: true,
  health_status: "online",
  last_reported_at: "2026-04-25T10:00:00.000Z",
  ...overrides,
});

describe("dashboard health builders", () => {
  it("builds a global health summary from report rows", () => {
    const summary = buildSummaryFromRows([
      row({ health_status: "online" }),
      row({ health_status: "offline" }),
      row({ health_status: "offline" }),
      row({ health_status: "never_seen" }),
      row({ health_status: "disabled" }),
    ]);

    expect(summary).toEqual({
      total: 5,
      online: 1,
      offline: 2,
      never_seen: 1,
      disabled: 1,
    });
  });

  it("groups health rows by client and tenant", () => {
    const clients = buildClientHealth([
      row({ client_id: "client-b", client_name: "Cliente B" }),
      row({ health_status: "offline" }),
      row({
        health_status: "offline",
        tenant_id: "tenant-b",
        tenant_name: "Tenant B",
      }),
    ]);

    expect(clients).toHaveLength(2);
    expect(clients[0].client_name).toBe("Cliente A");
    expect(clients[0].summary.total).toBe(2);
    expect(clients[0].summary.offline).toBe(2);
    expect(clients[0].tenants.map((tenant) => tenant.tenant_name)).toEqual([
      "Tenant A",
      "Tenant B",
    ]);
    expect(clients[1].client_name).toBe("Cliente B");
    expect(clients[1].summary.online).toBe(1);
  });
});
