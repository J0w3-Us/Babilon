import { useState, useCallback, useEffect, useRef } from 'react';
import { Book, BookPage } from '@babilon/shared-types';
import { getBookPagesApi } from '@/services/api';
import { useReadingProgress } from './useReadingProgress';
import { sanitizeBookPages } from '@/lib/bookTextCleaner';

const PAGE_BLOCK_SIZE = 10;

export type ReaderTheme = 'parchment' | 'dark' | 'light';

export interface UseBookReaderOptions {
  initialTheme?: ReaderTheme;
  initialFontSize?: number;
}

export function useBookReader({
  initialTheme = 'light',
  initialFontSize = 18,
}: UseBookReaderOptions = {}) {
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagesByNumber, setPagesByNumber] = useState<Record<number, BookPage>>({});
  const [pageCount, setPageCount] = useState(0);
  const [pageLoadError, setPageLoadError] = useState<string | null>(null);
  const [reloadPageBlock, setReloadPageBlock] = useState(0);
  const [theme, setTheme] = useState<ReaderTheme>(initialTheme);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const requestId = useRef(0);
  const userNavigationPending = useRef(false);
  const {
    progress: savedProgress,
    progressPercent: readingProgressPercent,
    storageError: readingProgressError,
    saveProgress,
  } = useReadingProgress(readingBook?.id ?? null);

  const openBook = useCallback((book: Book, startPage = 0) => {
    requestId.current += 1;
    userNavigationPending.current = false;
    setReadingBook(book);
    setCurrentPage(Math.max(0, startPage));
    setPagesByNumber({});
    setPageCount(Math.max(0, book.pageCount || 0));
    setPageLoadError(null);
    setIsLoadingPages(true);
  }, []);

  useEffect(() => {
    if (!readingBook) return;

    const requestedPage = currentPage + 1;
    const blockStart = Math.floor((requestedPage - 1) / PAGE_BLOCK_SIZE) * PAGE_BLOCK_SIZE + 1;
    const currentRequestId = ++requestId.current;
    if (pagesByNumber[requestedPage]) {
      if (userNavigationPending.current) {
        saveProgress(requestedPage, pageCount || savedProgress?.totalPages || 0);
        userNavigationPending.current = false;
      }
      setIsLoadingPages(false);
      return;
    }

    setIsLoadingPages(true);
    setPageLoadError(null);
    getBookPagesApi(readingBook.id, blockStart, PAGE_BLOCK_SIZE)
      .then(({ pages, total }) => {
        if (currentRequestId !== requestId.current) return;
        const cleanedPages = sanitizeBookPages(pages, {
          title: readingBook.title,
          author: readingBook.author?.name,
        });
        setPagesByNumber((previous) => ({
          ...previous,
          ...Object.fromEntries(cleanedPages.map((page) => [page.numero, page])),
        }));
        setPageCount(total);
        if (
          userNavigationPending.current &&
          pages.some((loadedPage) => loadedPage.numero === requestedPage)
        ) {
          saveProgress(requestedPage, total);
          userNavigationPending.current = false;
        }
      })
      .catch(() => {
        if (currentRequestId === requestId.current) {
          setPageLoadError('No se pudo cargar este bloque de páginas.');
        }
      })
      .finally(() => {
        if (currentRequestId === requestId.current) setIsLoadingPages(false);
      });

    return () => {
      if (currentRequestId === requestId.current) requestId.current += 1;
    };
  }, [
    currentPage,
    pageCount,
    pagesByNumber,
    readingBook,
    reloadPageBlock,
    saveProgress,
    savedProgress?.totalPages,
  ]);

  const changePage = useCallback((page: number) => {
    const availablePages = pageCount > 0 ? pageCount : savedProgress?.totalPages ?? 0;
    const nextPage = Math.max(0, Math.min(page, Math.max(0, availablePages - 1)));
    if (nextPage !== currentPage) userNavigationPending.current = true;
    setCurrentPage(nextPage);
  }, [currentPage, pageCount, savedProgress?.totalPages]);

  const resumeReading = useCallback(() => {
    if (savedProgress) changePage(savedProgress.pageNumber - 1);
  }, [changePage, savedProgress]);

  const retryPageBlock = useCallback(() => {
    setPageLoadError(null);
    setReloadPageBlock((previous) => previous + 1);
  }, []);

  const closeBook = useCallback(() => {
    requestId.current += 1;
    userNavigationPending.current = false;
    setReadingBook(null);
    setCurrentPage(0);
    setPagesByNumber({});
    setPageCount(0);
    setPageLoadError(null);
    setIsFullscreen(false);
    setIsLoadingPages(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((previous) => !previous);
  }, []);

  return {
    state: {
      readingBook,
      currentPage,
      page: pagesByNumber[currentPage + 1] ?? null,
      pageCount,
      pageLoadError,
      savedPageNumber: savedProgress?.pageNumber ?? null,
      readingProgressPercent,
      readingProgressError,
      theme,
      fontSize,
      isFullscreen,
      isLoadingPages,
      isOpen: readingBook !== null,
    },
    actions: {
      openBook,
      closeBook,
      setCurrentPage: changePage,
      resumeReading,
      retryPageBlock,
      setTheme,
      setFontSize,
      toggleFullscreen,
    },
  };
}
