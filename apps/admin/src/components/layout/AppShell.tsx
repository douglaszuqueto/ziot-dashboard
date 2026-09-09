import {
  Activity,
  Building2,
  Cpu,
  LayoutDashboard,
  Menu,
  Router,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Waypoints,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/modules/auth/access";
import { UserMenu } from "@/modules/auth/components/UserMenu";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { TenantContextSwitcher } from "@/modules/tenants/components/TenantContextSwitcher";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    to: "/dashboard",
    permission: "platform.read",
    section: "Global",
  },
  {
    icon: Building2,
    label: "Clientes",
    to: "/clientes",
    permission: "clients.read",
    section: "Global",
  },
  {
    icon: Waypoints,
    label: "Tenants",
    to: "/tenants",
    permission: "tenants.read",
    section: "Global",
  },
  {
    icon: Users,
    label: "Usuários",
    to: "/usuarios",
    permission: "users.read.platform",
    section: "Global",
  },
  {
    icon: Cpu,
    label: "Dispositivos",
    to: "/devices",
    permission: "inventory.read",
    section: "Global",
  },
  {
    icon: Router,
    label: "Gateways",
    to: "/gateways",
    permission: "gateways.read",
    section: "Global",
  },
  {
    icon: SlidersHorizontal,
    label: "Acessos",
    to: "/acessos",
    permission: "access.read",
    section: "Contexto",
  },
  {
    icon: ShieldCheck,
    label: "Membros",
    to: "/memberships",
    permission: "users.read.platform",
    section: "Contexto",
  },
  {
    icon: Activity,
    label: "Relatórios",
    to: "/relatorios/device-health",
    permission: "reports.read.platform",
    section: "Contexto",
  },
];

const navSections = ["Global", "Contexto"] as const;

const titles = new Map(navItems.map((item) => [item.to, item.label]));

const resolveTitle = (pathname: string) => {
  if (pathname.startsWith("/relatorios")) {
    return "Relatórios";
  }
  const match = navItems.find((item) => pathname.startsWith(item.to));
  return match ? match.label : (titles.get(pathname) ?? "Ziot Admin");
};

const SideNav = () => {
  const { pathname } = useLocation();
  const permissions = useAuthStore((state) => state.permissions);
  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <div className="mb-4 flex h-10 shrink-0 items-center justify-center px-2">
        <img
          src="/brand/ziot-wordmark-white.png"
          alt="Ziot Admin"
          className="h-7 w-auto"
        />
      </div>
      <div className="mb-4 shrink-0">
        <TenantContextSwitcher />
      </div>
      {navSections.map((section, sectionIndex) => {
        const visibleItems = navItems.filter(
          (item) =>
            item.section === section &&
            hasPermission(permissions, item.permission),
        );

        if (visibleItems.length === 0) {
          return null;
        }

        return (
          <div
            key={section}
            className={cn(
              "space-y-1",
              sectionIndex > 0 &&
                "mt-3 border-t border-frame-foreground/10 pt-3",
            )}
          >
            {visibleItems.map(({ icon: Icon, label, to }) => {
              const active =
                to === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(to);
              return (
                <Link
                  key={label}
                  to={to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-frame-foreground/80 hover:bg-white/10 hover:text-frame-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
};

export const AppShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const title = resolveTitle(pathname);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-frame text-frame-foreground lg:block">
        <SideNav />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-2 bg-frame px-4 py-3 text-frame-foreground lg:border-b lg:border-border lg:bg-background lg:px-8 lg:py-4 lg:text-foreground">
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-white/20 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 border-0 bg-frame p-0 text-frame-foreground"
            >
              <SideNav />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/favicon.png"
              alt="Ziot"
              className="h-9 w-9 rounded-xl bg-white/10 p-1.5"
            />
            <p className="text-sm font-semibold">Ziot Admin</p>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
            <UserMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1680px] space-y-6 px-4 py-5 lg:space-y-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};
