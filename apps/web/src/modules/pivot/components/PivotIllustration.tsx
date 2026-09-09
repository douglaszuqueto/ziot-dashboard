import { cn } from "@/lib/utils";

// Ilustração inline de um pivô central (vista de cima): campo circular, setor
// irrigado, braço radial com torres e ponto central. Mesmo estilo suave da
// ilustração de estufa da base original, sem depender de imagem.
export const PivotIllustration = ({
  className,
  angle = 40,
}: {
  className?: string;
  // Ângulo do braço em graus, convenção de bússola (0° = norte, sentido
  // horário) — a mesma do gauge do cartão. Só visual.
  angle?: number;
}) => {
  const cx = 120;
  const cy = 76;
  const radius = 58;
  const bearing = ((angle % 360) + 360) % 360;
  const rad = ((90 - bearing) * Math.PI) / 180;
  const tip = {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  };
  const sectorStart = { x: cx, y: cy - radius };
  const largeArc = bearing > 180 ? 1 : 0;
  const towers = [0.33, 0.66, 0.98].map((t) => ({
    x: cx + radius * t * Math.cos(rad),
    y: cy - radius * t * Math.sin(rad),
  }));
  const drops = [0.18, 0.5, 0.82].map((t) => ({
    x: cx + radius * t * Math.cos(rad),
    y: cy - radius * t * Math.sin(rad),
  }));

  return (
    <svg
      viewBox="0 0 240 150"
      role="img"
      aria-labelledby="pivot-illustration-title"
      className={cn("h-auto w-full", className)}
    >
      <title id="pivot-illustration-title">Ilustração de um pivô central</title>

      {/* sombra do solo */}
      <ellipse
        cx={cx}
        cy={cy + radius + 4}
        rx={radius + 14}
        ry={6}
        className="fill-primary/10"
      />

      {/* campo circular */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 6}
        className="fill-status/5 stroke-primary/25"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        className="fill-status/10 stroke-primary/40"
        strokeWidth={1.5}
      />

      {/* faixas concêntricas da cultura */}
      {[0.35, 0.6, 0.82].map((t) => (
        <circle
          key={t}
          cx={cx}
          cy={cy}
          r={radius * t}
          className="fill-none stroke-primary/20"
          strokeWidth={1}
        />
      ))}

      {/* setor já irrigado (do norte até o braço, sentido horário) */}
      <path
        d={`M ${cx} ${cy} L ${sectorStart.x} ${sectorStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${tip.x} ${tip.y} Z`}
        className="fill-primary/20"
      />

      {/* jatos de água ao longo do braço */}
      {drops.map((drop) => (
        <circle
          key={`${drop.x}-${drop.y}`}
          cx={drop.x}
          cy={drop.y + 7}
          r={3}
          className="fill-primary/30"
        />
      ))}

      {/* braço radial */}
      <line
        x1={cx}
        y1={cy}
        x2={tip.x}
        y2={tip.y}
        className="stroke-primary"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* torres com rodas */}
      {towers.map((tower) => (
        <g key={`${tower.x}-${tower.y}`}>
          <line
            x1={tower.x}
            y1={tower.y}
            x2={tower.x}
            y2={tower.y + 9}
            className="stroke-primary"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle
            cx={tower.x - 3}
            cy={tower.y + 10}
            r={2.4}
            className="fill-card stroke-primary"
            strokeWidth={1.5}
          />
          <circle
            cx={tower.x + 3}
            cy={tower.y + 10}
            r={2.4}
            className="fill-card stroke-primary"
            strokeWidth={1.5}
          />
        </g>
      ))}

      {/* ponto central do pivô */}
      <circle
        cx={cx}
        cy={cy}
        r={7}
        className="fill-card stroke-primary"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={3} className="fill-primary" />
    </svg>
  );
};
