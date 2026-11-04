'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY_PREFIX = 'babilon:reading-progress:v1:';
const PROGRESS_CHANGED_EVENT = 'babilon:reading-progress-changed';

export interface ReadingProgress {
  version: 1;
  bookId: string;
  pageNumber: number;
  totalPages: number;
  updatedAt: string;
}

interface UseReadingProgressResult {
  progress: ReadingProgress | null;
  progressPercent: number | null;
  storageError: string | null;
  saveProgress: (pageNumber: number, totalPages: number) => void;
}

function getStorageKey(bookId: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(bookId)}`;
}

function parseProgress(value: string, bookId: string): ReadingProgress | null {
  const parsed: unknown = JSON.parse(value);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('bookId' in parsed) ||
    !('pageNumber' in parsed) ||
    !('totalPages' in parsed) ||
    !('updatedAt' in parsed)
  ) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  if (
    record.version !== 1 ||
    record.bookId !== bookId ||
    typeof record.pageNumber !== 'number' ||
    !Number.isInteger(record.pageNumber) ||
    record.pageNumber < 1 ||
    typeof record.totalPages !== 'number' ||
    !Number.isInteger(record.totalPages) ||
    record.totalPages < 0 ||
    typeof record.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    version: 1,
    bookId,
    pageNumber: record.pageNumber,
    totalPages: record.totalPages,
    updatedAt: record.updatedAt,
  };
}

export function useReadingProgress(bookId: string | null): UseReadingProgressResult {
  const [storedProgress, setStoredProgress] = useState<ReadingProgress | null>(null);
  const [loadedBookId, setLoadedBookId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const readProgress = useCallback((id: string) => {
    try {
      const rawProgress = window.localStorage.getItem(getStorageKey(id));
      if (!rawProgress) {
        setStoredProgress(null);
        setStorageError(null);
        return;
      }

      const progress = parseProgress(rawProgress, id);
      if (!progress) {
        setStoredProgress(null);
        setStorageError('El marcador local tiene un formato inválido; la lectura puede continuar.');
        return;
      }

      setStoredProgress(progress);
      setStorageError(null);
    } catch {
      setStoredProgress(null);
      setStorageError('No se pudo leer el marcador local; la lectura puede continuar.');
    }
  }, []);

  useEffect(() => {
    setStoredProgress(null);
    setStorageError(null);
    setLoadedBookId(null);
    if (!bookId) return;

    readProgress(bookId);
    setLoadedBookId(bookId);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getStorageKey(bookId) || event.key === null) {
        readProgress(bookId);
      }
    };
    const handleProgressChanged = (event: Event) => {
      const detail = (event as CustomEvent<ReadingProgress>).detail;
      if (detail?.bookId === bookId) setStoredProgress(detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
    };
  }, [bookId, readProgress]);

  const saveProgress = useCallback(
    (pageNumber: number, totalPages: number) => {
      if (!bookId || !Number.isInteger(pageNumber) || pageNumber < 1) return;

      const safeTotalPages = Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 0;
      const progress: ReadingProgress = {
        version: 1,
        bookId,
        pageNumber: safeTotalPages > 0 ? Math.min(pageNumber, safeTotalPages) : pageNumber,
        totalPages: safeTotalPages,
        updatedAt: new Date().toISOString(),
      };

      try {
        window.localStorage.setItem(getStorageKey(bookId), JSON.stringify(progress));
        setStoredProgress(progress);
        setLoadedBookId(bookId);
        setStorageError(null);
        window.dispatchEvent(
          new CustomEvent<ReadingProgress>(PROGRESS_CHANGED_EVENT, { detail: progress })
        );
      } catch {
        setStorageError('No se pudo guardar el marcador local; la lectura puede continuar.');
      }
    },
    [bookId]
  );

  const progress =
    bookId && loadedBookId === bookId && storedProgress?.bookId === bookId
      ? storedProgress
      : null;
  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.min(100, Math.round((progress.pageNumber / progress.totalPages) * 100))
      : null;

  return { progress, progressPercent, storageError, saveProgress };
}
