'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, UploadCloud } from 'lucide-react';

export function CallToActionSection() {
  return (
    <section className="py-20 lg:py-24 bg-stone-100/60 dark:bg-surface-50 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-stone-900 dark:bg-surface-100 border border-stone-800 dark:border-surface-300 text-stone-100 p-8 sm:p-12 text-center space-y-5 shadow-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-800 dark:bg-surface-200 text-terracotta-400 text-xs font-semibold uppercase tracking-wider border border-stone-700 dark:border-surface-300">
            <Sparkles size={13} />
            <span>Exploración Sin Límites</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white max-w-2xl mx-auto leading-tight">
            Comienza tu lectura o preserva una nueva obra hoy mismo
          </h2>

          <p className="text-sm sm:text-base text-stone-400 max-w-xl mx-auto leading-relaxed font-sans">
            Accede a las salas temáticas de Filosofía, Clásicos, Ficción, Ciencia Ficción y Poesía de la Biblioteca Babilon, o contribuye digitalizando textos.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/biblioteca"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold text-sm transition-all shadow-subtle cursor-pointer"
            >
              <span>Abrir Catálogo de la Biblioteca</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/subir"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 dark:bg-surface-200 dark:hover:bg-surface-300 text-white font-medium text-sm transition-all border border-stone-700 dark:border-surface-300 cursor-pointer"
            >
              <UploadCloud size={16} />
              <span>Digitalizar Obra</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
