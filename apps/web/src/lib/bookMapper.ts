import { Book, BookGenre, BookPage, BookChapter } from '@babilon/shared-types';
import { formatBookSynopsis } from '@/lib/synopsisFormatter';

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80';

function extractObjectIdIsoDate(rawId: unknown): string | undefined {
  if (!rawId) return undefined;
  const idStr = String(rawId).trim();
  if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
    const timestampSeconds = parseInt(idStr.slice(0, 8), 16);
    if (Number.isFinite(timestampSeconds) && timestampSeconds > 946684800) {
      return new Date(timestampSeconds * 1000).toISOString();
    }
  }
  return undefined;
}

function normalizeIsoDate(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return undefined;
}

export function normalizeCoverUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const coverUrl = value.trim();
  if (!coverUrl) return undefined;

  try {
    const parsedUrl = new URL(coverUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return undefined;
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
}

export function normalizeBook(doc: Record<string, any>): Book {
  const authorValue = doc.autor ?? doc.author;
  const author = typeof authorValue === 'string'
    ? {
        id: String(doc.autor_id || `author-${doc._id || doc.id || 'unknown'}`),
        name: authorValue,
        biography: '',
      }
    : authorValue ?? {
        id: String(doc.autor_id || `author-${doc._id || doc.id || 'unknown'}`),
        name: 'Autor desconocido',
        biography: '',
      };

  let genres: BookGenre[] = ['Ficción'];
  if (Array.isArray(doc.categorias) && doc.categorias.length > 0) {
    genres = doc.categorias as BookGenre[];
  } else if (Array.isArray(doc.genres) && doc.genres.length > 0) {
    genres = doc.genres as BookGenre[];
  } else if (doc.categoria) {
    genres = [doc.categoria as BookGenre];
  }

  const publishedYear = Number(
    doc.anio_publicacion ?? doc.publishedYear ?? doc.anioPublicacion ?? 2024
  );

  // Normalize the structured pages returned by the books API.
  const rawPaginas = Array.isArray(doc.paginas) ? doc.paginas : [];
  const pages: BookPage[] = rawPaginas.map((p: any, idx: number) => {
    // Cubrir todas las variantes de nombre de campo que puede devolver MongoDB / la API
    const textoRaw =
      p.texto ??
      p.texto_extraido ??
      p.textoExtraido ??
      p.page_text ??
      p.pageText ??
      p.content ??
      p.body ??
      p.text ??
      '';
    const textoStr = String(textoRaw);
    const wordCount =
      p.conteo_palabras ??
      p.palabra_count ??
      (textoStr.trim() ? textoStr.trim().split(/\s+/).length : 0);
    return {
      numero: Number(p.numero_pagina ?? p.numeroPagina ?? p.numero ?? p.page ?? idx + 1),
      texto: textoStr,
      nombre_archivo: p.nombre_archivo ?? p.filename ?? p.file_name,
      conteo_palabras: wordCount,
    };
  });

  // Normalizar capítulos
  const rawCapitulos = Array.isArray(doc.capitulos) ? doc.capitulos : [];
  const chapters: BookChapter[] = rawCapitulos.map((c: any, idx: number) => ({
    numero: Number(c.numero ?? idx + 1),
    titulo: String(c.titulo ?? c.title ?? `Capítulo ${idx + 1}`),
    pagina_inicio: c.pagina_inicio,
    pagina_fin: c.pagina_fin,
    contenido: c.contenido,
  }));

  let rawSynopsis = doc.sinopsis ?? doc.synopsis ?? doc.descripcion ?? doc.resumen ?? '';
  if (!rawSynopsis && pages.length > 0 && pages[0].texto) {
    rawSynopsis = pages[0].texto.slice(0, 400);
  }
  const synopsis = formatBookSynopsis(rawSynopsis, {
    fallback: 'Sin sinopsis disponible.',
  });

  // Generar muestra si no existe
  let sampleChapterText: string | undefined = doc.sampleChapterText;
  if (!sampleChapterText && pages.length > 0) {
    sampleChapterText = pages
      .slice(0, 3)
      .map((p) => `--- Página ${p.numero} ---\n\n${p.texto}`)
      .join('\n\n');
  }

  const coverUrl =
    normalizeCoverUrl(doc.portada_url) ??
    normalizeCoverUrl(doc.coverUrl) ??
    normalizeCoverUrl(doc.portada) ??
    DEFAULT_COVER_URL;

  const rawId = doc._id ?? doc.id ?? doc.isbn ?? Math.random().toString();
  const objectIdDate = extractObjectIdIsoDate(doc._id ?? doc.id);

  const uploadedAt =
    normalizeIsoDate(doc.fecha_subida) ??
    normalizeIsoDate(doc.fecha_creacion) ??
    normalizeIsoDate(doc.createdAt) ??
    normalizeIsoDate(doc.fecha_procesamiento) ??
    objectIdDate ??
    normalizeIsoDate(doc.fecha_actualizacion);

  const rawUpdatedAt =
    normalizeIsoDate(doc.fecha_ultima_modificacion) ??
    normalizeIsoDate(doc.updatedAt) ??
    normalizeIsoDate(doc.fecha_actualizacion);

  let wasUpdated = Boolean(doc.fue_actualizado ?? doc.wasUpdated);
  if (!wasUpdated && uploadedAt && rawUpdatedAt) {
    const diffMs = new Date(rawUpdatedAt).getTime() - new Date(uploadedAt).getTime();
    if (diffMs > 2000) {
      wasUpdated = true;
    }
  }

  const updatedAt = wasUpdated ? (rawUpdatedAt ?? null) : null;

  const rawOrigin = doc.origen_datos ?? doc.origin ?? doc.metadatos_adicionales?.origen;
  const origin =
    rawOrigin === 'google_books_api' || doc.google_book_id
      ? 'Google Books API'
      : rawOrigin === 'digitalizacion_local'
        ? 'Digitalización Local'
        : typeof rawOrigin === 'string' && rawOrigin.trim()
          ? rawOrigin.trim()
          : 'Archivo Babilon';

  return {
    id: String(rawId),
    title: doc.titulo ?? doc.title ?? 'Sin título',
    originalTitle: doc.subtitulo || doc.originalTitle || doc.titulo,
    isbn: doc.isbn ?? doc.isbn_o_codigo ?? 'N/A',
    author,
    genres,
    synopsis,
    publishedYear,
    publisher: doc.editorial ?? doc.publisher ?? 'Editorial Babilon',
    pageCount: Number(doc.total_paginas ?? doc.pageCount ?? (pages.length > 0 ? pages.length : 0)),
    language: doc.idioma ?? doc.language ?? 'Español',
    catalogType: doc.tipo_libro || doc.metadatos_adicionales?.tipo_libro || doc.catalogType || 'Digitalizado',
    coverUrl,
    ratingAverage: Number(doc.calificacion?.promedio ?? doc.ratingAverage ?? 4.8),
    ratingCount: Number(doc.calificacion?.total_votos ?? doc.ratingCount ?? 120),
    availableFormats: doc.availableFormats ?? ['PAPERBACK', 'EBOOK'],
    sampleChapterText,
    chapters,
    pages,
    stock: Number(doc.stock ?? 10),
    featured: Boolean(doc.destacado ?? doc.featured ?? true),
    uploadedAt,
    updatedAt,
    wasUpdated,
    origin,
    uploadedBy: typeof doc.subido_por === 'string' ? doc.subido_por : undefined,
    updatedBy: typeof doc.actualizado_por === 'string' ? doc.actualizado_por : undefined,
  };
}
