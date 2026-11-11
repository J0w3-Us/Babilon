'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Trash2,
  Undo2,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Filter,
  Search,
} from 'lucide-react';

export interface PageItem {
  id: string;
  originalIndex: number;
  texto: string;
  conteo_palabras?: number;
  eliminada: boolean;
}

interface PageManagerProps {
  pages: PageItem[];
  onTogglePage: (id: string) => void;
  onRestoreAll: () => void;
}

type FilterMode = 'todas' | 'activas' | 'excluidas';

export function PageManager({ pages, onTogglePage, onRestoreAll }: PageManagerProps) {
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  const paginasActivas = useMemo(() => pages.filter((p) => !p.eliminada), [pages]);
  const paginasExcluidas = useMemo(() => pages.filter((p) => p.eliminada), [pages]);

  // Manejo de tecla Escape y bloqueo de scroll para los modales
  useEffect(() => {
    const isAnyModalOpen = isGridModalOpen || previewPageIndex !== null;
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewPageIndex !== null) {
          // Si el visor de página individual está abierto, cerrar primero el visor
          setPreviewPageIndex(null);
        } else if (isGridModalOpen) {
          // Si la cuadrícula está abierta, cerrarla
          setIsGridModalOpen(false);
        }
      } else if (previewPageIndex !== null) {
        // Atajos con flechas dentro del visor de página individual
        if (e.key === 'ArrowLeft' && previewPageIndex > 0) {
          setPreviewPageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'ArrowRight' && previewPageIndex < pages.length - 1) {
          setPreviewPageIndex((prev) => (prev !== null && prev < pages.length - 1 ? prev + 1 : prev));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isGridModalOpen, previewPageIndex, pages.length]);

  const filteredPages = useMemo(() => {
    return pages.filter((p) => {
      if (filterMode === 'activas' && p.eliminada) return false;
      if (filterMode === 'excluidas' && !p.eliminada) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesIndex = String(p.originalIndex).includes(query);
        const matchesText = p.texto.toLowerCase().includes(query);
        return matchesIndex || matchesText;
      }
      return true;
    });
  }, [pages, filterMode, searchQuery]);

  if (pages.length === 0) return null;

  const currentPreviewPage = previewPageIndex !== null ? pages[previewPageIndex] : null;

  return (
    <>
      {/* Banner de resumen en el formulario principal */}
      <div className="rounded-2xl border border-stone-200/90 dark:border-surface-300 bg-cream-50 dark:bg-surface-200/50 p-4 sm:p-5 transition-colors">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 shrink-0 shadow-2xs">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-100">
                  Gestión de Páginas del Documento
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cream-200 dark:bg-surface-300 text-stone-700 dark:text-stone-200">
                  {paginasActivas.length} de {pages.length} páginas seleccionadas
                </span>
                {paginasExcluidas.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                    {paginasExcluidas.length} excluida(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Abre el gestor para revisar página por página, excluir portadas, páginas en blanco o páginas con dedicatorias antes de guardar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {paginasExcluidas.length > 0 && (
              <button
                type="button"
                onClick={onRestoreAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                title="Restaurar todas las páginas excluidas"
              >
                <Undo2 size={14} />
                <span>Restaurar todas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsGridModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50 text-xs font-semibold shadow-subtle transition-all cursor-pointer"
            >
              <Maximize2 size={14} />
              <span>Ver y gestionar páginas ({pages.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL AMPLIO CON TODAS LAS PÁGINAS (SIN DESENFOQUE, FONDO SÓLIDO LIMPIO) */}
      {/* ========================================================================= */}
      {isGridModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="page-manager-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-5 bg-black/90 animate-fade-in"
        >
          <div
            className="w-full h-full sm:h-[95vh] max-w-7xl bg-cream-50 dark:bg-surface-100 sm:rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
          >
            {/* Cabecera del Modal */}
            <div className="px-6 py-4 border-b border-stone-200/90 dark:border-surface-300 bg-white/70 dark:bg-surface-200/70 flex items-center justify-between gap-4 flex-wrap shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/40 border border-terracotta-200 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 id="page-manager-modal-title" className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                    Selector de Páginas del Documento
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-stone-500 dark:text-stone-400">
                      Total: <strong className="text-stone-700 dark:text-stone-200">{pages.length}</strong> páginas
                    </span>
                    <span className="text-stone-300 dark:text-surface-400">•</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {paginasActivas.length} se guardarán
                    </span>
                    {paginasExcluidas.length > 0 && (
                      <>
                        <span className="text-stone-300 dark:text-surface-400">•</span>
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                          {paginasExcluidas.length} excluidas
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Acciones de la cabecera */}
              <div className="flex items-center gap-2.5">
                {paginasExcluidas.length > 0 && (
                  <button
                    type="button"
                    onClick={onRestoreAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                  >
                    <Undo2 size={13} />
                    <span>Restaurar todas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsGridModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-surface-300 dark:hover:bg-surface-400 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Cerrar ventana (Esc)"
                >
                  <X size={15} />
                  <span>Cerrar</span>
                </button>
              </div>
            </div>

            {/* Barra de Controles: Filtros y Búsqueda */}
            <div className="px-6 py-3 border-b border-stone-200/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/30 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterMode('todas')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterMode === 'todas'
                      ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-surface-300'
                  }`}
                >
                  Todas ({pages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('activas')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterMode === 'activas'
                      ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-surface-300'
                  }`}
                >
                  Conservadas ({paginasActivas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('excluidas')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filterMode === 'excluidas'
                      ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900'
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-surface-300'
                  }`}
                >
                  Excluidas ({paginasExcluidas.length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar texto o nº de pág..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-100 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                />
              </div>
            </div>

            {/* Cuadrícula Amplia de Páginas */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredPages.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <Filter size={32} className="text-stone-300 dark:text-stone-600 mb-2" />
                  <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                    No hay páginas que coincidan con los filtros aplicados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {filteredPages.map((p) => {
                    const actualIndex = pages.findIndex((item) => item.id === p.id);
                    const isExcluded = p.eliminada;
                    const wordCount = p.conteo_palabras || p.texto.trim().split(/\s+/).filter(Boolean).length;
                    const rawLines = p.texto.trim().split('\n').map((l) => l.trim()).filter(Boolean);
                    const titleLine = rawLines.find((l) => /^#{1,6}\s+/.test(l));
                    const bodyLines = rawLines.filter((l) => !/^#{1,6}\s+/.test(l));
                    const displayHeading = titleLine ? titleLine.replace(/^#{1,6}\s+/, '') : null;
                    const previewExtract = (bodyLines.length > 0 ? bodyLines.join(' ') : p.texto.trim()).slice(0, 110);

                    return (
                      <div
                        key={p.id}
                        onClick={() => setPreviewPageIndex(actualIndex)}
                        title="Haz clic sobre la tarjeta para leer la página completa"
                        className={`group relative rounded-2xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer ${
                          isExcluded
                            ? 'border-rose-300/80 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20 opacity-60'
                            : 'border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200/50 shadow-2xs hover:shadow-md hover:border-terracotta-500 dark:hover:border-terracotta-500 hover:scale-[1.01]'
                        }`}
                      >
                        {/* Header de la tarjeta */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span
                            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                              isExcluded
                                ? 'bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 line-through'
                                : 'bg-cream-200 dark:bg-surface-300 text-stone-800 dark:text-stone-200'
                            }`}
                          >
                            Pág. {p.originalIndex}
                          </span>

                          <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                            {wordCount} palabras
                          </span>
                        </div>

                        {/* Texto preliminar con título en su línea */}
                        <div className="flex-1 mb-3">
                          {displayHeading && (
                            <p className="text-[11px] font-bold text-terracotta-700 dark:text-terracotta-400 font-serif line-clamp-1 mb-1">
                              {displayHeading}
                            </p>
                          )}
                          <p className="text-[10px] text-stone-600 dark:text-stone-300 font-serif line-clamp-3 leading-relaxed select-none">
                            {previewExtract || <span className="italic text-stone-400">(Página en blanco o sin texto)</span>}
                          </p>
                        </div>

                        {/* Botón de acción rápido (con stopPropagation para no abrir el visor) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePage(p.id);
                          }}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isExcluded
                              ? 'bg-stone-200 hover:bg-stone-300 dark:bg-surface-300 dark:hover:bg-surface-400 text-stone-800 dark:text-stone-100'
                              : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/60'
                          }`}
                        >
                          {isExcluded ? (
                            <>
                              <Undo2 size={12} />
                              <span>Restaurar</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={12} />
                              <span>Quitar página</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie del modal amplio */}
            <div className="px-6 py-3.5 border-t border-stone-200/90 dark:border-surface-300 bg-white/70 dark:bg-surface-200/70 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 shrink-0">
              <p>
                Consejo: Puedes usar la tecla <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-surface-300 font-mono text-[10px]">Esc</kbd> para cerrar este panel en cualquier momento.
              </p>
              <button
                type="button"
                onClick={() => setIsGridModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50 font-semibold cursor-pointer transition-colors"
              >
                Aceptar selección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================================= */}
      {/* 2. VISOR INDIVIDUAL DE PÁGINA (AMPLIO, NAVEGACIÓN ANTERIOR / SIGUIENTE, FLECHAS)  */}
      {/* ================================================================================= */}
      {currentPreviewPage && previewPageIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="page-reader-modal-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-3 md:p-5 bg-black/92 animate-fade-in"
        >
          <div
            className="w-full h-full sm:h-[95vh] max-w-4xl bg-cream-50 dark:bg-surface-100 sm:rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100"
          >
            {/* Header del Lector */}
            <div className="px-6 py-4 border-b border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-cream-200 dark:bg-surface-300 text-stone-800 dark:text-stone-200">
                  Página {currentPreviewPage.originalIndex} de {pages.length}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  ({currentPreviewPage.texto.trim().split(/\s+/).filter(Boolean).length} palabras)
                </span>
                {currentPreviewPage.eliminada ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                    Página excluida de la subida
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50">
                    Página conservada
                  </span>
                )}
              </div>

              {/* Botón de cerrar el visor */}
              <button
                type="button"
                onClick={() => setPreviewPageIndex(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                title="Cerrar visor (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cuerpo del Texto de la Página (Estilo editorial con títulos centrados y líneas divisorias) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14 bg-white/40 dark:bg-surface-100/50">
              <div className="max-w-2xl mx-auto space-y-4">
                {currentPreviewPage.texto.trim() ? (
                  currentPreviewPage.texto
                    .trim()
                    .split(/\n\s*\n+/)
                    .map((block, bIdx) => {
                      const trimmed = block.trim();
                      if (/^#{1,6}\s+/.test(trimmed)) {
                        const titleText = trimmed.replace(/^#{1,6}\s+/, '');
                        return (
                          <div key={bIdx} className="text-center my-6 sm:my-8">
                            <h3 className="font-serif font-bold text-lg sm:text-xl tracking-widest uppercase text-terracotta-700 dark:text-terracotta-400">
                              {titleText}
                            </h3>
                            <div className="w-16 h-0.5 bg-terracotta-400/50 dark:bg-terracotta-500/50 mx-auto mt-3 mb-6" />
                          </div>
                        );
                      }
                      return (
                        <p
                          key={bIdx}
                          className="font-serif text-sm sm:text-base text-stone-800 dark:text-stone-200 leading-relaxed tracking-normal select-text text-justify sm:text-left"
                        >
                          {trimmed}
                        </p>
                      );
                    })
                ) : (
                  <div className="py-20 text-center">
                    <FileText size={40} className="mx-auto text-stone-300 dark:text-stone-600 mb-3" />
                    <p className="font-serif text-base text-stone-500 dark:text-stone-400 italic">
                      Esta página no contiene texto extraído o es una página en blanco.
                    </p>
                    <p className="text-xs text-stone-400 mt-2">
                      Si se trata de una página vacía o ilustración sin texto, puedes excluirla con el botón de abajo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Barra de Navegación y Acciones Inferior */}
            <div className="px-6 py-4 border-t border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200 flex items-center justify-between gap-3 shrink-0 flex-wrap">
              {/* Botón Página Anterior */}
              <button
                type="button"
                disabled={previewPageIndex === 0}
                onClick={() => setPreviewPageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Página anterior (← Flecha Izquierda)"
              >
                <ChevronLeft size={16} />
                <span>Página Anterior</span>
              </button>

              {/* Botón de Exclusión / Restauración In-situ */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePage(currentPreviewPage.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-subtle transition-colors cursor-pointer ${
                    currentPreviewPage.eliminada
                      ? 'bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {currentPreviewPage.eliminada ? (
                    <>
                      <Undo2 size={14} />
                      <span>Restaurar esta página</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Excluir esta página de la subida</span>
                    </>
                  )}
                </button>
              </div>

              {/* Botón Página Siguiente */}
              <button
                type="button"
                disabled={previewPageIndex === pages.length - 1}
                onClick={() => setPreviewPageIndex((prev) => (prev !== null && prev < pages.length - 1 ? prev + 1 : prev))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="Página siguiente (→ Flecha Derecha)"
              >
                <span>Página Siguiente</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
