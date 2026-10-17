'use client';

import { BookOpen, UploadCloud, Layers } from 'lucide-react';

export function FeaturesGrid() {
  return (
    <section className="py-20 lg:py-24 border-b border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600 dark:text-terracotta-500">
            Arquitectura & Experiencia
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-100">
            Tres pilares concebidos para el lector y la obra
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed">
            Eliminamos capas innecesarias para construir un flujo directo entre el texto preservado y los ojos del lector.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pilar 1 */}
          <div className="bg-stone-50 dark:bg-surface-100 border border-stone-200 dark:border-surface-300 rounded-2xl p-7 space-y-4 swiss-card">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-stone-50 dark:bg-surface-200 dark:text-stone-100 flex items-center justify-center shadow-subtle">
              <BookOpen size={20} className="text-stone-200 dark:text-stone-100" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Lector de Papel Sereno
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Navegación página por página con tipografía editorial adaptada, modos Pergamino, Claro y Oscuro, escalado de texto y lectura en pantalla completa.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-stone-50 dark:bg-surface-100 border border-stone-200 dark:border-surface-300 rounded-2xl p-7 space-y-4 swiss-card">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-stone-50 dark:bg-surface-200 dark:text-stone-100 flex items-center justify-center shadow-subtle">
              <UploadCloud size={20} className="text-emerald-400" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Subida y Digitalización
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Incorpora obras mediante archivos de texto o transcripciones. El sistema pagina automáticamente el texto y lo deja inmediatamente disponible en el catálogo.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-stone-50 dark:bg-surface-100 border border-stone-200 dark:border-surface-300 rounded-2xl p-7 space-y-4 swiss-card">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-stone-50 dark:bg-surface-200 dark:text-stone-100 flex items-center justify-center shadow-subtle">
              <Layers size={20} className="text-stone-300 dark:text-stone-200" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
              Conexión Nativa MongoDB
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Consultas directas a la base de datos <code className="font-mono text-terracotta-700 dark:text-terracotta-400">biblioteca_digital</code> sin intermediarios que ralenticen el flujo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
