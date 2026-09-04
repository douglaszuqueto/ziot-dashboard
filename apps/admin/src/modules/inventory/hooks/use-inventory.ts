import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  type AssetKind,
  createAsset,
  fetchAsset,
  fetchAssets,
  fetchDeviceProfiles,
  type InventoryFilters,
  transferAsset,
  updateAsset,
  updateAssetStatus,
} from "@/modules/inventory/api/inventory.api";
import type {
  AssetFormValues,
  AssetUpdateFormValues,
} from "@/modules/inventory/schemas/inventory.schemas";

export const INVENTORY_QUERY_KEY = ["admin", "inventory"] as const;
export type { AssetKind };

export const useDeviceProfilesQuery = (
  filters: InventoryFilters,
  enabled = true,
) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY, "profiles", filters],
    queryFn: () => fetchDeviceProfiles(token ?? "", filters),
    enabled: Boolean(token && enabled),
  });
};

export const useAssetsQuery = (kind: AssetKind, filters: InventoryFilters) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY, kind, filters],
    queryFn: () => fetchAssets(token ?? "", kind, filters),
    enabled: Boolean(token),
  });
};

export const useAssetQuery = (kind: AssetKind, id?: string) => {
  const token = useAuthStore((state) => state.accessToken);
  return useQuery({
    queryKey: [...INVENTORY_QUERY_KEY, kind, id],
    queryFn: () => fetchAsset(token ?? "", kind, id ?? ""),
    enabled: Boolean(token && id),
  });
};

export const useCreateAssetMutation = (kind: AssetKind) => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetFormValues) =>
      createAsset(token ?? "", kind, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
};

export const useUpdateAssetMutation = (kind: AssetKind) => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; values: AssetUpdateFormValues }) =>
      updateAsset(token ?? "", kind, input.id, input.values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
};

export const useTransferAssetMutation = (kind: AssetKind) => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; tenantId: string }) =>
      transferAsset(token ?? "", kind, input.id, input.tenantId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
};

export const useUpdateAssetStatusMutation = (kind: AssetKind) => {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; active: boolean }) =>
      updateAssetStatus(token ?? "", kind, input.id, input.active),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY }),
  });
};
