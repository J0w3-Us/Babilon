'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookUploadWizard } from './BookUploadWizard';
import { ArrowLeft, UploadCloud, ShieldCheck, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function UploadView() {
  const router = useRouter();
  const { user, isAdmin, openAuthModal } = useAuth();

  const handleSuccess = () => {
    router.push('/biblioteca');
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-surface-50 text-stone-900 dark:text-stone-100 selection:bg-terracotta-100 selection:text-terracotta-900 font-sans pb-16 transition-colors duration-200">
      {/* Subheader / Breadcrumb Bar */}
      <div className="bg-cream-50/80 dark:bg-surface-100 border-b border-stone-200/80 dark:border-surface-300 py-3.5 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/biblioteca"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a la Biblioteca</span>
            </Link>
            <span className="text-stone-300 dark:text-surface-400">/</span>
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
              Ingesta & Digitalización
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-sans">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Subida protegida con JWT (HS256), Ping de salud y Rol Administrador</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Cabecera Editorial */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cream-200 dark:bg-surface-200 text-stone-700 dark:text-stone-300 text-[11px] font-semibold uppercase tracking-wider border border-stone-200/80 dark:border-surface-300 mb-2.5">
            <UploadCloud size={12} className="text-terracotta-600 dark:text-terracotta-500" />
            <span>Ingesta Literaria</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            Digitalizar y Subir Obra
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
            Preserva textos universales o producciones académicas en el repositorio de Babilon. Podrás incorporar datos bibliográficos precisos y el texto íntegro para lectura en alta resolución.
          </p>
        </div>

        {isAdmin ? (
          <div className="bg-cream-50 dark:bg-surface-100 rounded-2xl border border-stone-200/90 dark:border-surface-300 shadow-card dark:shadow-dark-card overflow-hidden">
            <BookUploadWizard onSuccess={handleSuccess} />
          </div>
        ) : (
          <div className="bg-cream-50 dark:bg-surface-100 rounded-2xl border border-stone-200/90 dark:border-surface-300 shadow-card p-8 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/30 border border-terracotta-200 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 mx-auto mb-4">
              <Lock size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Acceso Exclusivo para Administradores
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
              {user
                ? `Tu cuenta actual (${user.username}) tiene rol de Usuario (solo lectura). Para subir, editar o borrar libros necesitas iniciar sesión o registrar una cuenta de Administrador.`
                : 'Para digitalizar y subir obras a la base de datos necesitas iniciar sesión con una cuenta de Administrador.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <LogIn size={15} />
                Iniciar Sesión como Administrador
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
