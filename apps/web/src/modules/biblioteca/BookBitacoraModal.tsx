'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Book } from '@babilon/shared-types';
import { getBooksBitacoraApi } from '@/services/api';
import { downloadBitacoraPdf } from '@/lib/bitacoraPdfGenerator';
import {
  X,
  ClipboardList,
  Search,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  History,
  FileText,
  Hash,
  Building2,
  Layers,
  Tag,
  User,
  Database,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  AlertCircle,
  ArrowUpDown,
  UploadCloud,
  Check,
} from 'lucide-react';

interface BookBitacoraModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBooks?: Book[];
  onSelectBook?: (book: Book) => void;
  isDetailModalOpen?: boolean;
  refreshVersion?: number;
}

type StatusFilter = 'all' | 'updated' | 'original';
type SortOption = 'uploaded_desc' | 'updated_desc' | 'title_asc' | 'year_desc';

const SORT_OPTIONS: Array<{ value: SortOption; label: string; shortLabel: string }> = [
  {
    value: 'uploaded_desc',
    label: 'Fecha de subida (Más recientes)',
    shortLabel: 'Orden: Fecha de subida (Recientes)',
  },
  {
    value: 'updated_desc',
    label: 'Última actualización',
    shortLabel: 'Orden: Última actualización',
  },
  {
    value: 'title_asc',
    label: 'Título alfabético (A - Z)',
    shortLabel: 'Orden: Título (A - Z)',
  },
  {
    value: 'year_desc',
    label: 'Año de publicación',
    shortLabel: 'Orden: Año de publicación',
  },
];

export function formatBitacoraDate(isoDate?: string | null): {
  shortDate: string;
  time: string;
  fullLabel: string;
  relative: string;
} | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const shortDate = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const time = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  const fullLabel = `${shortDate} · ${time}`;

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = 'Reciente';
  if (diffMinutes < 1) {
    relative = 'Hace instantes';
  } else if (diffMinutes < 60) {
    relative = `Hace ${diffMinutes} min`;
  } else if (diffHours < 24) {
    relative = `Hace ${diffHours} h`;
  } else if (diffDays === 1) {
    relative = 'Ayer';
  } else if (diffDays < 30) {
    relative = `Hace ${diffDays} días`;
  } else {
    relative = shortDate;
  }

  return { shortDate, time, fullLabel, relative };
}

export function BookBitacoraModal({
  isOpen,
  onClose,
  initialBooks = [],
  onSelectBook,
  isDetailModalOpen = false,
  refreshVersion = 0,
}: BookBitacoraModalProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('uploaded_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadBitacora = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBooksBitacoraApi();
      if (!result.online) {
        setError('No se pudo sincronizar la bitácora con el servidor. Mostrando registros en caché.');
      } else {
        setBooks(result.books);
      }
    } catch {
      setError('Error al consultar la bitácora de libros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (initialBooks.length > 0 && books.length === 0) {
      setBooks(initialBooks);
    }
    void loadBitacora();
  }, [isOpen, refreshVersion, loadBitacora]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDetailModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDetailModalOpen, onClose]);

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const updatedBooks = books.filter((b) => b.wasUpdated && b.updatedAt).length;
    const originalBooks = totalBooks - updatedBooks;
    const totalPages = books.reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0);

    let latestTimestamp = 0;
    for (const b of books) {
      const uTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      const mTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (uTime > latestTimestamp) latestTimestamp = uTime;
      if (mTime > latestTimestamp) latestTimestamp = mTime;
    }

    const latestActivity =
      latestTimestamp > 0
        ? formatBitacoraDate(new Date(latestTimestamp).toISOString())?.fullLabel ?? 'Sin registro'
        : 'Sin registro';

    return {
      totalBooks,
      updatedBooks,
      originalBooks,
      totalPages,
      latestActivity,
    };
  }, [books]);

  const filteredAndSortedBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = books.filter((book) => {
      if (statusFilter === 'updated' && !(book.wasUpdated && book.updatedAt)) {
        return false;
      }
      if (statusFilter === 'original' && book.wasUpdated && book.updatedAt) {
        return false;
      }

      if (!q) return true;

      const haystack = [
        book.title,
        book.author?.name,
        book.isbn,
        book.publisher,
        book.publishedYear,
        book.origin,
        book.catalogType,
        ...(book.genres || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'year_desc') {
        return (b.publishedYear || 0) - (a.publishedYear || 0);
      }
      if (sortBy === 'updated_desc') {
        const aTime = a.updatedAt
          ? new Date(a.updatedAt).getTime()
          : a.uploadedAt
            ? new Date(a.uploadedAt).getTime()
            : 0;
        const bTime = b.updatedAt
          ? new Date(b.updatedAt).getTime()
          : b.uploadedAt
            ? new Date(b.uploadedAt).getTime()
            : 0;
        if (bTime !== aTime) return bTime - aTime;
        return Number(Boolean(b.wasUpdated)) - Number(Boolean(a.wasUpdated));
      }

      // default: uploaded_desc
      const aUpload = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
      const bUpload = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
      return bUpload - aUpload;
    });
  }, [books, searchQuery, statusFilter, sortBy]);

  const activeSortOption =
    SORT_OPTIONS.find((opt) => opt.value === sortBy) || SORT_OPTIONS[0];

  const handleExportPdf = () => {
    const filterLabel =
      statusFilter === 'updated'
        ? 'Solo Actualizados'
        : statusFilter === 'original'
          ? 'Solo Originales'
          : 'Todos los registros';

    downloadBitacoraPdf(filteredAndSortedBooks, {
      totalBooks: stats.totalBooks,
      updatedBooks: stats.updatedBooks,
      originalBooks: stats.originalBooks,
      totalPages: stats.totalPages,
      latestActivity: stats.latestActivity,
      filterLabel,
      sortLabel: activeSortOption.shortLabel,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bitacora-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-cream-50 dark:bg-surface-100 rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Cabecera de la Bitácora */}
        <div className="px-6 py-5 border-b border-stone-200/80 dark:border-surface-300 bg-white dark:bg-surface-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/60 border border-terracotta-200 dark:border-terracotta-800/50 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 shrink-0 shadow-2xs">
              <ClipboardList size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  id="bitacora-modal-title"
                  className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight"
                >
                  Bitácora y Registro Bibliográfico
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-terracotta-100 dark:bg-terracotta-950/80 text-terracotta-800 dark:text-terracotta-300 border border-terracotta-200/80 dark:border-terracotta-800/50">
                  Auditoría de Catálogo
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Historial de fechas de subida, metadatos técnicos completos y registro de actualizaciones de cada obra.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={filteredAndSortedBooks.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-terracotta-300/80 dark:border-terracotta-800/60 bg-terracotta-50/80 dark:bg-terracotta-950/50 text-xs font-semibold text-terracotta-800 dark:text-terracotta-300 hover:bg-terracotta-100 dark:hover:bg-terracotta-900/60 transition-colors cursor-pointer disabled:opacity-40 shadow-2xs"
              title="Descargar reporte oficial de bitácora en PDF"
            >
              <Download size={14} />
              <span>Exportar PDF</span>
            </button>

            <button
              type="button"
              onClick={() => void loadBitacora()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-100 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-cream-200/70 dark:hover:bg-surface-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Actualizar bitácora"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar bitácora"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tarjetas de Resumen (KPIs) */}
        <div className="px-6 py-4 bg-cream-100/80 dark:bg-surface-200/40 border-b border-stone-200/70 dark:border-surface-300 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-200 border border-stone-200/80 dark:border-surface-300 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-surface-300 flex items-center justify-center text-stone-700 dark:text-stone-200 shrink-0">
              <Database size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                Obras Registradas
              </p>
              <p className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 leading-tight">
                {stats.totalBooks}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-200 border border-stone-200/80 dark:border-surface-300 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <History size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                Obras Actualizadas
              </p>
              <p className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 leading-tight">
                {stats.updatedBooks}{' '}
                <span className="text-[11px] font-sans font-normal text-stone-400">
                  ({stats.originalBooks} orig.)
                </span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-200 border border-stone-200/80 dark:border-surface-300 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                Páginas en Archivo
              </p>
              <p className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 leading-tight">
                {stats.totalPages.toLocaleString('es-MX')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-200 border border-stone-200/80 dark:border-surface-300 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-terracotta-50 dark:bg-terracotta-950/50 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 shrink-0">
              <Clock size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400 truncate">
                Último Movimiento
              </p>
              <p
                className="text-xs font-bold font-mono text-stone-900 dark:text-stone-100 truncate mt-0.5"
                title={stats.latestActivity}
              >
                {stats.latestActivity}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros, Búsqueda y Ordenamiento */}
        <div className="px-6 py-3.5 bg-white/80 dark:bg-surface-100 border-b border-stone-200/80 dark:border-surface-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar bitácora por título, autor, ISBN, editorial o género..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de estado */}
            <div className="inline-flex items-center rounded-xl bg-cream-100 dark:bg-surface-200 p-1 border border-stone-200/80 dark:border-surface-300">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Todos ({stats.totalBooks})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('updated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'updated'
                    ? 'bg-terracotta-600 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Actualizados ({stats.updatedBooks})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'original'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Originales ({stats.originalBooks})
              </button>
            </div>

            {/* Dropdown personalizado con el diseño editorial de Babilon */}
            <div ref={sortDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setSortDropdownOpen((prev) => !prev)}
                aria-expanded={sortDropdownOpen}
                aria-haspopup="listbox"
                className={`inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-w-[240px] ${
                  sortDropdownOpen
                    ? 'border-terracotta-400 dark:border-terracotta-500 bg-white dark:bg-surface-200 text-stone-900 dark:text-stone-100 shadow-sm'
                    : 'border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-200 text-stone-700 dark:text-stone-200 hover:border-stone-300 dark:hover:border-surface-400'
                }`}
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <ArrowUpDown size={13} className="text-terracotta-600 dark:text-terracotta-400 shrink-0" />
                  <span className="truncate">{activeSortOption.shortLabel}</span>
                </span>
                <ChevronDown
                  size={14}
                  className={`text-stone-400 shrink-0 transition-transform duration-200 ${
                    sortDropdownOpen ? 'rotate-180 text-terracotta-500' : ''
                  }`}
                />
              </button>

              {sortDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Opciones de ordenamiento"
                  className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200 shadow-2xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    Ordenar Bitácora por
                  </div>
                  {SORT_OPTIONS.map((option) => {
                    const isSelected = option.value === sortBy;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSortBy(option.value);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-terracotta-50 dark:bg-terracotta-950/60 text-terracotta-800 dark:text-terracotta-300 font-semibold border border-terracotta-200/70 dark:border-terracotta-800/50'
                            : 'text-stone-700 dark:text-stone-200 hover:bg-cream-100 dark:hover:bg-surface-300'
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && (
                          <Check size={14} className="text-terracotta-600 dark:text-terracotta-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido Principal: Lista / Tabla de Registros */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-reader-scrollbar">
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && books.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw size={26} className="animate-spin mx-auto text-terracotta-600" />
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Cargando bitácora y metadatos del archivo bibliográfico...
              </p>
            </div>
          ) : filteredAndSortedBooks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-stone-300 dark:border-surface-300 bg-white/60 dark:bg-surface-200/40 p-8 max-w-lg mx-auto space-y-2">
              <ClipboardList size={30} className="mx-auto text-stone-400" />
              <h3 className="font-serif text-base font-bold text-stone-800 dark:text-stone-200">
                No se encontraron registros en la bitácora
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Prueba cambiando el filtro de estado o el término de búsqueda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedBooks.map((book) => {
                const uploadDateInfo = formatBitacoraDate(book.uploadedAt);
                const updateDateInfo =
                  book.wasUpdated && book.updatedAt
                    ? formatBitacoraDate(book.updatedAt)
                    : null;
                const isExpanded = expandedBookId === book.id;

                return (
                  <div
                    key={book.id}
                    className="rounded-2xl border border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200/80 shadow-2xs hover:border-stone-300 dark:hover:border-surface-400 transition-all overflow-hidden"
                  >
                    {/* Fila Principal del Registro */}
                    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* 1. Identificación de la Obra */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-16 rounded-xl overflow-hidden bg-cream-200 dark:bg-surface-300 border border-stone-200 dark:border-surface-300 shrink-0 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-cream-200/90 dark:bg-surface-300 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-surface-300">
                              {book.isbn || 'SIN-ISBN'}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-surface-300/60 text-stone-600 dark:text-stone-400">
                              {book.origin || 'Archivo Babilon'}
                            </span>
                            {(book.genres || []).slice(0, 2).map((g) => (
                              <span
                                key={g}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-terracotta-50 dark:bg-terracotta-950/50 text-terracotta-700 dark:text-terracotta-300 border border-terracotta-200/60 dark:border-terracotta-800/40"
                              >
                                {g}
                              </span>
                            ))}
                          </div>

                          <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug truncate">
                            {book.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                            <span className="inline-flex items-center gap-1 font-medium">
                              <User size={12} className="text-stone-400" />
                              {book.author?.name || 'Autor desconocido'}
                            </span>
                            <span className="text-stone-300 dark:text-surface-400">•</span>
                            <span className="inline-flex items-center gap-1">
                              <Building2 size={12} className="text-stone-400" />
                              {book.publisher || 'Editorial Babilon'}
                            </span>
                            <span className="text-stone-300 dark:text-surface-400">•</span>
                            <span className="font-mono text-[11px]">
                              Año {book.publishedYear || 'S/F'}
                            </span>
                            <span className="text-stone-300 dark:text-surface-400">•</span>
                            <span className="font-mono text-[11px]">
                              {book.pageCount || 0} págs.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Bloques de Fechas: Subida y Actualización */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 lg:w-[410px] shrink-0">
                        {/* Fecha de Subida */}
                        <div className="p-3 rounded-xl bg-cream-100/70 dark:bg-surface-300/40 border border-stone-200/80 dark:border-surface-300">
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={11} className="text-emerald-600 dark:text-emerald-400" />
                              Fecha de Subida
                            </span>
                            {uploadDateInfo && (
                              <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                                {uploadDateInfo.relative}
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 mt-1">
                            {uploadDateInfo ? uploadDateInfo.fullLabel : 'Registro previo'}
                          </p>
                          {book.uploadedBy && (
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                              Por: {book.uploadedBy}
                            </p>
                          )}
                        </div>

                        {/* Fecha de Actualización (en dado caso que haya sido) */}
                        <div
                          className={`p-3 rounded-xl border ${
                            updateDateInfo
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-800/50'
                              : 'bg-stone-50/80 dark:bg-surface-300/20 border-stone-200/70 dark:border-surface-300/70'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider">
                            <span
                              className={`inline-flex items-center gap-1 ${
                                updateDateInfo
                                  ? 'text-amber-800 dark:text-amber-300'
                                  : 'text-stone-500 dark:text-stone-400'
                              }`}
                            >
                              <History
                                size={11}
                                className={
                                  updateDateInfo
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-stone-400'
                                }
                              />
                              Actualización
                            </span>
                            {updateDateInfo ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                Editado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 size={10} />
                                Original
                              </span>
                            )}
                          </div>
                          {updateDateInfo ? (
                            <>
                              <p className="font-mono text-xs font-semibold text-amber-950 dark:text-amber-200 mt-1">
                                {updateDateInfo.fullLabel}
                              </p>
                              {book.updatedBy && (
                                <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 truncate">
                                  Por: {book.updatedBy}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-medium">
                              Sin modificaciones
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 3. Botones de Acción (Metadatos y Ficha, sin botón Leer) */}
                      <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100 dark:border-surface-300">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedBookId((prev) => (prev === book.id ? null : book.id))
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            isExpanded
                              ? 'border-terracotta-300 dark:border-terracotta-700 bg-terracotta-50 dark:bg-terracotta-950/40 text-terracotta-800 dark:text-terracotta-300'
                              : 'border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-300/50 text-stone-700 dark:text-stone-200 hover:bg-cream-200/60'
                          }`}
                        >
                          <FileText size={13} />
                          <span>Metadatos</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        {onSelectBook && (
                          <button
                            type="button"
                            onClick={() => onSelectBook(book)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Abrir ficha de la obra (al cerrar volverás a esta bitácora)"
                          >
                            <Eye size={13} />
                            <span>Ficha</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Panel Expandible: Datos de Subida y Metadatos Técnicos (sin sinopsis) */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-3 bg-cream-50/90 dark:bg-surface-100/80 border-t border-stone-200/80 dark:border-surface-300 space-y-4 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-terracotta-700 dark:text-terracotta-400 flex items-center gap-1.5">
                            <Database size={13} />
                            <span>Datos de Subida y Metadatos Técnicos</span>
                          </h4>
                          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                            ID Documento: {book.id}
                          </span>
                        </div>

                        {/* Bloque 1: Datos de Subida, Origen y Trazabilidad */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          <div className="p-3 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <UploadCloud size={11} className="text-terracotta-500" /> Origen de Subida
                            </span>
                            <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 mt-1">
                              {book.origin || 'Archivo Babilon'}
                            </p>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                              Responsable: {book.uploadedBy || 'Administrador'}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <Calendar size={11} className="text-emerald-500" /> Timestamp de Subida
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 mt-1">
                              {uploadDateInfo ? uploadDateInfo.fullLabel : 'Registro base'}
                            </p>
                            <p className="font-mono text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate" title={book.uploadedAt}>
                              ISO: {book.uploadedAt || 'N/A'}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <History size={11} className={updateDateInfo ? 'text-amber-500' : 'text-stone-400'} /> Timestamp de Actualización
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 mt-1">
                              {updateDateInfo ? updateDateInfo.fullLabel : 'Sin modificaciones'}
                            </p>
                            <p className="font-mono text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate" title={book.updatedAt || ''}>
                              {book.wasUpdated && book.updatedAt
                                ? `ISO: ${book.updatedAt}`
                                : 'Estado: Versión original de subida'}
                            </p>
                          </div>

                          <div className="p-3 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                              <Database size={11} /> Identificador & Formato
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-900 dark:text-stone-100 mt-1 truncate" title={book.id}>
                              ID: {book.id}
                            </p>
                            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                              Formatos: {(book.availableFormats || ['EBOOK']).join(', ')}
                            </p>
                          </div>
                        </div>

                        {/* Bloque 2: Metadatos Bibliográficos de la Obra */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Hash size={11} /> ISBN / Código
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate" title={book.isbn}>
                              {book.isbn || 'N/A'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <User size={11} /> Autor Registrado
                            </span>
                            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate" title={book.author?.name}>
                              {book.author?.name || 'Autor desconocido'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Building2 size={11} /> Editorial
                            </span>
                            <p className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate" title={book.publisher}>
                              {book.publisher || 'Editorial Babilon'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Calendar size={11} /> Año Publicación
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5">
                              {book.publishedYear || 'S/F'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Layers size={11} /> Páginas & Idioma
                            </span>
                            <p className="font-mono text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate">
                              {book.pageCount || 0} págs. · {book.language?.toUpperCase() || 'ES'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-white dark:bg-surface-200 border border-stone-200/70 dark:border-surface-300">
                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                              <Tag size={11} /> Categorías / Tipo
                            </span>
                            <p
                              className="text-xs font-semibold text-stone-800 dark:text-stone-200 mt-0.5 truncate"
                              title={`${(book.genres || []).join(', ')} (${book.catalogType || 'Digital'})`}
                            >
                              {(book.genres || []).join(', ') || book.catalogType || 'General'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 dark:border-surface-300 bg-white dark:bg-surface-200 flex items-center justify-between gap-4 text-xs text-stone-500 dark:text-stone-400 shrink-0">
          <span className="font-mono">
            Mostrando {filteredAndSortedBooks.length} de {stats.totalBooks}{' '}
            {stats.totalBooks === 1 ? 'libro registrado' : 'libros registrados'}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Cerrar Bitácora
          </button>
        </div>
      </div>
    </div>
  );
}
