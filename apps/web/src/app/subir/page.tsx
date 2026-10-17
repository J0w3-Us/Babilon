'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookUploadWizard } from '@/modules/upload/BookUploadWizard';
import { ArrowLeft, UploadCloud, ShieldCheck } from 'lucide-react';

export default function SubirPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/biblioteca');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-surface-50 text-stone-900 dark:text-stone-100 selection:bg-terracotta-100 selection:text-terracotta-900 font-sans pb-16 transition-colors duration-200">
      {/* Subheader / Breadcrumb Bar */}
      <div className="bg-white dark:bg-surface-100 border-b border-stone-200 dark:border-surface-300 py-3.5 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
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
            <span>Persistencia en MongoDB Atlas</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Cabecera Editorial */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-surface-200 text-stone-700 dark:text-stone-300 text-[11px] font-semibold uppercase tracking-wider border border-stone-200 dark:border-surface-300 mb-2.5">
            <UploadCloud size={12} className="text-terracotta-600 dark:text-terracotta-500" />
            <span>Pilar 3: Ingesta Literaria</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-50 tracking-tight">
            Digitalizar y Subir Obra
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
            Preserva textos universales o producciones académicas en el repositorio de Babilon. Podrás incorporar datos bibliográficos precisos y el texto íntegro para lectura en alta resolución.
          </p>
        </div>

        {/* Tarjeta Principal del Wizard */}
        <div className="bg-white dark:bg-surface-100 rounded-2xl border border-stone-200 dark:border-surface-300 shadow-card dark:shadow-dark-card overflow-hidden">
          <BookUploadWizard onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
}
