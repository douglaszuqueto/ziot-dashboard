import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  fetchAuthMe,
  fetchUserTenants,
  loginRequest,
  switchTenantRequest,
} from "@/modules/auth/api/auth.api";
import { useAuthStore } from "@/modules/auth/store/auth.store";
import { isUnauthorizedError } from "@/shared/api/error";
import type { SessionPersistence } from "@/shared/auth/session";
import { homeRoute } from "@/shared/lib/home-route";

const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;
const AUTH_TENANTS_QUERY_KEY = ["auth", "tenants"] as const;

export const useBootstrapAuth = () => {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const setSession = useAuthStore((state) => state.setSession);
  const markInitialized = useAuthStore((state) => state.markInitialized);
  const setBootstrapping = useAuthStore((state) => state.setBootstrapping);
  const initialized = useAuthStore((state) => state.initialized);

  return useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: async () => {
      if (!initialized) {
        setBootstrapping(true);
      }
      const token = restoreSession();
      if (!token) {
        markInitialized();
        return null;
      }

      const response = await fetchAuthMe(token);
      setSession({
        accessToken: token,
        expiresAt: undefined,
        persistence: useAuthStore.getState().persistence,
        user: response.user,
        tenant: response.tenant,
        member: response.member,
        memberships: response.memberships,
        permissions: response.permissions,
        modules: response.modules,
        policyVersion: response.policy_version,
      });

      return response;
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
      const response = await loginRequest({
        login: payload.login,
        password: payload.password,
      });

      return { response, persistence: payload.persistence };
    },
    onSuccess: ({ response, persistence }) => {
      queryClient.clear();
      setSession({
        accessToken: response.access_token,
        expiresAt: response.expires_at,
        persistence,
        user: response.user,
        tenant: response.tenant,
        member: response.member,
        memberships: response.memberships,
        permissions: response.permissions,
        modules: response.modules,
        policyVersion: response.policy_version,
      });
      void queryClient.invalidateQueries();
      navigate(homeRoute(response.tenant?.home_module), { replace: true });
    },
  });
};

export const useAuthTenantsQuery = () => {
  const token = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: AUTH_TENANTS_QUERY_KEY,
    queryFn: () => fetchUserTenants(token ?? ""),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
};

export const useSwitchTenantMutation = () => {
  const token = useAuthStore((state) => state.accessToken);
  const persistence = useAuthStore((state) => state.persistence);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (payload: { memberId: string; tenantId: string }) => {
      const response = await switchTenantRequest(token ?? "", {
        member_id: payload.memberId,
        tenant_id: payload.tenantId,
      });

      return response;
    },
    onSuccess: (response) => {
      queryClient.clear();
      setSession({
        accessToken: response.access_token,
        expiresAt: response.expires_at,
        persistence,
        user: response.user,
        tenant: response.tenant,
        member: response.member,
        memberships: response.memberships,
        permissions: response.permissions,
        modules: response.modules,
        policyVersion: response.policy_version,
      });
      navigate("/", { replace: true });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        clearSession();
      }
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const clearSession = useAuthStore((state) => state.clearSession);
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    void queryClient.clear();
    navigate("/login", { replace: true });
  };
};
