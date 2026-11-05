'use client';

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
  synopsis: string;
  onSynopsisChange: (value: string) => void;
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
  synopsis,
  onSynopsisChange,
}: MetadataFieldsProps) {
  const inputBaseClasses =
    'w-full rounded-xl border border-stone-200/90 bg-cream-100 px-3.5 py-2.5 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-terracotta-300/70 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-100/40 dark:border-surface-300 dark:bg-surface-200 dark:text-stone-100 dark:focus:border-surface-400 dark:focus:bg-surface-100 dark:focus:ring-surface-400/20';

  const disabledInputClasses =
    'w-full rounded-xl border border-stone-200/90 bg-stone-100/80 px-3.5 py-2.5 text-sm font-mono text-stone-600 cursor-not-allowed select-none opacity-85 dark:border-surface-300 dark:bg-surface-300/50 dark:text-stone-300';

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="book-isbn"
            className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            <span>ISBN (Código Identificador)</span>
            <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
              Generado automáticamente
            </span>
          </label>
          <input
            id="book-isbn"
            type="text"
            readOnly
            disabled
            value={isbn || 'Se genera al seleccionar la obra'}
            placeholder="Se genera al seleccionar la obra"
            className={disabledInputClasses}
            title="El código ISBN se genera de manera automática al cargar la obra"
          />
        </div>

        <div>
          <label
            htmlFor="book-publisher"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
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
      </div>

      <div>
        <label
          htmlFor="book-synopsis"
          className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
        >
          <span>Sinopsis de la obra</span>
          <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
            Visible en las tarjetas del catálogo
          </span>
        </label>
        <textarea
          id="book-synopsis"
          rows={3}
          value={synopsis}
          onChange={(event) => onSynopsisChange(event.target.value)}
          placeholder="Escribe o edita una breve reseña o sinopsis de la obra para orientar a los lectores en el catálogo..."
          className={`${inputBaseClasses} resize-y min-h-[80px] leading-relaxed`}
        />
      </div>
    </div>
  );
}
