import { describe, expect, it } from "vitest";
import { tenantFormSchema } from "@/modules/tenants/schemas/tenants.schemas";

const validTenant = {
  client_id: "00000000-0000-4000-8000-000000000001",
  slug: "cliente-a",
  name: "Cliente A",
  timezone: "America/Sao_Paulo",
  status: "active",
  role: "operator",
  location: '{"lat":-22.6903,"lng":-46.9827}',
};

describe("tenantFormSchema", () => {
  it("accepts a tenant payload aligned with the database constraints", () => {
    expect(tenantFormSchema.parse(validTenant)).toEqual(validTenant);
  });

  it("allows an empty location object", () => {
    expect(
      tenantFormSchema.parse({ ...validTenant, location: "{}" }).location,
    ).toBe("{}");
  });

  it("rejects invalid client ids and coordinates", () => {
    const result = tenantFormSchema.safeParse({
      ...validTenant,
      client_id: "not-uuid",
      location: '{"lat":120,"lng":-46.9827}',
    });

    expect(result.success).toBe(false);
  });
});
