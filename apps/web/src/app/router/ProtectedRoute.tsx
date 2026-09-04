import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { SectionLoading } from "@/shared/components/states/QueryState";

export const ProtectedRoute = () => {
  const location = useLocation();
  const initialized = useAuthStore((state) => state.initialized);
  const bootstrapping = useAuthStore((state) => state.bootstrapping);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!initialized || bootstrapping) {
    return (
      <main className="flex min-h-[100dvh] w-full bg-background p-4 lg:p-8">
        <SectionLoading lines={3} screen />
      </main>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
