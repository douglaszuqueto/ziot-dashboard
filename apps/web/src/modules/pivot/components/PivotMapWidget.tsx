import {
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { useId, useMemo } from "react";
import {
  MAP_FIELD_PALETTE,
  PivotFieldDrawing,
} from "@/modules/pivot/components/PivotFieldDrawing";
import { PivotFieldOverlay } from "@/modules/pivot/components/PivotFieldOverlay";
import {
  destinationPoint,
  type LatLng,
  pivotBearing,
} from "@/modules/pivot/lib/pivot-geometry";
import {
  type PivotArmStatus,
  pivotArmStatus,
} from "@/modules/pivot/lib/pivot-state";
import type { Pivot, PivotState } from "@/modules/pivot/schemas/pivot.schemas";

// Cores fixas (hex) das camadas do mapa. Elas ficam sobre a imagem de
// satélite, não sobre o tema do app, então não seguem os tokens do CSS —
// precisam contrastar com verde/marrom de lavoura em qualquer tema.
export const MAP_COLORS = {
  water: "#0284c7",
  dry: "#d97706",
  stopped: "#6b7280",
  security: "#dc2626",
  road: "#e5e7eb",
  // Azul primário da marca com opacidade baixa para o campo irrigado.
  field: "#006bb3",
} as const;

export const ARM_COLORS: Record<PivotArmStatus, string> = {
  water: MAP_COLORS.water,
  dry: MAP_COLORS.dry,
  stopped: MAP_COLORS.stopped,
  security: MAP_COLORS.security,
};

export const pivotCenter = (
  pivot: Pick<Pivot, "latitude" | "longitude">,
): LatLng | null =>
  pivot.latitude !== null && pivot.longitude !== null
    ? { lat: pivot.latitude, lng: pivot.longitude }
    : null;

// Pivô desenhado sobre o mapa: o mesmo desenho estilizado da ilustração
// (`PivotFieldDrawing`) ancorado aos limites reais do campo por
// `PivotFieldOverlay`, mais os marcadores do carreador. Sem `radius_m` só o
// centro é marcado; sem ângulo na telemetria, campo e carreador ficam sem o
// braço. Em testes (`useMap()` e `useMapsLibrary()` nulos) a camada
// geográfica não é criada.
export const PivotMapWidget = ({
  pivot,
  state,
}: {
  pivot: Pivot;
  state?: PivotState;
}) => {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const titleId = useId();
  const {
    latitude,
    longitude,
    radius_m: radius,
    spans,
    road_angle: roadAngle,
    road_latitude: roadLatitude,
    road_longitude: roadLongitude,
    sweep_start_angle: sweepStart,
    sweep_end_angle: sweepEnd,
  } = pivot;
  const bearing = pivotBearing(pivot, state?.angle);
  const status = pivotArmStatus(state);
  const armColor = ARM_COLORS[status];

  // Memoizado por coordenada para o overlay só ser recriado quando o centro
  // realmente muda.
  const center = useMemo<LatLng | null>(
    () =>
      latitude !== null && longitude !== null
        ? { lat: latitude, lng: longitude }
        : null,
    [latitude, longitude],
  );

  const sweep = useMemo(
    () =>
      sweepStart !== null && sweepEnd !== null
        ? { start: sweepStart, end: sweepEnd }
        : null,
    [sweepStart, sweepEnd],
  );

  const roadEdge = useMemo(
    () =>
      center && radius !== null && roadAngle !== null
        ? destinationPoint(center, radius, roadAngle)
        : null,
    [center, radius, roadAngle],
  );

  if (!center) return null;

  const roadPoint =
    roadLatitude !== null && roadLongitude !== null
      ? { lat: roadLatitude, lng: roadLongitude }
      : null;

  return (
    <>
      {radius !== null && map && maps ? (
        <PivotFieldOverlay
          map={map}
          maps={maps}
          center={center}
          radiusM={radius}
        >
          <PivotFieldDrawing
            bearing={bearing}
            spans={spans}
            armColor={armColor}
            drops={status === "water"}
            sweep={sweep}
            roadAngle={roadAngle}
            palette={MAP_FIELD_PALETTE}
            title={`${pivot.name} no mapa`}
            titleId={titleId}
            className="h-full w-full"
          />
        </PivotFieldOverlay>
      ) : null}

      {radius === null ? (
        <AdvancedMarker position={center} title={pivot.name} zIndex={6}>
          <span
            data-testid="map-center"
            className="block h-4 w-4 rounded-full border-2 border-white bg-primary shadow"
          />
        </AdvancedMarker>
      ) : null}

      {roadEdge ? (
        <AdvancedMarker position={roadEdge} title="Carreador" zIndex={4}>
          <span
            data-testid="map-road-label"
            className="rounded-full border border-white/60 bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow"
          >
            Carreador
          </span>
        </AdvancedMarker>
      ) : null}

      {roadPoint ? (
        <AdvancedMarker
          position={roadPoint}
          title="Ponto de referência do carreador"
          zIndex={4}
        >
          <span
            data-testid="map-road-pin"
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-black/60 text-white shadow"
          >
            <MapPin className="h-3.5 w-3.5" />
          </span>
        </AdvancedMarker>
      ) : null}
    </>
  );
};
