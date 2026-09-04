export type SessionPersistence = "local" | "session";

export interface AuthSessionSnapshot {
  accessToken: string;
  expiresAt?: string;
}

const SESSION_KEY = "vizeos-admin.auth";

const storages = {
  local: () => window.localStorage,
  session: () => window.sessionStorage,
} as const;

const readFromStorage = (storage: Storage): AuthSessionSnapshot | null => {
  const raw = storage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSessionSnapshot;
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }
};

export const readStoredSession = ():
  | (AuthSessionSnapshot & { persistence: SessionPersistence })
  | null => {
  const local = readFromStorage(storages.local());
  if (local) {
    return { ...local, persistence: "local" };
  }

  const session = readFromStorage(storages.session());
  if (session) {
    return { ...session, persistence: "session" };
  }

  return null;
};

export const persistSession = (
  snapshot: AuthSessionSnapshot,
  persistence: SessionPersistence,
) => {
  clearStoredSession();
  storages[persistence]().setItem(SESSION_KEY, JSON.stringify(snapshot));
};

export const clearStoredSession = () => {
  storages.local().removeItem(SESSION_KEY);
  storages.session().removeItem(SESSION_KEY);
};
