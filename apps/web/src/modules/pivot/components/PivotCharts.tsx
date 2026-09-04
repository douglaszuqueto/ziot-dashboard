import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PivotSeriesPoint {
  time: string;
  pressure?: number | null;
  voltage?: number | null;
  angle?: number | null;
}

// Eixo temporal das últimas 24h sem valores: mantém eixos e legenda visíveis
// (como o gráfico vazio da estufa) até a API expor a série de telemetria.
export const buildEmptySeries24h = (now = new Date()): PivotSeriesPoint[] => {
  const end = new Date(now);
  end.setMinutes(0, 0, 0);

  return Array.from({ length: 25 }, (_, index) => {
    const date = new Date(end.getTime() - (24 - index) * 60 * 60 * 1000);
    return { time: date.toISOString() };
  });
};

// Sem dados o recharts não consegue derivar domínio; cai num intervalo
// padrão para os eixos continuarem legíveis.
export const axisDomain =
  (fallbackMax: number) =>
  ([, dataMax]: [number, number]): [number, number] =>
    Number.isFinite(dataMax) && dataMax > 0 ? [0, dataMax] : [0, fallbackMax];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 12,
    fontSize: 12,
    boxShadow: "var(--shadow-elevated)",
  },
};

const formatHour = (value: string) => value.slice(11, 16);

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const PivotCharts = ({ series }: { series: PivotSeriesPoint[] }) => (
  <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
    <ChartCard title="Pressão e tensão" subtitle="Últimas 24h">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <CartesianGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="time" tickFormatter={formatHour} {...axisProps} />
          <YAxis yAxisId="pressure" domain={axisDomain(10)} {...axisProps} />
          <YAxis
            yAxisId="voltage"
            orientation="right"
            domain={axisDomain(600)}
            {...axisProps}
          />
          <Tooltip {...tooltipStyle} labelFormatter={formatHour} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Line
            yAxisId="pressure"
            type="monotone"
            dataKey="pressure"
            name="Pressão (bar)"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="voltage"
            type="monotone"
            dataKey="voltage"
            name="Tensão (V)"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>

    <ChartCard title="Posição do pivô" subtitle="Ângulo nas últimas 24h">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <defs>
            <linearGradient id="pivot-angle" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="hsl(var(--border))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis dataKey="time" tickFormatter={formatHour} {...axisProps} />
          <YAxis
            domain={[0, 360]}
            ticks={[0, 90, 180, 270, 360]}
            {...axisProps}
          />
          <Tooltip {...tooltipStyle} labelFormatter={formatHour} />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
          <Area
            type="monotone"
            dataKey="angle"
            name="Ângulo (°)"
            stroke="hsl(var(--primary))"
            fill="url(#pivot-angle)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  </section>
);

const ChartCard = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
    <header className="mb-4">
      <h3 className="text-base font-semibold tracking-tight lg:text-lg">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground lg:text-sm">{subtitle}</p>
    </header>
    <div className="h-[260px] w-full lg:h-[300px]">{children}</div>
  </section>
);
