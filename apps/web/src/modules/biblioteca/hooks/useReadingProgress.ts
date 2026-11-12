'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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
  canTrackProgress: boolean;
  saveProgress: (pageNumber: number, totalPages: number) => void;
}

function getStorageKey(username: string, bookId: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(username.toLowerCase())}:${encodeURIComponent(bookId)}`;
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
  const { user, isAdmin } = useAuth();
  // Solo los usuarios lectores con sesión activa guardan y consultan progreso de lectura (no invitados ni administradores)
  const canTrackProgress = Boolean(user && !isAdmin && user.rol === 'usuario');
  const activeUsername = canTrackProgress && user ? user.username : null;

  const [storedProgress, setStoredProgress] = useState<ReadingProgress | null>(null);
  const [loadedBookId, setLoadedBookId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const readProgress = useCallback(
    (username: string, id: string) => {
      try {
        const rawProgress = window.localStorage.getItem(getStorageKey(username, id));
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
    },
    []
  );

  useEffect(() => {
    setStoredProgress(null);
    setStorageError(null);
    setLoadedBookId(null);

    if (!bookId || !activeUsername) return;

    readProgress(activeUsername, bookId);
    setLoadedBookId(bookId);

    const expectedKey = getStorageKey(activeUsername, bookId);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === expectedKey || event.key === null) {
        readProgress(activeUsername, bookId);
      }
    };
    const handleProgressChanged = (event: Event) => {
      const detail = (event as CustomEvent<ReadingProgress & { username?: string }>).detail;
      if (detail?.bookId === bookId && detail?.username === activeUsername) {
        setStoredProgress(detail);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PROGRESS_CHANGED_EVENT, handleProgressChanged);
    };
  }, [bookId, activeUsername, readProgress]);

  const saveProgress = useCallback(
    (pageNumber: number, totalPages: number) => {
      if (!activeUsername || !bookId || !Number.isInteger(pageNumber) || pageNumber < 1) {
        return;
      }

      const safeTotalPages = Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 0;
      const progress: ReadingProgress = {
        version: 1,
        bookId,
        pageNumber: safeTotalPages > 0 ? Math.min(pageNumber, safeTotalPages) : pageNumber,
        totalPages: safeTotalPages,
        updatedAt: new Date().toISOString(),
      };

      try {
        window.localStorage.setItem(getStorageKey(activeUsername, bookId), JSON.stringify(progress));
        setStoredProgress(progress);
        setLoadedBookId(bookId);
        setStorageError(null);
        window.dispatchEvent(
          new CustomEvent(PROGRESS_CHANGED_EVENT, {
            detail: { ...progress, username: activeUsername },
          })
        );
      } catch {
        setStorageError('No se pudo guardar el marcador local; la lectura puede continuar.');
      }
    },
    [activeUsername, bookId]
  );

  const progress =
    canTrackProgress && bookId && loadedBookId === bookId && storedProgress?.bookId === bookId
      ? storedProgress
      : null;
  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.min(100, Math.round((progress.pageNumber / progress.totalPages) * 100))
      : null;

  return {
    progress,
    progressPercent,
    storageError: canTrackProgress ? storageError : null,
    canTrackProgress,
    saveProgress,
  };
}
