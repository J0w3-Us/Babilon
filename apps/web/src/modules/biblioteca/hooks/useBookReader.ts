import { useState, useCallback } from 'react';
import { Book } from '@babilon/shared-types';
import { getBookByIdApi } from '@/services/api';

export type ReaderTheme = 'parchment' | 'dark' | 'light';

export interface UseBookReaderOptions {
  initialTheme?: ReaderTheme;
  initialFontSize?: number;
}

export function useBookReader({
  initialTheme = 'light',
  initialFontSize = 18,
}: UseBookReaderOptions = {}) {
  // El libro del catálogo (metadatos, sin páginas completas)
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [theme, setTheme] = useState<ReaderTheme>(initialTheme);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  // true mientras se carga el detalle completo con páginas
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);

  /**
   * Abre el lector con el libro del catálogo y, en paralelo,
   * obtiene el detalle completo (con `paginas`) desde la API.
   */
  const openBook = useCallback(async (book: Book, startPage = 0) => {
    // Mostrar el lector inmediatamente con los datos del catálogo
    setReadingBook(book);
    setCurrentPage(startPage);
    setIsLoadingPages(true);

    try {
      const fullBook = await getBookByIdApi(book.id);
      if (fullBook && fullBook.pages && fullBook.pages.length > 0) {
        // Reemplazar con el libro completo que tiene las páginas
        setReadingBook(fullBook);
      }
      // Si falla o no hay páginas, el lector ya muestra el sampleChapterText o sinopsis
    } catch {
      // silencioso: el lector ya tiene datos mínimos del catálogo
    } finally {
      setIsLoadingPages(false);
    }
  }, []);

  const closeBook = () => {
    setReadingBook(null);
    setCurrentPage(0);
    setIsFullscreen(false);
    setIsLoadingPages(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return {
    state: {
      readingBook,
      currentPage,
      theme,
      fontSize,
      isFullscreen,
      isLoadingPages,
      isOpen: readingBook !== null,
    },
    actions: {
      openBook,
      closeBook,
      setCurrentPage,
      setTheme,
      // Expone el setter de React directamente (compatible con (prev) => number)
      setFontSize,
      toggleFullscreen,
    },
  };
}
