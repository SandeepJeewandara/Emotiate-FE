import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthUser } from '../types';
import { setToken, clearToken } from '../api';

interface AuthContextValue {
  user:    AuthUser | null;
  login:   (user: AuthUser) => void;
  logout:  () => void;
}

const AuthCtx = createContext<AuthContextValue>({
  user: null, login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem('el_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const login = (u: AuthUser) => {
    setToken(u.token);
    localStorage.setItem('el_user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem('el_user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
