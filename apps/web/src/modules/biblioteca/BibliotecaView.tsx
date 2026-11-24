'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  RefreshCw,
  Library,
  Feather,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

import { BookCard } from './BookCard';
import { BookDetailModal } from './BookDetailModal';
import { BookBitacoraModal } from './BookBitacoraModal';
import { Book } from '@babilon/shared-types';
import { CatalogFilterDropdown } from './CatalogFilterDropdown';
import { BookReader } from './BookReader';
import { useBooksCatalog } from './hooks/useBooksCatalog';
import { useBookReader } from './hooks/useBookReader';
import { useAuth } from '@/context/AuthContext';

function buildPaginationItems(
  currentPage: number,
  totalPages: number
): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let p = currentPage - 1; p <= currentPage + 1; p += 1) {
    if (p > 1 && p < totalPages) {
      pages.add(p);
    }
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(sorted[i]);
  }
  return items;
}

export function BibliotecaView() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const catalogSectionRef = useRef<HTMLElement | null>(null);
  const [selectedDetailBook, setSelectedDetailBook] = useState<Book | null>(null);
  const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);
  const [bitacoraRefreshVersion, setBitacoraRefreshVersion] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('bitacora') === '1') {
      setIsBitacoraOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenBitacoraEvent = () => setIsBitacoraOpen(true);
    window.addEventListener('babilon:open-bitacora', handleOpenBitacoraEvent);
    return () => window.removeEventListener('babilon:open-bitacora', handleOpenBitacoraEvent);
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('babilon:bitacora-state', { detail: { open: isBitacoraOpen } })
    );
  }, [isBitacoraOpen]);

  const initialPageParam = Number(searchParams.get('page') ?? '1');

  const {
    state: catalog,
    actions: {
      setSearchTerm,
      setAuthorSearch,
      toggleDraftCategory,
      toggleDraftAuthor,
      clearFilterDraft,
      beginFilterDraft,
      cancelFilterDraft,
      applyFilterDraft,
      refreshBooks,
      goToPage,
      nextPage,
      prevPage,
    },
  } = useBooksCatalog({
    initialQuery: searchParams.get('q') ?? '',
    initialCategories: searchParams.getAll('category'),
    initialAuthors: searchParams.getAll('author'),
    initialPage: Number.isFinite(initialPageParam) && initialPageParam >= 1 ? initialPageParam : 1,
  });

  const {
    state: reader,
    actions: {
      openBook,
      closeBook,
      setCurrentPage,
      resumeReading,
      retryPageBlock,
      setTheme,
      setFontSize,
      toggleFullscreen,
    },
  } = useBookReader();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const scrollToCatalogTop = () => {
    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGoToPage = (page: number) => {
    if (page === catalog.currentPage || catalog.loading) return;
    goToPage(page);
    scrollToCatalogTop();
  };

  const handlePrevPage = () => {
    if (!catalog.hasPreviousPage || catalog.loading) return;
    prevPage();
    scrollToCatalogTop();
  };

  const handleNextPage = () => {
    if (!catalog.hasNextPage || catalog.loading) return;
    nextPage();
    scrollToCatalogTop();
  };

  const paginationItems = buildPaginationItems(catalog.currentPage, catalog.totalPages);
  const totalDisplayedCount = catalog.totalCount || catalog.books.length;

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-surface-50 text-stone-900 dark:text-stone-100 selection:bg-terracotta-100 selection:text-terracotta-900 font-sans pb-16 transition-colors duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-3 bg-stone-900 text-stone-50 dark:bg-surface-100 dark:text-stone-100 rounded-xl shadow-lg border border-stone-800 dark:border-surface-300 animate-fade-in max-w-md">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hero & Search Header */}
      <section className="bg-cream-50/70 dark:bg-surface-100 border-b border-stone-200/80 dark:border-surface-300 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cream-200 dark:bg-surface-200 text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-200/80 dark:border-surface-300">
              <Library size={13} className="text-terracotta-600 dark:text-terracotta-500" />
              <span>Catálogo & Preservación Activa</span>
            </div>

            {catalog.health && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Catálogo activo: {totalDisplayedCount} {totalDisplayedCount === 1 ? 'obra' : 'obras'}
              </span>
            )}
          </div>

          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
              Archivo Bibliográfico Babilon
            </h1>
            <p className="text-stone-600 dark:text-stone-400 font-sans text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Explora títulos universales y obras del pensamiento humano digitalizadas. Selecciona cualquier ejemplar para abrir el lector inmersivo de alta legibilidad.
            </p>
          </div>

          {/* Search Box */}
          <div className="mt-7 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
            <div className="md:col-span-8 relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por título, autor o palabra clave..."
                value={catalog.searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-cream-100 dark:bg-surface-200 border border-stone-200/90 dark:border-surface-300 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-300/70 dark:focus:border-surface-400 focus:bg-cream-50 dark:focus:bg-surface-100 focus:ring-2 focus:ring-terracotta-100/40 dark:focus:ring-surface-400/20 transition-all shadow-subtle"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-end gap-3 text-xs text-stone-600 dark:text-stone-400">
              <span className="font-mono">
                {totalDisplayedCount} {totalDisplayedCount === 1 ? 'obra' : 'obras'}
                {catalog.totalPages > 1 ? ` · Pág. ${catalog.currentPage}/${catalog.totalPages}` : ''}
              </span>
              <button
                onClick={() => refreshBooks()}
                className="p-2 rounded-lg border border-stone-200 dark:border-surface-300 hover:border-stone-400 dark:hover:border-surface-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer bg-cream-50 dark:bg-surface-200"
                title="Actualizar catálogo"
              >
                <RefreshCw size={14} className={catalog.loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <CatalogFilterDropdown
              open={catalog.filterMenuOpen}
              selectedCategories={catalog.selectedCategories}
              selectedAuthors={catalog.selectedAuthors}
              draftCategories={catalog.draftCategories}
              draftAuthors={catalog.draftAuthors}
              categories={catalog.availableCategories}
              authors={catalog.availableAuthors}
              authorLabels={catalog.authorLabels}
              authorSearch={catalog.authorSearch}
              activeCount={catalog.selectedFilterCount}
              onAuthorSearchChange={setAuthorSearch}
              onToggleCategory={toggleDraftCategory}
              onToggleAuthor={toggleDraftAuthor}
              onOpen={beginFilterDraft}
              onCancel={cancelFilterDraft}
              onApply={applyFilterDraft}
              onClear={clearFilterDraft}
            />
            {catalog.selectedFilterCount > 0 && (
              <span className="text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
                {catalog.selectedFilterCount} filtros activos
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Book Grid */}
      <section
        ref={catalogSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 scroll-mt-4"
      >
        {catalog.errorMessage && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 text-xs text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{catalog.errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => refreshBooks()}
              className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {catalog.loading && catalog.books.length === 0 ? (
          <div className="py-24 text-center">
            <RefreshCw
              size={24}
              className="animate-spin mx-auto text-stone-600 dark:text-stone-400 mb-3"
            />
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
              Consultando catálogo en la API de libros...
            </p>
          </div>
        ) : catalog.books.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-surface-100 rounded-2xl border border-dashed border-stone-300 dark:border-surface-300 p-8 max-w-xl mx-auto">
            <Feather size={28} className="mx-auto text-stone-400 dark:text-stone-500 mb-2.5" />
            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
              No se hallaron obras registradas
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
              No hay coincidencias para el criterio actual.
            </p>
            {isAdmin && (
              <Link
                href="/subir"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
              >
                <PlusCircle size={14} />
                <span>Incorporar Libro</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-200 ${
                catalog.loading ? 'opacity-55 pointer-events-none' : 'opacity-100'
              }`}
              aria-busy={catalog.loading}
            >
              {catalog.books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onRead={openBook}
                  onSelect={setSelectedDetailBook}
                />
              ))}
            </div>

            {/* Paginación por páginas de 20 obras */}
            <nav
              aria-label="Paginación del catálogo"
              className="mt-12 pt-6 border-t border-stone-200/80 dark:border-surface-300 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <p className="text-xs font-mono text-stone-500 dark:text-stone-400 order-2 sm:order-1">
                Mostrando {catalog.rangeStart}–{catalog.rangeEnd} de {totalDisplayedCount}{' '}
                {totalDisplayedCount === 1 ? 'obra' : 'obras'} · Página {catalog.currentPage} de{' '}
                {catalog.totalPages}
              </p>

              <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={!catalog.hasPreviousPage || catalog.loading}
                  onClick={handlePrevPage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-cream-200/70 dark:hover:bg-surface-300 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft size={15} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {paginationItems.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 py-1 text-xs font-mono text-stone-400 dark:text-stone-500 select-none"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        disabled={catalog.loading}
                        onClick={() => handleGoToPage(item)}
                        aria-current={item === catalog.currentPage ? 'page' : undefined}
                        className={`min-w-[2.25rem] h-9 px-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer disabled:pointer-events-none ${
                          item === catalog.currentPage
                            ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-subtle'
                            : 'border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 text-stone-700 dark:text-stone-300 hover:bg-cream-200/70 dark:hover:bg-surface-300'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  disabled={!catalog.hasNextPage || catalog.loading}
                  onClick={handleNextPage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-cream-200/70 dark:hover:bg-surface-300 transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </nav>
          </>
        )}
      </section>

      {/* Modal de Bitácora de Libros */}
      <BookBitacoraModal
        isOpen={isBitacoraOpen}
        onClose={() => setIsBitacoraOpen(false)}
        initialBooks={catalog.books}
        onSelectBook={(book) => setSelectedDetailBook(book)}
        isDetailModalOpen={Boolean(selectedDetailBook)}
        refreshVersion={bitacoraRefreshVersion}
      />

      {/* Modal de Detalle de Obra (se superpone a la bitácora si fue abierta desde ahí, y al cerrarse regresa a la bitácora) */}
      {selectedDetailBook && (
        <BookDetailModal
          book={selectedDetailBook}
          onClose={() => setSelectedDetailBook(null)}
          onRead={(book) => {
            setIsBitacoraOpen(false);
            openBook(book);
          }}
          onBookUpdated={() => {
            showToast('¡Metadatos de la obra actualizados exitosamente!');
            refreshBooks();
            setBitacoraRefreshVersion((v) => v + 1);
          }}
          onBookDeleted={() => {
            showToast('Obra eliminada de la base de datos.');
            refreshBooks();
            setBitacoraRefreshVersion((v) => v + 1);
          }}
        />
      )}

      {/* Lector de Libros Digital */}
      {reader.readingBook && (
        <BookReader
          book={reader.readingBook}
          page={reader.page}
          pageCount={reader.pageCount}
          pageLoadError={reader.pageLoadError}
          onRetryPage={retryPageBlock}
          onClose={closeBook}
          currentPage={reader.currentPage}
          onPageChange={setCurrentPage}
          savedPageNumber={reader.savedPageNumber}
          readingProgressPercent={reader.readingProgressPercent}
          onResumeReading={resumeReading}
          readingProgressError={reader.readingProgressError}
          theme={reader.theme}
          onThemeChange={setTheme}
          fontSize={reader.fontSize}
          onFontSizeChange={setFontSize}
          isFullscreen={reader.isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isLoadingPages={reader.isLoadingPages}
        />
      )}
    </div>
  );
}
