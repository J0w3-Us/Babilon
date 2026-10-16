import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { normalizeMongoBook } from '@/lib/bookMapper';
import { ApiResponse, Book } from '@babilon/shared-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const genre = searchParams.get('genre');
    const featured = searchParams.get('featured');

    const db = await getDb();
    const collection = db.collection('libros');

    const filter: Record<string, any> = {};

    if (genre && genre !== 'Todos') {
      filter.$or = [
        { categorias: { $regex: new RegExp(genre, 'i') } },
        { genres: { $regex: new RegExp(genre, 'i') } },
        { categoria: { $regex: new RegExp(genre, 'i') } },
      ];
    }

    if (featured === 'true') {
      filter.$or = [
        { destacado: true },
        { featured: true },
      ];
    }

    if (query && query.trim() !== '') {
      const qRegex = new RegExp(query.trim(), 'i');
      const textConditions = [
        { titulo: qRegex },
        { title: qRegex },
        { autor: qRegex },
        { 'author.name': qRegex },
        { isbn: qRegex },
        { sinopsis: qRegex },
        { synopsis: qRegex },
        { editorial: qRegex },
        { publisher: qRegex },
      ];

      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          { $or: textConditions },
        ];
        delete filter.$or;
      } else {
        filter.$or = textConditions;
      }
    }

    const docs = await collection.find(filter).sort({ fecha_creacion: -1, _id: -1 }).toArray();
    const books: Book[] = docs.map(doc => normalizeMongoBook(doc));

    const responsePayload: ApiResponse<Book[]> = {
      success: true,
      data: books,
      meta: {
        total: books.length,
      },
    };

    const res = NextResponse.json(responsePayload);
    res.headers.set('X-Babilon-Storage', 'mongodb');
    return res;
  } catch (error: any) {
    console.error('Error al consultar libros directamente en MongoDB:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al consultar libros en la base de datos',
        data: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    let autorNombre = '';
    if (typeof payload.author === 'string') {
      autorNombre = payload.author;
    } else if (payload.author?.name) {
      autorNombre = payload.author.name;
    } else if (typeof payload.autor === 'string') {
      autorNombre = payload.autor;
    } else {
      autorNombre = 'Autor desconocido';
    }

    const titulo = String(payload.titulo || payload.title || '').trim();
    if (!titulo) {
      return NextResponse.json(
        {
          success: false,
          message: 'El título del libro es obligatorio',
        },
        { status: 400 }
      );
    }

    const isbn = String(payload.isbn || payload.isbn_o_codigo || `ISBN-${Date.now()}`).trim();
    const editorial = String(payload.editorial || payload.publisher || 'Editorial Babilon').trim();
    const anio_publicacion = Math.round(Number(payload.anio_publicacion || payload.publishedYear || 2024));
    const idioma = String(payload.idioma || payload.language || 'Español').trim();

    let categorias: string[] = ['Ficción'];
    if (Array.isArray(payload.categorias) && payload.categorias.length > 0) {
      categorias = payload.categorias;
    } else if (Array.isArray(payload.genres) && payload.genres.length > 0) {
      categorias = payload.genres;
    } else if (payload.categoria) {
      categorias = [String(payload.categoria)];
    }

    const sinopsis = String(payload.sinopsis || payload.synopsis || payload.descripcion || '').trim();
    const portada_url = String(payload.portada_url || payload.coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80').trim();
    const contraportada_url = String(payload.contraportada_url || '').trim();

    // Procesamiento inteligente de páginas y contenido textual
    let paginas: any[] = [];
    if (Array.isArray(payload.paginas) && payload.paginas.length > 0) {
      paginas = payload.paginas.map((p: any, idx: number) => ({
        numero_pagina: Number(p.numero ?? p.numero_pagina ?? idx + 1),
        texto: String(p.texto ?? p.content ?? ''),
        nombre_archivo: p.nombre_archivo || `pagina_${idx + 1}.txt`,
        conteo_palabras: p.conteo_palabras || (p.texto ? p.texto.split(/\s+/).length : 0),
      }));
    } else if (payload.fullText && typeof payload.fullText === 'string') {
      // Si el usuario subió un texto completo o archivo .txt / .md, dividir en páginas lógicas (~1800 caracteres o por saltos)
      const rawChunks = payload.fullText.split(/\n\s*---\s*\n|\f/);
      if (rawChunks.length > 1) {
        paginas = rawChunks.map((chunk: string, idx: number) => ({
          numero_pagina: idx + 1,
          texto: chunk.trim(),
          nombre_archivo: `seccion_${idx + 1}.txt`,
          conteo_palabras: chunk.trim().split(/\s+/).length,
        }));
      } else {
        // Paginación por bloques de lectura
        const words = payload.fullText.split(/\s+/);
        const pageSize = 350; // palabras por página estándar de lectura
        const totalP = Math.ceil(words.length / pageSize) || 1;
        paginas = Array.from({ length: totalP }, (_, idx) => {
          const slice = words.slice(idx * pageSize, (idx + 1) * pageSize).join(' ');
          return {
            numero_pagina: idx + 1,
            texto: slice,
            nombre_archivo: `pagina_${idx + 1}.txt`,
            conteo_palabras: slice.split(/\s+/).length,
          };
        });
      }
    } else if (payload.sampleChapterText) {
      paginas = [
        {
          numero_pagina: 1,
          texto: payload.sampleChapterText,
          nombre_archivo: 'capitulo_1.txt',
          conteo_palabras: payload.sampleChapterText.split(/\s+/).length,
        },
      ];
    }

    const total_paginas = Math.max(
      paginas.length,
      Math.round(Number(payload.total_paginas || payload.pageCount || 1))
    );

    // Capítulos
    let capitulos: any[] = [];
    if (Array.isArray(payload.capitulos) && payload.capitulos.length > 0) {
      capitulos = payload.capitulos;
    } else if (paginas.length > 0) {
      capitulos = [
        {
          numero: 1,
          titulo: 'Capítulo I',
          pagina_inicio: 1,
          pagina_fin: paginas.length,
        },
      ];
    }

    const nowIso = new Date().toISOString();

    const bookDoc = {
      titulo,
      subtitulo: payload.subtitulo || '',
      autor: autorNombre,
      autor_id: payload.autor_id || null,
      isbn,
      editorial,
      anio_publicacion,
      idioma,
      categorias,
      sinopsis: sinopsis || (paginas[0]?.texto ? paginas[0].texto.slice(0, 200) + '...' : 'Sin sinopsis registrada.'),
      portada_url,
      contraportada_url,
      total_paginas,
      capitulos,
      paginas,
      calificacion: {
        promedio: 4.9,
        total_votos: 1,
      },
      destacado: Boolean(payload.destacado ?? payload.featured ?? false),
      metadatos_adicionales: {
        ...(payload.metadatos_adicionales || {}),
        caracteres_totales: paginas.reduce((acc: number, p: any) => acc + (p.texto?.length || 0), 0),
        origen: 'Subida Directa Web',
      },
      fecha_creacion: nowIso,
      fecha_actualizacion: nowIso,
    };

    const db = await getDb();
    const collection = db.collection('libros');

    const result = await collection.insertOne(bookDoc);
    const createdDoc = { ...bookDoc, _id: result.insertedId };
    const normalizedBook = normalizeMongoBook(createdDoc);

    const responsePayload: ApiResponse<Book> = {
      success: true,
      message: 'Libro y texto digitalizado guardados directamente en MongoDB biblioteca_digital',
      data: normalizedBook,
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error: any) {
    console.error('Error al insertar libro en MongoDB:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al persistir el libro en MongoDB',
      },
      { status: 500 }
    );
  }
}
