import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requestPivotGps,
  requestPivotStatus,
  sendPivotManualCommand,
} from "@/modules/pivot/api/pivot.api";
import { pivotCommandsKey } from "@/modules/pivot/hooks/use-pivot-history";
import { pivotStateKey } from "@/modules/pivot/hooks/use-pivot-state";
import { usePivotSession } from "@/modules/pivot/hooks/use-pivots";
import type { PivotManualCommand } from "@/modules/pivot/schemas/pivot.schemas";

// Após um comando, o estado e o histórico de comandos ficam desatualizados.
const useInvalidateAfterCommand = (id: string) => {
  const { tenantId } = usePivotSession();
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: pivotStateKey(tenantId, id),
    });
    void queryClient.invalidateQueries({
      queryKey: pivotCommandsKey(tenantId, id),
    });
  };
};

// POST /v1/pivots/{id}/commands/manual
export const useManualCommandMutation = (id: string) => {
  const { token } = usePivotSession();
  const invalidate = useInvalidateAfterCommand(id);

  return useMutation({
    mutationFn: (payload: PivotManualCommand) =>
      sendPivotManualCommand(token, id, payload),
    onSuccess: invalidate,
  });
};

// POST /v1/pivots/{id}/commands/status
export const useRequestStatusMutation = (id: string) => {
  const { token } = usePivotSession();
  const invalidate = useInvalidateAfterCommand(id);

  return useMutation({
    mutationFn: () => requestPivotStatus(token, id),
    onSuccess: invalidate,
  });
};

// POST /v1/pivots/{id}/commands/gps
export const useRequestGpsMutation = (id: string) => {
  const { token } = usePivotSession();
  const invalidate = useInvalidateAfterCommand(id);

  return useMutation({
    mutationFn: () => requestPivotGps(token, id),
    onSuccess: invalidate,
  });
};
