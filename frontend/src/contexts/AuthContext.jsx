import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authService from '../services/auth.service';
import { clearSession, getUser, setSession } from '../utils/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setBootstrapping(false);
  }, []);

  const login = useCallback(async ({ email, password, remember = true }) => {
    const data = await authService.login({ email, password });
    if (data.success && data.token && data.user) {
      setSession(data.token, data.user, remember);
      setUser(data.user);
    }
    return data;
  }, []);

  const register = useCallback(async (payload, remember = true) => {
    const data = await authService.register(payload);
    if (data.success && data.token && data.user) {
      setSession(data.token, data.user, remember);
      setUser(data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      bootstrapping,
      login,
      register,
      logout,
      isAuthenticated: !!user,
    }),
    [user, bootstrapping, login, register, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải dùng bên trong AuthProvider');
  }
  return ctx;
}
