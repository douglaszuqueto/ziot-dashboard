import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPivotState } from "@/modules/pivot/api/pivot.api";
import { usePivotSession } from "@/modules/pivot/hooks/use-pivots";
import { nullOn404 } from "@/modules/pivot/lib/api-fallback";
import type { PivotState } from "@/modules/pivot/schemas/pivot.schemas";

export const pivotStateKey = (tenantId?: string, id?: string) =>
  ["pivots", tenantId, "state", id] as const;

// GET /v1/pivots/{id}/state (contrato em ziot-api/docs/modules/pivot/README.md).
// Enquanto o backend não implementa o endpoint (404), a query resolve `null`
// e as telas seguem com "—".
export const usePivotStateQuery = (id?: string) => {
  const { token, tenantId } = usePivotSession();

  return useQuery({
    queryKey: pivotStateKey(tenantId, id),
    queryFn: () => nullOn404(() => fetchPivotState(token, id ?? "")),
    enabled: Boolean(token && tenantId && id),
    retry: false,
    staleTime: 30_000,
  });
};

export const usePivotState = (id?: string): PivotState | undefined =>
  usePivotStateQuery(id).data ?? undefined;

export const useInvalidatePivotState = () => {
  const { tenantId } = usePivotSession();
  const queryClient = useQueryClient();

  return (id: string) =>
    queryClient.invalidateQueries({ queryKey: pivotStateKey(tenantId, id) });
};
