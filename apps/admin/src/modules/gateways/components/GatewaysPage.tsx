import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import {
  APIProvider,
  Map as GoogleMap,
  type MapMouseEvent,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import {
  Edit,
  MapPin,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { hasPermission } from "@/modules/auth/access";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  useCreateGatewayMutation,
  useDeleteGatewayMutation,
  useGatewaysQuery,
  useSyncGatewayMutation,
  useUpdateGatewayMutation,
} from "@/modules/gateways/hooks/use-gateways";
import {
  type Coordinates,
  type Gateway,
  type GatewayCreateFormValues,
  type GatewayUpdateFormValues,
  gatewayCreateFormSchema,
  gatewayUpdateFormSchema,
} from "@/modules/gateways/schemas/gateways.schemas";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";
import {
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
import { env } from "@/shared/config/env";

const DEFAULT_LOCATION = { lat: -22.6903, lng: -46.9827 };

const formatCoordinate = (value: number) => Number(value.toFixed(6));

const locationToLabel = (location: Coordinates) =>
  `${formatCoordinate(location.lat)}, ${formatCoordinate(location.lng)}`;

const defaultFormValues = (
  gateway?: Gateway,
): GatewayCreateFormValues | GatewayUpdateFormValues => ({
  tenant_id: gateway?.tenant_id || "",
  chirpstack_tenant_id: gateway?.chirpstack_tenant_id ?? "",
  ...(gateway ? {} : { gateway_eui: "" }),
  name: gateway?.name ?? "",
  description: gateway?.description ?? "",
  location: gateway?.location ?? DEFAULT_LOCATION,
  stats_interval_seconds: gateway?.stats_interval_seconds ?? 30,
});

const LocationSearchMap = ({
  selected,
  onSelect,
}: {
  selected: Coordinates;
  onSelect: (value: Coordinates) => void;
}) => {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    map?.panTo(selected);
  }, [map, selected]);

  const handleMapClick = (event: MapMouseEvent) => {
    if (!event.detail.latLng) {
      return;
    }
    onSelect(event.detail.latLng);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();
    if (!query || !geocoding) {
      return;
    }

    setSearching(true);
    setMessage(null);

    const geocoder = new geocoding.Geocoder();
    void geocoder
      .geocode({ address: query, region: "BR" })
      .then(({ results }) => {
        const location = results[0]?.geometry.location;
        if (!location) {
          setMessage("Nenhum local encontrado para essa busca.");
          return;
        }

        const nextLocation = location.toJSON();
        onSelect(nextLocation);
        map?.panTo(nextLocation);
        map?.setZoom(15);
      })
      .catch(() => {
        setMessage("Não foi possível buscar esse local.");
      })
      .finally(() => {
        setSearching(false);
      });
  };

  return (
    <div className="space-y-3">
      <form className="flex flex-col gap-2 md:flex-row" onSubmit={submitSearch}>
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar endereço, cidade ou coordenadas"
            className="bg-white pr-10"
          />
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 h-4 w-4 text-muted-foreground" />
        </div>
        <Button type="submit" disabled={searching || !geocoding}>
          {searching ? "Buscando..." : "Buscar local"}
        </Button>
      </form>
      {message ? <p className="text-xs text-destructive">{message}</p> : null}
      <div className="h-[420px] overflow-hidden rounded-xl border bg-muted">
        <GoogleMap
          defaultCenter={selected}
          defaultZoom={13}
          gestureHandling="greedy"
          mapTypeId="roadmap"
          onClick={handleMapClick}
          style={{ height: "100%", width: "100%" }}
        >
          <Marker position={selected} />
        </GoogleMap>
      </div>
    </div>
  );
};

const LocationPickerDialog = ({
  value,
  onChange,
}: {
  value: Coordinates;
  onChange: (value: Coordinates) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Coordinates>(value);

  useEffect(() => {
    if (open) {
      setSelected(value);
    }
  }, [open, value]);

  const updateCoordinate = (key: keyof Coordinates, nextValue: string) => {
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) {
      return;
    }
    setSelected((current) => ({ ...current, [key]: parsed }));
  };

  const save = () => {
    onChange({
      lat: formatCoordinate(selected.lat),
      lng: formatCoordinate(selected.lng),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          <MapPin className="h-4 w-4" />
          Selecionar no mapa
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selecionar localização</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {env.VITE_GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={env.VITE_GOOGLE_MAPS_API_KEY}>
              <LocationSearchMap selected={selected} onSelect={setSelected} />
            </APIProvider>
          ) : (
            <div className="h-[420px] overflow-hidden rounded-xl border bg-muted">
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  Google Maps API Key não configurada
                </p>
                <p className="max-w-md text-xs text-muted-foreground">
                  Configure VITE_GOOGLE_MAPS_API_KEY para selecionar pelo mapa.
                  Enquanto isso, informe latitude e longitude manualmente.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="gateway-location-lat">Latitude</Label>
              <Input
                id="gateway-location-lat"
                type="number"
                step="0.000001"
                value={selected.lat}
                onChange={(event) =>
                  updateCoordinate("lat", event.target.value)
                }
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gateway-location-lng">Longitude</Label>
              <Input
                id="gateway-location-lng"
                type="number"
                step="0.000001"
                value={selected.lng}
                onChange={(event) =>
                  updateCoordinate("lng", event.target.value)
                }
                className="bg-white"
              />
            </div>
            <Button type="button" onClick={save}>
              Salvar local
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SyncBadge = ({ gateway }: { gateway: Gateway }) => {
  if (gateway.chirpstack_last_error) {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-alert/20 bg-alert/10 text-alert"
      >
        Erro
      </Badge>
    );
  }

  if (gateway.chirpstack_synced_at) {
    return (
      <Badge
        variant="outline"
        className="rounded-full border-success/20 bg-success/10 text-success"
      >
        Sincronizado
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="rounded-full">
      Pendente
    </Badge>
  );
};

const GatewayDialog = ({
  gateway,
  trigger,
}: {
  gateway?: Gateway;
  trigger: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const createMutation = useCreateGatewayMutation();
  const updateMutation = useUpdateGatewayMutation();
  const form = useForm<GatewayCreateFormValues | GatewayUpdateFormValues>({
    resolver: zodResolver(
      gateway ? gatewayUpdateFormSchema : gatewayCreateFormSchema,
    ),
    defaultValues: defaultFormValues(gateway),
  });

  useEffect(() => {
    form.reset(defaultFormValues(gateway));
    setSubmitError(undefined);
  }, [gateway, form]);

  const location = form.watch("location") ?? DEFAULT_LOCATION;

  const submit = form.handleSubmit((values) => {
    setSubmitError(undefined);
    const mutation = gateway
      ? updateMutation.mutateAsync({
          id: gateway.id,
          values: values as GatewayUpdateFormValues,
        })
      : createMutation.mutateAsync(values as GatewayCreateFormValues);

    void mutation
      .then((saved) => {
        setOpen(false);
        toast.success(gateway ? "Gateway atualizado." : "Gateway criado.");
        if (saved.chirpstack_last_error) {
          toast.error("Falha ao sincronizar com ChirpStack.", {
            description: saved.chirpstack_last_error,
          });
        }
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o gateway.";
        setSubmitError(message);
        toast.error("Não foi possível salvar o gateway.", {
          description: message,
        });
      });
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger label={gateway ? "Editar gateway" : "Novo gateway"}>
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {gateway ? "Editar gateway" : "Novo gateway"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select
              value={(form.watch("tenant_id") as string) || "none"}
              onValueChange={(value) =>
                form.setValue("tenant_id", value === "none" ? "" : value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem tenant vinculado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem tenant vinculado</SelectItem>
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
          <div className="space-y-2">
            <Label htmlFor="chirpstack_tenant_id">ChirpStack Tenant ID</Label>
            <Input
              id="chirpstack_tenant_id"
              {...form.register("chirpstack_tenant_id")}
            />
            <FieldError
              message={form.formState.errors.chirpstack_tenant_id?.message}
            />
          </div>
          {gateway ? (
            <div className="space-y-2">
              <Label htmlFor="gateway_eui_readonly">Gateway EUI</Label>
              <Input
                id="gateway_eui_readonly"
                value={gateway.gateway_eui}
                readOnly
                className="bg-muted"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="gateway_eui">Gateway EUI</Label>
              <Input
                id="gateway_eui"
                placeholder="a84041fdfe2a9010"
                {...form.register("gateway_eui" as never)}
              />
              <FieldError
                message={
                  (
                    form.formState.errors as {
                      gateway_eui?: { message?: string };
                    }
                  ).gateway_eui?.message
                }
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" {...form.register("description")} />
            <FieldError message={form.formState.errors.description?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stats_interval_seconds">
              Intervalo de stats (segundos)
            </Label>
            <Input
              id="stats_interval_seconds"
              type="number"
              min={1}
              {...form.register("stats_interval_seconds")}
            />
            <FieldError
              message={form.formState.errors.stats_interval_seconds?.message}
            />
          </div>
          <div className="space-y-2">
            <Label>Localização</Label>
            <div className="flex flex-col gap-2 lg:flex-row">
              <Input
                value={locationToLabel(location)}
                readOnly
                className="bg-white"
              />
              <LocationPickerDialog
                value={location}
                onChange={(value) =>
                  form.setValue("location", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>
            <FieldError message={form.formState.errors.location?.message} />
          </div>
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

const DeleteGatewayDialog = ({ gateway }: { gateway: Gateway }) => {
  const deleteMutation = useDeleteGatewayMutation();

  const remove = () => {
    void deleteMutation
      .mutateAsync(gateway.id)
      .then(() => toast.success("Gateway removido."))
      .catch((error: unknown) => {
        toast.error("Não foi possível remover o gateway.", {
          description:
            error instanceof Error ? error.message : "Tente novamente.",
        });
      });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Excluir"
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover gateway?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação remove o gateway do Admin e, quando a integração estiver
            configurada, também solicita a remoção no ChirpStack. O registro
            removido não poderá ser recuperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={remove}>Remover</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const SyncGatewayButton = ({ gateway }: { gateway: Gateway }) => {
  const syncMutation = useSyncGatewayMutation();

  const sync = () => {
    void syncMutation
      .mutateAsync(gateway.id)
      .then((synced) => {
        if (synced.chirpstack_last_error) {
          toast.error("Falha ao sincronizar com ChirpStack.", {
            description: synced.chirpstack_last_error,
          });
          return;
        }
        toast.success("Gateway sincronizado.");
      })
      .catch((error: unknown) => {
        toast.error("Não foi possível sincronizar o gateway.", {
          description:
            error instanceof Error ? error.message : "Tente novamente.",
        });
      });
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label="Sincronizar"
      disabled={syncMutation.isPending}
      onClick={sync}
    >
      <RefreshCw
        className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")}
      />
    </Button>
  );
};

export const GatewaysPage = () => {
  const [search, setSearch] = useState("");
  const contextTenantId = useTenantContextStore((state) => state.tenantId);
  const [tenantId, setTenantId] = useState(contextTenantId ?? "");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const gatewaysQuery = useGatewaysQuery({
    search,
    tenantId,
    page,
    perPage: pageSize,
  });
  const permissions = useAuthStore((state) => state.permissions);
  const canManageGateways = hasPermission(permissions, "gateways.manage");

  useEffect(() => {
    setTenantId(contextTenantId ?? "");
  }, [contextTenantId]);

  if (gatewaysQuery.isLoading) {
    return <SectionLoading screen variant="table" />;
  }

  if (gatewaysQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar gateways."
        onRetry={() => void gatewaysQuery.refetch()}
      />
    );
  }

  const gateways = gatewaysQuery.data?.data ?? [];
  const totalItems = gatewaysQuery.data?.meta?.total ?? gateways.length;
  const columns: ColumnDef<Gateway>[] = [
    {
      header: "Gateway",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.gateway_eui}
          </p>
        </div>
      ),
    },
    {
      header: "Tenant",
      cell: ({ row }) =>
        row.original.tenant_name ? (
          row.original.tenant_name
        ) : (
          <span className="text-muted-foreground">Sem vínculo</span>
        ),
    },
    {
      header: "ChirpStack",
      accessorKey: "chirpstack_tenant_id",
    },
    {
      header: "Localização",
      cell: ({ row }) => locationToLabel(row.original.location),
    },
    {
      header: "Sync",
      cell: ({ row }) => (
        <div className="space-y-1">
          <SyncBadge gateway={row.original} />
          {row.original.chirpstack_last_error ? (
            <p className="max-w-72 truncate text-xs text-alert">
              {row.original.chirpstack_last_error}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      header: "Atualizado",
      cell: ({ row }) => <DateCell value={row.original.updated_at} />,
    },
    {
      id: "actions",
      cell: ({ row }) =>
        canManageGateways ? (
          <div className="flex justify-end gap-2">
            <GatewayDialog
              gateway={row.original}
              trigger={
                <Button size="icon" variant="ghost" aria-label="Editar">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
            <SyncGatewayButton gateway={row.original} />
            <DeleteGatewayDialog gateway={row.original} />
          </div>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<RadioTower className="h-5 w-5" />}
        title="Gateways"
        description="Gerencie gateways LoRaWAN, vínculo com tenant e sincronização com ChirpStack."
        meta={
          <StatusBadge
            value={`${totalItems} ${totalItems === 1 ? "gateway" : "gateways"}`}
            active
          />
        }
        action={
          canManageGateways ? (
            <GatewayDialog
              trigger={
                <Button>
                  <Plus className="h-4 w-4" />
                  Novo gateway
                </Button>
              }
            />
          ) : null
        }
      />
      <AdminDataTable
        columns={columns}
        data={gateways}
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        empty={
          <SectionEmpty
            title="Nenhum gateway"
            description="Ajuste os filtros ou cadastre o primeiro gateway."
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
              placeholder="Buscar por nome, EUI ou tenant"
            />
            <Select
              value={tenantId || "all"}
              onValueChange={(value) => {
                setTenantId(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white lg:w-72">
                <SelectValue placeholder="Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tenants</SelectItem>
                {(tenantsQuery.data?.data ?? []).map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.client_name} / {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </div>
  );
};
