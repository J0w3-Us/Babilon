import { Book, BookGenre, BookPage, MinerUScanResult } from '@babilon/shared-types';
import { normalizeBook } from '@/lib/bookMapper';

export interface HealthInfo {
  online: boolean;
  dbConnected: boolean;
  dbStatus: string;
  service: string;
}

export interface FetchBooksResult {
  books: Book[];
  total: number;
  storage: 'api' | 'memory-fallback' | 'fallback';
  online: boolean;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; response: Response | null }> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (res.ok) {
      const data = (await res.json()) as T;
      return { data, response: res };
    }

    console.error(`La API devolvió ${res.status} para ${endpoint}`);
  } catch (err) {
    console.error(`Error en fetch a ${endpoint}:`, err);
  }

  return { data: null, response: null };
}

/**
 * Consulta el estado de la API publicada y su conexión con Atlas.
 */
export async function checkApiHealth(): Promise<HealthInfo> {
  const { data } = await apiFetch<{
    status?: string;
    message?: string;
    database?: { connected?: boolean; status?: string };
  }>('/api/backend/api/salud');

  if (!data) {
    return {
      online: false,
      dbConnected: false,
      dbStatus: 'sin conexión',
      service: 'API de libros desconectada',
    };
  }

  return {
    online: true,
    dbConnected: data.database?.connected ?? data.status === 'ok',
    dbStatus: data.database?.status ?? 'conectado',
    service: data.message ?? 'API Biblioteca Eclesiástica',
  };
}

/**
 * Obtiene el catálogo de libros desde la API publicada.
 */
export async function getBooksApi(params?: {
  query?: string;
  genre?: string;
  featured?: boolean;
}): Promise<FetchBooksResult> {
  const queryParams = new URLSearchParams();
  if (params?.query && params.query.trim()) {
    queryParams.append('query', params.query.trim());
  }
  if (params?.genre && params.genre !== 'Todos') {
    queryParams.append('genre', params.genre);
  }
  if (params?.featured) {
    queryParams.append('featured', 'true');
  }

  const endpoint = `/api/backend/api/libros${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const { data } = await apiFetch<unknown>(endpoint);
  const rawBooks = extractBooks(data);

  if (rawBooks) {
    const books = rawBooks
      .map((book) => normalizeBook(book))
      .filter((book) => matchesBookFilters(book, params));
    return {
      books,
      total: books.length,
      storage: 'api',
      online: true,
    };
  }

  return {
    books: [],
    total: 0,
    storage: 'fallback',
    online: false,
  };
}

/**
 * Obtiene el detalle completo de un libro por su ID (incluyendo el array de páginas).
 * El endpoint de catálogo no devuelve `paginas` por tamaño; este sí lo hace.
 */
export async function getBookByIdApi(bookId: string): Promise<Book | null> {
  const { data } = await apiFetch<unknown>(`/api/backend/api/libros/${encodeURIComponent(bookId)}`);
  const raw = extractSingleBook(data);
  if (raw) {
    return normalizeBook(raw);
  }
  return null;
}

/**
 * Registra o actualiza un libro en la API publicada.
 * Soporta metadatos completos, texto continuo (fullText), o array de páginas estructuradas.
 */
export async function createBookApi(book: {
  title: string;
  isbn: string;
  author: { name: string; biography?: string; country?: string };
  genres: BookGenre[];
  synopsis: string;
  publishedYear: number;
  publisher: string;
  coverUrl?: string;
  sampleChapterText?: string;
  fullText?: string;
  paginas?: BookPage[];
}): Promise<{ success: boolean; book?: Book; message?: string }> {
  const { data } = await apiFetch<unknown>('/api/backend/api/libros', {
    method: 'POST',
    body: JSON.stringify({
      ...book,
      titulo: book.title,
      autor: book.author.name,
      editorial: book.publisher,
      anio_publicacion: book.publishedYear,
      categorias: book.genres,
      sinopsis: book.synopsis,
      portada_url: book.coverUrl,
      paginas: book.paginas,
    }),
  });

  const createdBook = extractSingleBook(data);
  if (createdBook) {
    return {
      success: true,
      book: normalizeBook(createdBook),
      message: getApiMessage(data) || 'Libro guardado exitosamente en la API de libros',
    };
  }

  return {
    success: false,
    message: getApiMessage(data) || 'No se pudo registrar el libro en la API',
  };
}

import { mineruScannerService } from './mineru.service';

/**
 * Escanea un libro en formato PDF utilizando MinerU para extraer metadatos y cuerpo en Markdown.
 * Delegado al servicio especializado mineruScannerService.
 */
export async function scanBookPdfWithMinerU(file: File): Promise<{
  success: boolean;
  data?: MinerUScanResult;
  message?: string;
}> {
  return mineruScannerService.scan(file);
}



function extractBooks(payload: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return null;
  }

  const candidates = [payload.data, payload.books, payload.libros];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(isRecord);
    }
    if (isRecord(candidate)) {
      const nested = candidate.books ?? candidate.libros;
      if (Array.isArray(nested)) {
        return nested.filter(isRecord);
      }
    }
  }

  return null;
}

function extractSingleBook(payload: unknown): Record<string, unknown> | null {
  if (isRecord(payload)) {
    if (isRecord(payload.data)) return payload.data;
    if (isRecord(payload.book)) return payload.book;
    if ('titulo' in payload || 'title' in payload) return payload;
  }
  return null;
}

function getApiMessage(payload: unknown): string | undefined {
  return isRecord(payload) && typeof payload.message === 'string'
    ? payload.message
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function matchesBookFilters(
  book: Book,
  params?: { query?: string; genre?: string; featured?: boolean }
): boolean {
  const query = params?.query?.trim().toLocaleLowerCase();
  const matchesQuery =
    !query ||
    [book.title, book.isbn, book.author.name, book.synopsis]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query);
  const matchesGenre =
    !params?.genre ||
    params.genre === 'Todos' ||
    book.genres.some((genre) => genre.toLocaleLowerCase() === params.genre?.toLocaleLowerCase());
  const matchesFeatured = !params?.featured || Boolean(book.featured);

  return matchesQuery && matchesGenre && matchesFeatured;
}
