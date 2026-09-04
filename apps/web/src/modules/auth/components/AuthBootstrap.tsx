import { type ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBootstrapAuth } from "@/modules/auth/hooks/use-auth";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { isUnauthorizedError } from "@/shared/api/error";

export const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const markInitialized = useAuthStore((state) => state.markInitialized);
  const { error } = useBootstrapAuth();

  useEffect(() => {
    if (isUnauthorizedError(error)) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    if (error) {
      markInitialized();
    }
  }, [clearSession, error, markInitialized, navigate]);

  return <>{children}</>;
};
