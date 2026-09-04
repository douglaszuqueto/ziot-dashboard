import { ArrowLeft, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasAccess } from "@/modules/auth/access";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { DeletePivotDialog } from "@/modules/pivot/components/DeletePivotDialog";
import {
  buildEmptySeries24h,
  PivotCharts,
} from "@/modules/pivot/components/PivotCharts";
import { PivotCommandsCard } from "@/modules/pivot/components/PivotCommandsCard";
import { PivotFormDialog } from "@/modules/pivot/components/PivotFormDialog";
import { PivotHistoryCard } from "@/modules/pivot/components/PivotHistoryCard";
import { PivotLocationCard } from "@/modules/pivot/components/PivotLocationCard";
import { PivotOverview } from "@/modules/pivot/components/PivotOverview";
import { PivotStatusBadge } from "@/modules/pivot/components/PivotStatusBadge";
import {
  usePivotAlerts,
  usePivotHistory,
} from "@/modules/pivot/hooks/use-pivot-history";
import { usePivotStateQuery } from "@/modules/pivot/hooks/use-pivot-state";
import { usePivotQuery } from "@/modules/pivot/hooks/use-pivots";
import { formatPivotLastInput } from "@/modules/pivot/lib/pivot-state";
import { ApiError } from "@/shared/api/error";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const TITLE = "Pivô";

const BackLink = () => (
  <Link
    to="/pivos"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
  >
    <ArrowLeft className="h-4 w-4" />
    Voltar para pivôs
  </Link>
);

export const PivotDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = usePivotQuery(id);
  const stateQuery = usePivotStateQuery(id);
  const history = usePivotHistory(id, 24);
  const alerts = usePivotAlerts(id);
  // O contador "Alertas" da coluna Pivô reflete o histórico carregado.
  const alertsTotal = alerts.data?.total;
  const telemetry = useMemo(() => {
    const state = stateQuery.data ?? undefined;
    if (!state || alertsTotal === undefined) return state;
    return { ...state, alerts_count: alertsTotal };
  }, [stateQuery.data, alertsTotal]);
  const permissions = useAuthStore((state) => state.permissions);
  const canWrite = hasAccess(permissions, "pivot.write");
  const canCommand = hasAccess(permissions, "pivot.command");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Série real (GET /v1/pivots/{id}/history?hours=24) quando existir; senão o
  // eixo vazio das últimas 24h para manter eixos e legenda visíveis.
  const historyItems = history.data?.items;
  const series = useMemo(
    () => (historyItems?.length ? historyItems : buildEmptySeries24h()),
    [historyItems],
  );
  const refreshing = query.isFetching || stateQuery.isFetching;
  const refresh = () => {
    void query.refetch();
    void stateQuery.refetch();
    void history.refetch();
  };

  if (query.isLoading) {
    return (
      <AppShell title={TITLE}>
        <SectionLoading lines={6} screen variant="detail" />
      </AppShell>
    );
  }

  const notFound =
    query.error instanceof ApiError && query.error.status === 404;

  if (notFound || (!query.isError && !query.data)) {
    return (
      <AppShell title={TITLE}>
        <BackLink />
        <SectionEmpty
          title="Pivô não encontrado"
          description="Ele pode ter sido removido ou pertencer a outro tenant."
        />
      </AppShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <AppShell title={TITLE}>
        <BackLink />
        <SectionError
          message="Não foi possível carregar o pivô."
          onRetry={() => void query.refetch()}
        />
      </AppShell>
    );
  }

  const pivot = query.data;

  return (
    <AppShell title={pivot.name}>
      <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/pivos"
              aria-label="Voltar para pivôs"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/70"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="min-w-0 truncate text-2xl font-semibold tracking-tight lg:text-3xl">
                  {pivot.name}
                </h2>
                <PivotStatusBadge status={pivot.status} withIcon />
              </div>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                {pivot.description || "Sem descrição"}
              </p>
              {pivot.device_id ? (
                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground/80">
                  {pivot.device_id}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPivotLastInput(telemetry?.last_input) ??
                  "Última atualização: —"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canWrite ? (
              <Button
                type="button"
                variant="secondary"
                className="h-11 rounded-xl px-5 text-sm font-medium"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            ) : null}
            <Button
              type="button"
              className="h-11 rounded-xl px-5 text-sm font-medium"
              disabled={refreshing}
              onClick={refresh}
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
              />
              Atualizar
            </Button>
            {canWrite ? (
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-xl px-4 text-sm font-medium text-alert hover:text-alert"
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {canCommand ? <PivotCommandsCard pivotId={pivot.id} /> : null}

      <PivotOverview pivot={pivot} state={telemetry} />

      <PivotLocationCard pivot={pivot} canWrite={canWrite} />

      <PivotCharts series={series} />

      <PivotHistoryCard pivotId={pivot.id} />

      {canWrite ? (
        <>
          <PivotFormDialog
            open={editing}
            pivot={pivot}
            onOpenChange={setEditing}
          />
          <DeletePivotDialog
            pivot={deleting ? pivot : null}
            onOpenChange={setDeleting}
            onDeleted={() => navigate("/pivos", { replace: true })}
          />
        </>
      ) : null}
    </AppShell>
  );
};
