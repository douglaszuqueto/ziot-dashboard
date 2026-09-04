import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  type ClientFilters,
  createClient,
  deleteClient,
  fetchClient,
  fetchClients,
  updateClient,
} from "@/modules/clients/api/clients.api";
import type { ClientFormValues } from "@/modules/clients/schemas/clients.schemas";

export const CLIENTS_QUERY_KEY = ["admin", "clients"] as const;

export const useClientsQuery = (filters: ClientFilters = {}) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, filters],
    queryFn: () => fetchClients(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useClientQuery = (id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, id],
    queryFn: () => fetchClient(token ?? "", id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateClientMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientFormValues) =>
      createClient(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  });
};

export const useUpdateClientMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: ClientFormValues }) =>
      updateClient(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  });
};

export const useDeleteClientMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClient(token ?? "", id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY }),
  });
};
