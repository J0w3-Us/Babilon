'use client';

import { useMemo } from 'react';
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
  onClose: () => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  theme: 'parchment' | 'dark' | 'light';
  onThemeChange: (theme: 'parchment' | 'dark' | 'light') => void;
  fontSize: number;
  onFontSizeChange: (updater: (prev: number) => number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  /** true mientras se hace fetch del detalle completo con páginas */
  isLoadingPages?: boolean;
}

export function BookReader({
  book,
  onClose,
  currentPage,
  onPageChange,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  isFullscreen,
  onToggleFullscreen,
  isLoadingPages = false,
}: BookReaderProps) {
  // Páginas preparadas para el Lector.
  // Prioridad: 1) book.pages con texto real → 2) sampleChapterText parseado → 3) synopsis / fallback
  const readerPages: BookPage[] = useMemo(() => {
    if (!book) return [];

    // 1. Array de páginas estructuradas con contenido real
    if (book.pages && book.pages.length > 0) {
      const pagesWithContent = book.pages.filter((p) => p.texto && p.texto.trim().length > 0);
      if (pagesWithContent.length > 0) {
        return pagesWithContent;
      }
    }

    // 2. Texto de muestra: parsear separadores "--- Página N ---"
    if (book.sampleChapterText && book.sampleChapterText.trim().length > 0) {
      // Regex con captura del número real de página
      const separatorRegex = /---\s*Página\s*(\d+)\s*---/g;
      const matches = [...book.sampleChapterText.matchAll(separatorRegex)];

      if (matches.length > 0) {
        const parsedPages: BookPage[] = [];
        matches.forEach((match, i) => {
          const pageNum = parseInt(match[1], 10);
          const startIdx = (match.index ?? 0) + match[0].length;
          const endIdx = matches[i + 1]?.index ?? book.sampleChapterText!.length;
          const texto = book.sampleChapterText!.slice(startIdx, endIdx).trim();
          if (texto.length > 0) {
            parsedPages.push({ numero: pageNum, texto });
          }
        });
        if (parsedPages.length > 0) return parsedPages;
      }

      // Sin separadores: dividir por longitud fija (~1800 caracteres por página)
      const fullText = book.sampleChapterText.trim();
      if (fullText.length > 1800) {
        const chunkSize = 1800;
        const chunks: BookPage[] = [];
        for (let i = 0; i < fullText.length; i += chunkSize) {
          chunks.push({
            numero: Math.floor(i / chunkSize) + 1,
            texto: fullText.slice(i, i + chunkSize).trim(),
          });
        }
        return chunks;
      }

      return [{ numero: 1, texto: book.sampleChapterText.trim() }];
    }

    // 3. Fallback: mostrar sinopsis o mensaje de digitalización pendiente
    return [
      {
        numero: 1,
        texto: book.synopsis?.trim()
          ? `${book.synopsis}\n\n— Esta obra aún no tiene su texto completo digitalizado en el catálogo de Babilon.`
          : 'Texto en proceso de digitalización para esta obra de archivo.',
      },
    ];
  }, [book]);

  const currentPageData = readerPages[currentPage] || {
    numero: 1,
    texto: 'Página no disponible',
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
            ? 'bg-[#F9F7F1] text-stone-900 border-stone-200'
            : 'bg-white text-stone-900 border-stone-200'
        }`}
      >
        {/* Top Toolbar */}
        <div
          className={`px-6 py-3.5 flex items-center justify-between border-b transition-colors select-none ${
            theme === 'dark'
              ? 'bg-surface-100 border-surface-300 text-stone-100'
              : theme === 'parchment'
              ? 'bg-[#F2EFE8] border-stone-200 text-stone-900'
              : 'bg-stone-50 border-stone-200 text-stone-900'
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
        <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 sm:py-12 select-text font-serif">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-surface-300 pb-3 mb-6">
              <span className="text-[11px] font-mono uppercase tracking-widest opacity-60">
                Página {currentPage + 1} de {readerPages.length}
              </span>
              {currentPageData.nombre_archivo && (
                <span className="text-[11px] font-mono opacity-50 truncate max-w-[200px]">
                  {currentPageData.nombre_archivo}
                </span>
              )}
            </div>

            {/* Page Content Body */}
            {isLoadingPages ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-60">
                <svg
                  className="animate-spin w-6 h-6 text-terracotta-600 dark:text-terracotta-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-xs font-mono uppercase tracking-widest">Cargando páginas...</span>
              </div>
            ) : (
              <div
                style={{ fontSize: `${fontSize}px` }}
                className="font-serif leading-relaxed sm:leading-loose whitespace-pre-line text-justify first-letter:float-left first-letter:text-5xl first-letter:pr-3 first-letter:font-serif first-letter:text-terracotta-600 dark:first-letter:text-terracotta-500"
              >
                {currentPageData.texto}
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
              ? 'bg-[#F2EFE8] border-stone-200'
              : 'bg-stone-50 border-stone-200'
          }`}
        >
          <button
            disabled={currentPage === 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 dark:border-surface-300 hover:bg-stone-100 dark:hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft size={15} />
            Página Anterior
          </button>

          <span className="text-xs font-mono opacity-80">
            Pág. {currentPage + 1} de {readerPages.length}
          </span>

          <button
            disabled={currentPage >= readerPages.length - 1}
            onClick={() => onPageChange(Math.min(readerPages.length - 1, currentPage + 1))}
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
