'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Check, ChevronDown, Filter, Search, X } from 'lucide-react';
import { CatalogFacetOption } from '@/services/api';

interface CatalogFilterDropdownProps {
  open: boolean;
  selectedCategories: string[];
  selectedAuthors: string[];
  draftCategories: string[];
  draftAuthors: string[];
  categories: string[];
  authors: CatalogFacetOption[];
  authorLabels: Record<string, string>;
  authorSearch: string;
  activeCount: number;
  isLoadingOptions: boolean;
  optionsError: string | null;
  onAuthorSearchChange: (value: string) => void;
  onToggleCategory: (value: string) => void;
  onToggleAuthor: (value: string, label: string) => void;
  onOpen: () => void;
  onCancel: () => void;
  onApply: () => void;
  onClear: () => void;
}

export function CatalogFilterDropdown({
  open,
  selectedCategories,
  selectedAuthors,
  draftCategories,
  draftAuthors,
  categories,
  authors,
  authorLabels,
  authorSearch,
  activeCount,
  isLoadingOptions,
  optionsError,
  onAuthorSearchChange,
  onToggleCategory,
  onToggleAuthor,
  onOpen,
  onCancel,
  onApply,
  onClear,
}: CatalogFilterDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const authorOptions = useMemo(() => {
    const options = new Map(authors.map((author) => [author.value, author]));
    selectedAuthors.forEach((value) => {
      if (!options.has(value)) {
        options.set(value, { value, label: authorLabels[value] ?? value });
      }
    });
    return Array.from(options.values());
  }, [authorLabels, authors, selectedAuthors]);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    }, 0);
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        onCancel();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel, open]);

  const checkboxClasses =
    'h-4 w-4 shrink-0 rounded border-stone-400 accent-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600';
  const optionClasses =
    'flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-stone-800 hover:bg-cream-200 focus-within:bg-cream-200 dark:text-stone-200 dark:hover:bg-surface-200 dark:focus-within:bg-surface-200';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="catalog-filter-panel"
        aria-label={`Filtros${activeCount ? `, ${activeCount} activos` : ''}`}
        onClick={() => (open ? onCancel() : onOpen())}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-stone-200/90 bg-cream-50 px-3.5 text-sm font-semibold text-stone-800 transition-colors hover:border-stone-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600 dark:border-surface-300 dark:bg-surface-100 dark:text-stone-100 dark:hover:border-surface-400"
      >
        <Filter size={15} aria-hidden="true" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span
            aria-label={`${activeCount} filtros activos`}
            className="inline-flex min-w-5 items-center justify-center rounded-full bg-stone-900 px-1.5 py-0.5 text-[11px] leading-none text-cream-50 dark:bg-cream-100 dark:text-stone-900"
          >
            {activeCount}
          </span>
        )}
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="catalog-filter-panel"
          role="dialog"
          aria-label="Filtros del catálogo"
          className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-stone-200 bg-cream-50 shadow-xl dark:border-surface-300 dark:bg-surface-100"
        >
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-surface-300">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Filtrar catálogo
              </h2>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400" aria-live="polite">
                {draftCategories.length + draftAuthors.length} selecciones pendientes
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onCancel();
                triggerRef.current?.focus();
              }}
              aria-label="Cerrar filtros sin aplicar"
              className="rounded-md p-1.5 text-stone-500 hover:bg-cream-200 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 dark:hover:bg-surface-200 dark:hover:text-stone-100"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[min(65vh,28rem)] overflow-y-auto p-3">
            <fieldset>
              <legend className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Categorías
              </legend>
              <div className="max-h-40 overflow-y-auto">
                {categories.length === 0 ? (
                  <p className="px-2 py-3 text-xs text-stone-500 dark:text-stone-400">
                    No hay categorías disponibles.
                  </p>
                ) : (
                  categories.map((category) => (
                    <label key={category} className={optionClasses}>
                      <input
                        type="checkbox"
                        checked={draftCategories.includes(category)}
                        onChange={() => onToggleCategory(category)}
                        className={checkboxClasses}
                      />
                      <span className="min-w-0 flex-1 truncate">{category}</span>
                      {draftCategories.includes(category) && (
                        <Check size={14} className="text-terracotta-700 dark:text-terracotta-400" aria-hidden="true" />
                      )}
                    </label>
                  ))
                )}
              </div>
            </fieldset>

            <fieldset className="mt-4 border-t border-stone-200 pt-3 dark:border-surface-300">
              <legend className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                Autores
              </legend>
              <label className="relative mb-2 block">
                <Search
                  size={14}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="search"
                  value={authorSearch}
                  onChange={(event) => onAuthorSearchChange(event.target.value)}
                  placeholder="Buscar autor..."
                  aria-label="Buscar autores"
                  className="min-h-10 w-full rounded-lg border border-stone-200 bg-cream-100 py-2 pl-8 pr-3 text-sm text-stone-900 outline-none focus-visible:border-terracotta-500 focus-visible:ring-2 focus-visible:ring-terracotta-200 dark:border-surface-300 dark:bg-surface-200 dark:text-stone-100 dark:focus-visible:ring-surface-400"
                />
              </label>

              {optionsError ? (
                <p role="alert" className="px-2 py-3 text-xs text-rose-700 dark:text-rose-300">
                  {optionsError}
                </p>
              ) : isLoadingOptions ? (
                <p className="px-2 py-3 text-xs text-stone-500 dark:text-stone-400" role="status">
                  Buscando autores...
                </p>
              ) : authorOptions.length === 0 ? (
                <p className="px-2 py-3 text-xs text-stone-500 dark:text-stone-400">
                  {authorSearch.trim()
                    ? 'No hay autores que coincidan con la búsqueda.'
                    : 'No hay autores disponibles.'}
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {authorOptions.map((author) => (
                    <label key={author.value} className={optionClasses}>
                      <input
                        type="checkbox"
                        checked={draftAuthors.includes(author.value)}
                        onChange={() => onToggleAuthor(author.value, author.label)}
                        className={checkboxClasses}
                      />
                      <span className="min-w-0 flex-1 truncate">{author.label}</span>
                      {draftAuthors.includes(author.value) && (
                        <Check size={14} className="text-terracotta-700 dark:text-terracotta-400" aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-stone-200 bg-cream-100 px-3 py-3 dark:border-surface-300 dark:bg-surface-200">
            <button
              type="button"
              onClick={onClear}
              className="min-h-10 rounded-lg px-3 text-xs font-semibold text-stone-700 hover:bg-cream-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 dark:text-stone-300 dark:hover:bg-surface-300"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => {
                onApply();
                triggerRef.current?.focus();
              }}
              className="min-h-10 rounded-lg bg-stone-900 px-4 text-xs font-semibold text-cream-50 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta-600 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
