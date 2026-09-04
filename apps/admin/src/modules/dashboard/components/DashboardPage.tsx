import {
  Activity,
  AlertTriangle,
  Building2,
  CircleOff,
  Clock3,
  Cpu,
  RefreshCw,
  Router,
  Server,
  ShieldAlert,
  Signal,
  Users,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  DashboardOverviewFilters,
  PacketLossBucket,
  PacketLossFilters,
} from "@/modules/dashboard/api/dashboard.api";
import {
  useDashboardOverviewQuery,
  useDashboardPacketLossQuery,
} from "@/modules/dashboard/hooks/use-dashboard";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";
import {
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";
import { healthLabels, healthStatusKeys } from "@/shared/domain/health";
import {
  formatCompactNumber,
  formatDate,
  formatInteger,
  formatNumber,
} from "@/shared/lib/format";

const protocolOptions = [
  { value: "all", label: "Todos protocolos" },
  { value: "lorawan", label: "LoRaWAN" },
  { value: "nbiot", label: "NB-IoT" },
] as const;

const windowOptions = [
  { value: "24", label: "24h" },
  { value: "72", label: "72h" },
  { value: "168", label: "7d" },
] as const;

const bucketOptions = [
  { value: "hour", label: "Hora" },
  { value: "day", label: "Dia" },
] as const;

const healthColors = {
  online: "hsl(var(--primary))",
  offline: "hsl(var(--alert))",
  never_seen: "hsl(37 85% 48%)",
  disabled: "hsl(var(--muted-foreground))",
} as const;

const chartTooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    boxShadow: "var(--shadow-elevated)",
    fontSize: 12,
  },
};

export const DashboardPage = () => {
  const [protocol, setProtocol] = useState("all");
  const [packetLossHours, setPacketLossHours] = useState(24);
  const [bucket, setBucket] = useState<PacketLossBucket>("hour");
  const [rangeAnchor, setRangeAnchor] = useState(() => Date.now());
  const tenantId = useTenantContextStore((state) => state.tenantId);

  const protocolFilter = protocol === "all" ? undefined : protocol;
  const overviewFilters = useMemo<DashboardOverviewFilters>(
    () => ({
      tenantId: tenantId ?? undefined,
      protocol: protocolFilter,
      packetLossHours,
    }),
    [packetLossHours, protocolFilter, tenantId],
  );
  const packetLossRange = useMemo(() => {
    const to = new Date(rangeAnchor);
    const from = new Date(to.getTime() - packetLossHours * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }, [packetLossHours, rangeAnchor]);
  const packetLossFilters = useMemo<PacketLossFilters>(
    () => ({
      tenantId: tenantId ?? undefined,
      protocol: protocolFilter,
      bucket,
      ...packetLossRange,
    }),
    [bucket, packetLossRange, protocolFilter, tenantId],
  );

  const overviewQuery = useDashboardOverviewQuery(overviewFilters);
  const packetLossQuery = useDashboardPacketLossQuery(packetLossFilters);

  if (overviewQuery.isLoading) {
    return <SectionLoading screen variant="dashboard" />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <SectionError
        message="Não foi possível carregar métricas do dashboard admin."
        onRetry={() => void overviewQuery.refetch()}
      />
    );
  }

  const overview = overviewQuery.data;
  const packetLoss = packetLossQuery.data;
  const healthSeries = healthStatusKeys.map(({ key }) => ({
    key,
    label: healthLabels[key],
    value: overview.health[key],
    fill: healthColors[key],
  }));
  const packetLossSeries =
    packetLoss?.series.map((point) => ({
      ...point,
      bucketLabel: formatDate(
        point.bucket,
        bucket === "day" ? "dd/MM" : "HH:mm",
      ),
    })) ?? [];
  const alerts = overview.alerts;
  const alertSeries = alerts
    ? [
        {
          label: "Críticos",
          value: alerts.critical,
          fill: "hsl(var(--alert))",
        },
        {
          label: "Avisos",
          value: alerts.warning,
          fill: "hsl(var(--accent))",
        },
        { label: "Info", value: alerts.info, fill: "hsl(var(--primary))" },
      ]
    : null;
  const deviceErrors = overview.device_errors;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl bg-frame px-5 py-5 text-frame-foreground shadow-[var(--shadow-elevated)] lg:px-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">
              Saúde operacional
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-frame-foreground/65">
              Acompanhe devices, gateways e perda de pacotes da operação.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
            <Select value={protocol} onValueChange={setProtocol}>
              <SelectTrigger className="border-white/15 bg-white/10 text-frame-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {protocolOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(packetLossHours)}
              onValueChange={(value) => setPacketLossHours(Number(value))}
            >
              <SelectTrigger className="border-white/15 bg-white/10 text-frame-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {windowOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    Janela {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => {
                setRangeAnchor(Date.now());
                void overviewQuery.refetch();
              }}
              disabled={overviewQuery.isFetching || packetLossQuery.isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricLinkCard
          label="Clientes"
          value={overview.inventory.clients}
          to="/clientes"
          icon={Building2}
        />
        <MetricLinkCard
          label="Tenants"
          value={overview.inventory.tenants}
          to="/tenants"
          icon={Activity}
        />
        <MetricLinkCard
          label="Usuários"
          value={overview.inventory.users}
          to="/usuarios"
          icon={Users}
        />
        <MetricLinkCard
          label="Devices"
          value={overview.inventory.devices}
          to="/devices"
          icon={Cpu}
        />
        <MetricLinkCard
          label="Gateways"
          value={overview.inventory.gateways}
          icon={Router}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <HealthTile
          label="Monitorados"
          value={overview.health.total}
          icon={Server}
          className="border-border bg-card text-foreground"
        />
        <HealthTile
          label="Online"
          value={overview.health.online}
          icon={Wifi}
          className="border-success/20 bg-success/10 text-success"
          caption={percentLabel(overview.health.online, overview.health.total)}
        />
        <HealthTile
          label="Offline"
          value={overview.health.offline}
          icon={Signal}
          className="border-alert/20 bg-alert/10 text-alert"
          caption={percentLabel(overview.health.offline, overview.health.total)}
        />
        <HealthTile
          label="Nunca visto"
          value={overview.health.never_seen}
          icon={Clock3}
          className="border-amber-200 bg-amber-50 text-amber-700"
          caption={percentLabel(
            overview.health.never_seen,
            overview.health.total,
          )}
        />
        <HealthTile
          label="Desativados"
          value={overview.health.disabled}
          icon={CircleOff}
          className="border-border bg-muted text-muted-foreground"
          caption={percentLabel(
            overview.health.disabled,
            overview.health.total,
          )}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard
          title="Distribuição de saúde"
          subtitle="Status operacional por device ativo/cadastrado"
        >
          {overview.health.total === 0 ? (
            <ChartState
              title="Sem devices"
              description="Nenhum device retornado para filtro atual."
            />
          ) : (
            <div className="grid h-full gap-4 lg:grid-cols-[1fr_180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthSeries}
                    dataKey="value"
                    nameKey="label"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                  >
                    {healthSeries.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid content-center gap-2">
                {healthSeries.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Perda de pacotes"
          subtitle={`${packetLossHours}h · ${bucket === "day" ? "por dia" : "por hora"}`}
          action={
            <Select
              value={bucket}
              onValueChange={(value) => setBucket(value as PacketLossBucket)}
            >
              <SelectTrigger className="h-9 w-28 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bucketOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          {packetLossQuery.isError ? (
            <ChartState
              title="Falha ao carregar"
              description="Não foi possível carregar perda de pacotes."
            />
          ) : packetLossQuery.isLoading ? (
            <ChartLoading />
          ) : packetLossSeries.length === 0 ? (
            <ChartState
              title="Sem histórico"
              description="Nenhum bucket retornado para janela atual."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={packetLossSeries}>
                <defs>
                  <linearGradient id="packet-loss" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--alert))"
                      stopOpacity={0.32}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--alert))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="bucketLabel"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip {...chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="lost"
                  name="Perdidos"
                  stroke="hsl(var(--alert))"
                  fill="url(#packet-loss)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="received"
                  name="Recebidos"
                  stroke="hsl(var(--primary))"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {alertSeries ? (
          <Card className="rounded-2xl shadow-[var(--shadow-card)]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-alert" />
                Alarmes ativos
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Incidentes abertos ou reconhecidos
              </p>
            </CardHeader>
            <CardContent className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alertSeries}>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="value" name="Total" radius={[8, 8, 0, 0]}>
                    {alertSeries.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {deviceErrors ? (
          <StatusPanel
            title="Alarmes e erros"
            icon={ShieldAlert}
            items={[
              {
                label: "Devices com alarmes",
                value: deviceErrors.devices_with_alarms,
              },
              {
                label: "Devices com erros",
                value: deviceErrors.devices_with_errors,
              },
              {
                label: "Alarmes reportados",
                value: deviceErrors.alarm_count,
              },
              {
                label: "Erros reportados",
                value: deviceErrors.error_count,
              },
            ]}
          />
        ) : null}

        <StatusPanel
          title="Gateways LoRaWAN"
          icon={Router}
          items={[
            { label: "Cadastrados", value: overview.gateways.total },
            { label: "Vinculados", value: overview.gateways.linked },
            { label: "Sem vínculo", value: overview.gateways.unlinked },
            { label: "Sync OK", value: overview.gateways.sync_ok },
            { label: "Sync erro", value: overview.gateways.sync_error },
          ]}
        />
      </section>
    </div>
  );
};

const MetricLinkCard = ({
  label,
  value,
  to,
  icon: Icon,
}: {
  label: string;
  value: number;
  to?: string;
  icon: typeof Building2;
}) => {
  const content = (
    <Card className="h-full rounded-xl transition-colors hover:bg-muted/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{formatInteger(value)}</p>
      </CardContent>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

const HealthTile = ({
  label,
  value,
  icon: Icon,
  className,
  caption,
}: {
  label: string;
  value: number;
  icon: typeof Server;
  className: string;
  caption?: string;
}) => (
  <div className={cn("rounded-xl border p-4", className)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <Icon className="h-4 w-4" />
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">
      <p className="text-2xl font-semibold">{formatInteger(value)}</p>
      {caption ? <p className="text-xs opacity-75">{caption}</p> : null}
    </div>
  </div>
);

const ChartCard = ({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Card className="rounded-2xl shadow-[var(--shadow-card)]">
    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </CardHeader>
    <CardContent className="h-[330px]">{children}</CardContent>
  </Card>
);

const ChartState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/25 px-6 text-center">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
  </div>
);

const ChartLoading = () => (
  <div className="grid h-full gap-3">
    <div className="h-10 rounded-2xl bg-muted/50" />
    <div className="h-full rounded-2xl bg-muted/35" />
  </div>
);

const StatusPanel = ({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Router;
  items: Array<{ label: string; value: number }>;
}) => (
  <Card className="rounded-2xl shadow-[var(--shadow-card)]">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5"
        >
          <span className="text-sm text-muted-foreground">{item.label}</span>
          <span className="text-base font-semibold">
            {formatCompactNumber(item.value)}
          </span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const percentLabel = (value: number, total: number) => {
  if (!total) {
    return "0%";
  }
  return `${formatNumber((value / total) * 100, 0)}%`;
};
