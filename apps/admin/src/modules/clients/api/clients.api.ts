import {
  type ClientFormValues,
  clientFormSchema,
  clientSchema,
  clientsResponseSchema,
} from "@/modules/clients/schemas/clients.schemas";
import { httpRequest } from "@/shared/api/http-client";

export interface ClientFilters {
  search?: string;
  page?: number;
  perPage?: number;
}

export const fetchClients = (token: string, filters: ClientFilters = {}) => {
  const query = new URLSearchParams();
  if (filters.search) {
    query.set("search", filters.search);
  }
  if (filters.page) query.set("page", String(filters.page));
  if (filters.perPage) query.set("per_page", String(filters.perPage));

  return httpRequest(`/v1/admin/clients?${query.toString()}`, {
    authToken: token,
    schema: clientsResponseSchema,
  });
};

export const fetchClient = (token: string, id: string) =>
  httpRequest(`/v1/admin/clients/${id}`, {
    authToken: token,
    schema: clientSchema,
  });

export const createClient = (token: string, payload: ClientFormValues) =>
  httpRequest("/v1/admin/clients", {
    method: "POST",
    authToken: token,
    body: clientFormSchema.parse(payload),
    schema: clientSchema,
  });

export const updateClient = (
  token: string,
  id: string,
  payload: ClientFormValues,
) =>
  httpRequest(`/v1/admin/clients/${id}`, {
    method: "PATCH",
    authToken: token,
    body: clientFormSchema.parse(payload),
    schema: clientSchema,
  });

export const deleteClient = (token: string, id: string) =>
  httpRequest<void>(`/v1/admin/clients/${id}`, {
    method: "DELETE",
    authToken: token,
  });
