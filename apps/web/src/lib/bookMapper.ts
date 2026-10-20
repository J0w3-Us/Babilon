import { Book, BookGenre, BookPage, BookChapter } from '@babilon/shared-types';

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80';

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
  const pages: BookPage[] = rawPaginas.map((p: any, idx: number) => ({
    numero: Number(p.numero_pagina ?? p.numeroPagina ?? p.numero ?? idx + 1),
    texto: String(p.texto ?? p.textoExtraido ?? p.content ?? ''),
    nombre_archivo: p.nombre_archivo,
    conteo_palabras: p.conteo_palabras ?? (p.texto ? p.texto.split(/\s+/).length : undefined),
  }));

  // Normalizar capítulos
  const rawCapitulos = Array.isArray(doc.capitulos) ? doc.capitulos : [];
  const chapters: BookChapter[] = rawCapitulos.map((c: any, idx: number) => ({
    numero: Number(c.numero ?? idx + 1),
    titulo: String(c.titulo ?? c.title ?? `Capítulo ${idx + 1}`),
    pagina_inicio: c.pagina_inicio,
    pagina_fin: c.pagina_fin,
    contenido: c.contenido,
  }));

  let synopsis = doc.sinopsis ?? doc.synopsis ?? doc.descripcion ?? '';
  if (!synopsis && pages.length > 0 && pages[0].texto) {
    synopsis = pages[0].texto.slice(0, 220) + '...';
  }

  // Generar muestra si no existe
  let sampleChapterText: string | undefined = doc.sampleChapterText;
  if (!sampleChapterText && pages.length > 0) {
    sampleChapterText = pages
      .slice(0, 3)
      .map((p) => `--- Página ${p.numero} ---\n\n${p.texto}`)
      .join('\n\n');
  }

  const coverUrl = doc.portada_url ?? doc.coverUrl ?? doc.portada ?? DEFAULT_COVER_URL;

  return {
    id: String(doc._id ?? doc.id ?? doc.isbn ?? Math.random().toString()),
    title: doc.titulo ?? doc.title ?? 'Sin título',
    originalTitle: doc.subtitulo || doc.originalTitle || doc.titulo,
    isbn: doc.isbn ?? 'N/A',
    author,
    genres,
    synopsis: synopsis || 'Sin sinopsis disponible.',
    publishedYear,
    publisher: doc.editorial ?? doc.publisher ?? 'Editorial Babilon',
    pageCount: Number(doc.total_paginas ?? doc.pageCount ?? (pages.length > 0 ? pages.length : 0)),
    language: doc.idioma ?? doc.language ?? 'Español',
    catalogType: doc.metadatos_adicionales?.tipo_libro || doc.catalogType || 'Digitalizado',
    coverUrl,
    ratingAverage: Number(doc.calificacion?.promedio ?? doc.ratingAverage ?? 4.8),
    ratingCount: Number(doc.calificacion?.total_votos ?? doc.ratingCount ?? 120),
    availableFormats: doc.availableFormats ?? ['PAPERBACK', 'EBOOK'],
    sampleChapterText,
    chapters,
    pages,
    stock: Number(doc.stock ?? 10),
    featured: Boolean(doc.destacado ?? doc.featured ?? true),
  };
}
