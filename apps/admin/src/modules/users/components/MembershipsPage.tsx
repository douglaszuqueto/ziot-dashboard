import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";
import {
  useCreateMembershipMutation,
  useDeleteMembershipMutation,
  useMembershipsQuery,
  useUpdateMembershipMutation,
  useUsersQuery,
} from "@/modules/users/hooks/use-users";
import {
  type Membership,
  type MembershipFormValues,
  membershipFormSchema,
} from "@/modules/users/schemas/users.schemas";
import {
  ActionIconButton,
  AdminDataTable,
  AdminListHeader,
  DateCell,
  DialogActionTrigger,
  StatusBadge,
} from "@/shared/components/AdminTable";
import { FieldError } from "@/shared/components/forms/FieldError";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const MembershipDialog = ({
  membership,
  trigger,
  defaultTenantId,
}: {
  membership?: Membership;
  trigger: ReactNode;
  defaultTenantId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const usersQuery = useUsersQuery({ perPage: 100 });
  const createMutation = useCreateMembershipMutation();
  const updateMutation = useUpdateMembershipMutation();
  const form = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      tenant_id: membership?.tenant_id ?? defaultTenantId ?? "",
      user_id: membership?.user_id ?? "",
      role: "operator",
      status: membership?.status === "inactive" ? "inactive" : "active",
    },
  });

  useEffect(() => {
    form.reset({
      tenant_id: membership?.tenant_id ?? defaultTenantId ?? "",
      user_id: membership?.user_id ?? "",
      role: "operator",
      status: membership?.status === "inactive" ? "inactive" : "active",
    });
  }, [defaultTenantId, membership, form]);

  const submit = form.handleSubmit((values) => {
    const mutation = membership
      ? updateMutation.mutateAsync({ id: membership.id, values })
      : createMutation.mutateAsync(values);

    void mutation.then(() => setOpen(false));
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger
        label={membership ? "Editar vínculo" : "Novo vínculo"}
      >
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {membership ? "Editar membership" : "Novo membership"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select
              value={form.watch("tenant_id")}
              onValueChange={(value) =>
                form.setValue("tenant_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(tenantsQuery.data?.data ?? []).map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.client_name} / {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.tenant_id?.message} />
          </div>
          <div className="space-y-2">
            <Label>Usuário</Label>
            <Select
              value={form.watch("user_id")}
              onValueChange={(value) =>
                form.setValue("user_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(usersQuery.data?.data ?? []).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.user_id?.message} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value) =>
                  form.setValue("role", value as MembershipFormValues["role"], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">operator</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={form.formState.errors.role?.message} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) =>
                  form.setValue(
                    "status",
                    value as MembershipFormValues["status"],
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="inactive">inactive</SelectItem>
                </SelectContent>
              </Select>
              <FieldError message={form.formState.errors.status?.message} />
            </div>
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

export const MembershipsPage = () => {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const tenantId = useTenantContextStore((state) => state.tenantId);
  const membershipsQuery = useMembershipsQuery({
    status,
    tenantId: tenantId ?? undefined,
    page,
    perPage: pageSize,
  });
  const deleteMutation = useDeleteMembershipMutation();

  if (membershipsQuery.isLoading) {
    return (
      <SectionLoading screen tableControls="filter-action" variant="table" />
    );
  }

  if (membershipsQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar memberships."
        onRetry={() => void membershipsQuery.refetch()}
      />
    );
  }

  const memberships = membershipsQuery.data?.data ?? [];
  const totalItems = membershipsQuery.data?.meta?.total ?? memberships.length;
  const columns: ColumnDef<Membership>[] = [
    {
      header: "Cliente",
      accessorKey: "client_name",
    },
    {
      header: "Tenant",
      accessorKey: "tenant_name",
    },
    {
      header: "Usuário",
      accessorKey: "user_id",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.user_id}</span>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
    },
    {
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      header: "Criado",
      cell: ({ row }) => <DateCell value={row.original.created_at} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <MembershipDialog
            membership={row.original}
            trigger={
              <Button size="icon" variant="ghost" aria-label="Editar">
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <ActionIconButton
            label="Excluir"
            disabled={deleteMutation.isPending}
            onClick={() => void deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </ActionIconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Vínculos de acesso"
        description="Associe usuários aos tenants e acompanhe roles operacionais."
        meta={
          <StatusBadge
            value={`${totalItems} ${totalItems === 1 ? "vínculo" : "vínculos"}`}
            active
          />
        }
        action={
          <MembershipDialog
            defaultTenantId={tenantId ?? undefined}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo membership
              </Button>
            }
          />
        }
      />
      <AdminDataTable
        columns={columns}
        data={memberships}
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        empty={
          <SectionEmpty
            title="Nenhum membership"
            description="Crie vínculos entre usuários e tenants."
          />
        }
        toolbar={
          <Select
            value={status || "all"}
            onValueChange={(value) => {
              setStatus(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 rounded-xl bg-white lg:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="inactive">inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
};
