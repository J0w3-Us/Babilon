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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-cream-50 dark:bg-surface-100 rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl overflow-hidden flex flex-col text-stone-900 dark:text-stone-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 dark:bg-surface-200 dark:text-stone-200 dark:hover:bg-surface-300 backdrop-blur-md transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Cabecera / Portada */}
          <div className="relative h-60 sm:h-72 bg-cream-200 dark:bg-surface-200 border-b border-stone-200/80 dark:border-surface-300 overflow-hidden">
            {hasCover ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.coverUrl}
                  alt={`Portada de ${book.title}`}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-950 flex flex-col justify-end p-6" />
            )}

            {/* Badges superiores */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/85 backdrop-blur-md text-[11px] font-semibold text-stone-100 tracking-wider uppercase border border-white/10">
                <Tag size={12} className="text-terracotta-400" />
                {primaryGenre}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-stone-200 border border-white/10">
                <Layers size={12} />
                {book.pageCount ? `${book.pageCount} págs.` : 'Tomo digital'}
              </span>
            </div>

            {/* Título y Autor sobre la cabecera */}
            <div className="absolute bottom-5 left-5 right-5 z-10">
              <p className="font-mono text-xs text-terracotta-300 tracking-widest uppercase mb-1">
                {book.isbn || 'ARCHIVO-BABILON'}
              </p>
              <h2
                id="book-detail-title"
                className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-sm"
              >
                {book.title}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-stone-200 text-sm font-medium">
                <User size={14} className="text-stone-300" />
                <span>{book.author?.name || 'Autor Desconocido'}</span>
              </div>
            </div>
          </div>

          {/* Cuerpo: Metadatos y Sinopsis */}
          <div className="p-6 sm:p-7 space-y-6">
            {/* Barra de progreso de lectura (si existe) */}
            {progress && (
              <div className="p-4 rounded-2xl bg-cream-100/80 dark:bg-surface-200/80 border border-stone-200/80 dark:border-surface-300">
                <div className="flex items-center justify-between text-xs font-semibold text-terracotta-700 dark:text-terracotta-300">
                  <div className="flex items-center gap-2">
                    <BookmarkCheck size={16} />
                    <span>Progreso de lectura activo</span>
                  </div>
                  <span>
                    Página {progress.pageNumber}
                    {progress.totalPages > 0 ? ` de ${progress.totalPages}` : ''}
                    {progressPercent !== null ? ` (${progressPercent}%)` : ''}
                  </span>
                </div>
                {progressPercent !== null && (
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-surface-300">
                    <div
                      className="h-full rounded-full bg-terracotta-600 dark:bg-terracotta-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Metadatos en cuadrícula */}
            <section aria-label="Metadatos bibliográficos">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                Ficha Bibliográfica
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs mb-1">
                    <Calendar size={13} />
                    <span>Año</span>
                  </div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 font-mono">
                    {book.publishedYear || 'S/F'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs mb-1">
                    <Building2 size={13} />
                    <span>Editorial</span>
                  </div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 truncate" title={book.publisher}>
                    {book.publisher || 'Editorial Babilon'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs mb-1">
                    <Layers size={13} />
                    <span>Extensión</span>
                  </div>
                  <p className="font-semibold text-sm text-stone-900 dark:text-stone-100 font-mono">
                    {book.pageCount ? `${book.pageCount} págs.` : 'N/A'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-surface-300 bg-cream-100/50 dark:bg-surface-200/50">
                  <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-xs mb-1">
                    <Hash size={13} />
                    <span>ISBN</span>
                  </div>
                  <p className="font-mono text-xs text-stone-900 dark:text-stone-100 truncate" title={book.isbn}>
                    {book.isbn || 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            {/* Géneros / Etiquetas */}
            {book.genres && book.genres.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                  Categorías & Temáticas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {book.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-lg bg-cream-200/70 dark:bg-surface-200 text-xs font-medium text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-surface-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sinopsis de la obra */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                Sinopsis & Argumento
              </h3>
              <div className="p-4 rounded-2xl bg-cream-100/60 dark:bg-surface-200/60 border border-stone-200/80 dark:border-surface-300">
                <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif whitespace-pre-line">
                  {book.synopsis && book.synopsis.trim()
                    ? book.synopsis
                    : 'Sin sinopsis registrada para esta obra en el archivo.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-4 sm:p-5 border-t border-stone-200/80 dark:border-surface-300 bg-cream-100/60 dark:bg-surface-200/60 flex items-center justify-between gap-3">
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
  );
}
