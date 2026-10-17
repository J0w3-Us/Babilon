'use client';

import { BookGenre } from '@babilon/shared-types';

export const GENRES_FILTER_LIST: (BookGenre | 'Todos')[] = [
  'Todos',
  'Ficción',
  'Ciencia Ficción',
  'Filosofía',
  'Clásicos',
  'Poesía',
  'Historia',
];

interface GenreFilterBarProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreFilterBar({
  selectedGenre,
  onSelectGenre,
}: GenreFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {GENRES_FILTER_LIST.map((genre) => {
        const isSelected = selectedGenre === genre;
        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-subtle'
                : 'bg-white dark:bg-surface-100 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-surface-300 hover:border-stone-400 dark:hover:border-surface-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}
