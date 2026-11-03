'use client';

import { BookGenre } from '@babilon/shared-types';

export const GENRES_LIST: BookGenre[] = [
  'Clásicos',
  'Filosofía',
  'Ficción',
  'Ciencia Ficción',
  'Poesía',
  'Historia',
];

interface MetadataFieldsProps {
  title: string;
  onTitleChange: (v: string) => void;
  author: string;
  onAuthorChange: (v: string) => void;
  isbn: string;
  onIsbnChange: (v: string) => void;
  genre: BookGenre;
  onGenreChange: (v: BookGenre) => void;
  year: number;
  onYearChange: (v: number) => void;
  publisher: string;
  onPublisherChange: (v: string) => void;
  coverUrl: string;
  onCoverUrlChange: (v: string) => void;
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
            Género / Disciplina
          </label>
          <select
            value={genre}
            onChange={(e) => onGenreChange(e.target.value as BookGenre)}
            className={inputBaseClasses}
          >
            {GENRES_LIST.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
            Año de Publicación
          </label>
          <input
            type="number"
            min={-3000}
            max={new Date().getFullYear() + 2}
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value) || 0)}
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
          URL de Portada (Opcional)
        </label>
        <input
          type="url"
          placeholder="https://ejemplo.org/portada.jpg"
          value={coverUrl}
          onChange={(e) => onCoverUrlChange(e.target.value)}
          className={inputBaseClasses}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
          Sinopsis o Argumento
        </label>
        <textarea
          rows={3}
          placeholder="Breve reseña sobre el contenido de la obra..."
          value={synopsis}
          onChange={(e) => onSynopsisChange(e.target.value)}
          className={inputBaseClasses}
        />
      </div>
    </div>
  );
}
