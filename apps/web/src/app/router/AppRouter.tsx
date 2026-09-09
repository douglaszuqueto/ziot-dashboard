import type { ReactNode } from "react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { hasAccess, hasModule } from "@/modules/auth/access";
import { AuthBootstrap } from "@/modules/auth/components/AuthBootstrap";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  SectionLoading,
  type SectionLoadingVariant,
} from "@/shared/components/states/QueryState";
import { homeRoute } from "@/shared/lib/home-route";

const Login = lazy(() => import("@/pages/Login"));
const Index = lazy(() => import("@/pages/Index"));
const Pivots = lazy(() => import("@/pages/Pivots"));
const PivotDetail = lazy(() => import("@/pages/PivotDetail"));
const PivotEditor = lazy(() => import("@/pages/PivotEditor"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const FullScreenFallback = () => (
  <main className="flex min-h-[100dvh] w-full bg-background p-4 lg:p-8">
    <SectionLoading lines={3} screen />
  </main>
);

const RouteFallback = ({
  fullBleed = false,
  variant = "generic",
}: {
  fullBleed?: boolean;
  variant?: SectionLoadingVariant;
}) =>
  fullBleed ? null : <SectionLoading lines={3} screen variant={variant} />;

const PublicLazyRoute = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<FullScreenFallback />}>{children}</Suspense>
);

const ProtectedLazyRoute = ({
  children,
  title,
  fullBleed = false,
  loadingVariant = "generic",
  requiredPermission,
  requiredModule,
}: {
  children: ReactNode;
  title: string;
  fullBleed?: boolean;
  loadingVariant?: SectionLoadingVariant;
  requiredPermission?: string;
  requiredModule?: string;
}) => (
  <AccessBoundary
    fullBleed={fullBleed}
    requiredModule={requiredModule}
    requiredPermission={requiredPermission}
    title={title}
  >
    <Suspense
      fallback={
        <AppShell title={title} fullBleed={fullBleed}>
          <RouteFallback fullBleed={fullBleed} variant={loadingVariant} />
        </AppShell>
      }
    >
      {children}
    </Suspense>
  </AccessBoundary>
);

const AccessBoundary = ({
  children,
  fullBleed = false,
  requiredModule,
  requiredPermission,
  title,
}: {
  children: ReactNode;
  fullBleed?: boolean;
  requiredModule?: string;
  requiredPermission?: string;
  title: string;
}) => {
  const permissions = useAuthStore((state) => state.permissions);
  const modules = useAuthStore((state) => state.modules);
  const allowed =
    hasAccess(permissions, requiredPermission) &&
    hasModule(modules, requiredModule);

  if (!allowed) {
    return (
      <AppShell title={title} fullBleed={fullBleed}>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold text-foreground">
            Acesso indisponível
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu usuário não tem permissão para visualizar esta área.
          </p>
        </section>
      </AppShell>
    );
  }

  return children;
};

// A Home fica em `/`; tenants com `home_module` configurado são levados à
// tela do módulo (ver `homeRoute`) sem passar pela Home vazia.
const HomeRoute = () => {
  const tenant = useAuthStore((state) => state.tenant);
  const target = homeRoute(tenant?.home_module);

  if (target !== "/") {
    return <Navigate to={target} replace />;
  }

  return (
    <ProtectedLazyRoute title="Home">
      <Index />
    </ProtectedLazyRoute>
  );
};

const LoginRedirect = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrapping = useAuthStore((state) => state.bootstrapping);
  const tenant = useAuthStore((state) => state.tenant);

  if (!initialized || bootstrapping) {
    return <FullScreenFallback />;
  }

  return accessToken ? (
    <Navigate to={homeRoute(tenant?.home_module)} replace />
  ) : (
    <PublicLazyRoute>
      <Login />
    </PublicLazyRoute>
  );
};

export const AppRouter = () => (
  <BrowserRouter>
    <AuthBootstrap>
      <Routes>
        <Route path="/login" element={<LoginRedirect />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomeRoute />} />
          <Route
            path="/pivos"
            element={
              <ProtectedLazyRoute
                title="Pivôs"
                loadingVariant="list"
                requiredModule="pivot"
                requiredPermission="pivot.read"
              >
                <Pivots />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/pivos/novo"
            element={
              <ProtectedLazyRoute
                title="Novo pivô"
                loadingVariant="detail"
                requiredModule="pivot"
                requiredPermission="pivot.write"
              >
                <PivotEditor />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/pivos/:id/editar"
            element={
              <ProtectedLazyRoute
                title="Editar pivô"
                loadingVariant="detail"
                requiredModule="pivot"
                requiredPermission="pivot.write"
              >
                <PivotEditor />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/pivos/:id"
            element={
              <ProtectedLazyRoute
                title="Pivô"
                loadingVariant="detail"
                requiredModule="pivot"
                requiredPermission="pivot.read"
              >
                <PivotDetail />
              </ProtectedLazyRoute>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <PublicLazyRoute>
              <NotFound />
            </PublicLazyRoute>
          }
        />
      </Routes>
    </AuthBootstrap>
  </BrowserRouter>
);
