"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getProfile, logout as apiLogout } from "@/lib/api";

export interface User {
  id: number;
  username?: string;
  email: string;
  full_name: string;
  phone?: string;
  role: "customer" | "admin";
  /** Present after getProfile(); false for Google-only accounts until they set a password. */
  has_password?: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Bounded wait so admin layout never stays on “Loading admin panel…” if the profile request stalls. */
const PROFILE_FETCH_MS = 18_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), PROFILE_FETCH_MS);
    try {
      const data = await getProfile({ signal: controller.signal });
      setUserState(data as User | null);
    } catch {
      setUserState(null);
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUserState(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        setUser: setUserState,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
