import { ExitIcon } from "@radix-ui/react-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/modules/auth/hooks/use-auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { getInitials } from "@/shared/lib/format";
import { paletteOptions, usePalette } from "@/shared/theme/palette";

export const UserMenu = () => {
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const tenant = useAuthStore((state) => state.tenant);
  const { palette, setPalette } = usePalette();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary lg:flex"
        >
          <Avatar className="h-10 w-10 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/15 text-sm font-semibold text-primary">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold text-foreground">
            {user?.name ?? "Usuário"}
          </p>
          <p className="text-xs font-normal text-muted-foreground">
            {user?.email ?? "sem e-mail"}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {tenant?.name ?? "Sem tenant"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Troca de paleta em runtime, persistida por navegador (ver shared/theme/palette.ts). */}
        <DropdownMenuLabel className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
          Paleta
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={palette}
          onValueChange={(value) => setPalette(value)}
        >
          {paletteOptions.map((option) => (
            <DropdownMenuRadioItem key={option.key} value={option.key}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={logout}
          className="gap-2 text-alert focus:text-alert"
        >
          <ExitIcon className="h-4 w-4" />
          Sair da plataforma
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
