'use client';

import { BookGenre } from '@babilon/shared-types';
import { GENRES_LIST } from './bookUploadOptions';

interface MetadataFieldsProps {
  title: string;
  onTitleChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  isbn: string;
  onIsbnChange: (v: string) => void;
  genre: BookGenre | '';
  onGenreChange: (v: BookGenre | '') => void;
  year: number | '';
  onYearChange: (v: number | '') => void;
  publisher: string;
  onPublisherChange: (v: string) => void;
  coverUrl: string;
  onCoverUrlChange: (v: string) => void;
  coverPreviewUrl: string;
  hasCustomCover: boolean;
  onCoverFileSelect: (file: File) => void;
  onRemoveCustomCover: () => void;
  synopsis: string;
  onSynopsisChange: (v: string) => void;
}

export function MetadataFields({
  title,
  onTitleChange,
  author,
  onAuthorChange,
  isbn,
  onIsbnChange,
  genre,
  onGenreChange,
  year,
  onYearChange,
  publisher,
  onPublisherChange,
  coverUrl,
  onCoverUrlChange,
  coverPreviewUrl,
  hasCustomCover,
  onCoverFileSelect,
  onRemoveCustomCover,
  synopsis,
  onSynopsisChange,
}: MetadataFieldsProps) {
  const inputBaseClasses =
    'w-full px-3.5 py-2.5 bg-cream-100 dark:bg-surface-200 border border-stone-200/90 dark:border-surface-300 rounded-xl text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-terracotta-300/70 dark:focus:border-surface-400 focus:bg-cream-50 dark:focus:bg-surface-100 focus:ring-2 focus:ring-terracotta-100/40 dark:focus:ring-surface-400/20 transition-all';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
          Título de la Obra *
        </label>
        <input
          type="text"
          required
          aria-required="true"
          autoComplete="off"
          placeholder="ej. Ensayos sobre la lectura y la memoria"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={inputBaseClasses}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Autor / Escritor *
          </label>
          <input
            type="text"
            required
            aria-required="true"
            autoComplete="name"
            placeholder="ej. Jorge Luis Borges"
            value={author}
            onChange={(e) => onAuthorChange(e.target.value)}
            className={inputBaseClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            ISBN (Identificador de tomo)
          </label>
          <input
            type="text"
            placeholder="ej. 978-84-376-0000-0"
            value={isbn}
            onChange={(e) => onIsbnChange(e.target.value)}
            className={`${inputBaseClasses} font-mono`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Género / Disciplina *
          </label>
          <select
            required
            aria-required="true"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value as BookGenre | '')}
            className={inputBaseClasses}
          >
            <option value="" disabled>
              Selecciona un género
            </option>
            {GENRES_LIST.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Año de Publicación *
          </label>
          <input
            type="number"
            required
            aria-required="true"
            step={1}
            min={-3000}
            max={new Date().getFullYear() + 2}
            value={year}
            onChange={(e) =>
              onYearChange(e.target.value === '' ? '' : Number(e.target.value))
            }
            className={inputBaseClasses}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Sello Editorial
          </label>
          <input
            type="text"
            placeholder="ej. Babilonia Clásicos"
            value={publisher}
            onChange={(e) => onPublisherChange(e.target.value)}
            className={inputBaseClasses}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
          Portada (opcional)
        </label>
        {coverPreviewUrl && (
          <div className="mb-3 flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreviewUrl}
              alt="Vista previa de la portada"
              className="h-28 w-20 rounded-lg border border-stone-200 object-cover dark:border-surface-300"
            />
            <div className="min-w-0 text-xs text-stone-500 dark:text-stone-400">
              <p>{hasCustomCover ? 'Vista previa local, no se enviará a la API.' : 'Portada detectada o enlazada.'}</p>
              {hasCustomCover && (
                <button
                  type="button"
                  onClick={onRemoveCustomCover}
                  className="mt-2 font-semibold text-terracotta-700 underline underline-offset-2 dark:text-terracotta-300"
                >
                  Quitar imagen personalizada
                </button>
              )}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <input
            type="url"
            placeholder="https://ejemplo.org/portada.jpg"
            value={coverUrl}
            onChange={(e) => onCoverUrlChange(e.target.value)}
            aria-label="URL de portada"
            className={inputBaseClasses}
          />
          <label className="inline-flex min-h-10 items-center rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-cream-100 focus-within:outline focus-within:outline-2 focus-within:outline-terracotta-600 dark:border-surface-300 dark:text-stone-200 dark:hover:bg-surface-200">
            Elegir imagen para vista previa
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onCoverFileSelect(file);
                event.target.value = '';
              }}
              className="sr-only"
              aria-label="Elegir una imagen personalizada para vista previa"
            />
          </label>
        </div>
      </div>

      <details className="group rounded-xl border border-stone-200/80 dark:border-surface-300">
        <summary className="cursor-pointer px-3.5 py-3 text-xs font-semibold text-stone-700 marker:text-terracotta-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-terracotta-600 dark:text-stone-200">
          Sinopsis o argumento (opcional)
        </summary>
        <div className="px-3.5 pb-3.5">
          <textarea
            rows={3}
            placeholder="Breve reseña sobre el contenido de la obra..."
            value={synopsis}
            onChange={(e) => onSynopsisChange(e.target.value)}
            aria-label="Sinopsis o argumento"
            className={inputBaseClasses}
          />
        </div>
      </details>
    </div>
  );
}
