import type { ReactNode } from "react";
import { useBootstrapAuth } from "@/modules/auth/hooks/use-auth";

export const AuthBootstrap = ({ children }: { children: ReactNode }) => {
  useBootstrapAuth();
  return <>{children}</>;
};
