import { Book, ApiResponse, BookGenre, BookPage } from '@babilon/shared-types';

export interface HealthInfo {
  online: boolean;
  dbConnected: boolean;
  dbStatus: string;
  service: string;
}

export interface FetchBooksResult {
  books: Book[];
  total: number;
  storage: 'mongodb' | 'memory-fallback' | 'fallback';
  online: boolean;
}

/**
 * Cliente local que conecta directamente con los Route Handlers de Next.js
 * y con la base de datos MongoDB biblioteca_digital.
 */
async function localFetch<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; response: Response | null }> {
  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (res.ok) {
      const data = await res.json();
      return { data, response: res };
    }
  } catch (err) {
    console.error(`Error en fetch a ${endpoint}:`, err);
  }

  return { data: null, response: null };
}

/**
 * Consulta el estado de la conexión directa a MongoDB Atlas (biblioteca_digital).
 */
export async function checkApiHealth(): Promise<HealthInfo> {
  const { data } = await localFetch<any>('/api/health');

  if (!data) {
    return {
      online: false,
      dbConnected: false,
      dbStatus: 'sin conexión',
      service: 'MongoDB Atlas Desconectado',
    };
  }

  return {
    online: true,
    dbConnected: data.database?.connected ?? false,
    dbStatus: data.database?.status ?? 'conectado',
    service: data.service ?? 'MongoDB Atlas (biblioteca_digital)',
  };
}

/**
 * Obtiene el catálogo de libros con filtros directamente desde MongoDB Atlas.
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

  const endpoint = `/api/v1/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const { data, response } = await localFetch<ApiResponse<Book[]>>(endpoint);

  if (data && data.success && Array.isArray(data.data)) {
    const storageHeader =
      response?.headers.get('x-babilon-storage') ||
      response?.headers.get('X-Babilon-Storage');
    const storage: 'mongodb' | 'memory-fallback' =
      storageHeader === 'mongodb' ? 'mongodb' : 'memory-fallback';
    return {
      books: data.data,
      total: data.meta?.total ?? data.data.length,
      storage,
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
 * Registra o sube un nuevo libro directamente en la colección 'libros' de MongoDB biblioteca_digital.
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
  const { data } = await localFetch<ApiResponse<Book>>('/api/v1/books', {
    method: 'POST',
    body: JSON.stringify(book),
  });

  if (data && data.success && data.data) {
    return {
      success: true,
      book: data.data,
      message: data.message || 'Libro guardado exitosamente en MongoDB biblioteca_digital',
    };
  }

  return {
    success: false,
    message: data?.message || 'No se pudo registrar el libro en la base de datos',
  };
}
