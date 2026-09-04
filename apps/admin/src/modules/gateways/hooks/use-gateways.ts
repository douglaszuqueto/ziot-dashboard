import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  createGateway,
  deleteGateway,
  fetchGateway,
  fetchGateways,
  type GatewayFilters,
  syncGateway,
  updateGateway,
} from "@/modules/gateways/api/gateways.api";
import type {
  GatewayCreateFormValues,
  GatewayUpdateFormValues,
} from "@/modules/gateways/schemas/gateways.schemas";

export const GATEWAYS_QUERY_KEY = ["admin", "gateways"] as const;

export const useGatewaysQuery = (filters: GatewayFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...GATEWAYS_QUERY_KEY, filters],
    queryFn: () => fetchGateways(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useGatewayQuery = (id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...GATEWAYS_QUERY_KEY, id],
    queryFn: () => fetchGateway(token ?? "", id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateGatewayMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GatewayCreateFormValues) =>
      createGateway(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY }),
  });
};

export const useUpdateGatewayMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: GatewayUpdateFormValues }) =>
      updateGateway(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY }),
  });
};

export const useDeleteGatewayMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGateway(token ?? "", id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY }),
  });
};

export const useSyncGatewayMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => syncGateway(token ?? "", id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: GATEWAYS_QUERY_KEY }),
  });
};
