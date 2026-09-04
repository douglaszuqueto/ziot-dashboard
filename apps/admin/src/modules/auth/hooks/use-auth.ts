import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  adminLoginRequest,
  changeAdminPasswordRequest,
  fetchAdminMe,
} from "@/modules/auth/api/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import type { SessionPersistence } from "@/shared/auth/session";

const ADMIN_ME_QUERY_KEY = ["admin", "me"] as const;

export const useBootstrapAuth = () => {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const setSession = useAuthStore((state) => state.setSession);
  const markInitialized = useAuthStore((state) => state.markInitialized);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const clearSession = useAuthStore((state) => state.clearSession);

  return useQuery({
    queryKey: ADMIN_ME_QUERY_KEY,
    queryFn: async () => {
      setBootstrapping(true);
      const token = restoreSession();
      if (!token) {
        markInitialized();
        return null;
      }

      try {
        const response = await fetchAdminMe(token);
        setSession({
          accessToken: token,
          expiresAt: undefined,
          persistence: useAuthStore.getState().persistence,
          admin: response.admin,
          permissions: response.permissions,
          policyVersion: response.policy_version,
        });
        return response;
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
};

export const useLoginMutation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async (payload: {
      login: string;
      password: string;
      persistence: SessionPersistence;
    }) => {
      const response = await adminLoginRequest({
        login: payload.login,
        password: payload.password,
      });

      if (!response.access_token) {
        throw new Error("Resposta de login sem access_token");
      }

      return { response, persistence: payload.persistence };
    },
    onSuccess: ({ response, persistence }) => {
      setSession({
        accessToken: response.access_token ?? "",
        expiresAt: response.expires_at,
        persistence,
        admin: response.admin,
        permissions: response.permissions,
        policyVersion: response.policy_version,
      });
      void queryClient.invalidateQueries();
      navigate("/dashboard", { replace: true });
    },
  });
};

export const useChangePasswordMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const updateAdmin = useAuthStore((state) => state.updateAdmin);

  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      changeAdminPasswordRequest(token ?? "", {
        current_password: payload.currentPassword,
        new_password: payload.newPassword,
      }),
    onSuccess: (response) => {
      updateAdmin({
        admin: response.admin,
        permissions: response.permissions,
        policyVersion: response.policy_version,
      });
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    queryClient.clear();
    navigate("/login", { replace: true });
  };
};
