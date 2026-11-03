'use client';

interface GenreFilterBarProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  genres?: string[];
}

export const DEFAULT_GENRES: string[] = [
  'Todos',
  'Clásicos',
  'Ficción',
  'Filosofía',
  'Historia',
  'Poesía',
];

export function GenreFilterBar({
  selectedGenre,
  onSelectGenre,
  genres = DEFAULT_GENRES,
}: GenreFilterBarProps) {
  const displayGenres = genres && genres.length > 0 ? genres : DEFAULT_GENRES;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {displayGenres.map((genre) => {
        const isSelected = selectedGenre === genre;
        return (
          <button
            key={genre}
            onClick={() => onSelectGenre(genre)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-subtle'
                : 'bg-cream-50 dark:bg-surface-100 text-stone-700 dark:text-stone-300 border border-stone-200/90 dark:border-surface-300 hover:border-terracotta-300 dark:hover:border-surface-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            {genre}
          </button>
        );
      })}
    </div>
  );
}
