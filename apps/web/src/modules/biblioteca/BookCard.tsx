'use client';

import { useState } from 'react';
import { Book } from '@babilon/shared-types';
import { BookmarkCheck, BookOpen } from 'lucide-react';
import { useReadingProgress } from './hooks/useReadingProgress';

interface BookCardProps {
  book: Book;
  onRead: (book: Book) => void;
}

export function BookCard({ book, onRead }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const { progress, progressPercent } = useReadingProgress(book.id);
  const primaryGenre = book.genres?.[0] || 'Clásicos';
  const hasCover = Boolean(book.coverUrl && !imageError);

  return (
    <article className="bg-cream-50 dark:bg-surface-100 rounded-2xl border border-stone-200/90 dark:border-surface-300 overflow-hidden swiss-card flex flex-col group">
      {/* Visual Header / Cover Canvas */}
      <div className="h-52 bg-cream-100 dark:bg-surface-200 relative overflow-hidden border-b border-stone-200/80 dark:border-surface-300">
        {hasCover ? (
          <>
            {/* Imagen de Portada de la Base de Datos */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.coverUrl}
              alt={`Portada de ${book.title}`}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Degradado para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

            {/* Badges superiores sobre imagen */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-xs text-[10px] font-semibold text-stone-100 tracking-wider uppercase border border-white/10">
                {primaryGenre}
              </span>
              <span className="text-[10px] font-mono text-stone-200 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                {book.pageCount ? `${book.pageCount} págs.` : 'Tomo digital'}
              </span>
            </div>

            {/* Título e ISBN sobre imagen */}
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <p className="font-mono text-[9px] text-stone-300 tracking-widest uppercase mb-0.5">
                {book.isbn || 'ARCHIVO-BABILON'}
              </p>
              <h4 className="font-serif text-base font-bold text-white leading-snug line-clamp-1 drop-shadow-sm">
                {book.title}
              </h4>
            </div>
          </>
        ) : (
          /* Fallback sin imagen (diseño tipográfico clásico) */
          <div className="p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between z-10">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-cream-50 dark:bg-surface-100 border border-stone-200 dark:border-surface-300 text-[11px] font-semibold text-terracotta-600 dark:text-terracotta-400 tracking-wider uppercase">
                {primaryGenre}
              </span>
              <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                {book.pageCount ? `${book.pageCount} págs.` : 'Tomo digital'}
              </span>
            </div>

            <div className="z-10">
              <p className="font-mono text-[10px] text-stone-400 dark:text-stone-500 tracking-widest uppercase mb-1">
                {book.isbn || 'ARCHIVO-BABILON'}
              </p>
              <h4 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">
                {book.title}
              </h4>
            </div>
          </div>
        )}
      </div>

      {/* Info & Metadata */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-terracotta-600 dark:group-hover:text-terracotta-400 transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 font-medium">{book.author?.name}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 line-clamp-3 leading-relaxed">
            {book.synopsis || 'Sinopsis de archivo en catalogación.'}
          </p>
          {progress && (
            <div className="mt-3" aria-label={`Progreso de lectura de ${book.title}`}>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-terracotta-700 dark:text-terracotta-300">
                <BookmarkCheck size={13} aria-hidden="true" />
                <span>
                  En lectura · página {progress.pageNumber}
                  {progress.totalPages > 0 ? ` de ${progress.totalPages}` : ''}
                  {progressPercent !== null ? ` · ${progressPercent}%` : ''}
                </span>
              </div>
              {progressPercent !== null && (
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200 dark:bg-surface-300"
                  role="progressbar"
                  aria-label={`Progreso de lectura: ${progressPercent}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  <div
                    className="h-full rounded-full bg-terracotta-600 dark:bg-terracotta-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-stone-200/60 dark:border-surface-300 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 dark:text-stone-500 font-mono">
            {book.publishedYear || 'S/F'}
          </span>

          <button
            type="button"
            onClick={() => onRead(book)}
            aria-label={`Leer ${book.title}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-cream-50 text-xs font-medium transition-colors cursor-pointer"
          >
            <BookOpen size={13} />
            Leer Libro
          </button>
        </div>
      </div>
    </article>
  );
}
