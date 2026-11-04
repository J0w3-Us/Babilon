import { useState, useEffect, useCallback, useRef } from 'react';
import { Book } from '@babilon/shared-types';
import {
  getBooksApi,
  getCatalogFacetsApi,
  checkApiHealth,
  HealthInfo,
  CatalogFacetOption,
} from '@/services/api';

export const PAGE_SIZE = 20;

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function syncUrl(query: string, categories: string[], authors: string[]) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('q');
  url.searchParams.delete('category');
  url.searchParams.delete('author');
  if (query.trim()) url.searchParams.set('q', query.trim());
  categories.forEach((category) => url.searchParams.append('category', category));
  authors.forEach((author) => url.searchParams.append('author', author));
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function useBooksCatalog({
  debounceMs = 280,
  initialQuery = '',
  initialCategories = [],
  initialAuthors = [],
}: {
  debounceMs?: number;
  initialQuery?: string;
  initialCategories?: string[];
  initialAuthors?: string[];
} = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);
  const [selectedAuthors, setSelectedAuthors] = useState(initialAuthors);
  const [draftCategories, setDraftCategories] = useState(initialCategories);
  const [draftAuthors, setDraftAuthors] = useState(initialAuthors);
  const [authorLabels, setAuthorLabels] = useState<Record<string, string>>({});
  const [authorSearch, setAuthorSearch] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableAuthors, setAvailableAuthors] = useState<CatalogFacetOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchBooks = useCallback(async () => {
    const activeRequest = ++requestId.current;
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await getBooksApi({
        query: searchTerm,
        categories: selectedCategories,
        authors: selectedAuthors,
        limit: PAGE_SIZE,
      });
      if (activeRequest !== requestId.current) return;

      setBooks(result.books);
      setTotalCount(result.total);
      setHasMore(result.hasMore ?? false);
      setNextCursor(result.nextCursor ?? null);
    } catch {
      if (activeRequest === requestId.current) {
        setErrorMessage('Error al conectar con la API de libros de Babilon.');
      }
    } finally {
      if (activeRequest === requestId.current) setLoading(false);
    }
  }, [searchTerm, selectedAuthors, selectedCategories]);

  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore || !nextCursor) return;
    const activeRequest = requestId.current;
    setLoadingMore(true);
    setErrorMessage(null);
    try {
      const result = await getBooksApi({
        query: searchTerm,
        categories: selectedCategories,
        authors: selectedAuthors,
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      if (activeRequest !== requestId.current) return;
      setBooks((previous) => {
        const existingIds = new Set(previous.map((book) => book.id));
        return [...previous, ...result.books.filter((book) => !existingIds.has(book.id))];
      });
      setHasMore(result.hasMore ?? false);
      setNextCursor(result.nextCursor ?? null);
    } catch {
      if (activeRequest === requestId.current) {
        setErrorMessage('No se pudieron cargar más libros. Inténtalo de nuevo.');
      }
    } finally {
      if (activeRequest === requestId.current) setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    nextCursor,
    searchTerm,
    selectedAuthors,
    selectedCategories,
  ]);

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
    setFilterMenuOpen(false);
  }, [draftAuthors, draftCategories]);

  const toggleDraftAuthor = useCallback((value: string, label: string) => {
    setDraftAuthors((previous) => toggleValue(previous, value));
    setAuthorLabels((previous) => ({ ...previous, [value]: label }));
  }, []);

  useEffect(() => {
    syncUrl(searchTerm, selectedCategories, selectedAuthors);
  }, [searchTerm, selectedAuthors, selectedCategories]);

  useEffect(() => {
    requestId.current += 1;
    setLoadingMore(false);
    const timer = setTimeout(() => void fetchBooks(), debounceMs);
    return () => clearTimeout(timer);
  }, [fetchBooks, debounceMs]);

  useEffect(() => {
    void checkApiHealth().then(setHealth);
  }, []);

  useEffect(() => {
    if (!filterMenuOpen) return;
    let active = true;
    setLoadingOptions(true);
    setOptionsError(null);
    const timer = setTimeout(() => {
      getCatalogFacetsApi(authorSearch, selectedAuthors)
        .then((facets) => {
          if (!active) return;
          setAvailableCategories(facets.categories);
          setAvailableAuthors(facets.authors);
          setAuthorLabels((previous) => ({
            ...previous,
            ...Object.fromEntries(facets.authors.map((author) => [author.value, author.label])),
          }));
        })
        .catch(() => {
          if (active) setOptionsError('No se pudieron cargar las opciones de filtros.');
        })
        .finally(() => {
          if (active) setLoadingOptions(false);
        });
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [authorSearch, filterMenuOpen, selectedAuthors]);

  const selectedFilterCount = selectedCategories.length + selectedAuthors.length;

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
      availableCategories,
      availableAuthors,
      loadingOptions,
      optionsError,
      loading,
      loadingMore,
      health,
      errorMessage,
      totalCount,
      hasMore,
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
      loadMoreBooks,
      clearError: () => setErrorMessage(null),
    },
  };
}
