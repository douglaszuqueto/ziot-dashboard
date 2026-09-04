import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, KeyRound, Plus, Users } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  useChangeUserPasswordMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from "@/modules/users/hooks/use-users";
import {
  type User,
  type UserFormValues,
  type UserPasswordValues,
  userCreateFormSchema,
  userFormSchema,
  userPasswordSchema,
} from "@/modules/users/schemas/users.schemas";
import {
  AdminDataTable,
  AdminListHeader,
  DialogActionTrigger,
  SearchField,
  StatusBadge,
} from "@/shared/components/AdminTable";
import { FieldError } from "@/shared/components/forms/FieldError";
import { PasswordInput } from "@/shared/components/forms/PasswordInput";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const UserDialog = ({
  user,
  trigger,
  defaultTenantId,
}: {
  user?: User;
  trigger: ReactNode;
  defaultTenantId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(user ? userFormSchema : userCreateFormSchema),
    defaultValues: {
      tenant_id: defaultTenantId ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      password: "",
      role: "operator",
      status: user?.status === "inactive" ? "inactive" : "active",
    },
  });

  useEffect(() => {
    form.reset({
      tenant_id: defaultTenantId ?? "",
      name: user?.name ?? "",
      email: user?.email ?? "",
      username: user?.username ?? "",
      password: "",
      role: "operator",
      status: user?.status === "inactive" ? "inactive" : "active",
    });
  }, [defaultTenantId, user, form]);

  const submit = form.handleSubmit((values) => {
    const mutation = user
      ? updateMutation.mutateAsync({ id: user.id, values })
      : createMutation.mutateAsync(values);

    void mutation.then(() => setOpen(false));
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger label={user ? "Editar usuário" : "Novo usuário"}>
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          {!user ? (
            <div className="space-y-2 lg:col-span-2">
              <Label>Tenant inicial</Label>
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
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" {...form.register("email")} />
            <FieldError message={form.formState.errors.email?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <Input id="username" {...form.register("username")} />
            <FieldError message={form.formState.errors.username?.message} />
          </div>
          {!user ? (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput id="password" {...form.register("password")} />
              <FieldError message={form.formState.errors.password?.message} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value as UserFormValues["role"], {
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
                form.setValue("status", value as UserFormValues["status"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
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
          <DialogFooter className="lg:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PasswordDialog = ({ user }: { user: User }) => {
  const [open, setOpen] = useState(false);
  const mutation = useChangeUserPasswordMutation();
  const form = useForm<UserPasswordValues>({
    resolver: zodResolver(userPasswordSchema),
    defaultValues: { password: "" },
  });

  const submit = form.handleSubmit((values) => {
    void mutation.mutateAsync({ id: user.id, values }).then(() => {
      form.reset({ password: "" });
      setOpen(false);
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Trocar senha">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Trocar senha de {user.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <PasswordInput id="new-password" {...form.register("password")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar senha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const UsersPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const tenantId = useTenantContextStore((state) => state.tenantId);
  const usersQuery = useUsersQuery({
    search,
    status,
    tenantId: tenantId ?? undefined,
    page,
    perPage: pageSize,
  });

  if (usersQuery.isLoading) {
    return <SectionLoading screen variant="table" />;
  }

  if (usersQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar usuários."
        onRetry={() => void usersQuery.refetch()}
      />
    );
  }

  const users = usersQuery.data?.data ?? [];
  const totalItems = usersQuery.data?.meta?.total ?? users.length;
  const columns: ColumnDef<User>[] = [
    {
      header: "Usuário",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.username}
          </p>
        </div>
      ),
    },
    {
      header: "E-mail",
      accessorKey: "email",
    },
    {
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.status} />,
    },
    {
      header: "Memberships",
      accessorKey: "memberships_total",
    },
    {
      header: "Role",
      accessorKey: "role",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <UserDialog
            user={row.original}
            trigger={
              <Button size="icon" variant="ghost" aria-label="Editar">
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <PasswordDialog user={row.original} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<Users className="h-5 w-5" />}
        title="Usuários"
        description="Gerencie acessos pessoais e o status dos operadores da plataforma."
        meta={
          <StatusBadge
            value={`${totalItems} ${totalItems === 1 ? "usuário" : "usuários"}`}
            active
          />
        }
        action={
          <UserDialog
            defaultTenantId={tenantId ?? undefined}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            }
          />
        }
      />
      <AdminDataTable
        columns={columns}
        data={users}
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        empty={
          <SectionEmpty
            title="Nenhum usuário"
            description="Ajuste os filtros."
          />
        }
        toolbar={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchField
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
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
          </div>
        }
      />
    </div>
  );
};
