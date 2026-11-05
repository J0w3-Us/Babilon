'use client';

import { useState } from 'react';
import { Book } from '@babilon/shared-types';
import {
  X,
  BookOpen,
  Calendar,
  Building2,
  Tag,
  Hash,
  BookmarkCheck,
  User,
  Layers,
} from 'lucide-react';
import { useReadingProgress } from './hooks/useReadingProgress';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onRead: (book: Book) => void;
}

export function BookDetailModal({ book, onClose, onRead }: BookDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const { progress, progressPercent } = useReadingProgress(book.id);
  const primaryGenre = book.genres?.[0] || 'Clásicos';
  const hasCover = Boolean(book.coverUrl && !imageError);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-cream-50 dark:bg-surface-100 rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl overflow-hidden flex flex-col md:flex-row text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar flotante */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 dark:bg-surface-200 dark:text-stone-200 dark:hover:bg-surface-300 backdrop-blur-md transition-colors cursor-pointer shadow-md"
        >
          <X size={18} />
        </button>

        {/* LADO IZQUIERDO: Portada del Libro y Badges (Aspecto tipo libro vertical) */}
        <div className="relative w-full md:w-5/12 h-64 md:h-auto min-h-[320px] md:min-h-[460px] bg-cream-200 dark:bg-surface-200 border-b md:border-b-0 md:border-r border-stone-200/80 dark:border-surface-300 overflow-hidden flex flex-col justify-between shrink-0">
          {hasCover ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={book.coverUrl}
                alt={`Portada de ${book.title}`}
                onError={() => setImageError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-black/25" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black" />
          )}

          {/* Badges superiores sobre portada */}
          <div className="relative z-10 p-5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[11px] font-semibold text-stone-100 tracking-wider uppercase border border-white/10">
              <Tag size={12} className="text-terracotta-400" />
              {primaryGenre}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-stone-200 border border-white/10">
              <Layers size={12} />
              {book.pageCount ? `${book.pageCount} págs.` : 'Tomo digital'}
            </span>
          </div>

          {/* Título y Código sobre la portada */}
          <div className="relative z-10 p-5 pt-0">
            <p className="font-mono text-[11px] text-terracotta-300 tracking-widest uppercase mb-1">
              {book.isbn || 'ARCHIVO-BABILON'}
            </p>
            <h2
              id="book-detail-title"
              className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-md line-clamp-3"
            >
              {book.title}
            </h2>
            <div className="flex items-center gap-1.5 mt-2 text-stone-200 text-sm font-medium">
              <User size={14} className="text-stone-300 shrink-0" />
              <span className="truncate">{book.author?.name || 'Autor Desconocido'}</span>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Ficha bibliográfica, Sinopsis y Acciones (Sin scroll forzado) */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 md:p-8">
          <div className="space-y-5">
            {/* Encabezado derecho con categorías */}
            <div className="pr-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Temáticas:
                </span>
                {book.genres && book.genres.length > 0 ? (
                  book.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-md bg-cream-200/80 dark:bg-surface-200 text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-surface-300"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">General</span>
                )}
              </div>
            </div>

            {/* Progreso de lectura si existe */}
            {progress && (
              <div className="p-3.5 rounded-xl bg-cream-100/90 dark:bg-surface-200/80 border border-stone-200/80 dark:border-surface-300">
                <div className="flex items-center justify-between text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
                  <div className="flex items-center gap-1.5">
                    <BookmarkCheck size={15} />
                    <span>Progreso de lectura</span>
                  </div>
                  <span>
                    Pág. {progress.pageNumber}
                    {progress.totalPages > 0 ? ` de ${progress.totalPages}` : ''}
                    {progressPercent !== null ? ` · ${progressPercent}%` : ''}
                  </span>
                </div>
                {progressPercent !== null && (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-surface-300">
                    <div
                      className="h-full rounded-full bg-terracotta-600 dark:bg-terracotta-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Ficha Bibliográfica Compacta en 4 columnas */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Ficha Bibliográfica
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                    <Calendar size={12} />
                    <span>Año</span>
                  </div>
                  <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 font-mono">
                    {book.publishedYear || 'S/F'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                    <Building2 size={12} />
                    <span>Editorial</span>
                  </div>
                  <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate" title={book.publisher}>
                    {book.publisher || 'Editorial Babilon'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                    <Layers size={12} />
                    <span>Extensión</span>
                  </div>
                  <p className="font-semibold text-xs text-stone-900 dark:text-stone-100 font-mono">
                    {book.pageCount ? `${book.pageCount} págs.` : 'N/A'}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-[11px] mb-0.5">
                    <Hash size={12} />
                    <span>ISBN</span>
                  </div>
                  <p className="font-mono text-xs text-stone-900 dark:text-stone-100 truncate" title={book.isbn}>
                    {book.isbn || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sinopsis & Argumento (Diseñada para leerse cómoda sin desbordar el modal) */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Sinopsis & Argumento
              </h3>
              <div className="p-4 rounded-2xl bg-cream-100/60 dark:bg-surface-200/60 border border-stone-200/80 dark:border-surface-300 max-h-48 overflow-y-auto">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif whitespace-pre-line">
                  {book.synopsis && book.synopsis.trim()
                    ? book.synopsis
                    : 'Sin sinopsis registrada para esta obra en el archivo.'}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción inferiores */}
          <div className="pt-6 mt-4 border-t border-stone-200/80 dark:border-surface-300 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200/90 dark:border-surface-300 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-cream-200 dark:hover:bg-surface-300 transition-colors cursor-pointer"
            >
              Volver al catálogo
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRead(book);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-cream-50 text-xs font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <BookOpen size={15} />
              <span>Leer Obra Completa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
