import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientsQuery } from "@/modules/clients/hooks/use-clients";
import {
  useDeviceHealthQuery,
  useDeviceHealthSummaryQuery,
} from "@/modules/reports/hooks/use-reports";
import type { DeviceHealthRow } from "@/modules/reports/schemas/reports.schemas";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import {
  AdminDataTable,
  DateCell,
  StatusBadge,
} from "@/shared/components/AdminTable";
import { HealthBadge } from "@/shared/components/metrics/HealthBadge";
import { SummaryCard } from "@/shared/components/metrics/SummaryCard";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";
import { healthLabels, healthSummaryCards } from "@/shared/domain/health";

export const DeviceHealthPage = () => {
  const [clientId, setClientId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [thresholdMinutes, setThresholdMinutes] = useState(30);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const clientsQuery = useClientsQuery({ perPage: 100 });
  const tenantsQuery = useTenantsQuery({
    clientId,
    status: "active",
    perPage: 100,
  });
  const filters = {
    clientId,
    tenantId,
    healthStatus,
    thresholdMinutes,
  };
  const healthQuery = useDeviceHealthQuery({
    ...filters,
    page,
    perPage: pageSize,
  });
  const summaryQuery = useDeviceHealthSummaryQuery(filters);

  if (healthQuery.isLoading) {
    return <SectionLoading screen variant="report" />;
  }

  if (healthQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar o relatório de saúde."
        onRetry={() => void healthQuery.refetch()}
      />
    );
  }

  const rows = healthQuery.data?.data ?? [];
  const summary = summaryQuery.data?.summary;
  const total = summary?.total ?? healthQuery.data?.meta?.total ?? rows.length;
  const tableTotal = healthQuery.data?.meta?.total ?? rows.length;
  const threshold = summaryQuery.data?.threshold_minutes ?? thresholdMinutes;
  const columns: ColumnDef<DeviceHealthRow>[] = [
    {
      header: "Device",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.external_id}
          </p>
        </div>
      ),
    },
    {
      header: "Cliente / Tenant",
      cell: ({ row }) => (
        <div>
          <p>{row.original.client_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.tenant_name}
          </p>
        </div>
      ),
    },
    {
      header: "Módulo",
      accessorKey: "module",
    },
    {
      header: "Protocolo",
      accessorKey: "protocol",
    },
    {
      header: "Ativo",
      cell: ({ row }) => (
        <StatusBadge
          value={row.original.active ? "active" : "inactive"}
          active={row.original.active}
        />
      ),
    },
    {
      header: "Saúde",
      cell: ({ row }) => <HealthBadge value={row.original.health_status} />,
    },
    {
      header: "Último sinal",
      cell: ({ row }) => <DateCell value={row.original.last_reported_at} />,
    },
  ];

  return (
    <div className="space-y-5">
      {summary ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {healthSummaryCards.map(({ key, label, icon, className }) => {
            const value = summary[key];

            return (
              <SummaryCard
                key={key}
                label={label}
                value={value}
                total={total}
                icon={icon}
                className={className}
                caption={key === "total" ? `${threshold} min.` : undefined}
              />
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
        <div className="space-y-1">
          <Label className="text-xs">Cliente</Label>
          <Select
            value={clientId || "all"}
            onValueChange={(value) => {
              setClientId(value === "all" ? "" : value);
              setTenantId("");
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(clientsQuery.data?.data ?? []).map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tenant</Label>
          <Select
            value={tenantId || "all"}
            onValueChange={(value) => {
              setTenantId(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {(tenantsQuery.data?.data ?? []).map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.client_name} / {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Saúde</Label>
          <Select
            value={healthStatus || "all"}
            onValueChange={(value) => {
              setHealthStatus(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(healthLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="threshold" className="text-xs">
            Threshold min.
          </Label>
          <Input
            id="threshold"
            type="number"
            value={thresholdMinutes}
            onChange={(event) =>
              setThresholdMinutes(Number(event.target.value) || 30)
            }
            min={1}
            className="h-10 rounded-xl bg-white"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <p>
          Janela de saúde: devices sem sinal há mais de {threshold} minutos são
          considerados offline.
        </p>
        <p>
          Exibindo {rows.length} de {total} registros filtrados.
        </p>
        {summaryQuery.isError ? (
          <p className="text-alert">Resumo indisponível no momento.</p>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <SectionEmpty title="Sem registros" description="Ajuste os filtros." />
      ) : (
        <AdminDataTable
          columns={columns}
          data={rows}
          totalItems={tableTotal}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
