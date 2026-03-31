import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface StoredAuthUser extends AuthUser {
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (input: { email: string; password: string }) => void;
  signUp: (input: { name: string; email: string; password: string }) => void;
  signOut: () => void;
}

interface AuthState {
  accounts: StoredAuthUser[];
  user: AuthUser | null;
}

const ACCOUNTS_STORAGE_KEY = "carculator_auth_accounts";
const SESSION_STORAGE_KEY = "carculator_auth_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isStoredAuthUser(value: unknown): value is StoredAuthUser {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.password === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function parseStoredValue<T>(raw: string | null, guard: (value: unknown) => value is T, fallback: T): T {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    return guard(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function isStoredAuthUsers(value: unknown): value is StoredAuthUser[] {
  return Array.isArray(value) && value.every(isStoredAuthUser);
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.createdAt === "string"
  );
}

function toPublicUser(account: StoredAuthUser): AuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createAuthId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `auth_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function registerAccount(
  accounts: StoredAuthUser[],
  input: { name: string; email: string; password: string },
) {
  const email = normalizeEmail(input.email);

  if (accounts.some((account) => account.email === email)) {
    throw new Error("account_exists");
  }

  const account: StoredAuthUser = {
    id: createAuthId(),
    name: input.name.trim(),
    email,
    password: input.password,
    createdAt: new Date().toISOString(),
  };

  return {
    accounts: [...accounts, account],
    user: toPublicUser(account),
  };
}

export function authenticateAccount(
  accounts: StoredAuthUser[],
  input: { email: string; password: string },
) {
  const email = normalizeEmail(input.email);
  const account = accounts.find(
    (candidate) => candidate.email === email && candidate.password === input.password,
  );

  return account ? toPublicUser(account) : null;
}

function readAccounts() {
  if (!canUseStorage()) return [];

  return parseStoredValue(
    window.localStorage.getItem(ACCOUNTS_STORAGE_KEY),
    isStoredAuthUsers,
    [],
  );
}

function readSession(accounts: StoredAuthUser[]) {
  if (!canUseStorage()) return null;

  const storedUser = parseStoredValue<AuthUser | null>(
    window.localStorage.getItem(SESSION_STORAGE_KEY),
    (value): value is AuthUser | null => value === null || isAuthUser(value),
    null,
  );

  if (!storedUser) return null;

  const matchingAccount = accounts.find((account) => account.id === storedUser.id);
  return matchingAccount ? toPublicUser(matchingAccount) : null;
}

function createInitialAuthState(): AuthState {
  const accounts = readAccounts();
  return {
    accounts,
    user: readSession(accounts),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(createInitialAuthState);

  useEffect(() => {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(state.accounts));
  }, [state.accounts]);

  useEffect(() => {
    if (!canUseStorage()) return;

    if (!state.user) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state.user));
  }, [state.user]);

  const value = useMemo<AuthContextValue>(() => ({
    user: state.user,
    signIn: (input) => {
      const user = authenticateAccount(state.accounts, input);

      if (!user) {
        throw new Error("invalid_credentials");
      }

      setState((current) => ({
        ...current,
        user,
      }));
    },
    signUp: (input) => {
      const result = registerAccount(state.accounts, input);
      setState(result);
    },
    signOut: () => {
      setState((current) => ({
        ...current,
        user: null,
      }));
    },
  }), [state.accounts, state.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
