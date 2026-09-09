import { cn } from "@/lib/utils";
import { normalizeAngle, sweepSpan } from "@/modules/pivot/lib/pivot-geometry";

// Desenho estilizado do pivô visto de cima (o mesmo da ilustração do card,
// pedido pelo Douglas para ir sobre o mapa): anel externo tracejado, campo
// circular com faixas concêntricas, setor irrigado do início do giro até o
// braço, braço com torres de rodinhas, gotas no modo água e o ponto central.
// É SVG puro num viewBox quadrado alinhado ao norte (0° = cima, horário), então
// serve tanto no card quanto como camada geográfica do mapa (ver
// `PivotFieldOverlay`), onde o quadrado é ancorado aos limites reais do campo.

export const FIELD_SIZE = 200;
export const FIELD_CENTER = FIELD_SIZE / 2;
// Raio do campo dentro do viewBox; o resto é margem para o anel tracejado e
// as rodinhas da última torre.
export const FIELD_RADIUS = 84;
// Meia-largura do desenho medida em raios do campo: é o que o overlay usa para
// converter `radius_m` nos limites geográficos do quadrado.
export const FIELD_EXTENT_FACTOR = FIELD_CENTER / FIELD_RADIUS;

const RING_FRACTIONS = [0.35, 0.6, 0.82] as const;
const DEFAULT_SPANS = 3;
const TOWER_DROP = 9;
const WHEEL_OFFSET = 3;
const WHEEL_RADIUS = 2.4;
const DROP_OFFSET = 7;

export interface FieldPalette {
  field: string;
  fieldStroke: string;
  outside: string;
  ring: string;
  irrigated: string;
  road: string;
  centerFill: string;
  centerStroke: string;
}

// Card: tokens do tema (os mesmos da ilustração original). Mapa: cores fixas
// que contrastam com a imagem de satélite (não seguem o tema de propósito).
export const CARD_FIELD_PALETTE: FieldPalette = {
  field: "hsl(var(--status) / 0.1)",
  fieldStroke: "hsl(var(--primary) / 0.4)",
  outside: "hsl(var(--foreground) / 0.06)",
  ring: "hsl(var(--primary) / 0.2)",
  irrigated: "hsl(var(--primary) / 0.2)",
  road: "hsl(var(--muted-foreground) / 0.6)",
  centerFill: "hsl(var(--card))",
  centerStroke: "hsl(var(--primary))",
};

export const MAP_FIELD_PALETTE: FieldPalette = {
  field: "rgba(0, 107, 179, 0.18)",
  fieldStroke: "rgba(255, 255, 255, 0.85)",
  outside: "rgba(11, 18, 32, 0.35)",
  ring: "rgba(255, 255, 255, 0.45)",
  irrigated: "rgba(2, 132, 199, 0.35)",
  road: "rgba(229, 231, 235, 0.95)",
  centerFill: "#ffffff",
  centerStroke: "#006bb3",
};

// Ponto no viewBox a `radius` do centro na direção `bearing` (azimute).
export const fieldPoint = (bearing: number, radius: number) => {
  const rad = (bearing * Math.PI) / 180;
  return {
    x: FIELD_CENTER + radius * Math.sin(rad),
    y: FIELD_CENTER - radius * Math.cos(rad),
  };
};

// Fatia do centro até o arco de `start` a `end` (horário). Devolve `null`
// quando não há abertura; giro completo vira o círculo inteiro (dois arcos).
export const fieldSectorPath = (
  start: number,
  end: number,
  radius: number,
): string | null => {
  const span = sweepSpan(start, end);
  if (span <= 0) return null;
  if (span >= 360) {
    const top = fieldPoint(0, radius);
    const bottom = fieldPoint(180, radius);
    return `M ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const from = fieldPoint(start, radius);
  const to = fieldPoint(normalizeAngle(start + span), radius);
  const largeArc = span > 180 ? 1 : 0;
  return `M ${FIELD_CENTER} ${FIELD_CENTER} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
};

export interface PivotFieldDrawingProps {
  // Azimute do braço; sem ele o campo é desenhado sem braço.
  bearing: number | null;
  spans?: number | null;
  // Cor do braço, torres e gotas (estado do pivô).
  armColor: string;
  // Gotas ao longo do braço (modo água).
  drops?: boolean;
  // Setor irrigado dos pivôs "meia-lua"; nulo = giro completo.
  sweep?: { start: number; end: number } | null;
  roadAngle?: number | null;
  palette?: FieldPalette;
  // Sombra do solo por baixo (só faz sentido no card).
  shadow?: boolean;
  title: string;
  titleId: string;
  className?: string;
}

export const PivotFieldDrawing = ({
  bearing,
  spans,
  armColor,
  drops = false,
  sweep = null,
  roadAngle = null,
  palette = CARD_FIELD_PALETTE,
  shadow = false,
  title,
  titleId,
  className,
}: PivotFieldDrawingProps) => {
  const c = FIELD_CENTER;
  const r = FIELD_RADIUS;
  const towerCount = Math.max(1, Math.floor(spans ?? DEFAULT_SPANS));
  const hasBearing = bearing !== null && Number.isFinite(bearing);
  const tip = hasBearing ? fieldPoint(bearing, r) : null;
  const sweepStart = sweep ? sweep.start : 0;
  const irrigatedPath =
    hasBearing && tip ? fieldSectorPath(sweepStart, bearing, r) : null;
  const sectorPath = sweep ? fieldSectorPath(sweep.start, sweep.end, r) : null;
  const roadEdge = roadAngle !== null ? fieldPoint(roadAngle, r + 6) : null;
  const armBearing = hasBearing ? bearing : 0;
  const towers = tip
    ? Array.from({ length: towerCount }, (_, index) =>
        fieldPoint(armBearing, (r * (index + 1)) / towerCount),
      )
    : [];
  const dropPoints =
    tip && drops
      ? Array.from({ length: towerCount }, (_, index) =>
          fieldPoint(armBearing, (r * (index + 0.5)) / towerCount),
        )
      : [];

  return (
    <svg
      viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
      role="img"
      aria-labelledby={titleId}
      className={cn("block h-auto w-full", className)}
    >
      <title id={titleId}>{title}</title>

      {shadow ? (
        <ellipse
          cx={c}
          cy={c + r + 6}
          rx={r + 14}
          ry={6}
          fill="hsl(var(--primary) / 0.1)"
        />
      ) : null}

      {/* anel externo tracejado */}
      <circle
        cx={c}
        cy={c}
        r={r + 6}
        fill="none"
        stroke={palette.fieldStroke}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.7}
      />

      {/* campo: círculo inteiro, ou fundo apagado + setor nos "meia-lua" */}
      {sectorPath ? (
        <>
          <circle
            cx={c}
            cy={c}
            r={r}
            fill={palette.outside}
            stroke={palette.fieldStroke}
            strokeWidth={1}
            data-testid="field-outside"
          />
          <path
            d={sectorPath}
            fill={palette.field}
            stroke={palette.fieldStroke}
            strokeWidth={1.5}
            data-testid="field-sector"
          />
        </>
      ) : (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill={palette.field}
          stroke={palette.fieldStroke}
          strokeWidth={1.5}
          data-testid="field-circle"
        />
      )}

      {/* faixas concêntricas da cultura */}
      {RING_FRACTIONS.map((fraction) => (
        <circle
          key={fraction}
          cx={c}
          cy={c}
          r={r * fraction}
          fill="none"
          stroke={palette.ring}
          strokeWidth={1}
        />
      ))}

      {/* setor já varrido (do início do giro até o braço, sentido horário) */}
      {irrigatedPath ? (
        <path
          d={irrigatedPath}
          fill={palette.irrigated}
          data-testid="field-irrigated"
        />
      ) : null}

      {/* carreador */}
      {roadEdge ? (
        <line
          x1={c}
          y1={c}
          x2={roadEdge.x}
          y2={roadEdge.y}
          stroke={palette.road}
          strokeWidth={2.5}
          strokeLinecap="round"
          data-testid="field-road"
        />
      ) : null}

      {/* gotas ao longo do braço */}
      {dropPoints.map((drop) => (
        <circle
          key={`${drop.x},${drop.y}`}
          cx={drop.x}
          cy={drop.y + DROP_OFFSET}
          r={3}
          fill={armColor}
          opacity={0.35}
          data-testid="field-drop"
        />
      ))}

      {/* braço radial */}
      {tip ? (
        <line
          x1={c}
          y1={c}
          x2={tip.x}
          y2={tip.y}
          stroke={armColor}
          strokeWidth={3}
          strokeLinecap="round"
          data-testid="field-arm"
        />
      ) : null}

      {/* torres com rodas */}
      {towers.map((tower) => (
        <g key={`${tower.x},${tower.y}`} data-testid="field-tower">
          <line
            x1={tower.x}
            y1={tower.y}
            x2={tower.x}
            y2={tower.y + TOWER_DROP}
            stroke={armColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle
            cx={tower.x - WHEEL_OFFSET}
            cy={tower.y + TOWER_DROP + 1}
            r={WHEEL_RADIUS}
            fill={palette.centerFill}
            stroke={armColor}
            strokeWidth={1.5}
          />
          <circle
            cx={tower.x + WHEEL_OFFSET}
            cy={tower.y + TOWER_DROP + 1}
            r={WHEEL_RADIUS}
            fill={palette.centerFill}
            stroke={armColor}
            strokeWidth={1.5}
          />
        </g>
      ))}

      {/* ponto central do pivô */}
      <circle
        cx={c}
        cy={c}
        r={7}
        fill={palette.centerFill}
        stroke={palette.centerStroke}
        strokeWidth={2}
      />
      <circle cx={c} cy={c} r={3} fill={palette.centerStroke} />
    </svg>
  );
};
