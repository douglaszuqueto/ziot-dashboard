import { lazy, type ReactNode, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { hasPermission } from "@/modules/auth/access";
import { AuthBootstrap } from "@/modules/auth/components/AuthBootstrap";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import {
  SectionLoading,
  type SectionLoadingVariant,
  type TableLoadingControls,
} from "@/shared/components/states/QueryState";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Access = lazy(() => import("@/pages/Access"));
const Clients = lazy(() => import("@/pages/Clients"));
const Tenants = lazy(() => import("@/pages/Tenants"));
const Users = lazy(() => import("@/pages/Users"));
const Memberships = lazy(() => import("@/pages/Memberships"));
const Devices = lazy(() => import("@/pages/Devices"));
const Gateways = lazy(() => import("@/pages/Gateways"));
const DeviceHealth = lazy(() => import("@/pages/DeviceHealth"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PublicRouterFallback = () => (
  <main className="mx-auto flex min-h-[100dvh] w-full max-w-[640px] items-center px-4 py-10">
    <SectionLoading lines={3} />
  </main>
);

const PublicLazyRoute = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<PublicRouterFallback />}>{children}</Suspense>
);

const ProtectedLazyRoute = ({
  children,
  loadingVariant,
  tableControls,
  requiredPermission,
}: {
  children: ReactNode;
  loadingVariant: SectionLoadingVariant;
  tableControls?: TableLoadingControls;
  requiredPermission?: string;
}) => (
  <AccessBoundary requiredPermission={requiredPermission}>
    <Suspense
      fallback={
        <SectionLoading
          screen
          lines={5}
          tableControls={tableControls}
          variant={loadingVariant}
        />
      }
    >
      {children}
    </Suspense>
  </AccessBoundary>
);

const AccessBoundary = ({
  children,
  requiredPermission,
}: {
  children: ReactNode;
  requiredPermission?: string;
}) => {
  const permissions = useAuthStore((state) => state.permissions);
  if (!hasPermission(permissions, requiredPermission)) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold text-foreground">
          Acesso indisponível
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Seu usuário não tem permissão para visualizar esta área.
        </p>
      </div>
    );
  }
  return children;
};

const RootRedirect = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrapping = useAuthStore((state) => state.bootstrapping);

  if (!initialized || bootstrapping) {
    return <PublicRouterFallback />;
  }

  return <Navigate to={accessToken ? "/dashboard" : "/login"} replace />;
};

const LoginRedirect = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrapping = useAuthStore((state) => state.bootstrapping);

  if (!initialized || bootstrapping) {
    return <PublicRouterFallback />;
  }

  return accessToken ? <Navigate to="/dashboard" replace /> : <Login />;
};

export const AppRouter = () => (
  <BrowserRouter>
    <AuthBootstrap>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <PublicLazyRoute>
              <LoginRedirect />
            </PublicLazyRoute>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedLazyRoute
                loadingVariant="dashboard"
                requiredPermission="platform.read"
              >
                <Dashboard />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/acessos"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="access.read"
              >
                <Access />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                tableControls="search-action"
                requiredPermission="clients.read"
              >
                <Clients />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/clientes/:id"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                tableControls="search-action"
                requiredPermission="clients.read"
              >
                <Clients />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/tenants"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="tenants.read"
              >
                <Tenants />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/tenants/:id"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="tenants.read"
              >
                <Tenants />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="users.read.platform"
              >
                <Users />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/usuarios/:id"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="users.read.platform"
              >
                <Users />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/memberships"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                tableControls="filter-action"
                requiredPermission="users.read.platform"
              >
                <Memberships />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/devices"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="inventory.read"
              >
                <Devices />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/devices/:id"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="inventory.read"
              >
                <Devices />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/gateways"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="gateways.read"
              >
                <Gateways />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/gateways/:id"
            element={
              <ProtectedLazyRoute
                loadingVariant="table"
                requiredPermission="gateways.read"
              >
                <Gateways />
              </ProtectedLazyRoute>
            }
          />
          <Route
            path="/relatorios/device-health"
            element={
              <ProtectedLazyRoute
                loadingVariant="report"
                requiredPermission="reports.read.platform"
              >
                <DeviceHealth />
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
