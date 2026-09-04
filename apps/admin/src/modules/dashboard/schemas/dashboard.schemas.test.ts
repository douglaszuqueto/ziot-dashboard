import { describe, expect, it } from "vitest";
import {
  dashboardOverviewResponseSchema,
  dashboardPacketLossResponseSchema,
} from "@/modules/dashboard/schemas/dashboard.schemas";

describe("dashboard schemas", () => {
  it("parses overview response", () => {
    const parsed = dashboardOverviewResponseSchema.parse({
      inventory: {
        clients: 1,
        tenants: 2,
        users: 3,
        devices: 4,
        gateways: 1,
      },
      health: {
        total: 4,
        online: 2,
        offline: 1,
        never_seen: 1,
        disabled: 0,
      },
      packet_loss: {
        expected: 100,
        received: 95,
        lost: 5,
        loss_rate: 5,
      },
      alerts: {
        total: 2,
        critical: 1,
        warning: 1,
        info: 0,
      },
      device_errors: {
        devices_with_alarms: 1,
        devices_with_errors: 1,
        alarm_count: 2,
        error_count: 3,
      },
      gateways: {
        total: 1,
        linked: 1,
        unlinked: 0,
        sync_ok: 1,
        sync_error: 0,
      },
      meta: {
        generated_at: "2026-04-28T17:12:32Z",
        packet_loss_from: "2026-04-27T17:12:32Z",
        packet_loss_to: "2026-04-28T17:12:32Z",
        packet_loss_bucket: "hour",
      },
    });

    expect(parsed.health.online).toBe(2);
    expect(parsed.packet_loss.loss_rate).toBe(5);
  });

  it("aceita overview sem alerts e device_errors (módulos removidos)", () => {
    const parsed = dashboardOverviewResponseSchema.parse({
      inventory: { clients: 1, tenants: 1, users: 1, devices: 1, gateways: 0 },
      health: { total: 1, online: 1, offline: 0, never_seen: 0, disabled: 0 },
      packet_loss: { expected: 0, received: 0, lost: 0, loss_rate: 0 },
      gateways: { total: 0, linked: 0, unlinked: 0, sync_ok: 0, sync_error: 0 },
      meta: {
        generated_at: "2026-04-28T17:12:32Z",
        packet_loss_from: "2026-04-27T17:12:32Z",
        packet_loss_to: "2026-04-28T17:12:32Z",
        packet_loss_bucket: "hour",
      },
    });

    expect(parsed.alerts).toBeUndefined();
    expect(parsed.device_errors).toBeUndefined();
  });

  it("rejects invalid packet loss bucket", () => {
    const result = dashboardPacketLossResponseSchema.safeParse({
      summary: {
        expected: 10,
        received: 9,
        lost: 1,
        loss_rate: 10,
      },
      series: [],
      meta: {
        from: "2026-04-27T17:12:32Z",
        to: "2026-04-28T17:12:32Z",
        bucket: "minute",
      },
    });

    expect(result.success).toBe(false);
  });
});
