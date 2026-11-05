'use client';

import { ImagePlus } from 'lucide-react';
import { BookGenre } from '@babilon/shared-types';
import { GENRES_LIST } from './bookUploadOptions';

interface MetadataFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  author: string;
  onAuthorChange: (value: string) => void;
  isbn: string;
  genre: BookGenre | '';
  onGenreChange: (value: BookGenre | '') => void;
  year: number | '';
  onYearChange: (value: number | '') => void;
  publisher: string;
  onPublisherChange: (value: string) => void;
  coverPreviewUrl: string;
  hasCustomCover: boolean;
  onCoverFileSelect: (file: File) => void;
  onRemoveCustomCover: () => void;
}

export function MetadataFields({
  title,
  onTitleChange,
  author,
  onAuthorChange,
  isbn,
  genre,
  onGenreChange,
  year,
  onYearChange,
  publisher,
  onPublisherChange,
  coverPreviewUrl,
  hasCustomCover,
  onCoverFileSelect,
  onRemoveCustomCover,
}: MetadataFieldsProps) {
  const inputBaseClasses =
    'w-full rounded-xl border border-stone-200/90 bg-cream-100 px-3.5 py-2.5 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-terracotta-300/70 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-100/40 dark:border-surface-300 dark:bg-surface-200 dark:text-stone-100 dark:focus:border-surface-400 dark:focus:bg-surface-100 dark:focus:ring-surface-400/20';

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="book-title"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          Título de la obra *
        </label>
        <input
          id="book-title"
          type="text"
          required
          aria-required="true"
          autoComplete="off"
          placeholder="ej. Ensayos sobre la lectura y la memoria"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          className={inputBaseClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="book-author"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            Autor *
          </label>
          <input
            id="book-author"
            type="text"
            required
            aria-required="true"
            autoComplete="name"
            placeholder="ej. Jorge Luis Borges"
            value={author}
            onChange={(event) => onAuthorChange(event.target.value)}
            className={inputBaseClasses}
          />
        </div>

        <div>
          <label
            htmlFor="book-year"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            Año de publicación *
          </label>
          <input
            id="book-year"
            type="number"
            required
            aria-required="true"
            step={1}
            min={-3000}
            max={new Date().getFullYear() + 2}
            value={year}
            onChange={(event) =>
              onYearChange(event.target.value === '' ? '' : Number(event.target.value))
            }
            className={inputBaseClasses}
          />
        </div>

        <div>
          <label
            htmlFor="book-genre"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            Género *
          </label>
          <select
            id="book-genre"
            required
            aria-required="true"
            value={genre}
            onChange={(event) => onGenreChange(event.target.value as BookGenre | '')}
            className={inputBaseClasses}
          >
            <option value="" disabled>
              Selecciona un género
            </option>
            {GENRES_LIST.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section
        aria-label="Datos identificadores"
        className="grid grid-cols-1 gap-4 rounded-xl border border-stone-200/80 bg-cream-100/60 p-4 dark:border-surface-300 dark:bg-surface-200/60 sm:grid-cols-2"
      >
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            ISBN
          </p>
          <p className="break-all font-mono text-sm text-stone-800 dark:text-stone-100">
            {isbn || 'Se genera al seleccionar la obra'}
          </p>
        </div>
        <div>
          <label
            htmlFor="book-publisher"
            className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
          >
            Sello editorial
          </label>
          <input
            id="book-publisher"
            type="text"
            value={publisher}
            onChange={(event) => onPublisherChange(event.target.value)}
            placeholder="Editorial Babilon"
            className={inputBaseClasses}
          />
        </div>
      </section>

      <section aria-labelledby="book-cover-label">
        <p
          id="book-cover-label"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          Portada (opcional)
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {coverPreviewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreviewUrl}
              alt="Vista previa de la portada"
              className="h-28 w-20 rounded-lg border border-stone-200 object-cover dark:border-surface-300"
            />
          )}
          <div className="flex flex-col items-start gap-2">
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-stone-200 px-3 text-xs font-semibold text-stone-700 transition-colors hover:bg-cream-100 focus-within:outline focus-within:outline-2 focus-within:outline-terracotta-600 dark:border-surface-300 dark:text-stone-200 dark:hover:bg-surface-200">
              <ImagePlus size={14} />
              Seleccionar portada
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onCoverFileSelect(file);
                  event.target.value = '';
                }}
                className="sr-only"
                aria-label="Seleccionar portada"
              />
            </label>
            {hasCustomCover && (
              <>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Vista previa local; la imagen no se enviará a la API.
                </p>
                <button
                  type="button"
                  onClick={onRemoveCustomCover}
                  className="text-xs font-semibold text-terracotta-700 underline underline-offset-2 dark:text-terracotta-300"
                >
                  Quitar portada seleccionada
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
