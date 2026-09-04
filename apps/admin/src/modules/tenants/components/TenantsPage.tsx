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
import { Edit, MapPin, Plus, Search, Waypoints } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useForm } from "react-hook-form";
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
import { useClientsQuery } from "@/modules/clients/hooks/use-clients";
import {
  useCreateTenantMutation,
  useTenantsQuery,
  useUpdateTenantMutation,
} from "@/modules/tenants/hooks/use-tenants";
import {
  type Tenant,
  type TenantFormValues,
  tenantFormSchema,
} from "@/modules/tenants/schemas/tenants.schemas";
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

interface Coordinates {
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION = { lat: -22.6903, lng: -46.9827 };

const parseLocation = (value?: string | null): Coordinates | null => {
  if (!value?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<Coordinates>;
    const lat = Number(parsed.lat);
    const lng = Number(parsed.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  }
};

const formatLocation = (value: Coordinates) =>
  JSON.stringify({
    lat: Number(value.lat.toFixed(6)),
    lng: Number(value.lng.toFixed(6)),
  });

const resolveTimeZoneOptions = () => {
  const intlWithTimeZones = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  const supported = intlWithTimeZones.supportedValuesOf?.("timeZone") ?? [
    "America/Sao_Paulo",
    "America/Fortaleza",
    "America/Manaus",
    "America/Rio_Branco",
    "UTC",
  ];

  return Array.from(new Set(["UTC", ...supported])).sort((left, right) => {
    if (left === "UTC") return -1;
    if (right === "UTC") return 1;
    return left.localeCompare(right);
  });
};

const timeZoneOptions = resolveTimeZoneOptions();

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
  value?: string;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Coordinates>(
    parseLocation(value) ?? DEFAULT_LOCATION,
  );

  useEffect(() => {
    if (open) {
      setSelected(parseLocation(value) ?? DEFAULT_LOCATION);
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
    onChange(formatLocation(selected));
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
              <Label htmlFor="location-lat">Latitude</Label>
              <Input
                id="location-lat"
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
              <Label htmlFor="location-lng">Longitude</Label>
              <Input
                id="location-lng"
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

const TenantDialog = ({
  tenant,
  trigger,
}: {
  tenant?: Tenant;
  trigger: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const clientsQuery = useClientsQuery({ perPage: 100 });
  const createMutation = useCreateTenantMutation();
  const updateMutation = useUpdateTenantMutation();
  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      client_id: tenant?.client_id ?? "",
      slug: tenant?.slug ?? "",
      name: tenant?.name ?? "",
      timezone: tenant?.timezone ?? "UTC",
      status: tenant?.status === "inactive" ? "inactive" : "active",
      role: "operator",
      location: tenant?.location ? JSON.stringify(tenant.location) : "{}",
    },
  });

  useEffect(() => {
    form.reset({
      client_id: tenant?.client_id ?? "",
      slug: tenant?.slug ?? "",
      name: tenant?.name ?? "",
      timezone: tenant?.timezone ?? "UTC",
      status: tenant?.status === "inactive" ? "inactive" : "active",
      role: "operator",
      location: tenant?.location ? JSON.stringify(tenant.location) : "{}",
    });
  }, [tenant, form]);

  const submit = form.handleSubmit((values) => {
    const mutation = tenant
      ? updateMutation.mutateAsync({ id: tenant.id, values })
      : createMutation.mutateAsync(values);

    void mutation.then(() => setOpen(false));
  });

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogActionTrigger label={tenant ? "Editar tenant" : "Novo tenant"}>
        {trigger}
      </DialogActionTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tenant ? "Editar tenant" : "Novo tenant"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={form.watch("client_id")}
              onValueChange={(value) =>
                form.setValue("client_id", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(clientsQuery.data?.data ?? []).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.client_id?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...form.register("slug")} />
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={form.watch("timezone")}
              onValueChange={(value) =>
                form.setValue("timezone", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {timeZoneOptions.map((timeZone) => (
                  <SelectItem key={timeZone} value={timeZone}>
                    {timeZone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.timezone?.message} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue("status", value as TenantFormValues["status"], {
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
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value as TenantFormValues["role"], {
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
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="location">Localização</Label>
            <div className="flex flex-col gap-2 lg:flex-row">
              <Input
                id="location"
                readOnly
                className="bg-white"
                {...form.register("location")}
              />
              <LocationPickerDialog
                value={form.watch("location")}
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
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const TenantsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const tenantsQuery = useTenantsQuery({
    search,
    status,
    page,
    perPage: pageSize,
  });
  const tenants = tenantsQuery.data?.data ?? [];
  const totalItems = tenantsQuery.data?.meta?.total ?? tenants.length;
  const columns = useMemo<ColumnDef<Tenant>[]>(
    () => [
      {
        header: "Tenant",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.slug}</p>
          </div>
        ),
      },
      {
        header: "Cliente",
        accessorKey: "client_name",
      },
      {
        header: "Status",
        cell: ({ row }) => <StatusBadge value={row.original.status} />,
      },
      {
        header: "Usuários",
        accessorKey: "users_total",
      },
      {
        header: "Devices",
        accessorKey: "devices_total",
      },
      {
        header: "Atualizado",
        cell: ({ row }) => <DateCell value={row.original.updated_at} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <TenantDialog
              tenant={row.original}
              trigger={
                <Button size="icon" variant="ghost" aria-label="Editar tenant">
                  <Edit className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        ),
      },
    ],
    [],
  );

  if (tenantsQuery.isLoading) {
    return <SectionLoading screen variant="table" />;
  }

  if (tenantsQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar tenants."
        onRetry={() => void tenantsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <AdminListHeader
        icon={<Waypoints className="h-5 w-5" />}
        title="Tenants"
        description="Configure fazendas, timezone, localização e contexto operacional."
        meta={
          <Badge variant="secondary" className="rounded-full">
            {totalItems} tenants
          </Badge>
        }
        action={
          <TenantDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                Novo tenant
              </Button>
            }
          />
        }
      />
      <AdminDataTable
        columns={columns}
        data={tenants}
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
        empty={
          <SectionEmpty
            title="Nenhum tenant"
            description="Ajuste os filtros."
          />
        }
      />
    </div>
  );
};
