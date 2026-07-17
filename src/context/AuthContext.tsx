import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { UserMeResponse } from "../types/api";
import { setAuthCallbacks } from "../api/client";
import { getMe, logout as logoutRequest } from "../api/auth";

interface AuthState {
  user: UserMeResponse | null;
  isAuthenticated: boolean;
  // True until the initial session check (GET /auth/me) resolves. Consumers
  // like ProtectedRoute must wait for this before deciding to redirect —
  // otherwise a page reload would bounce straight to /login before we've
  // had a chance to ask the backend whether the session cookie is still valid.
  isInitializing: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setUser(null);
    try {
      // Clears the httpOnly cookie server-side — JS can't clear it itself.
      await logoutRequest();
    } catch {
      // Best-effort: local state is already cleared regardless of network failure.
    }
  }, []);

  useEffect(() => {
    setAuthCallbacks(() => setUser(null));
  }, []);

  // On mount (including a page reload), the browser may already be carrying
  // a valid session cookie — ask the server who that is instead of assuming
  // "logged out" just because there's no token in memory.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setUser(null);
      throw new Error("Failed to fetch user info");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      isLoading,
      login,
      logout,
    }),
    [user, isInitializing, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
