import { describe, expect, it } from "vitest";
import {
  membershipFormSchema,
  userCreateFormSchema,
} from "@/modules/users/schemas/users.schemas";

describe("user schemas", () => {
  it("normalizes e-mail and username for case-insensitive unique indexes", () => {
    const parsed = userCreateFormSchema.parse({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      name: "Admin",
      email: "ADMIN@VIZEOS.COM",
      username: "ADMIN",
      password: "secret",
      role: "operator",
      status: "active",
    });

    expect(parsed.email).toBe("admin@vizeos.com");
    expect(parsed.username).toBe("admin");
  });

  it("validates membership foreign-key ids and check constraints", () => {
    const result = membershipFormSchema.safeParse({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      user_id: "00000000-0000-4000-8000-000000000002",
      role: "operator",
      status: "inactive",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid membership status", () => {
    const result = membershipFormSchema.safeParse({
      tenant_id: "00000000-0000-4000-8000-000000000001",
      user_id: "00000000-0000-4000-8000-000000000002",
      role: "operator",
      status: "pending",
    });

    expect(result.success).toBe(false);
  });
});
