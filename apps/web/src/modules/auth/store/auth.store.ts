import { create } from "zustand";
import type {
  AuthMember,
  AuthMembership,
  AuthTenant,
  AuthUser,
} from "@/modules/auth/schemas/auth.schemas";
import {
  clearStoredSession,
  persistSession,
  readStoredSession,
  type SessionPersistence,
} from "@/shared/auth/session";

interface AuthState {
  accessToken: string | null;
  expiresAt?: string;
  persistence: SessionPersistence;
  initialized: boolean;
  bootstrapping: boolean;
  user: AuthUser | null;
  tenant: AuthTenant | null;
  member: AuthMember | null;
  memberships: AuthMembership[];
  permissions: string[];
  modules: string[];
  policyVersion?: number;
  setBootstrapping: (value: boolean) => void;
  markInitialized: () => void;
  restoreSession: () => string | null;
  setSession: (input: {
    accessToken: string;
    expiresAt?: string;
    persistence: SessionPersistence;
    user: AuthUser;
    tenant: AuthTenant;
    member: AuthMember;
    memberships: AuthMembership[];
    permissions: string[];
    modules: string[];
    policyVersion?: number;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  expiresAt: undefined,
  persistence: "session",
  initialized: false,
  bootstrapping: false,
  user: null,
  tenant: null,
  member: null,
  memberships: [],
  permissions: [],
  modules: [],
  policyVersion: undefined,
  setBootstrapping: (value) => set({ bootstrapping: value }),
  markInitialized: () => set({ initialized: true, bootstrapping: false }),
  restoreSession: () => {
    const snapshot = readStoredSession();
    if (!snapshot) {
      return null;
    }

    set({
      accessToken: snapshot.accessToken,
      expiresAt: snapshot.expiresAt,
      persistence: snapshot.persistence,
    });

    return snapshot.accessToken;
  },
  setSession: (input) => {
    persistSession(
      {
        accessToken: input.accessToken,
        expiresAt: input.expiresAt,
      },
      input.persistence,
    );

    set({
      accessToken: input.accessToken,
      expiresAt: input.expiresAt,
      persistence: input.persistence,
      user: input.user,
      tenant: input.tenant,
      member: input.member,
      memberships: input.memberships,
      permissions: input.permissions,
      modules: input.modules,
      policyVersion: input.policyVersion,
      initialized: true,
      bootstrapping: false,
    });
  },
  clearSession: () => {
    clearStoredSession();
    set({
      accessToken: null,
      expiresAt: undefined,
      user: null,
      tenant: null,
      member: null,
      memberships: [],
      permissions: [],
      modules: [],
      policyVersion: undefined,
      initialized: true,
      bootstrapping: false,
    });
  },
}));
