import { Book, BookGenre, BookPage, MinerUScanResult } from '@babilon/shared-types';
import { normalizeBook } from '@/lib/bookMapper';
import { splitTextIntoPages } from '@/lib/pageSplitter';

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
  hasMore?: boolean;
  nextCursor?: string | null;
}

async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; response: Response | null }> {
  let response: Response | null = null;
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    response = res;

    if (res.ok) {
      const data = (await res.json()) as T;
      return { data, response: res };
    }

    console.error(`La API devolvió ${res.status} para ${endpoint}`);
  } catch (err) {
    console.error(`Error en fetch a ${endpoint}:`, err);
  }

  return { data: null, response };
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
  categories?: string[];
  authors?: string[];
  featured?: boolean;
  limit?: number;
  cursor?: string | null;
}): Promise<FetchBooksResult> {
  const queryParams = new URLSearchParams();
  if (params?.query && params.query.trim()) {
    queryParams.append('busqueda', params.query.trim());
  }
  params?.categories?.forEach((category) => queryParams.append('category', category));
  params?.authors?.forEach((author) => queryParams.append('author', author));
  if (params?.featured) {
    queryParams.append('featured', 'true');
  }
  const limit = params?.limit ?? 20;
  queryParams.append('limit', String(limit));
  if (params?.cursor) queryParams.append('cursor', params.cursor);

  const endpoint = `/api/backend/api/libros${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const { data } = await apiFetch<unknown>(endpoint);
  const rawBooks = extractBooks(data);

  if (rawBooks) {
    const books = rawBooks.map((book) => normalizeBook(book));

    const totalFromServer = isRecord(data) && typeof data.total === 'number' ? data.total : books.length;
    const hasMoreFromServer = isRecord(data) && typeof data.hasMore === 'boolean'
      ? data.hasMore
      : false;

    return {
      books,
      total: totalFromServer,
      hasMore: hasMoreFromServer,
      nextCursor: isRecord(data) && typeof data.nextCursor === 'string'
        ? data.nextCursor
        : null,
      storage: 'api',
      online: true,
    };
  }

  return {
    books: [],
    total: 0,
    hasMore: false,
    nextCursor: null,
    storage: 'fallback',
    online: false,
  };
}

/**
 * Obtiene un bloque de páginas desde el detalle completo del libro.
 * La API publicada entrega el contenido en el endpoint de detalle.
 */
export async function getBookPagesApi(
  bookId: string,
  fromPage: number,
  limit = 10
): Promise<{ pages: BookPage[]; total: number }> {
  return getBookPagesFromBookDetail(bookId, fromPage, limit);
}

async function getBookPagesFromBookDetail(
  bookId: string,
  fromPage: number,
  limit: number
): Promise<{ pages: BookPage[]; total: number }> {
  const { data, response } = await apiFetch<unknown>(
    `/api/backend/api/libros/${encodeURIComponent(bookId)}`
  );
  const book = isRecord(data) && isRecord(data.data) ? data.data : data;
  if (!response?.ok || !isRecord(book)) {
    throw new Error(
      response?.status === 404
        ? 'No se encontró el libro solicitado.'
        : 'No se pudo cargar el detalle del libro.'
    );
  }

  const rawPages = Array.isArray(book.paginas)
    ? book.paginas
    : Array.isArray(book.pages)
      ? book.pages
      : [];
  let pages: BookPage[] = rawPages.map((rawPage, index) => {
    const page = isRecord(rawPage) ? rawPage : {};
    return {
      numero: Number(
        page.pageNumber ?? page.numero_pagina ?? page.numeroPagina ?? page.numero ?? page.page ?? index + 1
      ),
      texto: String(
        page.text ?? page.texto ?? page.texto_extraido ?? page.page_text ?? page.content ?? ''
      ),
    };
  }).filter((page) => Number.isSafeInteger(page.numero) && page.numero > 0)
    .sort((left, right) => left.numero - right.numero);

  if (pages.length === 0 && typeof book.fullText === 'string' && book.fullText.trim()) {
    pages = splitTextIntoPages(book.fullText).map((page) => ({
      numero: page.numero,
      texto: page.texto,
    }));
  }

  const total = Number(book.total_paginas ?? book.pageCount ?? pages.length);
  if (pages.length === 0 && total > 0) {
    throw new Error(
      'El detalle del libro no incluye las páginas que indica su total.'
    );
  }

  return {
    pages: pages.filter((page) => page.numero >= fromPage && page.numero < fromPage + limit),
    total: Number.isSafeInteger(total) && total >= 0 ? total : pages.length,
  };
}

/**
 * Registra o actualiza un libro en la API publicada.
 * Envía metadatos y contenido juntos al endpoint de creación soportado por la API.
 */
export async function createBookApi(book: {
  title: string;
  isbn: string;
  author: { name: string; biography?: string; country?: string };
  genres: BookGenre[];
  synopsis: string;
  publishedYear: number;
  publisher: string;
  pageCount: number;
  paginas?: BookPage[];
}): Promise<{ success: boolean; bookId?: string; message?: string }> {
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
      pageCount: book.pageCount,
      paginas: book.paginas,
    }),
  });

  const createdBook = extractSingleBook(data);
  if ((isRecord(data) && data.success === true) || createdBook) {
    const id = isRecord(data) && typeof data.upsertedId === 'string'
      ? data.upsertedId
      : createdBook?._id ?? createdBook?.id;
    return {
      success: true,
      bookId: typeof id === 'string' ? id : undefined,
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
