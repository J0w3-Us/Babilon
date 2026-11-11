'use client';

import { useState, useRef, useEffect } from 'react';
import { BookGenre } from '@babilon/shared-types';
import { GENRES_LIST } from './bookUploadOptions';
import {
  BookOpen,
  Sparkles,
  Rocket,
  Compass,
  Heart,
  FileText,
  Bookmark,
  History,
  Lightbulb,
  Atom,
  Cpu,
  GraduationCap,
  Baby,
  Image,
  Palette,
  UtensilsCrossed,
  HeartPulse,
  Church,
  Smile,
  Library,
  Feather,
  Skull,
  Search,
  HelpCircle,
  ChevronDown,
  Check,
} from 'lucide-react';

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

function getGenreIcon(genreName: string) {
  switch (genreName) {
    case 'Clásicos':
    case 'Novela':
    case 'Cuento':
      return BookOpen;
    case 'Ficción':
      return Feather;
    case 'Ciencia Ficción':
      return Rocket;
    case 'Fantasía y Magia':
      return Sparkles;
    case 'Terror y Horror':
      return Skull;
    case 'Misterio y Suspenso':
      return Search;
    case 'Aventura':
      return Compass;
    case 'Romance':
      return Heart;
    case 'Poesía':
      return Feather;
    case 'Ensayo':
      return FileText;
    case 'Biografía':
      return Bookmark;
    case 'Historia':
      return History;
    case 'Filosofía':
      return Lightbulb;
    case 'Ciencia':
      return Atom;
    case 'Tecnología':
      return Cpu;
    case 'Educación':
      return GraduationCap;
    case 'Infantil y Juvenil':
      return Baby;
    case 'Cómic y Novela Gráfica':
      return Image;
    case 'Arte y Fotografía':
      return Palette;
    case 'Cocina':
      return UtensilsCrossed;
    case 'Salud y Bienestar':
      return HeartPulse;
    case 'Religión y Espiritualidad':
      return Church;
    case 'Desarrollo Personal':
      return Smile;
    case 'Referencia y Consulta':
      return Library;
    default:
      return HelpCircle;
  }
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchGenre, setSearchGenre] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredGenres = GENRES_LIST.filter((g) =>
    g.toLowerCase().includes(searchGenre.toLowerCase())
  );

  const inputBaseClasses =
    'w-full rounded-xl border border-stone-200/90 bg-cream-100 px-3.5 py-2.5 text-sm text-stone-900 transition-all placeholder:text-stone-400 focus:border-terracotta-300/70 focus:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-terracotta-100/40 dark:border-surface-300 dark:bg-surface-200 dark:text-stone-100 dark:focus:border-surface-400 dark:focus:bg-surface-100 dark:focus:ring-surface-400/20';

  const disabledInputClasses =
    'w-full rounded-xl border border-stone-200/90 bg-stone-100/80 px-3.5 py-2.5 text-sm font-mono text-stone-600 cursor-not-allowed select-none opacity-85 dark:border-surface-300 dark:bg-surface-300/50 dark:text-stone-300';

  const SelectedIcon = genre ? getGenreIcon(genre) : null;

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
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            aria-required="true"
            placeholder="ej. 1943"
            value={year === '' ? '' : String(year)}
            onChange={(event) => {
              const val = event.target.value.replace(/[^0-9]/g, '');
              onYearChange(val === '' ? '' : Number(val));
            }}
            className={inputBaseClasses}
          />
        </div>

        {/* Selector de Género Rediseñado con Íconos y Búsqueda */}
        <div className="relative" ref={dropdownRef}>
          <label
            htmlFor="book-genre-button"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300"
          >
            Género *
          </label>
          <button
            id="book-genre-button"
            type="button"
            onClick={() => {
              setDropdownOpen((prev) => !prev);
              setSearchGenre('');
            }}
            className={`w-full flex items-center justify-between rounded-xl border border-stone-200/90 bg-cream-100 px-3.5 py-2.5 text-sm transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-terracotta-100/40 dark:border-surface-300 dark:bg-surface-200 ${
              genre
                ? 'text-stone-900 dark:text-stone-100 font-medium'
                : 'text-stone-400 dark:text-stone-500'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              {SelectedIcon && (
                <SelectedIcon size={16} className="text-terracotta-600 dark:text-terracotta-400 shrink-0" />
              )}
              <span className="truncate">{genre || 'Selecciona un género'}</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-stone-400 transition-transform duration-200 shrink-0 ${
                dropdownOpen ? 'rotate-180 text-terracotta-600 dark:text-terracotta-400' : ''
              }`}
            />
          </button>

          {/* Bandeja Flotante de Selección */}
          {dropdownOpen && (
            <div className="absolute z-50 mt-1.5 w-full min-w-[240px] rounded-2xl border border-stone-200/90 bg-cream-50 p-2 shadow-xl dark:border-surface-300 dark:bg-surface-100 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              <div className="mb-2 px-1">
                <input
                  type="text"
                  placeholder="Buscar género..."
                  value={searchGenre}
                  onChange={(e) => setSearchGenre(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-cream-100 px-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-terracotta-300 focus:outline-none dark:border-surface-300 dark:bg-surface-200 dark:text-stone-100"
                  autoFocus
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-surface-300">
                {filteredGenres.length > 0 ? (
                  filteredGenres.map((item) => {
                    const Icon = getGenreIcon(item);
                    const isSelected = genre === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          onGenreChange(item);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-sm'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-cream-200/80 dark:hover:bg-surface-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon
                            size={14}
                            className={
                              isSelected
                                ? 'text-cream-200 dark:text-stone-700'
                                : 'text-stone-500 dark:text-stone-400'
                            }
                          />
                          <span className="truncate">{item}</span>
                        </div>
                        {isSelected && (
                          <Check
                            size={14}
                            className="text-cream-100 dark:text-stone-900 shrink-0 ml-1"
                          />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-stone-400">
                    No se encontraron géneros coincidentes
                  </div>
                )}
              </div>
            </div>
          )}
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
          rows={7}
          value={synopsis}
          onChange={(event) => onSynopsisChange(event.target.value)}
          placeholder="Escribe o edita una reseña o sinopsis de la obra para orientar a los lectores en el catálogo..."
          className={`${inputBaseClasses} resize-none min-h-[160px] leading-relaxed font-serif`}
        />
      </div>
    </div>
  );
}
