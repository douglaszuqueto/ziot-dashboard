import { create } from "zustand";

const STORAGE_KEY = "vizeos-admin:tenant-context";

const readStoredTenantId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value && value !== "platform" ? value : null;
};

export interface TenantContextState {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
}

export const useTenantContextStore = create<TenantContextState>((set) => ({
  tenantId: readStoredTenantId(),
  setTenantId: (tenantId) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, tenantId ?? "platform");
    }
    set({ tenantId });
  },
}));
