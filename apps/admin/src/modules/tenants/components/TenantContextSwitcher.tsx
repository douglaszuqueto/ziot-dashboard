import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { useMemo, useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTenantsQuery } from "@/modules/tenants/hooks/use-tenants";
import { useTenantContextStore } from "@/modules/tenants/store/tenant-context.store";

export const TenantContextSwitcher = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const tenantId = useTenantContextStore((state) => state.tenantId);
  const setTenantId = useTenantContextStore((state) => state.setTenantId);
  const tenantsQuery = useTenantsQuery({ perPage: 100 });
  const tenants = tenantsQuery.data?.data ?? [];
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId),
    [tenantId, tenants],
  );

  const selectTenant = (nextTenantId: string | null) => {
    setTenantId(nextTenantId);
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-frame-foreground hover:bg-white/10 hover:text-frame-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Globe2 className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {selectedTenant?.name ?? "Plataforma"}
              </span>
              <span className="block truncate text-xs text-frame-foreground/60">
                {selectedTenant?.client_name ?? "Contexto global"}
              </span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Buscar tenant..." />
          <CommandList>
            <CommandEmpty>Nenhum tenant encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => selectTenant(null)}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    tenantId === null ? "opacity-100" : "opacity-0",
                  )}
                />
                <div>
                  <p className="font-medium">Plataforma</p>
                  <p className="text-xs text-muted-foreground">
                    Contexto global
                  </p>
                </div>
              </CommandItem>
              {tenants.map((tenant) => (
                <CommandItem
                  key={tenant.id}
                  value={`${tenant.name} ${tenant.client_name}`}
                  onSelect={() => selectTenant(tenant.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      tenantId === tenant.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{tenant.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {tenant.client_name}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
