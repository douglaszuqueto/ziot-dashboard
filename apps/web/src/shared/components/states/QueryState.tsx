import { ReloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export type SectionLoadingVariant = "detail" | "generic" | "list";

const loadingKeys = (prefix: string, length: number) =>
  Array.from({ length }, (_, index) => `${prefix}-${index}`);

const ListLoading = () => (
  <div className="flex min-h-[calc(100dvh-96px)] w-full flex-col gap-4 lg:gap-6">
    <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-4 w-72 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    </section>
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {loadingKeys("list-card", 6).map((key) => (
        <div
          key={key}
          className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-7 w-20 rounded-full" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      ))}
    </section>
  </div>
);

const DetailLoading = ({ lines }: { lines: number }) => (
  <div className="flex min-h-[calc(100dvh-96px)] w-full flex-col gap-4 lg:gap-6">
    <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-56 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>
    </section>
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {loadingKeys("detail-stat", Math.max(4, lines)).map((key) => (
        <Skeleton key={key} className="h-28 rounded-2xl" />
      ))}
    </section>
    <section className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
      <Skeleton className="min-h-64 rounded-3xl" />
      <Skeleton className="min-h-64 rounded-3xl" />
    </section>
  </div>
);

const GenericScreenLoading = ({ lines }: { lines: number }) => (
  <div className="flex min-h-[calc(100dvh-96px)] w-full flex-col rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
    <div className="space-y-3">
      <Skeleton className="h-6 w-40 rounded-full" />
      {loadingKeys("generic-loading-line", lines).map((key) => (
        <Skeleton key={key} className="h-16 w-full rounded-2xl" />
      ))}
    </div>
    <div className="mt-4 grid flex-1 grid-cols-1 gap-3 lg:grid-cols-2">
      <Skeleton className="min-h-64 rounded-2xl" />
      <Skeleton className="min-h-64 rounded-2xl" />
    </div>
  </div>
);

export const SectionLoading = ({
  lines = 4,
  screen = false,
  variant = "generic",
}: {
  lines?: number;
  screen?: boolean;
  variant?: SectionLoadingVariant;
}) => {
  if (screen && variant === "list") return <ListLoading />;
  if (screen && variant === "detail") return <DetailLoading lines={lines} />;
  if (screen) return <GenericScreenLoading lines={lines} />;

  return (
    <div className="rounded-3xl bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-40 rounded-full" />
        {loadingKeys("loading-line", lines).map((key) => (
          <Skeleton key={key} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
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
  <div className="rounded-3xl border border-alert/20 bg-card p-6 shadow-[var(--shadow-card)]">
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
  <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
  </div>
);
