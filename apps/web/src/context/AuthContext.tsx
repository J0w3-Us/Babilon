'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, loginUserApi, registerUserApi } from '@/services/api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message?: string }>;
  register: (payload: {
    username: string;
    password: string;
    nombre: string;
    rol: 'admin' | 'usuario';
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_USER_KEY = 'babilon-auth-user';
const STORAGE_TOKEN_KEY = 'babilon-auth-token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      const savedToken = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (savedUser && savedToken) {
        const parsed = JSON.parse(savedUser) as AuthUser;
        if (parsed && parsed.username) {
          setUser(parsed);
          setToken(savedToken);
        }
      }
    } catch {
      // ignore invalid storage
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (username: string, password: string) => {
    const res = await loginUserApi(username, password);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
      } catch {
        // ignore storage errors
      }
      setIsAuthModalOpen(false);
      return { success: true, message: res.message };
    }
    return {
      success: false,
      message: res.message || 'Usuario o contraseña incorrectos.',
    };
  };

  const register = async (payload: {
    username: string;
    password: string;
    nombre: string;
    rol: 'admin' | 'usuario';
  }) => {
    const res = await registerUserApi(payload);
    if (res.success && res.user && res.token) {
      setUser(res.user);
      setToken(res.token);
      try {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
      } catch {
        // ignore storage errors
      }
      setIsAuthModalOpen(false);
      return { success: true, message: res.message };
    }
    return {
      success: false,
      message: res.message || 'No se pudo crear la cuenta.',
    };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.rol === 'admin',
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
}

