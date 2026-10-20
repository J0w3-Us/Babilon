import { NextRequest, NextResponse } from 'next/server';

const backendUrl = (process.env.LIBROS_API_URL || process.env.API_BASE_URL || 'https://backend-libros-wj1t.onrender.com').replace(/\/+$/, '');
const apiKey = process.env.LIBROS_API_KEY || process.env.API_KEY;
const apiKeyHeader = process.env.LIBROS_API_KEY_HEADER || process.env.API_KEY_HEADER || 'x-api-key';
const apiKeyPrefix = process.env.LIBROS_API_KEY_PREFIX || process.env.API_KEY_PREFIX || '';

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const isPublicHealthCheck = path === 'api/salud' || path === 'healthz';
  if (!apiKey && !isPublicHealthCheck) {
    return NextResponse.json(
      { success: false, message: 'LIBROS_API_KEY no está configurada en el servidor' },
      { status: 500 }
    );
  }

  const targetUrl = `${backendUrl}/${path}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('accept-encoding');
  if (apiKey) {
    headers.set(apiKeyHeader, `${apiKeyPrefix}${apiKey}`);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
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
    console.error('Error al conectar con la API publicada de libros:', error);
    return NextResponse.json(
      { success: false, message: 'No se pudo conectar con la API publicada de libros' },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
