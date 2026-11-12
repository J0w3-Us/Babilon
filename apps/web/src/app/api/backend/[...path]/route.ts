import { NextRequest, NextResponse } from 'next/server';
import { ObjectId, Filter, Document } from 'mongodb';
import { verifyUploadJwt } from '@/lib/jwtSecurity';
import { getLibrosCollection } from '@/lib/mongoDb';

export const runtime = 'nodejs';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildBookFilterById(rawId: string): Filter<Document> {
  const id = String(rawId).trim();
  const conditions: Filter<Document>[] = [
    { _id: id as unknown as ObjectId },
    { isbn_o_codigo: id },
    { isbn: id },
    { titulo: id },
  ];
  if (ObjectId.isValid(id)) {
    conditions.unshift({ _id: new ObjectId(id) });
  }
  return { $or: conditions };
}

async function handleDirectMongo(
  request: NextRequest,
  path: string
): Promise<NextResponse | null> {
  // 1. GET /api/salud o /healthz
  if (request.method === 'GET' && (path === 'api/salud' || path === 'healthz')) {
    try {
      const colLibros = await getLibrosCollection();
      await colLibros.estimatedDocumentCount();
      return NextResponse.json({
        success: true,
        status: 'ok',
        servidor: 'ok',
        message: 'API Biblioteca Digital conectada directamente a MongoDB Atlas',
        database: {
          connected: true,
          status: 'conectado',
        },
      });
    } catch (err) {
      console.error('Error en chequeo de salud MongoDB:', err);
      return NextResponse.json(
        {
          success: false,
          status: 'error',
          message: 'Sin conexión a MongoDB Atlas',
          database: { connected: false, status: 'sin conexión' },
        },
        { status: 503 }
      );
    }
  }

  // 2. GET /api/libros (Catálogo paginado y filtrado)
  if (request.method === 'GET' && path === 'api/libros') {
    try {
      const colLibros = await getLibrosCollection();
      const sp = request.nextUrl.searchParams;
      const busqueda = (sp.get('busqueda') || sp.get('q') || '').trim();
      const categories = sp.getAll('category').map((c) => c.trim()).filter(Boolean);
      const authors = sp.getAll('author').map((a) => a.trim()).filter(Boolean);
      const limit = Math.min(200, Math.max(1, Number(sp.get('limit')) || 20));
      const cursorRaw = sp.get('cursor');
      const skip = cursorRaw
        ? Math.max(0, Number(cursorRaw) || 0)
        : Math.max(0, Number(sp.get('skip')) || 0);

      const andFilters: Filter<Document>[] = [];

      if (busqueda) {
        const rx = new RegExp(escapeRegex(busqueda), 'i');
        andFilters.push({
          $or: [
            { titulo: rx },
            { title: rx },
            { autor: rx },
            { editorial: rx },
            { isbn: rx },
            { isbn_o_codigo: rx },
            { tipo_libro: rx },
            { categorias: rx },
            { sinopsis: rx },
          ],
        });
      }

      if (categories.length > 0) {
        const catRegexes = categories.map((c) => new RegExp(escapeRegex(c), 'i'));
        andFilters.push({
          $or: [
            { categorias: { $in: catRegexes } },
            { tipo_libro: { $in: catRegexes } },
            { genres: { $in: catRegexes } },
          ],
        });
      }

      if (authors.length > 0) {
        const authorRegexes = authors.map((a) => new RegExp(escapeRegex(a), 'i'));
        andFilters.push({
          $or: [
            { autor: { $in: authorRegexes } },
            { 'author.name': { $in: authorRegexes } },
          ],
        });
      }

      const query: Filter<Document> =
        andFilters.length > 0 ? { $and: andFilters } : {};

      const total = await colLibros.countDocuments(query);
      const docs = await colLibros
        .find(query)
        .project({ paginas: 0, fullText: 0, contenido: 0, texto_completo: 0 })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const hasMore = skip + docs.length < total;
      const nextCursor = hasMore ? String(skip + docs.length) : null;

      return NextResponse.json({
        success: true,
        total,
        count: docs.length,
        skip,
        limit,
        hasMore,
        nextCursor,
        data: docs,
      });
    } catch (err) {
      console.error('Error al consultar catálogo en MongoDB Atlas:', err);
      return NextResponse.json(
        { success: false, message: 'Error al consultar el catálogo en la base de datos.' },
        { status: 500 }
      );
    }
  }

  // 3. GET /api/libros/:id (Detalle completo del libro con páginas)
  const bookIdMatch = path.match(/^api\/libros\/([^/]+)$/);
  if (request.method === 'GET' && bookIdMatch) {
    try {
      const bookId = decodeURIComponent(bookIdMatch[1]);
      const colLibros = await getLibrosCollection();
      const doc = await colLibros.findOne(buildBookFilterById(bookId));
      if (!doc) {
        return NextResponse.json(
          { success: false, message: 'Libro no encontrado.' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: doc,
      });
    } catch (err) {
      console.error('Error al obtener detalle del libro en MongoDB Atlas:', err);
      return NextResponse.json(
        { success: false, message: 'No se pudo cargar el detalle del libro.' },
        { status: 500 }
      );
    }
  }

  // 4. POST /api/libros (Crear o actualizar libro — SOLO ADMIN, ya validado por JWT)
  if (request.method === 'POST' && path === 'api/libros') {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      const colLibros = await getLibrosCollection();

      const titulo = String(body.titulo ?? body.title ?? '').trim();
      const autor =
        typeof body.autor === 'string' && body.autor.trim()
          ? body.autor.trim()
          : typeof body.author === 'object' && body.author !== null && 'name' in body.author
            ? String((body.author as { name: string }).name).trim()
            : 'Autor desconocido';
      const isbn = String(body.isbn ?? body.isbn_o_codigo ?? titulo).trim();
      const editorial = String(body.editorial ?? body.publisher ?? 'Editorial Babilon').trim();
      const sinopsis = String(body.sinopsis ?? body.synopsis ?? '').trim();
      const anio = Number(body.anio_publicacion ?? body.publishedYear ?? new Date().getFullYear());
      const categorias = Array.isArray(body.categorias)
        ? body.categorias
        : Array.isArray(body.genres)
          ? body.genres
          : ['General'];
      const paginas = Array.isArray(body.paginas) ? body.paginas : [];
      const totalPaginas = Number(body.total_paginas ?? body.pageCount ?? paginas.length);
      const portadaUrl = typeof body.portada_url === 'string' && body.portada_url.trim()
        ? body.portada_url.trim()
        : typeof body.coverUrl === 'string' && body.coverUrl.trim()
          ? body.coverUrl.trim()
          : undefined;
      const ahora = new Date().toISOString();

      const docToSave: Record<string, unknown> = {
        isbn_o_codigo: isbn,
        isbn,
        titulo,
        autor,
        editorial,
        sinopsis,
        resumen: sinopsis,
        categorias,
        tipo_libro: String(categorias[0] || 'General'),
        anio_publicacion: Number.isNaN(anio) ? new Date().getFullYear() : anio,
        periodo: {
          anio_inicio: Number.isNaN(anio) ? new Date().getFullYear() : anio,
          anio_fin: Number.isNaN(anio) ? new Date().getFullYear() : anio,
        },
        idioma: 'es',
        total_paginas: totalPaginas,
        paginas,
        ...(portadaUrl ? { portada_url: portadaUrl, coverUrl: portadaUrl } : {}),
        ...(typeof body.google_book_id === 'string' ? { google_book_id: body.google_book_id } : {}),
        fecha_actualizacion: ahora,
        fecha_procesamiento: ahora,
      };

      const filter: Filter<Document> = isbn
        ? { $or: [{ isbn_o_codigo: isbn }, { isbn }] }
        : { titulo };

      const result = await colLibros.updateOne(
        filter,
        { $set: docToSave },
        { upsert: true }
      );

      return NextResponse.json(
        {
          success: true,
          message:
            result.upsertedCount > 0
              ? 'Libro creado exitosamente en MongoDB Atlas.'
              : 'Libro actualizado exitosamente en MongoDB Atlas.',
          upsertedId: result.upsertedId ? String(result.upsertedId) : isbn,
        },
        { status: result.upsertedCount > 0 ? 201 : 200 }
      );
    } catch (err) {
      console.error('Error al guardar libro en MongoDB Atlas:', err);
      return NextResponse.json(
        { success: false, message: 'No se pudo guardar el libro en la base de datos.' },
        { status: 500 }
      );
    }
  }

  // 5. PUT y DELETE /api/libros/:id (Editar o eliminar libro — SOLO ADMIN)
  if (bookIdMatch && (request.method === 'PUT' || request.method === 'DELETE')) {
    const bookId = decodeURIComponent(bookIdMatch[1]);
    try {
      const colLibros = await getLibrosCollection();
      const filter = buildBookFilterById(bookId);

      if (request.method === 'DELETE') {
        const result = await colLibros.deleteOne(filter);
        if (result.deletedCount === 0) {
          return NextResponse.json(
            { success: false, message: 'No se encontró el libro para eliminar.' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: 'Libro eliminado exitosamente de la base de datos.',
        });
      }

      if (request.method === 'PUT') {
        const body = (await request.json()) as Record<string, unknown>;
        const updates: Record<string, unknown> = {
          fecha_actualizacion: new Date().toISOString(),
        };

        if (typeof body.title === 'string' || typeof body.titulo === 'string') {
          updates.titulo = String(body.title ?? body.titulo).trim();
        }
        if (typeof body.authorName === 'string' || typeof body.autor === 'string') {
          updates.autor = String(body.authorName ?? body.autor).trim();
        } else if (
          typeof body.author === 'object' &&
          body.author !== null &&
          'name' in body.author
        ) {
          updates.autor = String((body.author as { name: string }).name).trim();
        }
        if (typeof body.publisher === 'string' || typeof body.editorial === 'string') {
          updates.editorial = String(body.publisher ?? body.editorial).trim();
        }
        if (typeof body.synopsis === 'string' || typeof body.sinopsis === 'string') {
          updates.sinopsis = String(body.synopsis ?? body.sinopsis).trim();
          updates.resumen = updates.sinopsis;
          updates.descripcion = updates.sinopsis;
        }
        if (body.publishedYear !== undefined || body.anio_publicacion !== undefined) {
          const year = Number(body.publishedYear ?? body.anio_publicacion);
          if (!Number.isNaN(year)) {
            updates.anio_publicacion = year;
          }
        }
        if (Array.isArray(body.genres) || Array.isArray(body.categorias)) {
          const cats = (body.genres ?? body.categorias) as string[];
          updates.categorias = cats;
          if (cats.length > 0) {
            updates.tipo_libro = cats[0];
          }
        }
        if (typeof body.isbn === 'string') {
          updates.isbn = body.isbn.trim();
          updates.isbn_o_codigo = body.isbn.trim();
        }

        const updateResult = await colLibros.updateOne(filter, { $set: updates });
        if (updateResult.matchedCount === 0) {
          return NextResponse.json(
            { success: false, message: 'No se encontró el libro para actualizar.' },
            { status: 404 }
          );
        }

        const updatedDoc = await colLibros.findOne(filter);
        return NextResponse.json({
          success: true,
          message: 'Libro actualizado exitosamente.',
          data: updatedDoc,
        });
      }
    } catch (dbErr) {
      console.error('Error al modificar/eliminar libro en MongoDB Atlas:', dbErr);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al aplicar los cambios en la base de datos.',
        },
        { status: 500 }
      );
    }
  }

  return null;
}

const BACKEND_URL = (
  process.env.LIBROS_API_URL ||
  process.env.API_BASE_URL ||
  'https://backend-libros-wj1t.onrender.com'
).replace(/\/+$/, '');

async function proxyToRemoteBackend(
  request: NextRequest,
  path: string
): Promise<NextResponse> {
  const targetUrl = `${BACKEND_URL}/${path}${request.nextUrl.search}`;
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  const incomingJwt = request.headers.get('x-babilon-jwt');
  const incomingAuth = request.headers.get('authorization');

  if (incomingJwt) {
    headers.set('x-babilon-jwt', incomingJwt);
    headers.set('Authorization', `Bearer ${incomingJwt.replace(/^Bearer\s+/i, '')}`);
  } else if (incomingAuth) {
    headers.set('Authorization', incomingAuth);
  }

  try {
    const bodyText =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.text();

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: bodyText,
      cache: 'no-store',
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    console.error('Error al conectar con el backend remoto en Render:', error);
    return NextResponse.json(
      { success: false, message: 'No se pudo conectar con la API de libros.' },
      { status: 502 }
    );
  }
}

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const isPublicHealthCheck = path === 'api/salud' || path === 'healthz';
  const isWriteOperation =
    request.method === 'POST' ||
    request.method === 'PUT' ||
    request.method === 'PATCH' ||
    request.method === 'DELETE';

  const incomingToken =
    request.headers.get('x-babilon-jwt') ||
    request.headers.get('authorization');

  // Validar token JWT y rol de Administrador para cualquier operación de escritura (POST, PUT, DELETE)
  if (isWriteOperation && !isPublicHealthCheck) {
    const verification = verifyUploadJwt(incomingToken, 'books:write');
    if (!verification.valid) {
      return NextResponse.json(
        {
          success: false,
          message:
            verification.reason ||
            'No autorizado: Se requiere iniciar sesión como Administrador para subir, editar o eliminar obras.',
        },
        { status: 401 }
      );
    }

    if (verification.payload?.rol && verification.payload.rol !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message:
            'Acceso denegado: Tu cuenta tiene permisos de solo lectura (Usuario). Solo un Administrador puede modificar o eliminar libros.',
        },
        { status: 403 }
      );
    }
  }

  // Si MONGO_URI está configurada en el entorno (ej. local), operar directamente contra MongoDB Atlas
  if (process.env.MONGO_URI?.trim()) {
    const directResponse = await handleDirectMongo(request, path);
    if (directResponse) {
      return directResponse;
    }
  }

  // Si no hay MONGO_URI en el entorno (ej. Vercel), delegar de forma transparente al backend en Render
  return proxyToRemoteBackend(request, path);
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
