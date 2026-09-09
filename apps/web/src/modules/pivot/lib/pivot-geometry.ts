import type { Pivot } from "@/modules/pivot/schemas/pivot.schemas";

// Geometria pura do pivô sobre o mapa (sem dependência do Google Maps).
// Convenção de ângulos em todo o app: azimute geográfico, 0° = norte,
// sentido horário. Distâncias em metros; coordenadas em graus decimais.

export interface LatLng {
  lat: number;
  lng: number;
}

// Raio médio da Terra (m) — modelo esférico, suficiente para os poucos
// quilômetros de um pivô.
const EARTH_RADIUS_M = 6371008.8;

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

// Normaliza para [0, 360): -10 → 350, 370 → 10, 360 → 0.
export const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360;

// Azimute do braço a partir do ângulo reportado pelo controlador. Quando a
// referência do cadastro é o carreador, o zero do controlador está em
// `road_angle`; caso contrário o ângulo já é um azimute. `null` sem ângulo.
export const pivotBearing = (
  pivot: Pick<Pivot, "angle_reference" | "road_angle">,
  angle: number | null | undefined,
): number | null => {
  if (typeof angle !== "number" || !Number.isFinite(angle)) return null;
  if (pivot.angle_reference === "road" && pivot.road_angle !== null) {
    return normalizeAngle(pivot.road_angle + angle);
  }
  return normalizeAngle(angle);
};

// Abertura do setor, em graus, indo de `start` a `end` no sentido horário
// (0..360). Ângulos iguais depois de normalizados contam como giro completo
// quando os valores brutos diferem (ex.: 0 → 360) e como 0 quando são o mesmo
// valor.
export const sweepSpan = (start: number, end: number) => {
  const span = normalizeAngle(end - start);
  if (span === 0) return start === end ? 0 : 360;
  return span;
};

// `bearing` está dentro do setor horário de `start` a `end`?
export const isWithinSweep = (bearing: number, start: number, end: number) =>
  normalizeAngle(bearing - start) <= sweepSpan(start, end);

// Ponto a `distanceM` metros de `origin` na direção `bearingDeg` (fórmula
// direta sobre a esfera).
export const destinationPoint = (
  origin: LatLng,
  distanceM: number,
  bearingDeg: number,
): LatLng => {
  const delta = distanceM / EARTH_RADIUS_M;
  const theta = toRadians(bearingDeg);
  const phi1 = toRadians(origin.lat);
  const lambda1 = toRadians(origin.lng);

  const sinPhi2 =
    Math.sin(phi1) * Math.cos(delta) +
    Math.cos(phi1) * Math.sin(delta) * Math.cos(theta);
  const phi2 = Math.asin(sinPhi2);
  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(delta) * Math.cos(phi1),
      Math.cos(delta) - Math.sin(phi1) * sinPhi2,
    );

  return {
    lat: toDegrees(phi2),
    // Longitude normalizada para [-180, 180).
    lng: ((toDegrees(lambda2) + 540) % 360) - 180,
  };
};

// Pontos do arco de `startBearing` a `endBearing` (sentido horário), a cada
// `stepDeg`, incluindo os dois extremos.
const arcPoints = (
  center: LatLng,
  radiusM: number,
  startBearing: number,
  span: number,
  stepDeg: number,
) => {
  const step = Math.max(0.1, stepDeg);
  const points: LatLng[] = [];
  for (let offset = 0; offset < span; offset += step) {
    points.push(destinationPoint(center, radiusM, startBearing + offset));
  }
  points.push(destinationPoint(center, radiusM, startBearing + span));
  return points;
};

// Anel completo do campo, fechado (primeiro ponto repetido no fim).
export const circlePath = (center: LatLng, radiusM: number, stepDeg = 3) =>
  arcPoints(center, radiusM, 0, 360, stepDeg);

// Polígono fechado do setor irrigado: centro → arco → centro. Para giro
// completo devolve o anel inteiro.
export const sectorPath = (
  center: LatLng,
  radiusM: number,
  startBearing: number,
  endBearing: number,
  stepDeg = 3,
): LatLng[] => {
  const span = sweepSpan(startBearing, endBearing);
  if (span >= 360) return circlePath(center, radiusM, stepDeg);
  return [
    center,
    ...arcPoints(center, radiusM, startBearing, span, stepDeg),
    center,
  ];
};

// Braço: do centro até a ponta na direção `bearing`.
export const armPath = (
  center: LatLng,
  radiusM: number,
  bearing: number,
): [LatLng, LatLng] => [center, destinationPoint(center, radiusM, bearing)];

// Torres igualmente espaçadas ao longo do braço; a última fica na ponta.
export const towerPoints = (
  center: LatLng,
  radiusM: number,
  bearing: number,
  spans: number,
): LatLng[] => {
  const count = Math.floor(spans);
  if (!Number.isFinite(count) || count <= 0) return [];
  return Array.from({ length: count }, (_, index) =>
    destinationPoint(center, (radiusM * (index + 1)) / count, bearing),
  );
};

// Zoom padrão para o círculo caber num mapa de ~300 px de altura. Resolução
// no equador: 156 543 m/px no zoom 0, caindo pela metade a cada nível; o
// diâmetro ocupa ~240 px. Sem raio, o zoom padrão do cartão (15).
export const DEFAULT_MAP_ZOOM = 15;

export const zoomForRadius = (radiusM: number | null | undefined) => {
  if (typeof radiusM !== "number" || !(radiusM > 0)) return DEFAULT_MAP_ZOOM;
  const zoom = Math.floor(Math.log2((156543.03 * 120) / radiusM));
  return Math.min(20, Math.max(3, zoom));
};
