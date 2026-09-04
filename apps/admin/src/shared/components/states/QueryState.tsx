import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type SectionLoadingVariant =
  | "dashboard"
  | "table"
  | "report"
  | "generic";
export type TableLoadingControls =
  | "search-action"
  | "filter-action"
  | "search-filter-action";

const loadingRows = (length: number, prefix: string) =>
  Array.from({ length }, (_, index) => `${prefix}-${index + 1}`);

const DashboardLoading = () => (
  <div className="space-y-5">
    <div className="rounded-2xl bg-frame p-5 shadow-[var(--shadow-elevated)] lg:p-7">
      <Skeleton className="h-8 w-56 rounded-full bg-white/15" />
      <Skeleton className="mt-3 h-4 w-full max-w-xl rounded-full bg-white/10" />
      <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:max-w-[520px]">
        {loadingRows(3, "dashboard-filter").map((key) => (
          <Skeleton key={key} className="h-10 rounded-xl bg-white/10" />
        ))}
      </div>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      {loadingRows(6, "dashboard-metric").map((key) => (
        <Skeleton key={key} className="h-28 rounded-xl" />
      ))}
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {loadingRows(5, "dashboard-health").map((key) => (
        <Skeleton key={key} className="h-24 rounded-xl" />
      ))}
    </div>

    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Skeleton className="h-[410px] rounded-2xl" />
      <Skeleton className="h-[410px] rounded-2xl" />
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      {loadingRows(3, "dashboard-status").map((key) => (
        <Skeleton key={key} className="h-[300px] rounded-2xl" />
      ))}
    </div>
  </div>
);

const TableControlsLoading = ({
  controls,
}: {
  controls: TableLoadingControls;
}) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    {controls !== "filter-action" ? (
      <Skeleton className="h-10 w-full rounded-xl lg:w-80" />
    ) : null}
    {controls !== "search-action" ? (
      <Skeleton className="h-10 w-full rounded-xl lg:w-48" />
    ) : null}
    <Skeleton className="h-10 w-full rounded-xl lg:ml-auto lg:w-36" />
  </div>
);

const TableLoading = ({
  controls = "search-filter-action",
}: {
  controls?: TableLoadingControls;
}) => (
  <div className="space-y-5">
    <TableControlsLoading controls={controls} />

    <div className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b bg-muted/60 px-4 py-3">
        <div className="grid min-w-[900px] grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_96px] gap-4">
          {loadingRows(6, "table-heading").map((key) => (
            <Skeleton key={key} className="h-4 rounded-full" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {loadingRows(7, "table-row").map((key) => (
          <div
            key={key}
            className="grid min-w-[900px] grid-cols-[1.4fr_1fr_0.8fr_0.8fr_0.8fr_96px] gap-4 px-4 py-3"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-full" />
              <Skeleton className="h-3 w-1/2 rounded-full" />
            </div>
            <Skeleton className="h-4 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 rounded-full" />
            <Skeleton className="h-4 rounded-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ReportLoading = () => (
  <div className="space-y-5">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {loadingRows(5, "report-summary").map((key) => (
        <Skeleton key={key} className="h-24 rounded-xl" />
      ))}
    </div>
    <div className="grid gap-3 lg:grid-cols-4">
      {loadingRows(4, "report-filter").map((key) => (
        <Skeleton key={key} className="h-16 rounded-xl" />
      ))}
    </div>
    <TableLoading controls="search-filter-action" />
  </div>
);

const GenericLoading = ({ lines }: { lines: number }) => (
  <div className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
    <div className="space-y-3">
      <Skeleton className="h-6 w-40 rounded-full" />
      {loadingRows(lines, `loading-line-${lines}`).map((key) => (
        <Skeleton key={key} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
  </div>
);

export const SectionLoading = ({
  lines = 4,
  variant = "generic",
  screen = false,
  tableControls = "search-filter-action",
}: {
  lines?: number;
  variant?: SectionLoadingVariant;
  screen?: boolean;
  tableControls?: TableLoadingControls;
}) => {
  const content =
    variant === "dashboard" ? (
      <DashboardLoading />
    ) : variant === "table" ? (
      <TableLoading controls={tableControls} />
    ) : variant === "report" ? (
      <ReportLoading />
    ) : (
      <GenericLoading lines={lines} />
    );

  return (
    <div className={cn(screen && "min-h-[calc(100dvh-8rem)] w-full")}>
      {content}
    </div>
  );
};

export const SectionError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="rounded-2xl border border-alert/20 bg-card p-6 shadow-[var(--shadow-card)]">
    <p className="text-sm font-semibold text-foreground">
      Falha ao carregar dados
    </p>
    <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    {onRetry ? (
      <Button onClick={onRetry} variant="secondary" className="mt-4 rounded-xl">
        <ReloadIcon className="h-4 w-4" />
        Tentar novamente
      </Button>
    ) : null}
  </div>
);

export const SectionEmpty = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);
