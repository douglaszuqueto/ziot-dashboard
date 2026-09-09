import {
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin, RadioTower } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import {
  destinationPoint,
  type LatLng,
  pivotBearing,
  sectorPath,
  towerPoints,
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
  // Parte não irrigada do círculo nos pivôs "meia-lua".
  fieldOutside: "#0b1220",
} as const;

export const ARM_COLORS: Record<PivotArmStatus, string> = {
  water: MAP_COLORS.water,
  dry: MAP_COLORS.dry,
  stopped: MAP_COLORS.stopped,
  security: MAP_COLORS.security,
};

const NO_CLICK = { clickable: false } as const;

type MapsLibrary = google.maps.MapsLibrary;

interface OverlayLike<Options> {
  setMap(map: google.maps.Map | null): void;
  setOptions(options: Options): void;
}

// Overlay imperativo do Google Maps ligado ao ciclo de vida do React: cria
// uma vez, aplica novas opções quando mudam, esconde com `options === null`
// e remove do mapa ao desmontar. `create` deve ser estável (memoizado por
// `maps`), e `options` memoizado pelo chamador.
const useOverlay = <
  Options extends object,
  Overlay extends OverlayLike<Options>,
>(
  map: google.maps.Map | null,
  create: ((options: Options) => Overlay) | null,
  options: Options | null,
) => {
  const overlayRef = useRef<Overlay | null>(null);

  useEffect(() => {
    if (!map || !create || !options) {
      overlayRef.current?.setMap(null);
      return;
    }
    if (!overlayRef.current) {
      overlayRef.current = create(options);
    } else {
      overlayRef.current.setOptions(options);
    }
    overlayRef.current.setMap(map);
  }, [map, create, options]);

  useEffect(
    () => () => {
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
    },
    [],
  );
};

const useCircleFactory = (maps: MapsLibrary | null) =>
  useMemo(
    () =>
      maps
        ? (options: google.maps.CircleOptions) => new maps.Circle(options)
        : null,
    [maps],
  );

const usePolygonFactory = (maps: MapsLibrary | null) =>
  useMemo(
    () =>
      maps
        ? (options: google.maps.PolygonOptions) => new maps.Polygon(options)
        : null,
    [maps],
  );

const usePolylineFactory = (maps: MapsLibrary | null) =>
  useMemo(
    () =>
      maps
        ? (options: google.maps.PolylineOptions) => new maps.Polyline(options)
        : null,
    [maps],
  );

export const pivotCenter = (
  pivot: Pick<Pivot, "latitude" | "longitude">,
): LatLng | null =>
  pivot.latitude !== null && pivot.longitude !== null
    ? { lat: pivot.latitude, lng: pivot.longitude }
    : null;

// Camadas do pivô dentro do `<Map>` do cartão de localização: campo (círculo
// ou setor), braço colorido pelo estado com as torres, carreador e o
// marcador central. Sem `radius_m` só o centro é desenhado; sem ângulo na
// telemetria, campo e carreador ficam sem o braço. Em testes (`useMap()` e
// `useMapsLibrary()` nulos) os overlays imperativos não são criados.
export const PivotMapWidget = ({
  pivot,
  state,
}: {
  pivot: Pivot;
  state?: PivotState;
}) => {
  const map = useMap();
  const maps = useMapsLibrary("maps");
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
  const armColor = ARM_COLORS[pivotArmStatus(state)];

  // Valores memoizados por coordenada para que os `useEffect` dos overlays
  // só rodem quando algo realmente mudou.
  const center = useMemo<LatLng | null>(
    () =>
      latitude !== null && longitude !== null
        ? { lat: latitude, lng: longitude }
        : null,
    [latitude, longitude],
  );

  // Campo: círculo cheio no giro completo; nos pivôs "meia-lua" o círculo
  // vira o fundo escurecido e o setor irrigado é um polígono por cima.
  const circleOptions = useMemo<google.maps.CircleOptions | null>(() => {
    if (!center || radius === null) return null;
    const hasSweep = sweepStart !== null && sweepEnd !== null;
    return hasSweep
      ? {
          ...NO_CLICK,
          center,
          radius,
          fillColor: MAP_COLORS.fieldOutside,
          fillOpacity: 0.3,
          strokeColor: MAP_COLORS.field,
          strokeOpacity: 0.55,
          strokeWeight: 1.5,
          zIndex: 1,
        }
      : {
          ...NO_CLICK,
          center,
          radius,
          fillColor: MAP_COLORS.field,
          fillOpacity: 0.22,
          strokeColor: MAP_COLORS.field,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          zIndex: 1,
        };
  }, [center, radius, sweepStart, sweepEnd]);

  const sectorOptions = useMemo<google.maps.PolygonOptions | null>(() => {
    if (
      !center ||
      radius === null ||
      sweepStart === null ||
      sweepEnd === null
    ) {
      return null;
    }
    return {
      ...NO_CLICK,
      paths: sectorPath(center, radius, sweepStart, sweepEnd),
      fillColor: MAP_COLORS.field,
      fillOpacity: 0.28,
      strokeColor: MAP_COLORS.field,
      strokeOpacity: 0.9,
      strokeWeight: 2,
      zIndex: 2,
    };
  }, [center, radius, sweepStart, sweepEnd]);

  const armOptions = useMemo<google.maps.PolylineOptions | null>(() => {
    if (!center || radius === null || bearing === null) return null;
    return {
      ...NO_CLICK,
      path: [center, destinationPoint(center, radius, bearing)],
      strokeColor: armColor,
      strokeOpacity: 1,
      strokeWeight: 4,
      zIndex: 4,
    };
  }, [center, radius, bearing, armColor]);

  const roadEdge = useMemo(
    () =>
      center && radius !== null && roadAngle !== null
        ? destinationPoint(center, radius, roadAngle)
        : null,
    [center, radius, roadAngle],
  );

  const roadOptions = useMemo<google.maps.PolylineOptions | null>(() => {
    if (!center || !roadEdge) return null;
    return {
      ...NO_CLICK,
      path: [center, roadEdge],
      strokeColor: MAP_COLORS.road,
      strokeOpacity: 0.95,
      strokeWeight: 3,
      zIndex: 3,
    };
  }, [center, roadEdge]);

  const towers = useMemo(
    () =>
      center && radius !== null && bearing !== null && spans !== null
        ? towerPoints(center, radius, bearing, spans)
        : [],
    [center, radius, bearing, spans],
  );

  useOverlay(map, useCircleFactory(maps), circleOptions);
  useOverlay(map, usePolygonFactory(maps), sectorOptions);
  useOverlay(map, usePolylineFactory(maps), roadOptions);
  useOverlay(map, usePolylineFactory(maps), armOptions);

  if (!center) return null;

  const roadPoint =
    roadLatitude !== null && roadLongitude !== null
      ? { lat: roadLatitude, lng: roadLongitude }
      : null;

  return (
    <>
      {towers.map((tower, index) => (
        <AdvancedMarker
          key={`${tower.lat},${tower.lng}`}
          position={tower}
          title={`Torre ${index + 1}`}
          zIndex={5}
        >
          <span
            data-testid="map-tower"
            className="block h-2.5 w-2.5 rounded-full border-2 border-white shadow"
            style={{ backgroundColor: armColor }}
          />
        </AdvancedMarker>
      ))}

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

      <AdvancedMarker position={center} title={pivot.name} zIndex={6}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
          <RadioTower className="h-4 w-4" />
        </span>
      </AdvancedMarker>
    </>
  );
};
