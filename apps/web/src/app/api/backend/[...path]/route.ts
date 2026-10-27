import { NextRequest, NextResponse } from 'next/server';

const backendUrl = (process.env.LIBROS_API_URL || process.env.API_BASE_URL || 'https://backend-libros-wj1t.onrender.com').replace(/\/+$/, '');
const appUsername = process.env.APP_USERNAME || process.env.APP_USER;
const appPassword = process.env.APP_PASSWORD || process.env.APP_PASS;
const apiKey = process.env.LIBROS_API_KEY || process.env.API_KEY;
const apiKeyHeader = process.env.LIBROS_API_KEY_HEADER || process.env.API_KEY_HEADER;
const apiKeyPrefix = process.env.LIBROS_API_KEY_PREFIX || process.env.API_KEY_PREFIX || '';

function getAuthHeader(): { header: string; value: string } | null {
  // 1. Si se configuró usuario y contraseña, se genera Basic Auth (base64)
  if (appUsername && appPassword !== undefined) {
    const credentials = Buffer.from(`${appUsername}:${appPassword}`).toString('base64');
    return {
      header: 'Authorization',
      value: `Basic ${credentials}`,
    };
  }

  // 2. Si se configuró API Key directa
  if (apiKey) {
    const headerName = apiKeyHeader || 'x-api-key';
    const prefix = apiKeyPrefix ? (apiKeyPrefix.endsWith(' ') ? apiKeyPrefix : `${apiKeyPrefix} `) : '';
    return {
      header: headerName,
      value: `${prefix}${apiKey}`,
    };
  }

  return null;
}

async function proxy(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const isPublicHealthCheck = path === 'api/salud' || path === 'healthz';
  const authHeader = getAuthHeader();

  if (!authHeader && !isPublicHealthCheck) {
    return NextResponse.json(
      { success: false, message: 'Credenciales de acceso (APP_USERNAME/APP_PASSWORD o LIBROS_API_KEY) no configuradas en el servidor' },
      { status: 500 }
    );
  }

  const targetUrl = `${backendUrl}/${path}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('accept-encoding');

  if (authHeader) {
    headers.set(authHeader.header, authHeader.value);
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
