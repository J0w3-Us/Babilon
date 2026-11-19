/**
 * ============================================================================
 * BUSCADOR AVANZADO & PAGINACIÓN DE RED
 * HITO 2.1: Desarrollo de inputs y filtros dinámicos combinados
 * HITO 2.2: Consultas por palabras clave con debounce y sanitización
 * HITO 2.3: Configuración del sistema de paginación de red (limit y skip)
 * ============================================================================
 * - Control de búsqueda reactiva con debounce (280ms) para evitar saturación de sockets.
 * - Combinación de criterios en condición AND (búsqueda textual + categorías + autores).
 * - Paginación estricta por páginas de 20 obras (PAGE_SIZE = 20) compatible con MongoDB y Render.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Book } from '@babilon/shared-types';
import {
  getBooksApi,
  checkApiHealth,
  HealthInfo,
} from '@/services/api';
import { GENRES_LIST } from '@/modules/upload/bookUploadOptions';

export const PAGE_SIZE = 20;

interface CatalogAuthorOption {
  value: string;
  label: string;
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function normalizePage(page: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

function syncUrl(
  query: string,
  categories: string[],
  authors: string[],
  page: number
) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('q');
  url.searchParams.delete('category');
  url.searchParams.delete('author');
  url.searchParams.delete('page');
  if (query.trim()) url.searchParams.set('q', query.trim());
  categories.forEach((category) => url.searchParams.append('category', category));
  authors.forEach((author) => url.searchParams.append('author', author));
  if (page > 1) url.searchParams.set('page', String(page));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function useBooksCatalog({
  debounceMs = 280,
  initialQuery = '',
  initialCategories = [],
  initialAuthors = [],
  initialPage = 1,
}: {
  debounceMs?: number;
  initialQuery?: string;
  initialCategories?: string[];
  initialAuthors?: string[];
  initialPage?: number;
} = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);
  const [selectedAuthors, setSelectedAuthors] = useState(initialAuthors);
  const [draftCategories, setDraftCategories] = useState(initialCategories);
  const [draftAuthors, setDraftAuthors] = useState(initialAuthors);
  const [authorLabels, setAuthorLabels] = useState<Record<string, string>>({});
  const [authorSearch, setAuthorSearch] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [knownAuthors, setKnownAuthors] = useState<CatalogAuthorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(() => normalizePage(initialPage));
  const [hasMore, setHasMore] = useState(false);
  const requestId = useRef(0);

  const rememberAuthors = useCallback((booksToRemember: Book[]) => {
    setKnownAuthors((previous) => {
      const authors = new Map(previous.map((author) => [author.value, author]));
      booksToRemember.forEach((book) => {
        const name = book.author?.name?.trim();
        if (!name) return;
        const value = book.author.id?.trim() || name;
        authors.set(value, { value, label: name });
      });
      return Array.from(authors.values()).sort((left, right) =>
        left.label.localeCompare(right.label, 'es', { sensitivity: 'base' })
      );
    });
  }, []);

  const fetchBooks = useCallback(async () => {
    const activeRequest = ++requestId.current;
    const skip = (currentPage - 1) * PAGE_SIZE;

    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await getBooksApi({
        query: debouncedSearchTerm,
        categories: selectedCategories,
        authors: selectedAuthors,
        limit: PAGE_SIZE,
        skip,
      });
      if (activeRequest !== requestId.current) return;

      if (!result.online) {
        setErrorMessage('Error al conectar con la API de libros de Babilon.');
        return;
      }

      const computedTotalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
      if (result.total > 0 && currentPage > computedTotalPages) {
        setCurrentPage(computedTotalPages);
        return;
      }

      rememberAuthors(result.books);
      setBooks(result.books);
      setTotalCount(result.total);
      setHasMore(result.hasMore ?? skip + result.books.length < result.total);
    } catch {
      if (activeRequest === requestId.current) {
        setErrorMessage('Error al conectar con la API de libros de Babilon.');
      }
    } finally {
      if (activeRequest === requestId.current) setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, rememberAuthors, selectedAuthors, selectedCategories]);

  useEffect(() => {
    if (searchTerm === debouncedSearchTerm) return;
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm, debounceMs]);

  const beginFilterDraft = useCallback(() => {
    setDraftCategories(selectedCategories);
    setDraftAuthors(selectedAuthors);
    setFilterMenuOpen(true);
  }, [selectedAuthors, selectedCategories]);

  const cancelFilterDraft = useCallback(() => {
    setDraftCategories(selectedCategories);
    setDraftAuthors(selectedAuthors);
    setFilterMenuOpen(false);
  }, [selectedAuthors, selectedCategories]);

  const applyFilterDraft = useCallback(() => {
    setSelectedCategories(draftCategories);
    setSelectedAuthors(draftAuthors);
    setCurrentPage(1);
    setFilterMenuOpen(false);
  }, [draftAuthors, draftCategories]);

  const toggleDraftAuthor = useCallback((value: string, label: string) => {
    setDraftAuthors((previous) => toggleValue(previous, value));
    setAuthorLabels((previous) => ({ ...previous, [value]: label }));
  }, []);

  const baseTotalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totalPages = hasMore ? Math.max(baseTotalPages, currentPage + 1) : baseTotalPages;
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const goToPage = useCallback(
    (page: number) => {
      const target = Math.min(totalPages, normalizePage(page));
      setCurrentPage(target);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    setCurrentPage((previous) => (previous < totalPages ? previous + 1 : previous));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((previous) => (previous > 1 ? previous - 1 : 1));
  }, []);

  useEffect(() => {
    syncUrl(debouncedSearchTerm, selectedCategories, selectedAuthors, currentPage);
  }, [debouncedSearchTerm, selectedAuthors, selectedCategories, currentPage]);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    void checkApiHealth().then(setHealth);
  }, []);

  const selectedFilterCount = selectedCategories.length + selectedAuthors.length;
  const normalizedAuthorSearch = authorSearch.trim().toLocaleLowerCase('es');
  const availableAuthors = knownAuthors.filter((author) =>
    author.label.toLocaleLowerCase('es').includes(normalizedAuthorSearch)
  );
  const rangeStart = books.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = books.length > 0 ? (currentPage - 1) * PAGE_SIZE + books.length : 0;

  return {
    state: {
      books,
      searchTerm,
      selectedCategories,
      selectedAuthors,
      draftCategories,
      draftAuthors,
      authorLabels,
      authorSearch,
      filterMenuOpen,
      availableCategories: GENRES_LIST,
      availableAuthors,
      loading,
      health,
      errorMessage,
      totalCount,
      currentPage,
      totalPages,
      hasPreviousPage,
      hasNextPage,
      rangeStart,
      rangeEnd,
      selectedFilterCount,
      pageSize: PAGE_SIZE,
    },
    actions: {
      setSearchTerm,
      setAuthorSearch,
      toggleDraftCategory: (category: string) =>
        setDraftCategories((previous) => toggleValue(previous, category)),
      toggleDraftAuthor,
      clearFilterDraft: () => {
        setDraftCategories([]);
        setDraftAuthors([]);
      },
      beginFilterDraft,
      cancelFilterDraft,
      applyFilterDraft,
      refreshBooks: fetchBooks,
      goToPage,
      nextPage,
      prevPage,
      clearError: () => setErrorMessage(null),
    },
  };
}
