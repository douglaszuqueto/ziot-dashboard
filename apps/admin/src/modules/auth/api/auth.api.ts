import {
  adminMeResponseSchema,
  adminSessionResponseSchema,
  changePasswordResponseSchema,
} from "@/modules/auth/schemas/auth.schemas";
import { httpRequest } from "@/shared/api/http-client";

export const adminLoginRequest = (payload: {
  login: string;
  password: string;
}) =>
  httpRequest("/v1/admin/auth/login", {
    method: "POST",
    body: payload,
    schema: adminSessionResponseSchema,
  });

export const fetchAdminMe = (token: string) =>
  httpRequest("/v1/admin/auth/me", {
    authToken: token,
    schema: adminMeResponseSchema,
  });

export const changeAdminPasswordRequest = (
  token: string,
  payload: { current_password: string; new_password: string },
) =>
  httpRequest("/v1/admin/auth/change-password", {
    method: "POST",
    authToken: token,
    body: payload,
    schema: changePasswordResponseSchema,
  });
