import { Check, ChevronsUpDown, Save, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  usePermissionsQuery,
  useRolesQuery,
  useTenantModulesQuery,
  useUpdateRoleMutation,
  useUpdateTenantModulesMutation,
} from "@/modules/access/hooks/use-access";
import type {
  AccessPermission,
  AccessRole,
  TenantModule,
} from "@/modules/access/schemas/access.schemas";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";
import { AdminListHeader } from "@/shared/components/AdminTable";
import {
  SectionEmpty,
  SectionError,
  SectionLoading,
} from "@/shared/components/states/QueryState";

const audienceOptions = [
  { label: "Tenant", value: "tenant" },
  { label: "Plataforma", value: "platform" },
];

const emptyRoles: AccessRole[] = [];

const gatewayPlatformPermissions: AccessPermission[] = [
  {
    code: "gateways.read",
    audience: "platform",
    module: "gateways",
    resource: "gateways",
    action: "read",
    description: "Visualizar gateways",
    created_at: "",
  },
  {
    code: "gateways.manage",
    audience: "platform",
    module: "gateways",
    resource: "gateways",
    action: "manage",
    description: "Gerenciar gateways",
    created_at: "",
  },
];

const ensurePlatformGatewayPermissions = (
  audience: string,
  permissions: AccessPermission[],
) => {
  if (audience !== "platform") {
    return permissions;
  }

  const knownCodes = new Set(permissions.map((permission) => permission.code));
  const missingGatewayPermissions = gatewayPlatformPermissions.filter(
    (permission) => !knownCodes.has(permission.code),
  );

  return [...permissions, ...missingGatewayPermissions];
};

const groupPermissions = (permissions: AccessPermission[]) => {
  const groups = new Map<string, AccessPermission[]>();
  for (const permission of permissions) {
    const group = groups.get(permission.module) ?? [];
    group.push(permission);
    groups.set(permission.module, group);
  }
  return Array.from(groups.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );
};

const formatModuleName = (value: string) =>
  value
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getPermissionLabel = (permission: AccessPermission) =>
  permission.description || permission.code;

const RoleList = ({
  roles,
  selectedRoleId,
  onSelectRole,
}: {
  roles: AccessRole[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
}) => (
  <div className="flex flex-col gap-3">
    <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
      Funções
    </p>
    <div className="flex flex-col gap-1">
      {roles.map((role) => (
        <button
          key={role.id}
          type="button"
          onClick={() => onSelectRole(role.id)}
          className={cn(
            "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            role.id === selectedRoleId && "bg-primary/10 text-primary",
          )}
        >
          <span>
            <span className="block text-sm font-semibold text-foreground">
              {role.name}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {role.code}
            </span>
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {role.permissions.length}
          </span>
        </button>
      ))}
    </div>
  </div>
);

const TenantCombobox = ({
  tenantId,
  onTenantChange,
}: {
  tenantId: string;
  onTenantChange: (tenantId: string) => void;
}) => {
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const [open, setOpen] = useState(false);
  const tenants = tenantsQuery.data?.data ?? [];
  const selectedTenant = tenants.find((tenant) => tenant.id === tenantId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between bg-white lg:w-80"
        >
          <span className="truncate">
            {selectedTenant?.name ?? "Nenhum tenant selecionado"}
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar tenant..." />
          <CommandList>
            <CommandEmpty>Nenhum tenant encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onTenantChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    tenantId ? "opacity-0" : "opacity-100",
                  )}
                />
                Nenhum tenant
              </CommandItem>
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={`${tenant.name} ${tenant.id}`}
                  onSelect={() => {
                    onTenantChange(tenant.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      tenant.id === tenantId ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{tenant.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const TenantModulesPanel = ({
  tenantId,
  modules,
  permissionCountByModule,
  isLoading,
  isUpdating,
  onTenantChange,
  onModuleChange,
}: {
  tenantId: string;
  modules: TenantModule[];
  permissionCountByModule: Map<string, number>;
  isLoading: boolean;
  isUpdating: boolean;
  onTenantChange: (tenantId: string) => void;
  onModuleChange: (module: string, enabled: boolean) => void;
}) => {
  const enabledCount = modules.filter((item) => item.enabled).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Módulos do tenant
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabledCount}/{modules.length} módulos habilitados neste tenant.
          </p>
        </div>
        <TenantCombobox tenantId={tenantId} onTenantChange={onTenantChange} />
      </div>

      {!tenantId ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <SectionEmpty
              title="Nenhum tenant selecionado"
              description="Selecione um tenant para habilitar ou bloquear módulos."
            />
          </CardContent>
        </Card>
      ) : isLoading ? (
        <SectionLoading lines={4} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((item) => (
            <Card key={item.module} className="shadow-[var(--shadow-card)]">
              <CardContent className="flex min-h-20 items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {formatModuleName(item.module)}
                  </p>
                  <p className="mt-1 truncate text-xs font-mono text-muted-foreground">
                    {item.module} ·{" "}
                    {permissionCountByModule.get(item.module) ?? 0} permissões
                  </p>
                </div>
                <Switch
                  checked={item.enabled}
                  disabled={isUpdating}
                  onCheckedChange={(checked) =>
                    onModuleChange(item.module, checked)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const RolePermissionEditor = ({
  permissions,
  role,
}: {
  permissions: AccessPermission[];
  role?: AccessRole;
}) => {
  const updateRole = useUpdateRoleMutation();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(role?.permissions ?? []),
  );

  useEffect(() => {
    setSelected(new Set(role?.permissions ?? []));
  }, [role]);

  if (!role) {
    return (
      <Card className="shadow-[var(--shadow-card)]">
        <CardContent className="p-6">
          <SectionEmpty
            title="Selecione uma função"
            description="Escolha uma função na lateral para ajustar suas permissões."
          />
        </CardContent>
      </Card>
    );
  }

  const grouped = groupPermissions(permissions);
  const grantedCount = selected.size;
  const hasChanges =
    Array.from(selected).sort().join("|") !==
    [...role.permissions].sort().join("|");

  const toggle = (code: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const save = () =>
    updateRole.mutate(
      {
        id: role.id,
        payload: {
          audience: role.audience,
          code: role.code,
          name: role.name,
          description: role.description,
          status: role.status,
          permissions: Array.from(selected).sort(),
        },
      },
      {
        onSuccess: () => toast.success("Permissões salvas."),
        onError: () => toast.error("Não foi possível salvar as permissões."),
      },
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Permissões de {role.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {role.code} · {grantedCount} permissões concedidas
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={save} disabled={!hasChanges || updateRole.isPending}>
            <Save data-icon="inline-start" />
            {updateRole.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card className="shadow-[var(--shadow-card)]">
          <CardContent className="p-6">
            <SectionEmpty
              title="Nenhuma permissão encontrada"
              description="Ajuste o termo de busca para visualizar permissões."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {grouped.map(([module, modulePermissions]) => {
            const total = modulePermissions.length;
            const enabled = modulePermissions.filter((permission) =>
              selected.has(permission.code),
            ).length;

            return (
              <Card
                key={module}
                className="overflow-hidden shadow-[var(--shadow-card)]"
              >
                <CardHeader className="flex flex-row items-center justify-between gap-3 border-b p-4">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.24em] text-foreground">
                    {formatModuleName(module)}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="rounded-md bg-primary/10 px-2 text-primary"
                  >
                    {enabled}/{total}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 p-4">
                  {modulePermissions.map((permission) => {
                    const permissionId = `permission-${permission.code.replaceAll(".", "-")}`;

                    return (
                      <div
                        key={permission.code}
                        className="flex min-h-9 items-start gap-3 rounded-lg p-1 transition-colors hover:bg-muted/60"
                      >
                        <Checkbox
                          id={permissionId}
                          aria-label={permission.code}
                          checked={selected.has(permission.code)}
                          onCheckedChange={() => toggle(permission.code)}
                        />
                        <label
                          htmlFor={permissionId}
                          className="min-w-0 cursor-pointer"
                        >
                          <span className="block text-sm font-medium leading-5">
                            {getPermissionLabel(permission)}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {permission.code}
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AccessPage = () => {
  const [audience, setAudience] = useState("tenant");
  const [activeTab, setActiveTab] = useState("permissions");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const contextTenantId = useTenantContextStore((state) => state.tenantId);
  const [tenantId, setTenantId] = useState(contextTenantId ?? "");
  const permissionsQuery = usePermissionsQuery(audience);
  const rolesQuery = useRolesQuery(audience);
  const modulesQuery = useTenantModulesQuery(tenantId);
  const updateModules = useUpdateTenantModulesMutation(tenantId);
  const roles = rolesQuery.data?.data ?? emptyRoles;
  const modules = modulesQuery.data?.data ?? [];
  const moduleState = useMemo(
    () =>
      Object.fromEntries(
        modules.map((item) => [item.module, item.enabled] as const),
      ),
    [modules],
  );

  useEffect(() => {
    setTenantId(contextTenantId ?? "");
  }, [contextTenantId]);

  useEffect(() => {
    if (audience !== "tenant") {
      setActiveTab("permissions");
    }
  }, [audience]);

  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId("");
      return;
    }
    if (!roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  if (permissionsQuery.isLoading || rolesQuery.isLoading) {
    return <SectionLoading screen variant="table" />;
  }

  if (permissionsQuery.isError || rolesQuery.isError) {
    return (
      <SectionError
        message="Não foi possível carregar controle de acesso."
        onRetry={() => {
          void permissionsQuery.refetch();
          void rolesQuery.refetch();
        }}
      />
    );
  }

  const permissions = ensurePlatformGatewayPermissions(
    audience,
    permissionsQuery.data?.data ?? [],
  );
  const permissionCountByModule = new Map<string, number>();
  for (const permission of permissions) {
    permissionCountByModule.set(
      permission.module,
      (permissionCountByModule.get(permission.module) ?? 0) + 1,
    );
  }
  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const setModule = (module: string, enabled: boolean) => {
    updateModules.mutate({ ...moduleState, [module]: enabled });
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminListHeader
        icon={<ShieldCheck className="size-5" />}
        title="Acessos"
        description="Gerencie roles, claims e módulos habilitados por tenant."
        action={
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-full bg-white sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {audienceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-11 w-fit rounded-xl bg-muted/70 p-1">
          <TabsTrigger className="rounded-lg" value="permissions">
            Funções & Permissões
          </TabsTrigger>
          {audience === "tenant" ? (
            <TabsTrigger className="rounded-lg" value="modules">
              Módulos
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="permissions" className="mt-6">
          <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="h-fit shadow-[var(--shadow-card)] xl:sticky xl:top-6">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="size-4 text-primary" />
                  Controle de acesso
                </CardTitle>
                <CardDescription>
                  Selecione a função para ajustar permissões.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <RoleList
                  roles={roles}
                  selectedRoleId={selectedRole?.id ?? ""}
                  onSelectRole={setSelectedRoleId}
                />
              </CardContent>
            </Card>

            <RolePermissionEditor
              permissions={permissions}
              role={selectedRole}
            />
          </div>
        </TabsContent>

        {audience === "tenant" ? (
          <TabsContent value="modules" className="mt-6">
            <TenantModulesPanel
              tenantId={tenantId}
              modules={modules}
              permissionCountByModule={permissionCountByModule}
              isLoading={modulesQuery.isLoading}
              isUpdating={updateModules.isPending}
              onTenantChange={setTenantId}
              onModuleChange={setModule}
            />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
};
