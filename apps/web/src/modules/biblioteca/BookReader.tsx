'use client';

import { useLayoutEffect, useRef } from 'react';
import { Book, BookPage } from '@babilon/shared-types';
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Coffee,
  Sun,
  Moon,
} from 'lucide-react';

interface BookReaderProps {
  book: Book;
  page: BookPage | null;
  pageCount: number;
  pageLoadError: string | null;
  onRetryPage: () => void;
  onClose: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  savedPageNumber: number | null;
  readingProgressPercent: number | null;
  onResumeReading: () => void;
  readingProgressError: string | null;
  theme: 'parchment' | 'dark' | 'light';
  onThemeChange: (theme: 'parchment' | 'dark' | 'light') => void;
  fontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  /** true mientras se carga el bloque de páginas actual */
  isLoadingPages?: boolean;
}

export function BookReader({
  book,
  page,
  pageCount,
  pageLoadError,
  onRetryPage,
  onClose,
  currentPage,
  onPageChange,
  savedPageNumber,
  readingProgressPercent,
  onResumeReading,
  readingProgressError,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  isFullscreen,
  onToggleFullscreen,
  isLoadingPages = false,
}: BookReaderProps) {
  const readerScrollRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (readerScrollRef.current) {
      readerScrollRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  const currentPageData: BookPage = page ?? {
    numero: currentPage + 1,
    texto: book.synopsis?.trim()
      ? `${book.synopsis}\n\n— Esta obra aún no tiene su texto digitalizado en el catálogo de Babilon.`
      : 'Texto en proceso de digitalización para esta obra.',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs animate-fade-in ${
        isFullscreen ? 'p-0' : 'p-2 sm:p-6'
      } ${
        theme === 'dark'
          ? 'bg-black/75'
          : 'bg-black/50'
      }`}
    >
      <div
        className={`w-full h-full flex flex-col shadow-2xl transition-all duration-200 overflow-hidden ${
          isFullscreen
            ? 'max-w-none max-h-none rounded-none'
            : 'max-w-4xl max-h-[92vh] rounded-2xl border'
        } ${
          theme === 'dark'
            ? 'bg-surface-50 text-stone-100 border-surface-300'
            : theme === 'parchment'
            ? 'bg-[#F7F3E9] text-stone-900 border-stone-200/80'
            : 'bg-cream-50 text-stone-900 border-stone-200/80'
        }`}
      >
        {/* Top Toolbar */}
        <div
          className={`px-6 py-3.5 flex items-center justify-between border-b transition-colors select-none ${
            theme === 'dark'
              ? 'bg-surface-100 border-surface-300 text-stone-100'
              : theme === 'parchment'
              ? 'bg-[#EFE9DC] border-stone-200/80 text-stone-900'
              : 'bg-cream-100 border-stone-200/80 text-stone-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <BookOpen
              size={18}
              className="text-terracotta-600 dark:text-terracotta-500 shrink-0"
            />
            <div className="truncate max-w-[240px] sm:max-w-md">
              <h3 className="font-serif text-base sm:text-lg font-bold leading-tight truncate">
                {book.title}
              </h3>
              <p className="text-[11px] opacity-70 truncate font-sans">
                {book.author?.name} • {book.publisher}
              </p>
            </div>
          </div>

          {/* Reader Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Font Size controls */}
            <div className="hidden sm:flex items-center gap-1 border border-stone-200 dark:border-surface-300 rounded-lg px-2 py-1">
              <button
                onClick={() => onFontSizeChange((s) => Math.max(14, s - 2))}
                className="text-xs px-1 hover:text-terracotta-600 font-serif font-bold cursor-pointer transition-colors"
                title="Reducir tamaño de letra"
              >
                A-
              </button>
              <span className="text-[10px] font-mono opacity-50">|</span>
              <button
                onClick={() => onFontSizeChange((s) => Math.min(26, s + 2))}
                className="text-xs px-1 hover:text-terracotta-600 font-serif font-bold cursor-pointer transition-colors"
                title="Aumentar tamaño de letra"
              >
                A+
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-1 border border-stone-200 dark:border-surface-300 rounded-lg p-0.5">
              <button
                onClick={() => onThemeChange('light')}
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-stone-200 dark:bg-surface-300 text-stone-950 dark:text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Modo Blanco Nítido"
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => onThemeChange('parchment')}
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  theme === 'parchment'
                    ? 'bg-stone-200 dark:bg-surface-300 text-stone-950 dark:text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Tono Suave Lectura"
              >
                <Coffee size={14} />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-1.5 rounded-md text-xs transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-surface-300 text-white font-bold'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title="Modo Grafito Noche"
              >
                <Moon size={14} />
              </button>
            </div>

            {/* Pantalla Completa */}
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-surface-300 opacity-70 hover:opacity-100 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Cerrar Lector */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-stone-200 dark:border-surface-300 opacity-70 hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-600 transition-colors cursor-pointer ml-1"
              title="Cerrar Lector"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Reader Canvas / Document Scroll */}
        <div
          ref={readerScrollRef}
          className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 sm:py-12 select-text font-serif"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-surface-300 pb-3 mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest opacity-60">
                {pageCount > 0 ? `Página ${currentPage + 1} de ${pageCount}` : 'Sin páginas digitalizadas'}
              </span>
              {currentPageData.nombre_archivo && (
                <span className="text-[11px] font-mono opacity-50 truncate max-w-[200px]">
                  {currentPageData.nombre_archivo}
                </span>
              )}
            </div>

            {savedPageNumber !== null && savedPageNumber > 1 && currentPage === 0 && (
              <div
                className="sticky top-2 z-10 -mt-2 mb-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-cream-50/95 px-3.5 py-2.5 text-xs shadow-sm dark:border-surface-300 dark:bg-surface-100/95"
                role="status"
                aria-live="polite"
              >
                <span className="text-stone-700 dark:text-stone-200">
                  Última lectura: página {savedPageNumber}
                  {readingProgressPercent !== null ? ` · ${readingProgressPercent}%` : ''}.
                </span>
                <button
                  type="button"
                  onClick={onResumeReading}
                  className="shrink-0 rounded-lg bg-stone-900 px-3 py-2 font-semibold text-cream-50 hover:bg-stone-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50"
                >
                  Retomar lectura
                </button>
              </div>
            )}

            {readingProgressError && (
              <p className="mb-4 text-xs text-stone-500 dark:text-stone-400" role="status">
                {readingProgressError}
              </p>
            )}

            {/* Page Content Body */}
            {isLoadingPages ? (
              <div className="space-y-4 py-4" role="status" aria-live="polite">
                <span className="sr-only">Cargando páginas...</span>
                <div className="h-4 w-11/12 animate-pulse rounded bg-stone-200/70 dark:bg-surface-300" />
                <div className="h-4 w-full animate-pulse rounded bg-stone-200/70 dark:bg-surface-300" />
                <div className="h-4 w-10/12 animate-pulse rounded bg-stone-200/70 dark:bg-surface-300" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-stone-200/70 dark:bg-surface-300" />
              </div>
            ) : pageLoadError ? (
              <div className="py-12 text-center" role="alert">
                <p className="text-sm text-rose-700 dark:text-rose-300">{pageLoadError}</p>
                <button
                  type="button"
                  onClick={onRetryPage}
                  className="mt-3 min-h-10 rounded-lg border border-stone-300 px-4 text-xs font-semibold hover:bg-cream-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 dark:border-surface-300 dark:hover:bg-surface-200"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div
                style={{ fontSize: `${fontSize}px` }}
                className="font-serif leading-normal whitespace-pre-line text-justify"
              >
                {pageCount === 0 ? currentPageData.texto : (page?.texto ?? '')}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Page Navigation Controls */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between select-none ${
            theme === 'dark'
              ? 'bg-surface-100 border-surface-300'
              : theme === 'parchment'
              ? 'bg-[#EFE9DC] border-stone-200/80'
              : 'bg-cream-100 border-stone-200/80'
          }`}
        >
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            aria-label="Ir a la página anterior"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-surface-300 hover:bg-stone-100 dark:hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={15} />
            Página Anterior
          </button>

          <span className="text-xs font-mono opacity-80">
            {pageCount > 0 ? `Pág. ${currentPage + 1} de ${pageCount}` : 'Sin páginas'}
          </span>

          <button
            type="button"
            disabled={pageCount === 0 || currentPage >= pageCount - 1}
            onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}
            aria-label="Ir a la página siguiente"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Siguiente Página
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
