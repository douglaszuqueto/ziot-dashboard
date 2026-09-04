import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRole,
  fetchPermissions,
  fetchRoles,
  fetchTenantModules,
  type RolePayload,
  updateRole,
  updateTenantModules,
} from "@/modules/access/api/access.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const ACCESS_QUERY_KEY = ["admin", "access"] as const;

export const usePermissionsQuery = (audience = "") => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "permissions", audience],
    queryFn: () => fetchPermissions(token ?? "", audience),
    enabled: Boolean(token),
  });
};

export const useRolesQuery = (audience = "") => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "roles", audience],
    queryFn: () => fetchRoles(token ?? "", audience),
    enabled: Boolean(token),
  });
};

export const useCreateRoleMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RolePayload) => createRole(token ?? "", payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
  });
};

export const useUpdateRoleMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; payload: RolePayload }) =>
      updateRole(token ?? "", input.id, input.payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
  });
};

export const useTenantModulesQuery = (tenantId: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...ACCESS_QUERY_KEY, "tenant-modules", tenantId],
    queryFn: () => fetchTenantModules(token ?? "", tenantId),
    enabled: Boolean(token && tenantId),
  });
};

export const useUpdateTenantModulesMutation = (tenantId: string) => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modules: Record<string, boolean>) =>
      updateTenantModules(token ?? "", tenantId, modules),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
  });
};
