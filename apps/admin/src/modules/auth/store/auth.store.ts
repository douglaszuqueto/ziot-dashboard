import { create } from "zustand";
import type { Admin } from "@/modules/auth/schemas/auth.schemas";
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
  admin: Admin | null;
  permissions: string[];
  policyVersion?: number;
  setBootstrapping: (value: boolean) => void;
  markInitialized: () => void;
  restoreSession: () => string | null;
  setSession: (input: {
    accessToken: string;
    expiresAt?: string;
    persistence: SessionPersistence;
    admin: Admin;
    permissions: string[];
    policyVersion?: number;
  }) => void;
  updateAdmin: (input: {
    admin: Admin;
    permissions: string[];
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
  admin: null,
  permissions: [],
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
      admin: input.admin,
      permissions: input.permissions,
      policyVersion: input.policyVersion,
      initialized: true,
      bootstrapping: false,
    });
  },
  updateAdmin: (input) =>
    set({
      admin: input.admin,
      permissions: input.permissions,
      policyVersion: input.policyVersion,
    }),
  clearSession: () => {
    clearStoredSession();
    set({
      accessToken: null,
      expiresAt: undefined,
      admin: null,
      permissions: [],
      policyVersion: undefined,
      initialized: true,
      bootstrapping: false,
    });
  },
}));
