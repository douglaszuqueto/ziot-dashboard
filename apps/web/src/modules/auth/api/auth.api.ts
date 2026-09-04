import { z } from "zod";
import {
  authMeResponseSchema,
  authTenantListResponseSchema,
  loginResponseSchema,
  switchTenantRequestSchema,
} from "@/modules/auth/schemas/auth.schemas";
import { httpRequest } from "@/shared/api/http-client";

export const loginRequest = (payload: { login: string; password: string }) =>
  httpRequest("/v1/auth/login", {
    method: "POST",
    body: payload,
    schema: loginResponseSchema,
  });

export const fetchAuthMe = (token: string) =>
  httpRequest("/v1/auth/me", {
    authToken: token,
    schema: authMeResponseSchema,
  });

export const fetchUserTenants = (token: string) =>
  httpRequest("/v1/auth/tenants", {
    authToken: token,
    schema: authTenantListResponseSchema,
  });

export const switchTenantRequest = (
  token: string,
  payload: { tenant_id?: string; member_id?: string },
) =>
  httpRequest("/v1/auth/switch-tenant", {
    method: "POST",
    authToken: token,
    body: switchTenantRequestSchema.parse(payload),
    schema: loginResponseSchema.extend({
      switched: z.boolean().optional(),
    }),
  });
