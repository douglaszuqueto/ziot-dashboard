import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchPivotAlerts,
  fetchPivotCommands,
  fetchPivotHistory,
  type HistoryPage,
} from "@/modules/pivot/api/pivot.api";
import { usePivotSession } from "@/modules/pivot/hooks/use-pivots";
import { nullOn404 } from "@/modules/pivot/lib/api-fallback";
import type {
  PivotAlertList,
  PivotCommandList,
  PivotHistorySeries,
} from "@/modules/pivot/schemas/pivot.schemas";

export const HISTORY_PAGE_SIZE = 10;

// Atualização ao vivo com a página aberta (pausa com a aba oculta):
// comandos a cada 10 s (só na primeira página), alertas e histórico a cada 30 s.
export const COMMANDS_REFETCH_MS = 10_000;
export const ALERTS_REFETCH_MS = 30_000;
export const HISTORY_REFETCH_MS = 30_000;

// Prefixos das chaves: a página (`{limit, offset}`) entra no fim, então
// invalidar o prefixo atinge todas as páginas.
export const pivotAlertsKey = (tenantId?: string, id?: string) =>
  ["pivots", tenantId, "alerts", id] as const;
export const pivotCommandsKey = (tenantId?: string, id?: string) =>
  ["pivots", tenantId, "commands", id] as const;
export const pivotHistoryKey = (
  tenantId?: string,
  id?: string,
  hours?: number,
) => ["pivots", tenantId, "history", id, hours] as const;

const EMPTY_ALERTS: PivotAlertList = { items: [], total: 0 };
const EMPTY_COMMANDS: PivotCommandList = { items: [], total: 0 };
const EMPTY_HISTORY: PivotHistorySeries = { items: [] };

const toPage = ({
  limit = HISTORY_PAGE_SIZE,
  offset = 0,
}: Partial<HistoryPage> = {}): HistoryPage => ({ limit, offset });

// GET /v1/pivots/{id}/alerts?limit=&offset= → {items, total, limit, offset}.
// `total` é a contagem completa (alimenta o contador de alertas do resumo).
// 404 vira lista vazia; ao trocar de página a anterior fica na tela
// (`keepPreviousData`) para a tabela não piscar.
export const usePivotAlerts = (id?: string, options?: Partial<HistoryPage>) => {
  const { token, tenantId } = usePivotSession();
  const page = toPage(options);

  return useQuery({
    queryKey: [...pivotAlertsKey(tenantId, id), page] as const,
    queryFn: async () =>
      (await nullOn404(() => fetchPivotAlerts(token, id ?? "", page))) ??
      EMPTY_ALERTS,
    enabled: Boolean(token && tenantId && id),
    retry: false,
    placeholderData: keepPreviousData,
    refetchInterval: ALERTS_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
};

// GET /v1/pivots/{id}/commands?limit=&offset= — mesma semântica dos alertas.
export const usePivotCommands = (
  id?: string,
  options?: Partial<HistoryPage>,
) => {
  const { token, tenantId } = usePivotSession();
  const page = toPage(options);

  return useQuery({
    queryKey: [...pivotCommandsKey(tenantId, id), page] as const,
    queryFn: async () =>
      (await nullOn404(() => fetchPivotCommands(token, id ?? "", page))) ??
      EMPTY_COMMANDS,
    enabled: Boolean(token && tenantId && id),
    retry: false,
    placeholderData: keepPreviousData,
    refetchInterval: page.offset === 0 ? COMMANDS_REFETCH_MS : false,
    refetchIntervalInBackground: false,
  });
};

// GET /v1/pivots/{id}/history?hours=24 — alimenta os gráficos; 404 vira série
// vazia (os gráficos mantêm eixos e legenda).
export const usePivotHistory = (id?: string, hours = 24) => {
  const { token, tenantId } = usePivotSession();

  return useQuery({
    queryKey: pivotHistoryKey(tenantId, id, hours),
    queryFn: async () =>
      (await nullOn404(() => fetchPivotHistory(token, id ?? "", hours))) ??
      EMPTY_HISTORY,
    enabled: Boolean(token && tenantId && id),
    retry: false,
    staleTime: 15_000,
    refetchInterval: HISTORY_REFETCH_MS,
    refetchIntervalInBackground: false,
  });
};
