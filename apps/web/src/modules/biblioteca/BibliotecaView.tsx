'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  RefreshCw,
  Library,
  Feather,
  UploadCloud,
  CheckCircle2,
  ArrowLeft,
  X,
} from 'lucide-react';

import { BookCard } from './BookCard';
import { CatalogFilterDropdown } from './CatalogFilterDropdown';
import { BookReader } from './BookReader';
import { BookUploadWizard } from '@/modules/upload/BookUploadWizard';
import { useBooksCatalog } from './hooks/useBooksCatalog';
import { useBookReader } from './hooks/useBookReader';

export function BibliotecaView() {
  const searchParams = useSearchParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
      loadMoreBooks,
    },
  } = useBooksCatalog({
    initialQuery: searchParams.get('q') ?? '',
    initialCategories: searchParams.getAll('category'),
    initialAuthors: searchParams.getAll('author'),
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

  // Abrir modal si viene el query param ?action=subir
  useEffect(() => {
    if (searchParams.get('action') === 'subir') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-surface-50 text-stone-900 dark:text-stone-100 selection:bg-terracotta-100 selection:text-terracotta-900 font-sans pb-16 transition-colors duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 bg-stone-900 text-stone-50 dark:bg-surface-100 dark:text-stone-100 rounded-xl shadow-lg border border-stone-800 dark:border-surface-300 animate-fade-in max-w-md">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Subheader / Breadcrumb Bar */}
      <div className="bg-cream-50/80 dark:bg-surface-100 border-b border-stone-200/80 dark:border-surface-300 py-3.5 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <span className="text-stone-300 dark:text-surface-400">/</span>
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider font-mono">
              Biblioteca Digital
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {catalog.health && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Catálogo: {catalog.totalCount > 0 ? `${catalog.books.length} de ${catalog.totalCount} obras` : `${catalog.books.length} obras`}
              </span>
            )}

            <Link
              href="/subir"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cream-200 dark:bg-surface-200 text-stone-700 dark:text-stone-300 hover:bg-cream-300 dark:hover:bg-surface-300 text-xs font-medium border border-stone-200/80 dark:border-surface-300 transition-colors cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Página de Subida</span>
            </Link>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50 text-xs font-semibold shadow-subtle transition-all cursor-pointer"
            >
              <PlusCircle size={14} />
              <span>Digitalizar Obra</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero & Search Header */}
      <section className="bg-cream-50/70 dark:bg-surface-100 border-b border-stone-200/80 dark:border-surface-300 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cream-200 dark:bg-surface-200 text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-200/80 dark:border-surface-300 mb-3">
              <Library size={13} className="text-terracotta-600 dark:text-terracotta-500" />
              <span>Catálogo & Preservación Activa</span>
            </div>
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
                {catalog.books.length} {catalog.books.length === 1 ? 'obra' : 'obras'}
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
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
              No hay coincidencias para el criterio actual. Puedes subir y digitalizar una obra nueva de inmediato.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              <PlusCircle size={14} />
              Incorporar Libro
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catalog.books.map((book) => (
                <BookCard key={book.id} book={book} onRead={openBook} />
              ))}
            </div>

            {/* Paginación y Carga por Lotes de 20 */}
            <div className="mt-12 flex flex-col items-center justify-center gap-3">
              {catalog.hasMore ? (
                <button
                  type="button"
                  disabled={catalog.loadingMore}
                  onClick={() => loadMoreBooks()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold text-xs hover:bg-stone-800 dark:hover:bg-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  {catalog.loadingMore ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Cargando más obras...</span>
                    </>
                  ) : (
                    <>
                      <span>Cargar más obras (+20)</span>
                    </>
                  )}
                </button>
              ) : catalog.books.length > 20 ? (
                <p className="text-xs font-mono text-stone-400 dark:text-stone-500">
                  Has visualizado el total de las {catalog.totalCount} obras disponibles en este filtro.
                </p>
              ) : null}

              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Mostrando {catalog.books.length} de {catalog.totalCount || catalog.books.length} obras registradas
              </p>
            </div>
          </>
        )}
      </section>

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

      {/* Modal de Subida de Libros */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-surface-100 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-stone-200 dark:border-surface-300 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UploadCloud size={18} className="text-terracotta-600 dark:text-terracotta-500" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                    Subir y Digitalizar Obra
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                    Persistencia en la API de libros
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-full border border-stone-200 dark:border-surface-300 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <BookUploadWizard
                isModal={true}
                onCancel={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                  setIsAddModalOpen(false);
                  showToast('¡Obra agregada exitosamente!');
                  refreshBooks();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
