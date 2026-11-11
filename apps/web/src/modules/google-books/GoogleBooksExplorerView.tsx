'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  BookOpen,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  KeyRound,
  ShieldAlert,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Database,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { GoogleBookVolumeItem } from '@/app/api/v1/google-books/route';

const CATEGORIES = [
  { id: 'todos', label: 'Todos los Libres' },
  { id: 'literatura', label: 'Literatura y Novela' },
  { id: 'filosofia', label: 'Filosofía y Pensamiento' },
  { id: 'historia', label: 'Historia Universal' },
  { id: 'poesia', label: 'Poesía y Teatro' },
  { id: 'ciencia', label: 'Ciencia y Ensayo' },
];

export function GoogleBooksExplorerView() {
  const { isAdmin, isLoading: authLoading, token, openAuthModal } = useAuth();

  const [books, setBooks] = useState<GoogleBookVolumeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [startIndex, setStartIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Estado de importación por libro
  const [importingId, setImportingId] = useState<string | null>(null);

  // Modal de previsualización e importación detallada
  const [selectedBook, setSelectedBook] = useState<GoogleBookVolumeItem | null>(null);
  const [customTextContent, setCustomTextContent] = useState('');

  const pageSize = 12;

  const fetchGoogleBooks = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const params = new URLSearchParams({
          category: selectedCategory,
          startIndex: String(startIndex),
          maxResults: String(pageSize),
        });
        if (activeQuery.trim()) {
          params.set('q', activeQuery.trim());
        }

        const res = await fetch(`/api/v1/google-books?${params.toString()}`, {
          signal,
        });
        const data = await res.json();

        setApiKeyConfigured(Boolean(data.apiKeyConfigured));

        if (!data.success) {
          setErrorMessage(
            data.message || 'No se pudieron obtener los libros desde Google Books API.'
          );
          setBooks([]);
        } else {
          setBooks(Array.isArray(data.items) ? data.items : []);
          setTotalItems(Number(data.totalItems || 0));
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setErrorMessage('Error de red al consultar el endpoint de Google Books API.');
        setBooks([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [selectedCategory, activeQuery, startIndex]
  );

  useEffect(() => {
    if (!isAdmin) return;
    const controller = new AbortController();
    fetchGoogleBooks(controller.signal);
    return () => controller.abort();
  }, [isAdmin, fetchGoogleBooks]);

  // Bloqueo de scroll del fondo y cierre exclusivamente con Escape para el modal de detalle
  useEffect(() => {
    if (!selectedBook) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedBook(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedBook]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStartIndex(0);
    setActiveQuery(searchInput.trim());
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setActiveQuery('');
    setSearchInput('');
    setStartIndex(0);
  };

  const handleImportBook = async (book: GoogleBookVolumeItem, extraText?: string) => {
    if (!token) {
      Swal.fire({
        title: 'Sesión requerida',
        text: 'Debes tener sesión activa de Administrador para importar libros.',
        icon: 'warning',
        background: '#1c1917',
        color: '#f5f5f4',
        confirmButtonColor: '#C2593F',
      });
      return;
    }

    setImportingId(book.googleBookId);
    try {
      const res = await fetch('/api/v1/google-books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-babilon-jwt': token,
        },
        body: JSON.stringify({
          book,
          customText: extraText?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        Swal.fire({
          title: 'No se pudo importar',
          text: data.message || 'Error al guardar el libro en MongoDB Atlas.',
          icon: 'error',
          background: '#1c1917',
          color: '#f5f5f4',
          confirmButtonColor: '#C2593F',
          customClass: {
            popup: 'rounded-2xl border border-stone-800 shadow-2xl font-sans',
            title: 'font-serif text-xl font-bold text-stone-100',
            confirmButton: 'rounded-xl text-sm font-semibold px-5 py-2.5 cursor-pointer',
          },
        });
        return;
      }

      // Marcar como ya guardado en DB en el estado local
      setBooks((prev) =>
        prev.map((item) =>
          item.googleBookId === book.googleBookId ? { ...item, alreadyInDb: true } : item
        )
      );

      if (selectedBook?.googleBookId === book.googleBookId) {
        setSelectedBook(null);
      }

      Swal.fire({
        title: '¡Agregado al Catálogo!',
        text:
          data.message ||
          `"${book.title}" se guardó en MongoDB Atlas con sus ${data.pagesSaved || book.pageCount} páginas completas y portada vinculada a la API.`,
        icon: 'success',
        iconColor: '#C2593F',
        background: '#1c1917',
        color: '#f5f5f4',
        confirmButtonColor: '#C2593F',
        confirmButtonText: 'Excelente',
        customClass: {
          popup: 'rounded-2xl border border-stone-800 shadow-2xl font-sans',
          title: 'font-serif text-xl font-bold text-stone-100',
          confirmButton: 'rounded-xl text-sm font-semibold px-5 py-2.5 cursor-pointer',
        },
      });
    } catch {
      Swal.fire({
        title: 'Error de conexión',
        text: 'No fue posible comunicarse con el servidor para importar la obra.',
        icon: 'error',
        background: '#1c1917',
        color: '#f5f5f4',
        confirmButtonColor: '#C2593F',
      });
    } finally {
      setImportingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream-50 dark:bg-surface-100">
        <Loader2 size={28} className="animate-spin text-terracotta-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-cream-50 dark:bg-surface-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 p-8 text-center shadow-elevated space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-50 dark:bg-terracotta-950/50 border border-terracotta-200 dark:border-terracotta-800/40 flex items-center justify-center text-terracotta-600 dark:text-terracotta-400 mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
              Acceso Restringido
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              El explorador e importador directo desde Google Books API está reservado exclusivamente para cuentas de Administrador.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/biblioteca"
              className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors"
            >
              Ir al Catálogo
            </Link>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-4 py-2.5 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 text-xs font-semibold cursor-pointer"
            >
              Iniciar como Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-cream-50 dark:bg-surface-100 text-stone-900 dark:text-stone-100 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navegación Superior */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
            <Link
              href="/biblioteca"
              className="inline-flex items-center gap-1.5 hover:text-stone-900 dark:hover:text-stone-100 transition-colors font-medium"
            >
              <ArrowLeft size={14} />
              Volver al Catálogo
            </Link>
            <span className="text-stone-300 dark:text-surface-300">/</span>
            <span className="text-terracotta-700 dark:text-terracotta-400 font-semibold uppercase tracking-wider text-[11px]">
              Google Books API • Obras de Uso Libre
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/subir"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors"
            >
              <UploadCloud size={14} />
              <span>Subir PDF Local</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchGoogleBooks()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 text-xs font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Sincronizar API</span>
            </button>
          </div>
        </div>

        {/* Cabecera Editorial */}
        <div className="rounded-3xl border border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200/60 p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-50 dark:bg-terracotta-950/50 border border-terracotta-200/80 dark:border-terracotta-800/40 text-terracotta-700 dark:text-terracotta-400 text-[11px] font-semibold tracking-wide uppercase">
                <Sparkles size={12} />
                <span>Alimentación Directa desde Google Cloud Books API</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Catálogo de Obras de Uso Libre
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Explora obras filtradas como libros gratuitos (<code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-surface-300">free-ebooks</code>) en Google Books. Al importarlas, los metadatos y el texto estructurado se guardan en MongoDB Atlas, mientras que las portadas se sirven directamente desde la API de Google.
              </p>
            </div>

            {/* Indicador de Estado de API Key */}
            <div
              className={`px-4 py-3 rounded-2xl border flex items-center gap-3 shrink-0 ${
                apiKeyConfigured
                  ? 'border-emerald-200/80 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                  : 'border-amber-300/80 bg-amber-50/70 dark:border-amber-800/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <KeyRound size={18} className="shrink-0" />
              <div className="text-xs">
                <p className="font-bold">
                  {apiKeyConfigured ? 'GOOGLE_BOOKS_API_KEY Activa' : 'API Key Pendiente en .env.local'}
                </p>
                <p className="text-[11px] opacity-85 mt-0.5">
                  {apiKeyConfigured
                    ? 'Conectado con cuota oficial de Google Cloud'
                    : 'Agrega GOOGLE_BOOKS_API_KEY en apps/web/.env.local'}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros de Categorías y Buscador */}
          <div className="pt-4 border-t border-stone-200/80 dark:border-surface-300 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id && !activeQuery
                      ? 'bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 shadow-xs'
                      : 'bg-cream-100 dark:bg-surface-300/60 text-stone-600 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-surface-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar título o autor libre..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-cream-50 dark:bg-surface-100 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Buscar
              </button>
            </form>
          </div>
        </div>

        {/* Aviso si hay error o falta API Key */}
        {errorMessage && (
          <div className="rounded-2xl border border-amber-300/80 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <AlertCircle size={22} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Aviso de Conexión con Google Books API
                </h3>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  En cuanto pegues tu clave en <code className="font-mono px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-surface-300">apps/web/.env.local</code> dentro de <code className="font-mono px-1.5 py-0.5 rounded bg-stone-200/70 dark:bg-surface-300">GOOGLE_BOOKS_API_KEY=&quot;AIza...&quot;</code>, oprime <strong>Sincronizar API</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => fetchGoogleBooks()}
              className="px-4 py-2 rounded-xl bg-stone-900 text-cream-50 dark:bg-cream-100 dark:text-stone-900 text-xs font-semibold shrink-0 cursor-pointer"
            >
              Reintentar ahora
            </button>
          </div>
        )}

        {/* Grid de Libros */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200/80 dark:border-surface-300 bg-white dark:bg-surface-200 p-4 space-y-4 animate-pulse"
              >
                <div className="h-56 w-full rounded-xl bg-stone-200 dark:bg-surface-300" />
                <div className="h-4 w-3/4 rounded bg-stone-200 dark:bg-surface-300" />
                <div className="h-3 w-1/2 rounded bg-stone-200 dark:bg-surface-300" />
                <div className="h-9 w-full rounded-xl bg-stone-200 dark:bg-surface-300" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-3xl border border-stone-200/80 dark:border-surface-300 bg-white/70 dark:bg-surface-200/40 p-14 text-center space-y-3">
            <BookOpen size={36} className="mx-auto text-stone-400" />
            <h3 className="font-serif text-lg font-bold text-stone-800 dark:text-stone-200">
              No se encontraron volúmenes para mostrar
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Verifica que tu <code className="font-mono">GOOGLE_BOOKS_API_KEY</code> esté activa en <code className="font-mono">.env.local</code> o intenta con otra categoría o término de búsqueda.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {books.map((book) => {
                const isImporting = importingId === book.googleBookId;

                return (
                  <div
                    key={book.googleBookId}
                    className="group rounded-2xl border border-stone-200/90 dark:border-surface-300 bg-white dark:bg-surface-200/80 overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-elevated transition-all"
                  >
                    <div>
                      {/* Portada servida directamente desde la URL de Google Books API */}
                      <div
                        onClick={() => {
                          setSelectedBook(book);
                          setCustomTextContent('');
                        }}
                        className="relative h-60 w-full bg-cream-200 dark:bg-surface-300 overflow-hidden cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={book.coverUrl}
                          alt={`Portada de ${book.title}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/75 text-cream-50">
                            {book.genres?.[0] || 'Clásicos'}
                          </span>
                        </div>

                        {book.alreadyInDb && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                              <CheckCircle2 size={11} />
                              <span>En DB</span>
                            </span>
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-cream-100 font-mono">
                          <span>{book.publishedYear}</span>
                          {book.pageCount > 0 && <span>{book.pageCount} págs.</span>}
                        </div>
                      </div>

                      {/* Información del libro */}
                      <div className="p-4 space-y-2">
                        <h3
                          onClick={() => {
                            setSelectedBook(book);
                            setCustomTextContent('');
                          }}
                          className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-2 hover:text-terracotta-600 dark:hover:text-terracotta-400 cursor-pointer transition-colors"
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs font-medium text-stone-600 dark:text-stone-400 line-clamp-1">
                          {book.author}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 leading-relaxed">
                          {book.synopsis}
                        </p>
                      </div>
                    </div>

                    {/* Acciones de Tarjeta */}
                    <div className="p-4 pt-2 border-t border-stone-100 dark:border-surface-300/60 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBook(book);
                          setCustomTextContent('');
                        }}
                        className="px-3 py-2 rounded-xl border border-stone-200 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                      >
                        Revisar
                      </button>

                      <button
                        type="button"
                        disabled={isImporting}
                        onClick={() => handleImportBook(book)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          book.alreadyInDb
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                            : 'bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 dark:hover:bg-cream-50'
                        }`}
                      >
                        {isImporting ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : book.alreadyInDb ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Actualizar en DB</span>
                          </>
                        ) : (
                          <>
                            <Database size={13} />
                            <span>Agregar a DB</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200/80 dark:border-surface-300">
              <button
                type="button"
                disabled={startIndex === 0 || loading}
                onClick={() => setStartIndex((prev) => Math.max(0, prev - pageSize))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={15} />
                <span>Página Anterior</span>
              </button>

              <span className="text-xs font-mono text-stone-500 dark:text-stone-400">
                Mostrando {startIndex + 1} - {startIndex + books.length}
                {totalItems > 0 ? ` de ~${totalItems}` : ''}
              </span>

              <button
                type="button"
                disabled={books.length < pageSize || loading}
                onClick={() => setStartIndex((prev) => prev + pageSize)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <span>Siguiente Página</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE REVISIÓN E IMPORTACIÓN (NO SE CIERRA AL HACER CLIC AFUERA)       */}
      {/* ========================================================================= */}
      {selectedBook && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="google-book-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 animate-fade-in"
        >
          <div className="w-full max-w-4xl max-h-[92vh] bg-cream-50 dark:bg-surface-100 rounded-3xl border border-stone-200/90 dark:border-surface-300 shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cream-200 dark:bg-surface-300 text-stone-800 dark:text-stone-200">
                  ID: {selectedBook.googleBookId}
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Portada servida vía Google Books API • Metadatos y texto hacia MongoDB
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors cursor-pointer"
                title="Cerrar ventana (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-reader-scrollbar space-y-6 flex-1">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Portada por API */}
                <div className="w-40 sm:w-48 shrink-0 mx-auto sm:mx-0">
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-stone-200 dark:border-surface-300 shadow-md bg-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedBook.coverUrl}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-center text-stone-400 mt-2">
                    URL de portada vinculada a la API
                  </p>
                </div>

                {/* Metadatos */}
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400">
                      {selectedBook.genres.join(', ')} • {selectedBook.publishedYear}
                    </span>
                    <h2
                      id="google-book-modal-title"
                      className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1"
                    >
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300 mt-0.5">
                      {selectedBook.author} — <span className="text-stone-400">{selectedBook.publisher}</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-surface-200/70 border border-stone-200/80 dark:border-surface-300 space-y-1.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Sinopsis Oficial (se guardará en la DB)
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 leading-relaxed font-serif">
                      {selectedBook.synopsis}
                    </p>
                  </div>

                  {/* Enlaces de recursos libres de Google Books */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedBook.pdfDownloadLink && (
                      <a
                        href={selectedBook.pdfDownloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors"
                      >
                        <Download size={13} />
                        <span>Descargar PDF de Google</span>
                      </a>
                    )}
                    {selectedBook.epubDownloadLink && (
                      <a
                        href={selectedBook.epubDownloadLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors"
                      >
                        <Download size={13} />
                        <span>Descargar EPUB Libre</span>
                      </a>
                    )}
                    {selectedBook.webReaderLink && (
                      <a
                        href={selectedBook.webReaderLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-surface-300 transition-colors"
                      >
                        <ExternalLink size={13} />
                        <span>Abrir en Google Reader</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Campo opcional para pegar o enriquecer el texto completo de la obra */}
              <div className="space-y-2 pt-2 border-t border-stone-200/80 dark:border-surface-300">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <FileText size={14} className="text-terracotta-600" />
                    <span>Texto de la Obra (Opcional: pega aquí el texto completo para paginarlo)</span>
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Se aplicará el constructor de títulos y párrafos automáticamente
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={customTextContent}
                  onChange={(e) => setCustomTextContent(e.target.value)}
                  placeholder={`Si dejas este campo vacío, el sistema descargará automáticamente el texto íntegro de la obra y lo dividirá en sus ${selectedBook.pageCount} páginas completas con títulos centrados en naranja...`}
                  className="w-full p-3.5 rounded-2xl border border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 text-xs sm:text-sm font-serif text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-terracotta-500/30 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-surface-300 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
              >
                Cerrar (Esc)
              </button>

              <button
                type="button"
                disabled={importingId === selectedBook.googleBookId}
                onClick={() => handleImportBook(selectedBook, customTextContent)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-cream-50 hover:bg-stone-800 dark:bg-cream-100 dark:text-stone-900 text-xs font-semibold shadow-subtle cursor-pointer disabled:opacity-50"
              >
                {importingId === selectedBook.googleBookId ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importando a MongoDB Atlas...</span>
                  </>
                ) : (
                  <>
                    <Database size={14} />
                    <span>Guardar Metadatos y Texto en DB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
