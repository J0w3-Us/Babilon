/**
 * ============================================================================
 * DISEÑO DE INTERFACES & CONTROL DE NAVEGACIÓN
 * HITO 1.3: Integración de la navegación interactiva y SPA sin recargas
 * HITO 3.1: Control de visualización y rutas protegidas según rol (Admin vs Lector)
 * ============================================================================
 * - Barra de navegación con indicador de estado activo.
 * - Despliegue condicional de rutas administrativas (/subir, /explorar-libres)
 *   únicamente cuando el usuario autenticado posee el rol 'admin'.
 * - Zonas táctiles superiores a 44px para ergonomía móvil y escritorio.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Compass,
  UploadCloud,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  ClipboardList,
  Plus,
  Home,
} from 'lucide-react';
import ThemeToggle from '@/app/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

export default function NavbarClient() {
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newBookMenuOpen, setNewBookMenuOpen] = useState(false);
  const [bitacoraActive, setBitacoraActive] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const newBookMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (newBookMenuRef.current && !newBookMenuRef.current.contains(target)) {
        setNewBookMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNewBookMenuOpen(false);
      }
    };

    const handleBitacoraState = (event: Event) => {
      const customEvent = event as CustomEvent<{ open?: boolean }>;
      setBitacoraActive(Boolean(customEvent.detail?.open));
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('babilon:bitacora-state', handleBitacoraState);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('babilon:bitacora-state', handleBitacoraState);
    };
  }, []);

  const handleOpenBitacora = () => {
    setNewBookMenuOpen(false);
    if (pathname === '/biblioteca') {
      window.dispatchEvent(new CustomEvent('babilon:open-bitacora'));
    } else {
      router.push('/biblioteca?bitacora=1');
    }
  };

  const isUploadSection = pathname === '/subir' || pathname === '/explorar-libres';

  return (
    <>
      {/* HITO 1.3: Barra de navegación única con cápsula central y controles compactos */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 dark:border-surface-300 glass-header">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Izquierda: Marca Babilon pegada al borde izquierdo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-cream-50 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 flex items-center justify-center text-stone-800 dark:text-stone-200 group-hover:text-terracotta-600 transition-colors shadow-2xs">
              <BookOpen size={17} strokeWidth={2} />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Babilon
              <span className="hidden sm:inline-block text-[10px] uppercase font-sans font-semibold tracking-widest px-2 py-0.5 rounded-full bg-cream-200/80 dark:bg-surface-200 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-surface-300">
                Archivo
              </span>
            </span>
          </Link>

          {/* Centro: Cápsula de navegación (Inicio | Catálogo) */}
          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-1 p-1 rounded-2xl bg-cream-100/90 dark:bg-surface-200/90 border border-stone-200/80 dark:border-surface-300 shadow-2xs"
          >
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/'
                  ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-cream-200/60 dark:hover:bg-surface-300/60'
              }`}
            >
              <Home size={13} />
              <span>Inicio</span>
            </Link>

            <Link
              href="/biblioteca"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                pathname === '/biblioteca' && !bitacoraActive
                  ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-2xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-cream-200/60 dark:hover:bg-surface-300/60'
              }`}
            >
              <Compass size={13} />
              <span>Catálogo</span>
            </Link>
          </nav>

          {/* Derecha: Cambio de tema pegado junto al icono compacto de perfil */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                aria-label={user ? `Perfil de ${user.nombre || user.username}` : 'Menú de cuenta'}
                title={user ? `${user.nombre || user.username} (${isAdmin ? 'Admin' : 'Usuario'})` : 'Cuenta de usuario'}
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                  profileMenuOpen
                    ? 'border-terracotta-400 dark:border-terracotta-500 bg-terracotta-50/70 dark:bg-terracotta-950/50 text-terracotta-700 dark:text-terracotta-300'
                    : 'border-stone-200 dark:border-surface-300 bg-cream-50/80 dark:bg-surface-200 text-stone-700 dark:text-stone-300 hover:border-stone-400 dark:hover:border-surface-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {user && isAdmin ? (
                  <ShieldCheck size={16} className="text-terracotta-600 dark:text-terracotta-400" />
                ) : (
                  <UserIcon size={16} />
                )}
                {user && (
                  <span
                    className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cream-50 dark:border-surface-100 ${
                      isAdmin ? 'bg-terracotta-500' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 rounded-2xl border border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200 shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {user ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-stone-200/70 dark:border-surface-300">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            {user.nombre || user.username}
                          </p>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              isAdmin
                                ? 'bg-terracotta-100 dark:bg-terracotta-900/50 text-terracotta-700 dark:text-terracotta-300'
                                : 'bg-stone-200 dark:bg-surface-300 text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {isAdmin ? 'Admin' : 'Usuario'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          @{user.username}
                        </p>
                      </div>

                      <div className="p-1.5">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Cerrar sesión</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-1.5 space-y-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          openAuthModal('login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-cream-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                      >
                        <LogIn size={14} className="text-terracotta-600 dark:text-terracotta-400" />
                        <span>Iniciar Sesión</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          openAuthModal('register');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-cream-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                      >
                        <UserPlus size={14} className="text-stone-500 dark:text-stone-400" />
                        <span>Crear Cuenta</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Botón Flotante Circular (Speed Dial FAB) en la esquina inferior derecha con 3 círculos de acción */}
      <div
        ref={newBookMenuRef}
        className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3"
      >
        {/* Los 3 círculos desplegables hacia arriba: Bitácora, Libros por API y Subir PDF */}
        <div
          role="menu"
          aria-hidden={!newBookMenuOpen}
          className="flex flex-col items-center gap-3"
        >
          {/* Círculo 1: Bitácora */}
          <div
            className={`group relative flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              newBookMenuOpen
                ? 'opacity-100 translate-y-0 scale-100 delay-100 pointer-events-auto'
                : 'opacity-0 translate-y-10 scale-50 delay-0 pointer-events-none'
            }`}
          >
            <span className="absolute right-14 px-2.5 py-1 rounded-lg bg-stone-900/95 text-cream-50 dark:bg-surface-200 dark:text-stone-100 border border-stone-700/60 dark:border-surface-300 text-[11px] font-semibold whitespace-nowrap shadow-md opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none">
              Bitácora de Libros
            </span>
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenBitacora}
              aria-label="Bitácora de Libros"
              title="Bitácora de Libros"
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 cursor-pointer hover:scale-110 ${
                bitacoraActive
                  ? 'bg-terracotta-600 text-white border-terracotta-500'
                  : 'bg-white dark:bg-surface-200 text-stone-800 dark:text-stone-100 border-stone-200 dark:border-surface-300 hover:border-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-400'
              }`}
            >
              <ClipboardList size={19} />
            </button>
          </div>

          {/* Círculo 2: Libros por API (Google Books) */}
          <div
            className={`group relative flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              newBookMenuOpen
                ? 'opacity-100 translate-y-0 scale-100 delay-75 pointer-events-auto'
                : 'opacity-0 translate-y-8 scale-50 delay-0 pointer-events-none'
            }`}
          >
            <span className="absolute right-14 px-2.5 py-1 rounded-lg bg-stone-900/95 text-cream-50 dark:bg-surface-200 dark:text-stone-100 border border-stone-700/60 dark:border-surface-300 text-[11px] font-semibold whitespace-nowrap shadow-md opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none">
              Obras Libres (API)
            </span>
            <Link
              href="/explorar-libres"
              role="menuitem"
              onClick={() => setNewBookMenuOpen(false)}
              aria-label="Obras Libres por API"
              title="Obras Libres (Google Books API)"
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-110 ${
                pathname === '/explorar-libres'
                  ? 'bg-terracotta-600 text-white border-terracotta-500'
                  : 'bg-white dark:bg-surface-200 text-terracotta-600 dark:text-terracotta-400 border-stone-200 dark:border-surface-300 hover:border-terracotta-400'
              }`}
            >
              <Sparkles size={19} />
            </Link>
          </div>

          {/* Círculo 3: Subir PDF / Archivo Local */}
          <div
            className={`group relative flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              newBookMenuOpen
                ? 'opacity-100 translate-y-0 scale-100 delay-0 pointer-events-auto'
                : 'opacity-0 translate-y-6 scale-50 delay-0 pointer-events-none'
            }`}
          >
            <span className="absolute right-14 px-2.5 py-1 rounded-lg bg-stone-900/95 text-cream-50 dark:bg-surface-200 dark:text-stone-100 border border-stone-700/60 dark:border-surface-300 text-[11px] font-semibold whitespace-nowrap shadow-md opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 pointer-events-none">
              Subir PDF Local
            </span>
            <Link
              href="/subir"
              role="menuitem"
              onClick={() => setNewBookMenuOpen(false)}
              aria-label="Subir PDF Local"
              title="Subir PDF / Archivo Local"
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 hover:scale-110 ${
                pathname === '/subir'
                  ? 'bg-terracotta-600 text-white border-terracotta-500'
                  : 'bg-white dark:bg-surface-200 text-stone-800 dark:text-stone-100 border-stone-200 dark:border-surface-300 hover:border-terracotta-400 hover:text-terracotta-600 dark:hover:text-terracotta-400'
              }`}
            >
              <UploadCloud size={19} />
            </Link>
          </div>
        </div>

        {/* Botón Circular Principal: gira de "+" a "X" con transición suave */}
        <button
          type="button"
          onClick={() => setNewBookMenuOpen((prev) => !prev)}
          aria-expanded={newBookMenuOpen}
          aria-haspopup="menu"
          aria-label={newBookMenuOpen ? 'Cerrar menú flotante' : 'Abrir opciones de obras y bitácora'}
          title={newBookMenuOpen ? 'Cerrar' : 'Opciones de Obras y Bitácora'}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            newBookMenuOpen
              ? 'bg-terracotta-600 hover:bg-terracotta-700 text-white border-terracotta-500 scale-105'
              : isUploadSection || bitacoraActive
                ? 'bg-terracotta-600 hover:bg-terracotta-700 text-white border-terracotta-500 hover:scale-105'
                : 'bg-stone-900 hover:bg-stone-800 text-cream-50 dark:bg-cream-100 dark:hover:bg-white dark:text-stone-900 border-stone-800 dark:border-stone-200 hover:scale-105'
          }`}
        >
          <Plus
            size={22}
            strokeWidth={2.5}
            className={`transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              newBookMenuOpen ? 'rotate-[135deg]' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      <AuthModal />
    </>
  );
}

