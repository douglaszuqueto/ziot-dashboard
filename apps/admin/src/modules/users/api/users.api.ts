import {
  type MembershipFormValues,
  membershipFormSchema,
  membershipSchema,
  membershipsResponseSchema,
  type UserFormValues,
  type UserPasswordValues,
  userCreateFormSchema,
  userDetailResponseSchema,
  userFormSchema,
  userPasswordSchema,
  userSchema,
  usersResponseSchema,
} from "@/modules/users/schemas/users.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface UserFilters {
  clientId?: string;
  tenantId?: string;
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface MembershipFilters {
  clientId?: string;
  tenantId?: string;
  userId?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

const queryFrom = (filters: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });
  return query.toString();
};

const userBody = (payload: UserFormValues, includeTenant: boolean) => {
  const parsed = includeTenant
    ? userCreateFormSchema.parse(payload)
    : userFormSchema.parse(payload);

  return {
    ...(includeTenant ? { tenant_id: parsed.tenant_id } : {}),
    name: parsed.name,
    email: parsed.email,
    username: parsed.username,
    ...(parsed.password ? { password: parsed.password } : {}),
    role: parsed.role,
    status: parsed.status,
  };
};

export const fetchUsers = (token: string, filters: UserFilters) =>
  httpRequest(
    `/v1/admin/users?${queryFrom({
      client_id: filters.clientId,
      tenant_id: filters.tenantId,
      status: filters.status,
      search: filters.search,
      page: filters.page,
      per_page: filters.perPage,
    })}`,
    {
      authToken: token,
      schema: usersResponseSchema,
    },
  );

export const fetchUser = (token: string, id: string) =>
  httpRequest(`/v1/admin/users/${id}`, {
    authToken: token,
    schema: userDetailResponseSchema,
  });

export const createUser = (token: string, payload: UserFormValues) =>
  httpRequest("/v1/admin/users", {
    method: "POST",
    authToken: token,
    body: userBody(payload, true),
    schema: userSchema,
  });

export const updateUser = (
  token: string,
  id: string,
  payload: UserFormValues,
) =>
  httpRequest(`/v1/admin/users/${id}`, {
    method: "PATCH",
    authToken: token,
    body: userBody(payload, false),
    schema: userSchema,
  });

export const changeUserPassword = (
  token: string,
  id: string,
  payload: UserPasswordValues,
) =>
  httpRequest(`/v1/admin/users/${id}/change-password`, {
    method: "POST",
    authToken: token,
    body: userPasswordSchema.parse(payload),
    schema: userSchema,
  });

export const fetchMemberships = (token: string, filters: MembershipFilters) =>
  httpRequest(
    `/v1/admin/memberships?${queryFrom({
      client_id: filters.clientId,
      tenant_id: filters.tenantId,
      user_id: filters.userId,
      status: filters.status,
      page: filters.page,
      per_page: filters.perPage,
    })}`,
    {
      authToken: token,
      schema: membershipsResponseSchema,
    },
  );

export const fetchMembership = (token: string, id: string) =>
  httpRequest(`/v1/admin/memberships/${id}`, {
    authToken: token,
    schema: membershipSchema,
  });

export const createMembership = (
  token: string,
  payload: MembershipFormValues,
) =>
  httpRequest("/v1/admin/memberships", {
    method: "POST",
    authToken: token,
    body: membershipFormSchema.parse(payload),
    schema: membershipSchema,
  });

export const updateMembership = (
  token: string,
  id: string,
  payload: MembershipFormValues,
) =>
  httpRequest(`/v1/admin/memberships/${id}`, {
    method: "PATCH",
    authToken: token,
    body: membershipFormSchema.parse(payload),
    schema: membershipSchema,
  });

export const deleteMembership = (token: string, id: string) =>
  httpRequest<void>(`/v1/admin/memberships/${id}`, {
    method: "DELETE",
    authToken: token,
  });
