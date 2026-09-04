import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Boxes,
  Check,
  ChevronsUpDown,
  Edit,
  MoveRight,
  Plus,
  Power,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type AssetKind,
  useAssetsQuery,
  useCreateAssetMutation,
  useDeviceProfilesQuery,
  useTransferAssetMutation,
  useUpdateAssetMutation,
  useUpdateAssetStatusMutation,
} from "@/modules/inventory/hooks/use-inventory";
import {
  type AssetFormValues,
  type AssetUpdateFormValues,
  assetFormSchema,
  assetUpdateFormSchema,
  type DeviceProfile,
  type ManagedDevice,
} from "@/modules/inventory/schemas/inventory.schemas";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";
import {
  ActionIconButton,
  AdminDataTable,
  AdminListHeader,
  DateCell,
  DialogActionTrigger,
  SearchField,
  StatusBadge,
} from "@/shared/components/AdminTable";
import { FieldError } from "@/shared/components/forms/FieldError";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const kindLabels = {
  devices: "Devices",
} as const;

const newButtonLabels = {
  devices: "Novo device",
} as const;

const profileLabel = (profile: DeviceProfile) =>
  `${profile.scope === "global" ? "Global" : profile.tenant_name} / ${profile.name}`;

const AssetDialog = ({
  kind,
  asset,
  trigger,
  defaultTenantId,
}: {
  kind: AssetKind;
  asset?: ManagedDevice;
  trigger: ReactNode;
  defaultTenantId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const createMutation = useCreateAssetMutation(kind);
  const updateMutation = useUpdateAssetMutation(kind);
  const form = useForm<AssetFormValues | AssetUpdateFormValues>({
    resolver: zodResolver(asset ? assetUpdateFormSchema : assetFormSchema),
    defaultValues: asset
      ? {
          name: asset.name,
          device_profile_id: asset.device_profile_id,
          device_eui: asset.external_id,
          serial_number: asset.serial_number,
          join_eui: asset.join_eui,
          application_key: "",
          clear_application_key: false,
        }
      : {
          tenant_id: defaultTenantId ?? "",
          name: "",
          device_profile_id: "",
          device_eui: "",
          serial_number: "",
          join_eui: "",
          application_key: "",
          channel_count: 0,
        },
  });
  const watchedValues = form.watch();
  const selectedTenantId = asset
    ? asset.tenant_id
    : "tenant_id" in watchedValues
      ? watchedValues.tenant_id
      : "";
  const profilesQuery = useDeviceProfilesQuery(
    { tenantId: selectedTenantId },
    Boolean(selectedTenantId),
  );

  useEffect(() => {
    form.reset(
      asset
        ? {
            name: asset.name,
            device_profile_id: asset.device_profile_id,
            device_eui: asset.external_id,
            serial_number: asset.serial_number,
            join_eui: asset.join_eui,
            application_key: "",
            clear_application_key: false,
          }
        : {
            tenant_id: defaultTenantId ?? "",
            name: "",
            device_profile_id: "",
            device_eui: "",
            serial_number: "",
            join_eui: "",
            application_key: "",
            channel_count: 0,
          },
    );
  }, [asset, defaultTenantId, form]);

  const submit = form.handleSubmit((values) => {
    setSubmitError(undefined);
    const mutation = asset
      ? updateMutation.mutateAsync({
          id: asset.id,
          values: values as AssetUpdateFormValues,
        })
      : createMutation.mutateAsync(values as AssetFormValues);

    void mutation
      .then(() => setOpen(false))
      .catch((error: unknown) => {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o cadastro.",
        );
      });
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger
        label={asset ? `Editar ${kindLabels[kind]}` : newButtonLabels[kind]}
      >
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {asset ? `Editar ${kindLabels[kind]}` : `Novo ${kindLabels[kind]}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          {!asset ? (
            <div className="space-y-2 lg:col-span-2">
              <Label>Tenant</Label>
              <Select
                value={selectedTenantId}
                onValueChange={(value) => {
                  setSubmitError(undefined);
                  form.setValue("tenant_id" as never, value as never, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  form.setValue("device_profile_id", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
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
              <FieldError
                message={
                  (
                    form.formState.errors as {
                      tenant_id?: { message?: string };
                    }
                  ).tenant_id?.message
                }
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label>Device profile</Label>
            <Select
              value={form.watch("device_profile_id")}
              disabled={!selectedTenantId || profilesQuery.isLoading}
              onValueChange={(value) => {
                setSubmitError(undefined);
                form.setValue("device_profile_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedTenantId ? "Selecione" : "Selecione o tenant"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {selectedTenantId &&
                (profilesQuery.data?.data.length ?? 0) > 0 ? (
                  (profilesQuery.data?.data ?? []).map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profileLabel(profile)}
                    </SelectItem>
                  ))
                ) : selectedTenantId ? (
                  <SelectItem value="__no_profiles" disabled>
                    Nenhum profile para o tenant selecionado
                  </SelectItem>
                ) : (
                  <SelectItem value="__select_tenant_first" disabled>
                    Selecione um tenant primeiro
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FieldError
              message={form.formState.errors.device_profile_id?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="device_eui">External ID</Label>
            <Input id="device_eui" {...form.register("device_eui")} />
            <FieldError message={form.formState.errors.device_eui?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="serial_number">Serial</Label>
            <Input id="serial_number" {...form.register("serial_number")} />
            <FieldError
              message={form.formState.errors.serial_number?.message}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join_eui">Join EUI</Label>
            <Input id="join_eui" {...form.register("join_eui")} />
            <FieldError message={form.formState.errors.join_eui?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="application_key">Application key</Label>
            <Input
              id="application_key"
              type="password"
              {...form.register("application_key")}
            />
            <FieldError
              message={form.formState.errors.application_key?.message}
            />
          </div>
          {!asset ? (
            <div className="space-y-2">
              <Label htmlFor="channel_count">Canais</Label>
              <Input
                id="channel_count"
                type="number"
                {...form.register("channel_count" as never)}
              />
              <FieldError
                message={
                  (
                    form.formState.errors as {
                      channel_count?: { message?: string };
                    }
                  ).channel_count?.message
                }
              />
            </div>
          ) : null}
          <DialogFooter className="lg:col-span-2">
            <FieldError message={submitError} />
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MoveDialog = ({
  kind,
  asset,
}: {
  kind: AssetKind;
  asset: ManagedDevice;
}) => {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const transferMutation = useTransferAssetMutation(kind);

  const tenants = tenantsQuery.data?.data ?? [];
  const selectedTenant = tenants.find((tenant) => tenant.id === tenantId);

  const submit = () => {
    void transferMutation
      .mutateAsync({ id: asset.id, tenantId })
      .then(() => {
        toast.success(`${asset.name} movido para o novo tenant.`);
        setOpen(false);
      })
      .catch((error: unknown) => {
        toast.error("Não foi possível mover o dispositivo.", {
          description:
            error instanceof Error ? error.message : "Tente novamente.",
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger label="Mover">
        <Button size="icon" variant="ghost" aria-label="Mover">
          <MoveRight className="h-4 w-4" />
        </Button>
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Mover {asset.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Novo tenant</Label>
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-expanded={pickerOpen}
                className="w-full justify-between font-normal"
              >
                <span className="truncate">
                  {selectedTenant
                    ? `${selectedTenant.client_name} / ${selectedTenant.name}`
                    : "Selecione o tenant de destino"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[--radix-popover-trigger-width] p-0"
            >
              <Command>
                <CommandInput placeholder="Buscar tenant..." />
                <CommandList>
                  <CommandEmpty>Nenhum tenant encontrado.</CommandEmpty>
                  <CommandGroup>
                    {tenants.map((tenant) => {
                      const isCurrent = tenant.id === asset.tenant_id;
                      return (
                        <CommandItem
                          key={tenant.id}
                          value={`${tenant.name} ${tenant.client_name}`}
                          disabled={isCurrent}
                          onSelect={() => {
                            setTenantId(tenant.id);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              tenantId === tenant.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {tenant.name}
                              {isCurrent ? " (atual)" : ""}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {tenant.client_name}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            disabled={
              transferMutation.isPending ||
              !tenantId ||
              tenantId === asset.tenant_id
            }
          >
            Mover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const InventoryPage = ({ kind }: { kind: AssetKind }) => {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const tenantId = useTenantContextStore((state) => state.tenantId);
  const assetsQuery = useAssetsQuery(kind, {
    search,
    active,
    tenantId: tenantId ?? undefined,
    page,
    perPage: pageSize,
  });
  const statusMutation = useUpdateAssetStatusMutation(kind);

  if (assetsQuery.isLoading) {
    return <SectionLoading screen variant="table" />;
  }

  if (assetsQuery.isError) {
    return (
      <SectionError
        message={`Não foi possível carregar ${kindLabels[kind]}.`}
        onRetry={() => void assetsQuery.refetch()}
      />
    );
  }

  const assets = assetsQuery.data?.data ?? [];
  const totalItems = assetsQuery.data?.meta?.total ?? assets.length;
  const columns: ColumnDef<ManagedDevice>[] = [
    {
      header: "Nome",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.external_id}
          </p>
        </div>
      ),
    },
    {
      header: "Tenant",
      cell: ({ row }) => (
        <div>
          <p>{row.original.tenant_name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.client_name}
          </p>
        </div>
      ),
    },
    {
      header: "Módulo",
      cell: ({ row }) => (
        <div>
          <p>{row.original.module}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.protocol}
          </p>
        </div>
      ),
    },
    {
      header: "Profile",
      accessorKey: "device_profile_name",
    },
    {
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          value={row.original.active ? "active" : "inactive"}
          active={row.original.active}
        />
      ),
    },
    {
      header: "Último sinal",
      cell: ({ row }) => <DateCell value={row.original.last_seen_at} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <AssetDialog
            kind={kind}
            asset={row.original}
            trigger={
              <Button size="icon" variant="ghost" aria-label="Editar">
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <MoveDialog kind={kind} asset={row.original} />
          <ActionIconButton
            label={row.original.active ? "Desativar" : "Ativar"}
            disabled={statusMutation.isPending}
            onClick={() =>
              void statusMutation.mutate({
                id: row.original.id,
                active: !row.original.active,
              })
            }
          >
            <Power className="h-4 w-4" />
          </ActionIconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<Boxes className="h-5 w-5" />}
        title={kindLabels[kind]}
        description="Gerencie cadastro, vínculo com tenant, profiles e status operacional."
        meta={
          <StatusBadge
            value={`${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
            active
          />
        }
        action={
          <AssetDialog
            kind={kind}
            defaultTenantId={tenantId ?? undefined}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                {newButtonLabels[kind]}
              </Button>
            }
          />
        }
      />
      <AdminDataTable
        columns={columns}
        data={assets}
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        empty={
          <SectionEmpty title="Nenhum item" description="Ajuste os filtros." />
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
              value={active || "all"}
              onValueChange={(value) => {
                setActive(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativos</SelectItem>
                <SelectItem value="false">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
};
