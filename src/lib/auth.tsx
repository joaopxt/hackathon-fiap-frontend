'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from './api';
import type { User } from './types';

interface AuthResponse {
  accessToken: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const login = useCallback(
    (email: string, password: string) =>
      api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }).then(
        handleAuth,
      ),
    [handleAuth],
  );

  const register = useCallback(
    (name: string, email: string, password: string) =>
      api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      }).then(handleAuth),
    [handleAuth],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
