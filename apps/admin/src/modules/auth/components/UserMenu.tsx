import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/modules/auth/hooks/use-auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { getInitials } from "@/shared/lib/format";

export const UserMenu = () => {
  const admin = useAuthStore((state) => state.admin);
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"
          aria-label="Abrir menu do administrador"
        >
          <Avatar className="h-10 w-10 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/15 text-sm font-semibold text-primary">
              {getInitials(admin?.name).slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block text-sm font-semibold text-foreground">
            {admin?.name ?? "Administrador"}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {admin?.email ?? "sem e-mail"}
          </span>
          <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
            {admin?.role ?? "platform"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
