import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as authStorage from './authStorage';
import type {Session} from './authStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: Session | null;
  loading: boolean;
  signup: (data: {name: string; email: string; password: string}) => Promise<void>;
  login: (data: {email: string; password: string}) => Promise<void>;
  logout: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore persisted session on mount
  useEffect(() => {
    (async () => {
      const session = await authStorage.getSession();
      setUser(session);
      setLoading(false);
    })();
  }, []);

  const signup = useCallback(
    async (data: {name: string; email: string; password: string}) => {
      const session = await authStorage.signup(data);
      setUser(session);
    },
    [],
  );

  const login = useCallback(async (data: {email: string; password: string}) => {
    const session = await authStorage.login(data);
    setUser(session);
  }, []);

  const logout = useCallback(async () => {
    await authStorage.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{user, loading, signup, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
