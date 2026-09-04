import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  createTenant,
  fetchTenant,
  fetchTenants,
  type TenantFilters,
  updateTenant,
} from "@/modules/tenants/api/tenants.api";
import type { TenantFormValues } from "@/modules/tenants/schemas/tenants.schemas";

export const TENANTS_QUERY_KEY = ["admin", "tenants"] as const;

export const useTenantsQuery = (filters: TenantFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...TENANTS_QUERY_KEY, filters],
    queryFn: () => fetchTenants(token ?? "", filters),
    enabled: Boolean(token),
  });
};

export const useTenantQuery = (id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...TENANTS_QUERY_KEY, id],
    queryFn: () => fetchTenant(token ?? "", id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateTenantMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TenantFormValues) =>
      createTenant(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY }),
  });
};

export const useUpdateTenantMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: TenantFormValues }) =>
      updateTenant(token ?? "", input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY }),
  });
};
