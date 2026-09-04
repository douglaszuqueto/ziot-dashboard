import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  HISTORY_PAGE_SIZE,
  usePivotAlerts,
  usePivotCommands,
} from "@/modules/pivot/hooks/use-pivot-history";
import {
  formatAlertKind,
  formatCommandDirection,
  formatCommandName,
  formatCommandOrigin,
  shortId,
} from "@/modules/pivot/lib/pivot-commands";
import { formatPivotPercent } from "@/modules/pivot/lib/pivot-state";
import type {
  PivotAlert,
  PivotCommand,
} from "@/modules/pivot/schemas/pivot.schemas";
import { formatDateTimeSeconds } from "@/shared/lib/format";

const HEAD_CLASS =
  "h-10 whitespace-nowrap px-4 text-[11px] uppercase tracking-wider text-muted-foreground";
const CELL_CLASS = "px-4 py-3 text-sm";

type HistoryTab = "alerts" | "commands";

export const pageOffset = (page: number, pageSize = HISTORY_PAGE_SIZE) =>
  (page - 1) * pageSize;

// Intervalo exibido no rodapé ("1–10 de 34").
export const pageRange = (
  page: number,
  total: number,
  pageSize = HISTORY_PAGE_SIZE,
) => {
  if (total <= 0) return { from: 0, to: 0 };
  const from = Math.min(pageOffset(page, pageSize) + 1, total);
  const to = Math.min(page * pageSize, total);
  return { from, to };
};

// Histórico de alertas e comandos do app legado, em abas paginadas (10 por
// página). Contrato: GET /v1/pivots/{id}/{alerts|commands}?limit=&offset= →
// {items, total, limit, offset}; 404 → lista vazia. A página volta a 1 ao
// trocar de aba ou atualizar.
export const PivotHistoryCard = ({ pivotId }: { pivotId: string }) => {
  const [tab, setTab] = useState<HistoryTab>("alerts");
  const [alertsPage, setAlertsPage] = useState(1);
  const [commandsPage, setCommandsPage] = useState(1);
  const alerts = usePivotAlerts(pivotId, {
    limit: HISTORY_PAGE_SIZE,
    offset: pageOffset(alertsPage),
  });
  const commands = usePivotCommands(pivotId, {
    limit: HISTORY_PAGE_SIZE,
    offset: pageOffset(commandsPage),
  });

  const changeTab = (value: string) => {
    setTab(value === "commands" ? "commands" : "alerts");
    setAlertsPage(1);
    setCommandsPage(1);
  };

  // Atualizar volta à primeira página; se já está nela, refaz a consulta.
  const refresh = (
    page: number,
    setPage: (page: number) => void,
    refetch: () => Promise<unknown>,
  ) => {
    if (page === 1) {
      void refetch();
      return;
    }
    setPage(1);
  };

  return (
    <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
      <Tabs value={tab} onValueChange={changeTab}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Histórico
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Alertas recebidos e comandos enviados ao pivô.
            </p>
          </div>
          <TabsList className="h-11 rounded-xl bg-secondary/60 p-1">
            <TabsTrigger value="alerts" className="h-9 rounded-lg px-4">
              Alertas
            </TabsTrigger>
            <TabsTrigger value="commands" className="h-9 rounded-lg px-4">
              Comandos
            </TabsTrigger>
          </TabsList>
        </header>

        <TabsContent value="alerts" className="mt-4">
          <HistoryPanel
            title="Histórico de alertas"
            total={alerts.data?.total ?? 0}
            page={alertsPage}
            onPageChange={setAlertsPage}
            isLoading={alerts.isLoading}
            isFetching={alerts.isFetching}
            isError={alerts.isError}
            emptyText="Nenhum alerta registrado"
            columns={3}
            onRefresh={() => refresh(alertsPage, setAlertsPage, alerts.refetch)}
            head={
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Tipo</TableHead>
                <TableHead className={HEAD_CLASS}>Alerta</TableHead>
                <TableHead className={HEAD_CLASS}>Data</TableHead>
              </TableRow>
            }
          >
            {alerts.data?.items.map((alert) => (
              <AlertRow key={alertKey(alert)} alert={alert} />
            ))}
          </HistoryPanel>
        </TabsContent>

        <TabsContent value="commands" className="mt-4">
          <HistoryPanel
            title="Histórico de comandos"
            total={commands.data?.total ?? 0}
            page={commandsPage}
            onPageChange={setCommandsPage}
            isLoading={commands.isLoading}
            isFetching={commands.isFetching}
            isError={commands.isError}
            emptyText="Nenhum comando enviado"
            columns={7}
            onRefresh={() =>
              refresh(commandsPage, setCommandsPage, commands.refetch)
            }
            head={
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Código</TableHead>
                <TableHead className={HEAD_CLASS}>Comando</TableHead>
                <TableHead className={HEAD_CLASS}>Direção</TableHead>
                <TableHead className={HEAD_CLASS}>Velocidade</TableHead>
                <TableHead className={HEAD_CLASS}>Origem</TableHead>
                <TableHead className={HEAD_CLASS}>Aceito</TableHead>
                <TableHead className={HEAD_CLASS}>Data</TableHead>
              </TableRow>
            }
          >
            {commands.data?.items.map((command) => (
              <CommandRow key={command.id} command={command} />
            ))}
          </HistoryPanel>
        </TabsContent>
      </Tabs>
    </section>
  );
};

const alertKey = (alert: PivotAlert) =>
  alert.id ?? `${alert.created_at}:${alert.code ?? alert.alert}`;

const AlertRow = ({ alert }: { alert: PivotAlert }) => (
  <TableRow>
    <TableCell className={CELL_CLASS}>
      <Badge
        variant="outline"
        className="border-transparent bg-secondary px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground"
      >
        {formatAlertKind(alert.kind)}
      </Badge>
    </TableCell>
    <TableCell className={cn(CELL_CLASS, "font-medium text-foreground")}>
      {alert.alert}
    </TableCell>
    <TableCell
      className={cn(CELL_CLASS, "whitespace-nowrap text-muted-foreground")}
    >
      {formatDateTimeSeconds(alert.created_at)}
    </TableCell>
  </TableRow>
);

const CommandRow = ({ command }: { command: PivotCommand }) => (
  <TableRow>
    <TableCell
      className={cn(CELL_CLASS, "font-mono text-xs text-muted-foreground")}
    >
      <span title={command.id}>{shortId(command.id)}</span>
    </TableCell>
    <TableCell className={cn(CELL_CLASS, "font-medium text-foreground")}>
      {formatCommandName(command.command)}
    </TableCell>
    <TableCell className={CELL_CLASS}>
      {formatCommandDirection(command.direction)}
    </TableCell>
    <TableCell className={CELL_CLASS}>
      {formatPivotPercent(command.percentimeter)}
    </TableCell>
    <TableCell className={CELL_CLASS}>
      {formatCommandOrigin(command.origin)}
    </TableCell>
    <TableCell
      className={cn(CELL_CLASS, "whitespace-nowrap text-muted-foreground")}
    >
      {formatDateTimeSeconds(command.accepted_at)}
    </TableCell>
    <TableCell
      className={cn(CELL_CLASS, "whitespace-nowrap text-muted-foreground")}
    >
      {formatDateTimeSeconds(command.created_at)}
    </TableCell>
  </TableRow>
);

const HistoryPanel = ({
  title,
  total,
  page,
  onPageChange,
  isLoading,
  isFetching,
  isError,
  emptyText,
  columns,
  head,
  children,
  onRefresh,
}: {
  title: string;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  emptyText: string;
  columns: number;
  head: ReactNode;
  children: ReactNode;
  onRefresh: () => void;
}) => {
  const { from, to } = pageRange(page, total);

  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {total}
          </span>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 rounded-xl px-3"
          disabled={isFetching}
          onClick={onRefresh}
          aria-label={`Atualizar ${title.toLowerCase()}`}
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border">
        <Table>
          <TableHeader className="bg-secondary/40">{head}</TableHeader>
          <TableBody>
            {isLoading ? (
              <LoadingRows columns={columns} />
            ) : isError ? (
              <StateRow columns={columns}>
                <p className="text-sm font-semibold text-foreground">
                  Falha ao carregar dados
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Não foi possível carregar o histórico. Tente atualizar.
                </p>
              </StateRow>
            ) : total === 0 ? (
              <StateRow columns={columns}>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
              </StateRow>
            ) : (
              children
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && !isError ? (
        <footer className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {from}–{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-xl px-3"
              disabled={page <= 1 || isFetching}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-xl px-3"
              disabled={to >= total || isFetching}
              onClick={() => onPageChange(page + 1)}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </footer>
      ) : null}
    </div>
  );
};

const StateRow = ({
  columns,
  children,
}: {
  columns: number;
  children: ReactNode;
}) => (
  <TableRow className="hover:bg-transparent">
    <TableCell colSpan={columns} className="px-4 py-8 text-center">
      {children}
    </TableCell>
  </TableRow>
);

const LoadingRows = ({ columns }: { columns: number }) => (
  <>
    {["a", "b", "c"].map((row) => (
      <TableRow key={row} className="hover:bg-transparent">
        <TableCell colSpan={columns} className="px-4 py-3">
          <Skeleton className="h-5 w-full rounded-full" />
        </TableCell>
      </TableRow>
    ))}
  </>
);
