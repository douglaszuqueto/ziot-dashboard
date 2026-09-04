import { useId } from "react";
import { cn } from "@/lib/utils";
import { formatPivotAngle } from "@/modules/pivot/lib/pivot-state";

const TICKS = [0, 90, 180, 270];

const toPoint = (bearing: number, radius: number) => {
  const rad = ((90 - bearing) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 - radius * Math.sin(rad) };
};

// Gauge circular do app legado: círculo com a agulha no ângulo do pivô
// (bússola: 0° = norte, sentido horário). Sem ângulo, mostra só o mostrador
// e "—°".
export const PivotAngleGauge = ({
  angle,
  size = 80,
  className,
}: {
  angle?: number | null;
  size?: number;
  className?: string;
}) => {
  const titleId = useId();
  const hasAngle = typeof angle === "number" && Number.isFinite(angle);
  const label = formatPivotAngle(angle);
  const tip = hasAngle ? toPoint(angle, 32) : null;

  return (
    <div className={cn("flex shrink-0 flex-col items-center gap-1", className)}>
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        role="img"
        aria-labelledby={titleId}
      >
        <title id={titleId}>Ângulo do pivô: {label}</title>
        <circle
          cx={50}
          cy={50}
          r={44}
          className="fill-status/10 stroke-primary/30"
          strokeWidth={2}
        />
        <circle
          cx={50}
          cy={50}
          r={34}
          className="fill-none stroke-primary/15"
          strokeWidth={1}
          strokeDasharray="2 4"
        />
        {TICKS.map((tick) => {
          const outer = toPoint(tick, 44);
          const inner = toPoint(tick, 38);
          return (
            <line
              key={tick}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              className="stroke-primary/50"
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
        {tip ? (
          <>
            <line
              x1={50}
              y1={50}
              x2={tip.x}
              y2={tip.y}
              className="stroke-primary"
              strokeWidth={3.5}
              strokeLinecap="round"
            />
            <circle cx={tip.x} cy={tip.y} r={3.5} className="fill-primary" />
          </>
        ) : null}
        <circle
          cx={50}
          cy={50}
          r={5}
          className="fill-card stroke-primary"
          strokeWidth={2}
        />
      </svg>
      <span className="text-sm font-semibold leading-none text-foreground">
        {label}
      </span>
    </div>
  );
};
