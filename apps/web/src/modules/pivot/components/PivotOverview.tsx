import {
  Cog,
  Cpu,
  Droplets,
  Power,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Waves,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PivotIllustration } from "@/modules/pivot/components/PivotIllustration";
import { PivotMetricTile } from "@/modules/pivot/components/PivotMetricTile";
import {
  formatOperatingTime,
  formatPivotAngle,
  formatPivotDirection,
  formatPivotMode,
  formatPivotMotor,
  formatPivotPercent,
  formatPivotPressure,
  formatPivotRunning,
  formatPivotSecure,
  formatPivotVoltage,
  isSecurityTriggered,
  pivotCaption,
} from "@/modules/pivot/lib/pivot-state";
import {
  pivotStatusMeta,
  resolvePivotStatus,
} from "@/modules/pivot/lib/pivot-status";
import type { Pivot, PivotState } from "@/modules/pivot/schemas/pivot.schemas";
import { formatInteger } from "@/shared/lib/format";

// Cartão de três colunas do detalhe (mesma composição do resumo da estufa):
// ESTADO · PIVÔ (contadores + ilustração + legenda) · HIDRÁULICA E ELÉTRICA.
export const PivotOverview = ({
  pivot,
  state,
}: {
  pivot: Pivot;
  state?: PivotState;
}) => {
  const meta = pivotStatusMeta(
    resolvePivotStatus(pivot.status, state?.running),
  );
  const pressure = formatPivotPressure(state);
  const voltage = formatPivotVoltage(state);
  const securityTriggered = isSecurityTriggered(state);

  return (
    <section className="grid grid-cols-1 gap-4 rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] lg:grid-cols-[0.9fr_1.15fr_0.95fr] lg:p-5">
      <OverviewColumn title="Estado" subtitle="Os nove estados do pivô">
        <PivotMetricTile
          icon={Power}
          label="Pivô"
          value={formatPivotRunning(state?.running)}
        />
        <PivotMetricTile
          icon={securityTriggered ? ShieldAlert : ShieldCheck}
          label="Segurança"
          value={formatPivotSecure(state?.secure)}
        />
        <PivotMetricTile
          icon={Cog}
          label="Motor"
          value={formatPivotMotor(state?.motor)}
        />
        <PivotMetricTile
          icon={RotateCw}
          label="Direção"
          value={formatPivotDirection(state?.direction)}
        />
        <PivotMetricTile
          icon={Droplets}
          label="Modo"
          value={formatPivotMode(state?.mode)}
        />
      </OverviewColumn>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-secondary/35 p-5">
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Pivô
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumo operacional geral
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <CounterPill
              label="Ângulo"
              value={formatPivotAngle(state?.angle)}
              emphasis
            />
            <CounterPill
              label="Percentímetro"
              value={formatPivotPercent(state?.percentimeter)}
            />
            <CounterPill
              label="Alertas"
              value={formatInteger(state?.alerts_count ?? 0)}
            />
          </div>
          <div className="mt-5 flex min-h-32 items-center justify-center rounded-3xl border border-primary/15 bg-card/75 px-4 py-3">
            <PivotIllustration
              className="max-h-56"
              angle={state?.angle ?? 40}
            />
          </div>
          <p className="mt-3 text-center text-sm font-medium text-foreground">
            {pivotCaption(meta.caption, state)}
          </p>
        </div>
      </div>

      <OverviewColumn
        title="Hidráulica e elétrica"
        subtitle="Pressão, tensão e vínculo"
      >
        <PivotMetricTile
          icon={Waves}
          label="Pressão"
          value={pressure.value}
          unit={pressure.unit}
        />
        <PivotMetricTile
          icon={Zap}
          label="Tensão"
          value={voltage.value}
          unit={voltage.unit}
        />
        <PivotMetricTile
          icon={Timer}
          label="Tempo de operação"
          value={formatOperatingTime(state?.operating_minutes)}
        />
        <PivotMetricTile
          icon={Cpu}
          label="Dispositivo vinculado"
          value={pivot.device_id ?? "Não vinculado"}
        />
      </OverviewColumn>
    </section>
  );
};

const OverviewColumn = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <div className="rounded-3xl border border-border bg-card p-4">
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
      {title}
    </p>
    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    <div className="mt-4 grid grid-cols-1 gap-2">{children}</div>
  </div>
);

const CounterPill = ({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) => (
  <div className="min-w-0 rounded-2xl bg-card/85 px-3 py-2 text-center shadow-sm">
    <p
      className={cn(
        "truncate text-lg font-semibold leading-none",
        emphasis && "text-xl text-primary",
      )}
    >
      {value}
    </p>
    <p className="mt-1 truncate text-[10px] uppercase tracking-wider text-muted-foreground">
      {label}
    </p>
  </div>
);
