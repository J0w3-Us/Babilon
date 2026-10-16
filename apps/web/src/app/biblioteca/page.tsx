'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  PlusCircle,
  X,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Library,
  Feather,
  UploadCloud,
  FileText,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Coffee,
  Sun,
  Moon,
  Check,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import { Book, BookGenre, BookPage } from '@babilon/shared-types';
import { getBooksApi, checkApiHealth, createBookApi, HealthInfo } from '@/services/api';

const genresList: (BookGenre | 'Todos')[] = [
  'Todos',
  'Ficción',
  'Ciencia Ficción',
  'Filosofía',
  'Clásicos',
  'Poesía',
  'Historia',
];

function BibliotecaContent() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  // Modal de Subida de Libros
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadTab, setUploadTab] = useState<'meta' | 'content'>('meta');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newGenre, setNewGenre] = useState<BookGenre>('Ficción');
  const [newYear, setNewYear] = useState(2024);
  const [newPublisher, setNewPublisher] = useState('Editorial Babilon');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Lector de Libros (Reader Experience)
  const [readingBook, setReadingBook] = useState<Book | null>(null);
  const [readerCurrentPage, setReaderCurrentPage] = useState(0);
  const [readerTheme, setReaderTheme] = useState<'parchment' | 'dark' | 'light'>('parchment');
  const [readerFontSize, setReaderFontSize] = useState<number>(18);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Abrir modal de subida si viene el query param ?action=subir
  useEffect(() => {
    if (searchParams.get('action') === 'subir') {
      setIsAddModalOpen(true);
      setUploadTab('content');
    }
  }, [searchParams]);

  // Cargar catálogo de libros
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBooksApi({
        query: searchTerm,
        genre: selectedGenre,
      });
      setBooks(result.books);
    } catch {
      showToast('Error al conectar con la base de datos');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedGenre]);

  useEffect(() => {
    checkApiHealth().then((h) => setHealth(h));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBooks();
    }, 280);
    return () => clearTimeout(timer);
  }, [fetchBooks]);

  // Manejo de subida de archivo .txt o .md para lectura directa
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    if (!newTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setNewFullText(text);
        if (!newSynopsis) {
          setNewSynopsis(text.slice(0, 220) + '...');
        }
      }
    };
    reader.readAsText(file);
  };

  // Guardar libro en MongoDB
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) {
      showToast('Por favor completa al menos el título y el autor');
      return;
    }
    setIsSubmitting(true);
    try {
      const isbnVal = newIsbn.trim() || `ISBN-BAB-${Date.now().toString().slice(-6)}`;
      const res = await createBookApi({
        title: newTitle.trim(),
        isbn: isbnVal,
        author: { name: newAuthor.trim() },
        genres: [newGenre],
        publishedYear: Number(newYear) || 2024,
        publisher: newPublisher.trim() || 'Editorial Babilon',
        synopsis: newSynopsis.trim() || 'Sin sinopsis registrada.',
        coverUrl: newCoverUrl.trim() || undefined,
        fullText: newFullText.trim() || undefined,
      });

      if (res.success) {
        showToast('¡Obra y texto agregados exitosamente a MongoDB!');
        setIsAddModalOpen(false);
        setNewTitle('');
        setNewAuthor('');
        setNewIsbn('');
        setNewSynopsis('');
        setNewCoverUrl('');
        setNewFullText('');
        setUploadedFileName(null);
        setUploadTab('meta');
        fetchBooks();
      } else {
        showToast(res.message || 'Error al incorporar la obra');
      }
    } catch {
      showToast('Error al conectar con MongoDB biblioteca_digital');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Páginas preparadas para el Lector
  const readerPages: BookPage[] = useMemo(() => {
    if (!readingBook) return [];

    if (readingBook.pages && readingBook.pages.length > 0) {
      return readingBook.pages;
    }

    if (readingBook.sampleChapterText) {
      const blocks = readingBook.sampleChapterText.split(/---\s*Página\s*\d+\s*---/).filter(Boolean);
      if (blocks.length > 1) {
        return blocks.map((b, idx) => ({
          numero: idx + 1,
          texto: b.trim(),
        }));
      }
      return [
        {
          numero: 1,
          texto: readingBook.sampleChapterText,
        },
      ];
    }

    return [
      {
        numero: 1,
        texto: readingBook.synopsis || 'Texto en proceso de digitalización para esta obra.',
      },
    ];
  }, [readingBook]);

  const currentPageData = readerPages[readerCurrentPage] || {
    numero: 1,
    texto: 'Página no disponible',
  };

  const openReader = (b: Book) => {
    setReadingBook(b);
    setReaderCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-parchment-100/60 text-ink-900 selection:bg-terracotta-200 selection:text-ink-950 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-ink-950 text-parchment-50 rounded-xl shadow-2xl border border-parchment-400/20 animate-fade-in max-w-md">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Subheader / Breadcrumb Bar */}
      <div className="bg-white border-b border-parchment-300 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-terracotta-600 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Volver a Inicio</span>
            </Link>
            <span className="text-parchment-400">/</span>
            <span className="text-xs font-bold text-ink-900 uppercase tracking-wider font-mono">
              Biblioteca Digital
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MongoDB Conectado</span>
            </span>

            <button
              onClick={() => {
                setUploadTab('meta');
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <UploadCloud size={14} />
              <span>Subir Libro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-950">
                Archivo de Libros & Obras
              </h1>
              <p className="text-sm text-ink-600 mt-1">
                Consulta los volúmenes preservados en la base de datos o lee de forma inmediata.
              </p>
            </div>
          </div>

          {/* Search Bar & Disciplines */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
            <div className="md:col-span-7 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                placeholder="Buscar por título, autor, sinopsis o ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-parchment-300 rounded-xl text-ink-900 placeholder:text-ink-400 text-sm focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500 transition-all shadow-subtle"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="md:col-span-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {genresList.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    selectedGenre === g
                      ? 'bg-ink-900 text-parchment-50 shadow-sm'
                      : 'bg-white text-ink-700 border border-parchment-300 hover:bg-parchment-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw size={32} className="animate-spin text-terracotta-600 mx-auto mb-3" />
            <p className="font-serif text-xl text-ink-800">Consultando biblioteca_digital...</p>
            <p className="text-xs text-ink-400 mt-1">Leyendo obras directamente desde MongoDB</p>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-parchment-300 p-8">
            <BookOpen size={44} className="text-parchment-400 mx-auto mb-4" />
            <h3 className="font-serif text-2xl font-medium text-ink-900">No se encontraron obras</h3>
            <p className="text-sm text-ink-500 max-w-md mx-auto mt-2 mb-6">
              No hay coincidencias para tu búsqueda. Puedes subir o digitalizar esta obra ahora mismo.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-600 text-white text-xs font-semibold hover:bg-terracotta-700 transition-colors cursor-pointer"
            >
              <UploadCloud size={16} />
              Subir la Obra
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => {
              const pagesCount = book.pages?.length || book.pageCount || 0;
              return (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-parchment-300 overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col group"
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4] bg-parchment-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-ink-900 shadow-sm backdrop-blur-sm">
                        {book.genres?.[0] || 'Volumen'}
                      </span>
                    </div>

                    {pagesCount > 0 && (
                      <div className="absolute bottom-3 right-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-ink-950/80 text-parchment-100 backdrop-blur-sm">
                          {pagesCount} pág.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-ink-950 line-clamp-1 group-hover:text-terracotta-600 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-ink-600 mt-0.5">{book.author?.name}</p>
                      <p className="text-xs text-ink-500 mt-2.5 line-clamp-3 leading-relaxed">
                        {book.synopsis}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-parchment-200 flex items-center justify-between">
                      <span className="text-[11px] text-ink-400 font-mono">
                        {book.publishedYear || 'S/F'}
                      </span>

                      <button
                        onClick={() => openReader(book)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-900 text-parchment-50 hover:bg-terracotta-600 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <BookOpen size={13} />
                        Leer Libro
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* LECTOR DE LIBROS DIGITAL (SERENE FULL-PAGE READING EXPERIENCE)            */}
      {/* ========================================================================= */}
      {readingBook && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in ${
            isFullscreen ? 'p-0' : 'p-2 sm:p-6'
          } ${readerTheme === 'dark' ? 'bg-ink-950/80' : 'bg-ink-950/60'}`}
        >
          <div
            className={`w-full h-full flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
              isFullscreen ? 'max-w-none max-h-none rounded-none' : 'max-w-4xl max-h-[92vh] rounded-2xl border'
            } ${
              readerTheme === 'dark'
                ? 'bg-ink-950 text-parchment-100 border-ink-800'
                : readerTheme === 'parchment'
                ? 'bg-[#FBF8F1] text-ink-900 border-[#E8DFC8]'
                : 'bg-white text-ink-900 border-parchment-300'
            }`}
          >
            {/* Top Toolbar */}
            <div
              className={`px-6 py-3.5 flex items-center justify-between border-b transition-colors select-none ${
                readerTheme === 'dark'
                  ? 'bg-ink-900/90 border-ink-800'
                  : readerTheme === 'parchment'
                  ? 'bg-[#F4ECE1] border-[#E5D7C0]'
                  : 'bg-parchment-100 border-parchment-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-terracotta-600 shrink-0" />
                <div className="truncate max-w-[260px] sm:max-w-md">
                  <h3 className="font-serif text-base sm:text-lg font-bold leading-tight truncate">
                    {readingBook.title}
                  </h3>
                  <p className="text-[11px] opacity-70 truncate font-sans">
                    {readingBook.author?.name} • {readingBook.publisher}
                  </p>
                </div>
              </div>

              {/* Reader Controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Font Size controls */}
                <div className="hidden sm:flex items-center gap-1 border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
                  <button
                    onClick={() => setReaderFontSize((s) => Math.max(14, s - 2))}
                    className="text-xs px-1 hover:text-terracotta-600 font-serif font-bold cursor-pointer"
                    title="Reducir fuente"
                  >
                    A-
                  </button>
                  <span className="text-[10px] font-mono opacity-60">|</span>
                  <button
                    onClick={() => setReaderFontSize((s) => Math.min(26, s + 2))}
                    className="text-xs px-1 hover:text-terracotta-600 font-serif font-bold cursor-pointer"
                    title="Aumentar fuente"
                  >
                    A+
                  </button>
                </div>

                {/* Theme Selector */}
                <div className="flex items-center gap-1 border border-black/10 dark:border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setReaderTheme('parchment')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
                      readerTheme === 'parchment' ? 'bg-[#EADECE] text-ink-900 shadow-sm' : 'opacity-60'
                    }`}
                    title="Tema Pergamino"
                  >
                    <Coffee size={13} />
                  </button>
                  <button
                    onClick={() => setReaderTheme('light')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
                      readerTheme === 'light' ? 'bg-white text-ink-900 shadow-sm' : 'opacity-60'
                    }`}
                    title="Tema Claro"
                  >
                    <Sun size={13} />
                  </button>
                  <button
                    onClick={() => setReaderTheme('dark')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
                      readerTheme === 'dark' ? 'bg-ink-800 text-parchment-100 shadow-sm' : 'opacity-60'
                    }`}
                    title="Tema Oscuro"
                  >
                    <Moon size={13} />
                  </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setReadingBook(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Reading Content Canvas */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 sm:py-12 select-text">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Chapter / Page Header */}
                <div className="text-center pb-6 border-b border-black/10 dark:border-white/10">
                  <span className="text-[11px] uppercase tracking-widest text-terracotta-600 font-sans font-bold">
                    Página {readerCurrentPage + 1} de {readerPages.length}
                  </span>
                  <h4 className="font-serif text-2xl sm:text-3xl font-medium mt-1">
                    {readingBook.title}
                  </h4>
                  {currentPageData.nombre_archivo && (
                    <span className="text-[10px] font-mono opacity-50 block mt-1">
                      {currentPageData.nombre_archivo}
                    </span>
                  )}
                </div>

                {/* Page Content Body */}
                <div
                  style={{ fontSize: `${readerFontSize}px` }}
                  className="font-serif leading-relaxed sm:leading-loose whitespace-pre-line text-justify first-letter:float-left first-letter:text-5xl first-letter:pr-3 first-letter:font-serif first-letter:text-terracotta-700"
                >
                  {currentPageData.texto}
                </div>
              </div>
            </div>

            {/* Bottom Page Navigation Controls */}
            <div
              className={`px-6 py-3.5 border-t flex items-center justify-between select-none ${
                readerTheme === 'dark'
                  ? 'bg-ink-900/90 border-ink-800'
                  : readerTheme === 'parchment'
                  ? 'bg-[#F4ECE1] border-[#E5D7C0]'
                  : 'bg-parchment-100 border-parchment-200'
              }`}
            >
              <button
                disabled={readerCurrentPage === 0}
                onClick={() => setReaderCurrentPage((p) => Math.max(0, p - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
                Página Anterior
              </button>

              <span className="text-xs font-mono opacity-80">
                Pág. {readerCurrentPage + 1} de {readerPages.length}
              </span>

              <button
                disabled={readerCurrentPage >= readerPages.length - 1}
                onClick={() => setReaderCurrentPage((p) => Math.min(readerPages.length - 1, p + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-ink-900 text-parchment-50 hover:bg-terracotta-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Siguiente Página
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE SUBIDA DE LIBROS (DIRECT STORAGE EN MONGODB ATLAS)               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-parchment-300 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-parchment-200 bg-parchment-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UploadCloud size={20} className="text-terracotta-600" />
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink-950">
                    Subir y Digitalizar Obra
                  </h3>
                  <p className="text-xs text-ink-500 font-sans">
                    Persistencia directa en la colección <code className="font-mono text-terracotta-700">libros</code> de MongoDB
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full border border-parchment-300 flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-parchment-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-parchment-200 bg-parchment-100/50 px-6 pt-2">
              <button
                type="button"
                onClick={() => setUploadTab('meta')}
                className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  uploadTab === 'meta'
                    ? 'border-terracotta-600 text-terracotta-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                1. Datos Bibliográficos
              </button>
              <button
                type="button"
                onClick={() => setUploadTab('content')}
                className={`pb-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  uploadTab === 'content'
                    ? 'border-terracotta-600 text-terracotta-700'
                    : 'border-transparent text-ink-500 hover:text-ink-800'
                }`}
              >
                2. Contenido / Archivo de Texto {newFullText && '✓'}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateBook} className="p-6 overflow-y-auto space-y-4 flex-1">
              {uploadTab === 'meta' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      Título de la Obra *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ej. La Divina Comedia"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                        Autor / Escritor *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Dante Alighieri"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                        ISBN (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="ej. 978-84-376-0000-0"
                        value={newIsbn}
                        onChange={(e) => setNewIsbn(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                        Género / Disciplina
                      </label>
                      <select
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value as BookGenre)}
                        className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                      >
                        <option value="Clásicos">Clásicos</option>
                        <option value="Filosofía">Filosofía</option>
                        <option value="Ficción">Ficción</option>
                        <option value="Ciencia Ficción">Ciencia Ficción</option>
                        <option value="Poesía">Poesía</option>
                        <option value="Historia">Historia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                        Año de Publicación
                      </label>
                      <input
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                        Editorial
                      </label>
                      <input
                        type="text"
                        value={newPublisher}
                        onChange={(e) => setNewPublisher(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      URL de Portada (opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newCoverUrl}
                      onChange={(e) => setNewCoverUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
                      Sinopsis / Resumen de la obra
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Breve reseña sobre el contenido del libro..."
                      value={newSynopsis}
                      onChange={(e) => setNewSynopsis(e.target.value)}
                      className="w-full px-3.5 py-2 bg-parchment-50 border border-parchment-300 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-5 border-2 border-dashed border-parchment-300 rounded-xl bg-parchment-50 text-center hover:bg-parchment-100 transition-colors">
                    <FileText size={32} className="text-terracotta-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-ink-800">
                      {uploadedFileName ? `Archivo cargado: ${uploadedFileName}` : 'Arrastra o selecciona un archivo de texto'}
                    </p>
                    <p className="text-xs text-ink-500 mt-1">
                      Formatos soportados: .txt, .md o texto plano digitalizado
                    </p>
                    <label className="mt-3 inline-block px-4 py-2 rounded-lg bg-ink-900 text-parchment-50 text-xs font-semibold cursor-pointer hover:bg-terracotta-600 transition-colors">
                      Examinar Archivo
                      <input
                        type="file"
                        accept=".txt,.md,text/plain"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-ink-700 uppercase tracking-wider">
                        O Pega el Texto de la Obra (Se paginará automáticamente)
                      </label>
                      <span className="text-[11px] font-mono text-ink-400">
                        {newFullText.length} caracteres
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="Pega aquí el contenido del libro, capítulos o páginas para que queden disponibles para lectura..."
                      value={newFullText}
                      onChange={(e) => setNewFullText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-parchment-50 border border-parchment-300 rounded-lg text-sm font-mono text-ink-900 focus:outline-none focus:border-terracotta-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="pt-4 border-t border-parchment-200 flex items-center justify-between">
                {uploadTab === 'meta' ? (
                  <button
                    type="button"
                    onClick={() => setUploadTab('content')}
                    className="text-xs text-terracotta-600 font-semibold hover:underline cursor-pointer"
                  >
                    Siguiente: Cargar texto del libro →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUploadTab('meta')}
                    className="text-xs text-ink-500 font-semibold hover:underline cursor-pointer"
                  >
                    ← Volver a datos
                  </button>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-parchment-300 text-xs font-semibold text-ink-700 hover:bg-parchment-100 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Guardando en MongoDB...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Guardar en el Archivo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BibliotecaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-parchment-100/60">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-terracotta-600 mx-auto mb-3" />
          <p className="font-serif text-xl text-ink-800">Cargando biblioteca...</p>
        </div>
      </div>
    }>
      <BibliotecaContent />
    </Suspense>
  );
}
