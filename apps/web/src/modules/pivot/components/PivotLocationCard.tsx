import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import {
  ARM_COLORS,
  MAP_COLORS,
  PivotMapWidget,
  pivotCenter,
} from "@/modules/pivot/components/PivotMapWidget";
import { zoomForRadius } from "@/modules/pivot/lib/pivot-geometry";
import {
  formatPivotAngle,
  pivotCaption,
} from "@/modules/pivot/lib/pivot-state";
import {
  pivotStatusMeta,
  resolvePivotStatus,
} from "@/modules/pivot/lib/pivot-status";
import type { Pivot, PivotState } from "@/modules/pivot/schemas/pivot.schemas";
import { env } from "@/shared/config/env";
import { formatCoordinates } from "@/shared/lib/format";

const MAP_HEIGHT = "h-[280px] lg:h-[320px]";

const LEGEND = [
  { label: "Água", color: ARM_COLORS.water },
  { label: "Seco", color: ARM_COLORS.dry },
  { label: "Parado", color: ARM_COLORS.stopped },
  { label: "Segurança", color: ARM_COLORS.security },
] as const;

// Cartão de localização: mapa satélite com o pivô desenhado em escala
// (campo, braço colorido pelo estado, torres e carreador — ver
// `PivotMapWidget`), coordenadas no cabeçalho, legenda das cores e a mesma
// legenda de estado da ilustração. Sem coordenadas ou sem chave do Google
// Maps, mostra um estado vazio dentro do cartão em vez de montar o provider.
export const PivotLocationCard = ({
  pivot,
  state,
  canWrite = false,
}: {
  pivot: Pivot;
  state?: PivotState;
  canWrite?: boolean;
}) => {
  const position = pivotCenter(pivot);
  const coordinates = formatCoordinates(position);
  const apiKey = env.VITE_GOOGLE_MAPS_API_KEY;
  const showMap = Boolean(position && apiKey);
  const meta = pivotStatusMeta(
    resolvePivotStatus(pivot.status, state?.running),
  );
  const caption = pivotCaption(meta.caption, state);
  const hasAngle =
    typeof state?.angle === "number" && Number.isFinite(state.angle);
  // O número continua sendo o ângulo do controlador; quando o zero está no
  // carreador, a legenda avisa.
  const angleCaption = hasAngle
    ? pivot.angle_reference === "road"
      ? `zero no carreador, ${formatPivotAngle(state?.angle)}`
      : formatPivotAngle(state?.angle)
    : null;

  return (
    <section className="rounded-3xl bg-card p-4 shadow-[var(--shadow-card)] lg:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            Localização
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {position ? coordinates : "Sem localização cadastrada"}
          </p>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-3xl border border-border bg-secondary/35 ${MAP_HEIGHT}`}
      >
        {!position ? (
          <MapEmptyState
            title="Sem localização cadastrada"
            description={
              canWrite
                ? 'Use "Editar" para informar latitude e longitude do pivô.'
                : "Informe latitude e longitude no cadastro do pivô."
            }
          />
        ) : !apiKey ? (
          <MapEmptyState
            title={coordinates}
            description={
              <>
                Configure <code>VITE_GOOGLE_MAPS_API_KEY</code> para exibir o
                mapa
              </>
            }
          />
        ) : (
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              // Remonta o mapa quando centro ou raio mudam no cadastro, já que
              // `defaultCenter`/`defaultZoom` só valem na montagem.
              key={`${position.lat},${position.lng},${pivot.radius_m ?? ""}`}
              mapId="DEMO_MAP_ID"
              defaultCenter={position}
              defaultZoom={zoomForRadius(pivot.radius_m)}
              mapTypeId="hybrid"
              gestureHandling="cooperative"
              disableDefaultUI
              zoomControl
              fullscreenControl={false}
              streetViewControl={false}
              style={{ width: "100%", height: "100%" }}
            >
              <PivotMapWidget pivot={pivot} state={state} />
            </GoogleMap>
            {pivot.radius_m === null ? (
              <p className="pointer-events-none absolute inset-x-3 bottom-3 rounded-2xl bg-card/90 px-3 py-2 text-center text-xs text-muted-foreground shadow-sm backdrop-blur">
                {canWrite
                  ? 'Use "Editar" para informar o raio irrigado e desenhar o pivô.'
                  : "Informe o raio irrigado no cadastro para desenhar o pivô."}
              </p>
            ) : null}
          </APIProvider>
        )}
      </div>

      {showMap ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {LEGEND.map((item) => (
              <LegendChip key={item.label} {...item} />
            ))}
            {pivot.road_angle !== null ? (
              <LegendChip label="Carreador" color={MAP_COLORS.road} outlined />
            ) : null}
          </ul>
          <p className="text-sm font-medium text-foreground">
            {caption}
            {angleCaption ? (
              <span className="font-normal text-muted-foreground">
                {" · "}
                {angleCaption}
              </span>
            ) : null}
          </p>
        </div>
      ) : null}
    </section>
  );
};

const LegendChip = ({
  label,
  color,
  outlined = false,
}: {
  label: string;
  color: string;
  outlined?: boolean;
}) => (
  <li className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
    <span
      aria-hidden
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: outlined ? "inset 0 0 0 1px rgba(0,0,0,0.35)" : undefined,
      }}
    />
    {label}
  </li>
);

const MapEmptyState = ({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <MapPin className="h-6 w-6" />
    </span>
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
