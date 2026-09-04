import {
  ChevronDown,
  Home,
  type LucideIcon,
  Menu,
  RadioTower,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { hasAccess, hasModule } from "@/modules/auth/access";
import { UserMenu } from "@/modules/auth/components/UserMenu";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { TenantSwitcher } from "@/modules/tenants/components/TenantSwitcher";
import { brandConfig } from "@/shared/brand";
import { BrandLogo } from "@/shared/components/BrandLogo";

type NavChild = {
  label: string;
  to: string;
  module?: string;
  permission?: string;
};

type NavItem = NavChild & {
  icon: LucideIcon;
  disabled?: boolean;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  {
    icon: Home,
    label: "Home",
    to: "/",
  },
  {
    icon: RadioTower,
    label: "Pivôs",
    to: "/pivos",
    module: "pivot",
    permission: "pivot.read",
  },
];

const SideNav = () => {
  const { pathname } = useLocation();
  const permissions = useAuthStore((state) => state.permissions);
  const modules = useAuthStore((state) => state.modules);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setOpenGroups((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  return (
    <nav className="flex h-full flex-col gap-1 overflow-y-auto p-4">
      <div className="mb-6 flex shrink-0 items-center justify-center px-2">
        <BrandLogo
          tone="dark"
          className={cn(
            "w-auto",
            brandConfig.key === "hortishop"
              ? "h-9 max-w-[170px]"
              : "h-7 max-w-[140px]",
          )}
        />
      </div>
      {navItems.map(
        ({ icon: Icon, label, to, disabled, module, permission, children }) => {
          if (
            !hasAccess(permissions, permission) ||
            !hasModule(modules, module)
          ) {
            return null;
          }
          const visibleChildren =
            children?.filter(
              (child) =>
                hasAccess(permissions, child.permission) &&
                hasModule(modules, child.module),
            ) ?? [];
          if (children && visibleChildren.length === 0) {
            return null;
          }
          const hasChildren = visibleChildren.length > 0;
          const childActive = visibleChildren.some((child) =>
            pathname.startsWith(child.to),
          );
          const active =
            childActive ||
            (to === "/" ? pathname === "/" : pathname.startsWith(to));
          if (disabled) {
            return (
              <span
                key={label}
                aria-disabled="true"
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-frame-foreground/40"
              >
                <Icon className="h-4 w-4" />
                {label}
              </span>
            );
          }
          const expanded = hasChildren && (active || openGroups[label]);
          const itemClassName = cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-frame-foreground/80 hover:bg-white/10 hover:text-frame-foreground",
          );

          if (hasChildren) {
            return (
              <div key={label}>
                <button
                  type="button"
                  className={itemClassName}
                  onClick={() => toggleGroup(label)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="min-w-0 flex-1 text-left">{label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      expanded ? "rotate-180" : "text-frame-foreground/50",
                    )}
                  />
                </button>
                {expanded ? (
                  <div className="mt-1 space-y-1 border-l border-white/15 pl-4">
                    {visibleChildren.map((child) => {
                      const childActive = pathname === child.to;
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={cn(
                            "flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                            childActive
                              ? "bg-white/15 text-frame-foreground"
                              : "text-frame-foreground/65 hover:bg-white/10 hover:text-frame-foreground",
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div key={label}>
              <Link to={to} className={itemClassName}>
                <Icon className="h-4 w-4" />
                <span className="min-w-0 flex-1">{label}</span>
              </Link>
            </div>
          );
        },
      )}
    </nav>
  );
};

interface AppShellProps {
  title: string;
  children: ReactNode;
  fullBleed?: boolean;
  wide?: boolean;
}

export const AppShell = ({
  title,
  children,
  fullBleed = false,
  wide = false,
}: AppShellProps) => {
  const outerClass = fullBleed
    ? "h-screen overflow-hidden bg-background"
    : "min-h-screen bg-background";
  const wrapperClass = fullBleed ? "flex h-full flex-col lg:pl-64" : "lg:pl-64";
  const mainClass = fullBleed
    ? "min-h-0 flex-1 overflow-hidden"
    : cn(
        "mx-auto w-full max-w-md space-y-6 px-4 py-5 lg:space-y-8 lg:px-10 lg:py-8",
        wide ? "lg:max-w-[1760px]" : "lg:max-w-[1400px]",
      );

  return (
    <div className={outerClass}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-frame text-frame-foreground lg:block">
        <SideNav />
      </aside>

      <div className={wrapperClass}>
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
            <BrandLogo
              tone="dark"
              className={cn(
                "w-auto",
                brandConfig.key === "hortishop"
                  ? "h-8 max-w-[132px]"
                  : "h-6 max-w-[112px]",
              )}
            />
          </div>

          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:gap-3">
            <TenantSwitcher />
            <UserMenu />
          </div>
        </header>

        <main className={mainClass}>{children}</main>
      </div>
    </div>
  );
};
