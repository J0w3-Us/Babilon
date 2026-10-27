import { useState, useEffect, useCallback } from 'react';
import { Book } from '@babilon/shared-types';
import { getBooksApi, checkApiHealth, HealthInfo } from '@/services/api';

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
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await getBooksApi({
        query: searchTerm,
        genre: selectedGenre,
      });
      setBooks(result.books);
    } catch {
      setErrorMessage('Error al conectar con la API de libros de Babilon');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre]);

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
      health,
      errorMessage,
    },
    actions: {
      setSearchTerm,
      setSelectedGenre,
      refreshBooks: fetchBooks,
      clearError: () => setErrorMessage(null),
    },
  };
}
