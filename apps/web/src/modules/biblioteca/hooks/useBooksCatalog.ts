import { useState, useEffect, useCallback, useMemo } from 'react';
import { Book } from '@babilon/shared-types';
import { getBooksApi, checkApiHealth, HealthInfo } from '@/services/api';

export const PAGE_SIZE = 20;

export interface UseBooksCatalogOptions {
  initialGenre?: string;
  debounceMs?: number;
}

export function useBooksCatalog({
  initialGenre = 'Todos',
  debounceMs = 280,
}: UseBooksCatalogOptions = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  // Lista acumulada de todas las categorías vistas en los libros
  const [discoveredCategories, setDiscoveredCategories] = useState<Set<string>>(
    new Set(['Ficción', 'Clásicos', 'Filosofía', 'Historia', 'Poesía'])
  );

  // Consulta inicial o tras cambiar filtros (siempre pide los primeros PAGE_SIZE)
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await getBooksApi({
        query: searchTerm,
        genre: selectedGenre,
        limit: PAGE_SIZE,
        skip: 0,
      });

      setBooks(result.books);
      setTotalCount(result.total);
      setHasMore(result.hasMore ?? false);

      // Extraer dinámicamente las categorías reales que vienen en los libros
      if (result.books && result.books.length > 0) {
        setDiscoveredCategories((prev) => {
          const nextSet = new Set(prev);
          result.books.forEach((b) => {
            if (Array.isArray(b.genres)) {
              b.genres.forEach((g) => {
                if (typeof g === 'string' && g.trim()) {
                  nextSet.add(g.trim());
                }
              });
            }
          });
          return nextSet;
        });
      }
    } catch {
      setErrorMessage('Error al conectar con la API de libros de Babilon');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre]);

  // Carga del siguiente lote de 20 libros
  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const result = await getBooksApi({
        query: searchTerm,
        genre: selectedGenre,
        limit: PAGE_SIZE,
        skip: books.length,
      });

      setBooks((prev) => {
        // Evitar duplicados por ID
        const existingIds = new Set(prev.map((b) => b.id));
        const newOnes = result.books.filter((b) => !existingIds.has(b.id));
        return [...prev, ...newOnes];
      });

      setTotalCount(result.total);
      setHasMore(result.hasMore ?? false);

      // Extraer más categorías descubiertas
      if (result.books && result.books.length > 0) {
        setDiscoveredCategories((prev) => {
          const nextSet = new Set(prev);
          result.books.forEach((b) => {
            if (Array.isArray(b.genres)) {
              b.genres.forEach((g) => {
                if (typeof g === 'string' && g.trim()) nextSet.add(g.trim());
              });
            }
          });
          return nextSet;
        });
      }
    } catch {
      setErrorMessage('No se pudieron cargar más libros');
    } finally {
      setLoadingMore(false);
    }
  }, [books.length, hasMore, loadingMore, searchTerm, selectedGenre]);

  // Categorías ordenadas para la barra de filtros
  const availableGenres = useMemo(() => {
    const list = Array.from(discoveredCategories).sort();
    return ['Todos', ...list];
  }, [discoveredCategories]);

  // Chequeo de salud del servicio al montar
  useEffect(() => {
    checkApiHealth().then((h) => setHealth(h));
  }, []);

  // Debounce en la búsqueda y cambio de género
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [fetchBooks, debounceMs]);

  return {
    state: {
      books,
      searchTerm,
      selectedGenre,
      loading,
      loadingMore,
      health,
      errorMessage,
      totalCount,
      hasMore,
      availableGenres,
      pageSize: PAGE_SIZE,
    },
    actions: {
      setSearchTerm,
      setSelectedGenre,
      refreshBooks: fetchBooks,
      loadMoreBooks,
      clearError: () => setErrorMessage(null),
    },
  };
}
