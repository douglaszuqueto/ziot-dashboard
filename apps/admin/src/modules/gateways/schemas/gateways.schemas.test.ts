import { describe, expect, it } from "vitest";
import {
  gatewayCreateFormSchema,
  gatewaysResponseSchema,
  normalizeGatewayEui,
} from "@/modules/gateways/schemas/gateways.schemas";

describe("gateways schemas", () => {
  it("parses gateway list responses", () => {
    const parsed = gatewaysResponseSchema.parse({
      data: [
        {
          id: "8e665251-c4b7-49a3-89b1-54d89e2f9567",
          tenant_id: null,
          tenant_name: "",
          chirpstack_tenant_id: "chirpstack-tenant",
          gateway_eui: "a84041fdfe2a9010",
          name: "Gateway Fazenda Norte",
          description: "Gateway principal",
          location: { lat: -22.6903, lng: -46.9827 },
          stats_interval_seconds: 30,
          chirpstack_synced_at: null,
          chirpstack_last_error: "",
          created_at: "2026-05-19T12:00:00Z",
          updated_at: "2026-05-19T12:00:00Z",
        },
      ],
    });

    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].location).toEqual({ lat: -22.6903, lng: -46.9827 });
  });

  it("normalizes gateway EUI separators and case", () => {
    const parsed = gatewayCreateFormSchema.parse({
      tenant_id: "",
      chirpstack_tenant_id: "",
      gateway_eui: "A8:40:41-FD FE:2A:90:10",
      name: "Gateway",
      description: "",
      location: { lat: -22.6903, lng: -46.9827 },
      stats_interval_seconds: 30,
    });

    expect(parsed.gateway_eui).toBe("a84041fdfe2a9010");
    expect(parsed.tenant_id).toBeUndefined();
    expect(normalizeGatewayEui(" A8-40 ")).toBe("a840");
  });

  it("rejects invalid gateway EUI", () => {
    const result = gatewayCreateFormSchema.safeParse({
      gateway_eui: "invalid",
      name: "Gateway",
      location: { lat: -22.6903, lng: -46.9827 },
      stats_interval_seconds: 30,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid coordinates", () => {
    const result = gatewayCreateFormSchema.safeParse({
      gateway_eui: "a84041fdfe2a9010",
      name: "Gateway",
      location: { lat: -91, lng: -46.9827 },
      stats_interval_seconds: 30,
    });

    expect(result.success).toBe(false);
  });
});
