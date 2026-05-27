import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, setAccessToken, setOnUnauthorized } from '@/lib/api';
import type { User, UserRole } from '@/lib/types';

interface AuthResponse {
  user: User;
  accessToken: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    role?: 'participant' | 'organizer';
  }) => Promise<User>;
  logout: () => Promise<void>;
  applyAccessToken: (token: string) => Promise<User>;
  refetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  // Авто-логаут при провалі refresh у API-клієнті
  useEffect(() => {
    setOnUnauthorized(() => {
      setAccessToken(null);
      setUser(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // На старті — спробувати оновити сесію через refresh cookie
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/auth/refresh`,
          { method: 'POST', credentials: 'include' },
        );
        if (response.ok) {
          const data = (await response.json()) as AuthResponse;
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>(
      '/api/auth/login',
      { email, password },
      { skipAuth: true },
    );
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      role?: 'participant' | 'organizer';
    }) => {
      const data = await api.post<AuthResponse>('/api/auth/register', input, {
        skipAuth: true,
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const applyAccessToken = useCallback(async (token: string) => {
    setAccessToken(token);
    const data = await api.get<{ user: User }>('/api/auth/me');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      if (!(err instanceof ApiError)) throw err;
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      hasRole: (...roles: UserRole[]) =>
        user !== null && roles.includes(user.role),
      login,
      register,
      logout,
      applyAccessToken,
      refetchMe: fetchMe,
    }),
    [user, isLoading, login, register, logout, applyAccessToken, fetchMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
