import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAuthTenantsQuery,
  useSwitchTenantMutation,
} from "@/modules/auth/hooks/use-auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";

export const TenantSwitcher = () => {
  const currentTenant = useAuthStore((state) => state.tenant);
  const currentMember = useAuthStore((state) => state.member);
  const { data } = useAuthTenantsQuery();
  const switchTenant = useSwitchTenantMutation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex max-w-[190px] items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/20 lg:max-w-none lg:bg-card lg:px-4 lg:py-2 lg:text-sm lg:text-foreground lg:shadow-[var(--shadow-card)] lg:hover:bg-secondary"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          <span className="truncate">{currentTenant?.name ?? "Tenant"}</span>
          <CaretSortIcon className="h-4 w-4 shrink-0 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Selecionar tenant
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data?.data.map((membership) => {
          const active = membership.id === currentMember?.id;
          return (
            <DropdownMenuItem
              key={membership.id}
              disabled={switchTenant.isPending || active}
              onSelect={() =>
                switchTenant.mutate({
                  memberId: membership.id,
                  tenantId: membership.tenant_id,
                })
              }
              className="flex items-start justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {membership.tenant.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {membership.tenant.timezone} · {membership.role}
                </p>
              </div>
              {active ? (
                <CheckIcon className="mt-0.5 h-4 w-4 text-primary" />
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
