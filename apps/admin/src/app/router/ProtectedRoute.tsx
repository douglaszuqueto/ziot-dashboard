import { Navigate, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { SectionLoading } from "@/shared/components/states/QueryState";

export const ProtectedRoute = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrapping = useAuthStore((state) => state.bootstrapping);

  if (!initialized || bootstrapping) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1500px] items-center px-4 py-10 lg:px-10">
        <SectionLoading screen lines={3} />
      </main>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};
