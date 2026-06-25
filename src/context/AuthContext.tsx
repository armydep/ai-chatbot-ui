import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { UserMeResponse } from "../types/api";
import { setAuthCallbacks } from "../api/client";
import { getMe } from "../api/auth";

interface AuthState {
  token: string | null;
  user: UserMeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    tokenRef.current = null;
  }, []);

  useEffect(() => {
    setAuthCallbacks(() => tokenRef.current, logout);
  }, [logout]);

  const login = useCallback(async (newToken: string) => {
    setToken(newToken);
    tokenRef.current = newToken;
    setIsLoading(true);
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      setToken(null);
      tokenRef.current = null;
      throw new Error("Failed to fetch user info");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: token !== null,
      isLoading,
      login,
      logout,
    }),
    [token, user, isLoading, login, logout],
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
