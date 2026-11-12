import { NextRequest, NextResponse } from 'next/server';
import { signUploadJwt, verifyUploadJwt } from '@/lib/jwtSecurity';
import { getLibrosCollection } from '@/lib/mongoDb';

export const runtime = 'nodejs';

const BACKEND_URL = (
  process.env.LIBROS_API_URL ||
  process.env.API_BASE_URL ||
  'https://backend-libros-wj1t.onrender.com'
).replace(/\/+$/, '');

/**
 * Endpoint de seguridad pre-subida:
 * 1. Verifica que la sesión pertenezca a un Administrador ('admin').
 * 2. Ejecuta un Ping preventivo directamente a MongoDB Atlas o al backend en Render para comprobar disponibilidad.
 * 3. Emite un token JWT firmado (HS256) con vigencia de 15 minutos y alcance 'books:write'.
 */
export async function POST(request: NextRequest) {
  try {
    const incomingAuth =
      request.headers.get('x-babilon-jwt') ||
      request.headers.get('authorization');

    let subjectUser = 'admin-babilon';
    let userNombre = 'Administrador';

    if (incomingAuth) {
      const check = verifyUploadJwt(incomingAuth, 'books:write');
      if (!check.valid || (check.payload?.rol && check.payload.rol !== 'admin')) {
        return NextResponse.json(
          {
            success: false,
            message:
              check.reason ||
              'Permisos insuficientes: Solo las cuentas de Administrador pueden subir libros.',
          },
          { status: 403 }
        );
      }
      if (check.payload?.username) subjectUser = check.payload.username;
      if (check.payload?.nombre) userNombre = check.payload.nombre;
    }

    // 1. Ping preventivo de disponibilidad a MongoDB Atlas (directo o vía backend Render)
    let online = false;
    let dbConnected = false;
    let dbStatus = 'desconocido';

    try {
      if (process.env.MONGO_URI?.trim()) {
        const colLibros = await getLibrosCollection();
        await colLibros.estimatedDocumentCount();
        online = true;
        dbConnected = true;
        dbStatus = 'conectado';
      } else {
        const remoteHealth = await fetch(`${BACKEND_URL}/api/salud`, { cache: 'no-store' });
        if (remoteHealth.ok) {
          online = true;
          dbConnected = true;
          dbStatus = 'conectado';
        }
      }
    } catch {
      online = false;
      dbConnected = false;
      dbStatus = 'sin conexión a MongoDB Atlas';
    }

    if (!online || !dbConnected) {
      return NextResponse.json(
        {
          success: false,
          message:
            'El ping de verificación detectó que la base de datos no está disponible en este momento. Intenta de nuevo en unos segundos.',
          health: { online, dbConnected, dbStatus },
        },
        { status: 503 }
      );
    }

    // 2. Generar token JWT firmado para autorizar la subida del libro
    const { token, expiresAt } = signUploadJwt({
      subject: subjectUser,
      username: subjectUser,
      nombre: userNombre,
      rol: 'admin',
      scope: 'books:write',
      expiresInSeconds: 900,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      health: {
        online,
        dbConnected,
        dbStatus,
      },
    });
  } catch (error) {
    console.error('Error al generar el token JWT de subida:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'No se pudo generar el token de seguridad JWT para la subida.',
      },
      { status: 500 }
    );
  }
}
