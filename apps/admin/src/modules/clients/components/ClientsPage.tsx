import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Edit, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useClientsQuery,
  useCreateClientMutation,
  useDeleteClientMutation,
  useUpdateClientMutation,
} from "@/modules/clients/hooks/use-clients";
import {
  type Client,
  type ClientFormValues,
  clientFormSchema,
} from "@/modules/clients/schemas/clients.schemas";
import {
  ActionIconButton,
  AdminDataTable,
  AdminListHeader,
  DateCell,
  DialogActionTrigger,
  SearchField,
} from "@/shared/components/AdminTable";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const ClientDialog = ({
  client,
  trigger,
}: {
  client?: Client;
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { name: client?.name ?? "" },
  });

  useEffect(() => {
    form.reset({ name: client?.name ?? "" });
  }, [client, form]);

  const submit = form.handleSubmit((values) => {
    const mutation = client
      ? updateMutation.mutateAsync({ id: client.id, values })
      : createMutation.mutateAsync(values);

    void mutation.then(() => setOpen(false));
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger label={client ? "Editar cliente" : "Novo cliente"}>
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-xs text-alert">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const ClientsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const clientsQuery = useClientsQuery({ search, page, perPage: pageSize });
  const deleteMutation = useDeleteClientMutation();
  const clients = clientsQuery.data?.data ?? [];
  const totalItems = clientsQuery.data?.meta?.total ?? clients.length;
  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        header: "Nome",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        header: "Tenants",
        accessorKey: "tenants_total",
      },
      {
        header: "Criado em",
        cell: ({ row }) => <DateCell value={row.original.created_at} />,
      },
      {
        header: "Atualizado",
        cell: ({ row }) => <DateCell value={row.original.updated_at} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <ClientDialog
              client={row.original}
              trigger={
                <Button size="icon" variant="ghost" aria-label="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
            <ActionIconButton
              label="Excluir cliente"
              disabled={deleteMutation.isPending}
              onClick={() => void deleteMutation.mutate(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </ActionIconButton>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  if (clientsQuery.isLoading) {
    return (
      <SectionLoading screen tableControls="search-action" variant="table" />
    );
  }

  if (clientsQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar clientes."
        onRetry={() => void clientsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<Building2 className="h-5 w-5" />}
        title="Clientes"
        description="Gerencie organizações, tenants e estrutura comercial da plataforma."
        meta={
          <Badge variant="secondary" className="rounded-full">
            {totalItems} clientes
          </Badge>
        }
        action={
          <ClientDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo cliente
              </Button>
            }
          />
        }
      />
      <AdminDataTable
        columns={columns}
        data={clients}
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchField
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Buscar por nome"
            />
          </div>
        }
        empty={
          <SectionEmpty
            title="Nenhum cliente encontrado"
            description="Ajuste os filtros ou cadastre o primeiro cliente."
          />
        }
      />
    </div>
  );
};
