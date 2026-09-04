import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  createPivot,
  deletePivot,
  fetchPivot,
  fetchPivots,
  updatePivot,
} from "@/modules/pivot/api/pivot.api";
import type {
  Pivot,
  PivotPayload,
} from "@/modules/pivot/schemas/pivot.schemas";

export const pivotsKey = (tenantId?: string) => ["pivots", tenantId] as const;
export const pivotKey = (tenantId?: string, id?: string) =>
  ["pivots", tenantId, "detail", id] as const;

export const usePivotSession = () => {
  const token = useAuthStore((state) => state.accessToken);
  const tenantId = useAuthStore((state) => state.tenant?.id);
  return { token: token ?? "", tenantId };
};

export const usePivotsQuery = () => {
  const { token, tenantId } = usePivotSession();

  return useQuery({
    queryKey: pivotsKey(tenantId),
    queryFn: () => fetchPivots(token),
    enabled: Boolean(token && tenantId),
  });
};

export const usePivotQuery = (id?: string) => {
  const { token, tenantId } = usePivotSession();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: pivotKey(tenantId, id),
    queryFn: () => fetchPivot(token, id ?? ""),
    enabled: Boolean(token && tenantId && id),
    // Ao abrir a partir da lista, mostra o cartão já carregado enquanto o
    // detalhe é buscado.
    placeholderData: () =>
      queryClient
        .getQueryData<{ items: Pivot[] }>(pivotsKey(tenantId))
        ?.items.find((pivot) => pivot.id === id),
  });
};

const useInvalidatePivots = () => {
  const { tenantId } = usePivotSession();
  const queryClient = useQueryClient();

  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: pivotsKey(tenantId) });
    if (id) {
      void queryClient.invalidateQueries({ queryKey: pivotKey(tenantId, id) });
    }
  };
};

export const useCreatePivotMutation = () => {
  const { token } = usePivotSession();
  const invalidate = useInvalidatePivots();

  return useMutation({
    mutationFn: (payload: PivotPayload) => createPivot(token, payload),
    onSuccess: () => invalidate(),
  });
};

export const useUpdatePivotMutation = () => {
  const { token } = usePivotSession();
  const invalidate = useInvalidatePivots();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<PivotPayload>;
    }) => updatePivot(token, id, payload),
    onSuccess: (pivot) => invalidate(pivot.id),
  });
};

export const useDeletePivotMutation = () => {
  const { token, tenantId } = usePivotSession();
  const queryClient = useQueryClient();
  const invalidate = useInvalidatePivots();

  return useMutation({
    mutationFn: (id: string) => deletePivot(token, id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: pivotKey(tenantId, id) });
      invalidate();
    },
  });
};
