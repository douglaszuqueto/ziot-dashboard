import type { LucideIcon } from "lucide-react";

// Tile de métrica do detalhe (ícone em quadrado claro + rótulo + valor + unidade),
// compartilhado pelo resumo em três colunas e pelo cartão de localização.
export const PivotMetricTile = ({
  icon: Icon,
  label,
  value,
  unit,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  // Linha discreta abaixo do valor (ex.: "ref. 3,5 bar").
  caption?: string;
}) => (
  <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-3 py-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 flex items-baseline gap-1 truncate text-lg font-semibold leading-none">
        {value}
        {unit ? (
          <span className="text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {caption ? (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {caption}
        </p>
      ) : null}
    </div>
  </div>
);
