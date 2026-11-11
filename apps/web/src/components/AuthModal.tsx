'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  UserPlus,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setSuccessMsg(null);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeAuthModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isAuthModalOpen, authModalMode, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (authModalMode === 'login') {
        const res = await login(username, password);
        if (!res.success) {
          setError(res.message || 'Credenciales incorrectas.');
        }
      } else {
        const res = await register({
          username,
          password,
          nombre: nombre.trim() || username.trim(),
          rol: 'usuario',
        });
        if (!res.success) {
          setError(res.message || 'No se pudo registrar la cuenta.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-cream-50 dark:bg-surface-100 rounded-2xl max-w-md w-full border border-stone-200/90 dark:border-surface-300 shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 dark:border-surface-300 flex items-center justify-between bg-white dark:bg-surface-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-terracotta-50 dark:bg-terracotta-900/20 border border-terracotta-200 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-700 dark:text-terracotta-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                {authModalMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta de Usuario'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {authModalMode === 'login'
                  ? 'Ingresa con tu cuenta de Usuario o Administrador'
                  : 'Regístrate para explorar y leer obras del catálogo'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 border-b border-stone-200 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              authModalMode === 'login'
                ? 'border-terracotta-600 text-terracotta-700 dark:text-terracotta-400 bg-white dark:bg-surface-200'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <LogIn size={14} />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('register')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              authModalMode === 'register'
                ? 'border-terracotta-600 text-terracotta-700 dark:text-terracotta-400 bg-white dark:bg-surface-200'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <UserPlus size={14} />
            Crear Cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Nombre o Alias
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. María López"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Usuario
            </label>
            <div className="relative">
              <UserIcon
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu nombre de usuario"
                autoComplete="username"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete={
                  authModalMode === 'login' ? 'current-password' : 'new-password'
                }
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-cream-100 dark:hover:bg-cream-50 text-cream-50 dark:text-stone-900 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Procesando...
              </>
            ) : authModalMode === 'login' ? (
              <>
                <LogIn size={16} />
                Entrar a Babilon
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Crear Cuenta de Usuario
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
