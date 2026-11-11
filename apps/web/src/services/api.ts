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

export interface AuthUser {
  id: string;
  username: string;
  nombre: string;
  rol: 'admin' | 'usuario';
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
  token?: string;
  expiresAt?: number;
  user?: AuthUser;
}

/**
 * Inicia sesión validando las credenciales contra la colección `usuarios` en MongoDB Atlas.
 */
export async function loginUserApi(
  username: string,
  password: string
): Promise<AuthActionResult> {
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });
    const body = (await res.json()) as AuthActionResult;
    return {
      ...body,
      success: Boolean(res.ok && body.success && body.token && body.user),
      message: body.message || (res.ok ? 'Sesión iniciada' : 'Credenciales inválidas'),
    };
  } catch {
    return {
      success: false,
      message: 'No se pudo conectar con el servidor de autenticación.',
    };
  }
}

/**
 * Crea una nueva cuenta (`admin` o `usuario`) en la colección `usuarios` de MongoDB Atlas.
 */
export async function registerUserApi(payload: {
  username: string;
  password: string;
  nombre: string;
  rol: 'admin' | 'usuario';
}): Promise<AuthActionResult> {
  try {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = (await res.json()) as AuthActionResult;
    return {
      ...body,
      success: Boolean(res.ok && body.success && body.token && body.user),
      message: body.message || (res.ok ? 'Cuenta creada' : 'No se pudo crear la cuenta'),
    };
  } catch {
    return {
      success: false,
      message: 'No se pudo conectar con el servidor para registrar la cuenta.',
    };
  }
}

export interface UploadSecurityTokenResult {
  success: boolean;
  token?: string;
  expiresAt?: number;
  message?: string;
  health?: {
    online: boolean;
    dbConnected: boolean;
    dbStatus: string;
  };
}

/**
 * Solicita un token JWT firmado (HS256) y valida mediante un ping previo
 * que la base de datos esté activa antes de permitir la subida del texto.
 */
export async function requestUploadSecurityToken(
  sessionToken?: string | null
): Promise<UploadSecurityTokenResult> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sessionToken) {
      headers['x-babilon-jwt'] = sessionToken;
    }

    const res = await fetch('/api/v1/auth/upload-token', {
      method: 'POST',
      headers,
      cache: 'no-store',
    });
    const body = (await res.json()) as UploadSecurityTokenResult;
    if (!res.ok || !body.success || !body.token) {
      return {
        success: false,
        message: body.message || 'No se pudo obtener autorización de seguridad JWT para la subida.',
        health: body.health,
      };
    }
    return body;
  } catch {
    return {
      success: false,
      message: 'No se pudo contactar al servicio de seguridad pre-subida.',
    };
  }
}

/**
 * Actualiza los metadatos de un libro existente (Solo Administradores).
 */
export async function updateBookApi(
  bookId: string,
  updates: {
    title?: string;
    authorName?: string;
    publisher?: string;
    publishedYear?: number;
    synopsis?: string;
    genres?: BookGenre[];
    isbn?: string;
  },
  token: string
): Promise<{ success: boolean; message?: string }> {
  const { data, response } = await apiFetch<unknown>(
    `/api/backend/api/libros/${encodeURIComponent(bookId)}`,
    {
      method: 'PUT',
      headers: {
        'x-babilon-jwt': token,
      },
      body: JSON.stringify(updates),
    }
  );

  if (response?.ok && isRecord(data) && data.success === true) {
    return {
      success: true,
      message: getApiMessage(data) || 'Libro actualizado correctamente.',
    };
  }

  return {
    success: false,
    message:
      getApiMessage(data) ||
      (response?.status === 403
        ? 'Solo los Administradores pueden editar libros.'
        : 'No se pudo actualizar el libro.'),
  };
}

/**
 * Elimina un libro del catálogo (Solo Administradores).
 */
export async function deleteBookApi(
  bookId: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  const { data, response } = await apiFetch<unknown>(
    `/api/backend/api/libros/${encodeURIComponent(bookId)}`,
    {
      method: 'DELETE',
      headers: {
        'x-babilon-jwt': token,
      },
    }
  );

  if (response?.ok && isRecord(data) && data.success === true) {
    return {
      success: true,
      message: getApiMessage(data) || 'Libro eliminado correctamente.',
    };
  }

  return {
    success: false,
    message:
      getApiMessage(data) ||
      (response?.status === 403
        ? 'Solo los Administradores pueden eliminar libros.'
        : 'No se pudo eliminar el libro.'),
  };
}

/**
 * Registra o actualiza un libro en la API publicada.
 * Valida la disponibilidad con un ping y resguarda la subida mediante un token JWT firmado.
 */
export async function createBookApi(
  book: {
    title: string;
    isbn: string;
    author: { name: string; biography?: string; country?: string };
    genres: BookGenre[];
    synopsis: string;
    publishedYear: number;
    publisher: string;
    pageCount: number;
    paginas?: BookPage[];
  },
  uploadToken?: string
): Promise<{ success: boolean; bookId?: string; message?: string }> {
  let token = uploadToken;

  if (!token) {
    const securityCheck = await requestUploadSecurityToken();
    if (!securityCheck.success || !securityCheck.token) {
      return {
        success: false,
        message:
          securityCheck.message ||
          'La verificación de seguridad (JWT / Ping) rechazó la subida.',
      };
    }
    token = securityCheck.token;
  }

  const { data, response } = await apiFetch<unknown>('/api/backend/api/libros', {
    method: 'POST',
    headers: {
      'x-babilon-jwt': token,
    },
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

  if (response?.status === 401) {
    return {
      success: false,
      message: 'Token de seguridad JWT inválido o expirado. Por favor intenta guardar nuevamente.',
    };
  }

  const createdBook = extractSingleBook(data);
  if ((isRecord(data) && data.success === true) || createdBook) {
    const id = isRecord(data) && typeof data.upsertedId === 'string'
      ? data.upsertedId
      : createdBook?._id ?? createdBook?.id;
    return {
      success: true,
      bookId: typeof id === 'string' ? id : undefined,
      message: getApiMessage(data) || 'Libro guardado exitosamente con verificación JWT',
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
