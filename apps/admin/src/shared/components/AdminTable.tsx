import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action ? <div className="flex shrink-0 gap-2">{action}</div> : null}
  </div>
);

export const AdminListHeader = ({
  icon,
  title,
  description,
  meta,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}) => (
  <section className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] lg:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {(meta || action) && (
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {meta}
          {action}
        </div>
      )}
    </div>
  </section>
);

export const SearchField = ({
  value,
  onChange,
  placeholder = "Buscar",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="relative w-full lg:w-80">
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl bg-white pr-10"
    />
    <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  </div>
);

export const AdminTable = ({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border [&_tr]:transition-colors [&_tr:hover]:bg-muted/40">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);

export const AdminDataTable = <TData,>({
  columns,
  data,
  empty,
  toolbar,
  totalItems,
  page,
  pageSize,
  onPageChange,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  empty?: ReactNode;
  toolbar?: ReactNode;
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const firstVisibleItem =
    totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = Array.from({ length: totalPages })
    .map((_, index) => index + 1)
    .filter((pageNumber) => {
      if (pageNumber === 1 || pageNumber === totalPages) {
        return true;
      }
      return Math.abs(pageNumber - currentPage) <= 1;
    });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
      {toolbar ? (
        <div className="border-b bg-card px-4 py-4">{toolbar}</div>
      ) : null}
      {totalItems === 0 && empty ? (
        <div className="px-4 py-10">{empty}</div>
      ) : (
        <Table className="min-w-[900px]">
          <TableHeader className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex flex-col gap-3 border-t bg-card px-4 py-3 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <p className="whitespace-nowrap">
          <span className="hidden sm:inline">Mostrando </span>
          {firstVisibleItem} - {lastVisibleItem}
          <span className="hidden sm:inline"> de {totalItems} itens</span>
          <span className="sm:hidden">/{totalItems}</span>
        </p>
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationLink
                href="#"
                size="default"
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(Math.max(1, currentPage - 1));
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              >
                Anterior
              </PaginationLink>
            </PaginationItem>
            {pageNumbers.map((pageNumber, index) => {
              const previousPage = pageNumbers[index - 1];
              return (
                <PaginationItem key={pageNumber}>
                  {previousPage && pageNumber - previousPage > 1 ? (
                    <span className="px-2 text-muted-foreground">...</span>
                  ) : null}
                  <PaginationLink
                    href="#"
                    isActive={pageNumber === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      onPageChange(pageNumber);
                    }}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationLink
                href="#"
                size="default"
                onClick={(event) => {
                  event.preventDefault();
                  onPageChange(Math.min(totalPages, currentPage + 1));
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              >
                Próximo
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </section>
  );
};

export const ActionIconButton = ({
  label,
  children,
  ...props
}: {
  label: string;
  children: ReactNode;
} & ComponentProps<typeof Button>) => (
  <Tooltip delayDuration={120}>
    <TooltipTrigger asChild>
      <Button size="icon" variant="ghost" aria-label={label} {...props}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

export const DialogActionTrigger = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Tooltip delayDuration={120}>
    <TooltipTrigger asChild>
      <DialogTrigger asChild>{children}</DialogTrigger>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

export const StatusBadge = ({
  value,
  active,
}: {
  value: string;
  active?: boolean;
}) => {
  const normalized = value.toLowerCase();
  const good = active ?? ["active", "online"].includes(normalized);
  const warn = ["offline", "never_seen", "inactive"].includes(normalized);

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full",
        good && "border-success/20 bg-success/10 text-success",
        warn && "border-alert/20 bg-alert/10 text-alert",
      )}
    >
      {value || "n/a"}
    </Badge>
  );
};

export const DateCell = ({ value }: { value?: string | null }) => {
  if (!value) {
    return <span className="text-muted-foreground">Nunca</span>;
  }

  return <span>{new Date(value).toLocaleString("pt-BR")}</span>;
};
