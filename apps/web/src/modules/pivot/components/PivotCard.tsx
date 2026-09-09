import {
  Compass,
  Droplets,
  type LucideIcon,
  Pencil,
  RadioTower,
  RotateCw,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PivotAngleGauge } from "@/modules/pivot/components/PivotAngleGauge";
import { PivotStatusBadge } from "@/modules/pivot/components/PivotStatusBadge";
import { pivotBearing } from "@/modules/pivot/lib/pivot-geometry";
import {
  formatPivotDirection,
  formatPivotLastInput,
  formatPivotMode,
  formatPivotPercent,
  formatPivotPressure,
  formatPivotVoltage,
} from "@/modules/pivot/lib/pivot-state";
import {
  pivotStatusMeta,
  resolvePivotStatus,
} from "@/modules/pivot/lib/pivot-status";
import type { Pivot, PivotState } from "@/modules/pivot/schemas/pivot.schemas";
import { formatCoordinates, formatRelative } from "@/shared/lib/format";

export const pivotCoordinates = (
  pivot: Pick<Pivot, "latitude" | "longitude">,
) => formatCoordinates({ lat: pivot.latitude, lng: pivot.longitude });

// Cartão da lista no padrão do cartão de estufa, com as informações do
// cartão do app legado: ícone + nome, pílula LIGADO/DESLIGADO (ou status
// cadastral), tiles modo / direção / pressão / tensão, tile de destaque com
// o gauge do ângulo e o percentímetro, e "Última atualização". O cartão
// inteiro leva ao detalhe (link "esticado" via `after:`), mantendo
// editar/excluir acessíveis acima dele.
export const PivotCard = ({
  pivot,
  state,
  canWrite,
  onEdit,
  onDelete,
}: {
  pivot: Pivot;
  // Telemetria (GET /v1/pivots/{id}/state); sem ela, os tiles mostram "—".
  state?: PivotState;
  canWrite: boolean;
  onEdit: (pivot: Pivot) => void;
  onDelete: (pivot: Pivot) => void;
}) => {
  const meta = pivotStatusMeta(
    resolvePivotStatus(pivot.status, state?.running),
  );
  const pressure = formatPivotPressure(state);
  const voltage = formatPivotVoltage(state);
  const lastUpdate =
    formatPivotLastInput(state?.last_input) ??
    `Atualizado ${formatRelative(pivot.updated_at)}`;

  return (
    <article className="relative flex flex-col rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={`/pivos/${encodeURIComponent(pivot.id)}`}
          className="flex min-w-0 flex-auto items-center gap-3 after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
              meta.iconClassName,
            )}
          >
            <RadioTower className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold leading-tight text-foreground">
              {pivot.name}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {pivot.description || "Sem descrição"}
            </span>
          </span>
        </Link>
        <PivotStatusBadge
          status={pivot.status}
          running={state?.running}
          className="shrink-0"
        />
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <InfoTile
          label="Modo"
          value={formatPivotMode(state?.mode)}
          icon={Droplets}
        />
        <InfoTile
          label="Direção"
          value={formatPivotDirection(state?.direction)}
          icon={RotateCw}
        />
        <InfoTile
          label="Pressão"
          value={`${pressure.value} ${pressure.unit}`}
          icon={Waves}
        />
        <InfoTile
          label="Tensão"
          value={`${voltage.value} ${voltage.unit}`}
          icon={Zap}
        />
      </div>

      <div
        className={cn(
          "mt-2.5 flex items-center gap-4 rounded-2xl px-4 py-3",
          meta.highlightClassName,
        )}
      >
        <PivotAngleGauge
          angle={state?.angle}
          bearing={pivotBearing(pivot, state?.angle)}
          size={72}
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Percentímetro
          </p>
          <p className="mt-1 text-base font-semibold">
            {formatPivotPercent(state?.percentimeter)}
          </p>
        </div>
        <Compass
          className={cn("h-6 w-6 shrink-0", meta.highlightIconClassName)}
        />
      </div>

      <footer className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {lastUpdate}
        </p>
        {canWrite ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Editar ${pivot.name}`}
              className="h-9 w-9 rounded-xl"
              onClick={() => onEdit(pivot)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${pivot.name}`}
              className="h-9 w-9 rounded-xl text-alert hover:text-alert"
              onClick={() => onDelete(pivot)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </footer>
    </article>
  );
};

const InfoTile = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) => (
  <div className="min-w-0 rounded-2xl bg-secondary/60 px-4 py-3">
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate text-[11px] uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p className="mt-1 truncate text-base font-semibold text-foreground">
      {value}
    </p>
  </div>
);
