'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Compass,
  UploadCloud,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import ThemeToggle from '@/app/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

export default function NavbarClient() {
  const { user, isAdmin, openAuthModal, logout } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/80 dark:border-surface-300 glass-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-cream-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 flex items-center justify-center text-stone-800 dark:text-stone-200 group-hover:text-terracotta-600 transition-colors shadow-xs">
              <BookOpen size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Babilon
                <span className="text-[10px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full bg-cream-200 dark:bg-surface-200 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-surface-300">
                  Archivo
                </span>
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                Patrimonio bibliográfico y lectura digital
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300">
            <Link
              href="/"
              className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/biblioteca"
              className="hover:text-terracotta-600 dark:hover:text-terracotta-500 transition-colors flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100"
            >
              <Compass
                size={15}
                className="text-terracotta-600 dark:text-terracotta-500"
              />
              Catálogo
            </Link>
            {isAdmin && (
              <Link
                href="/subir"
                className="hover:text-terracotta-600 dark:hover:text-terracotta-500 transition-colors flex items-center gap-1.5"
              >
                <UploadCloud size={15} />
                Subir Obra
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 text-xs">
                  {isAdmin ? (
                    <ShieldCheck
                      size={14}
                      className="text-terracotta-600 dark:text-terracotta-400"
                    />
                  ) : (
                    <UserIcon
                      size={14}
                      className="text-stone-500 dark:text-stone-400"
                    />
                  )}
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {user.nombre || user.username}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-terracotta-100 dark:bg-terracotta-900/40 text-terracotta-700 dark:text-terracotta-300'
                        : 'bg-stone-200 dark:bg-surface-300 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {isAdmin ? 'Admin' : 'Usuario'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 dark:border-surface-300 bg-white dark:bg-surface-200 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                >
                  <LogIn size={14} />
                  Iniciar Sesión
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50 transition-colors cursor-pointer shadow-subtle"
                >
                  <UserPlus size={14} />
                  Crear Cuenta
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <AuthModal />
    </>
  );
}

