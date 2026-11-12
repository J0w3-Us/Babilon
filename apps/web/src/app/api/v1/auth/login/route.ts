import { NextRequest, NextResponse } from 'next/server';
import { getUsuariosCollection } from '@/lib/mongoDb';
import { signUploadJwt, verifyPassword } from '@/lib/jwtSecurity';

export const runtime = 'nodejs';

const BACKEND_URL = (
  process.env.LIBROS_API_URL ||
  process.env.API_BASE_URL ||
  'https://backend-libros-wj1t.onrender.com'
).replace(/\/+$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    const cleanUsername = String(body?.username || '').trim();
    const cleanPassword = String(body?.password || '');

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'Por favor ingresa tu usuario y contraseña.' },
        { status: 400 }
      );
    }

    // 1. Si MONGO_URI está configurada directamente (entorno local o servidor con acceso directo)
    if (process.env.MONGO_URI?.trim()) {
      try {
        const colUsuarios = await getUsuariosCollection();
        const userDoc = await colUsuarios.findOne({
          username_lower: cleanUsername.toLowerCase(),
        });

        if (!userDoc || !verifyPassword(cleanPassword, userDoc.password_hash)) {
          return NextResponse.json(
            { success: false, message: 'Usuario o contraseña incorrectos.' },
            { status: 401 }
          );
        }

        const ahora = new Date().toISOString();
        await colUsuarios.updateOne(
          { username_lower: userDoc.username_lower },
          { $set: { ultimo_acceso: ahora } }
        );

        const rol = userDoc.rol === 'admin' ? 'admin' : 'usuario';
        const { token, expiresAt } = signUploadJwt({
          subject: userDoc.username,
          username: userDoc.username,
          nombre: userDoc.nombre || userDoc.username,
          rol,
          scope: rol === 'admin' ? 'books:write' : 'books:read',
        });

        return NextResponse.json({
          success: true,
          message: `Bienvenido, ${userDoc.nombre || userDoc.username}.`,
          token,
          expiresAt,
          user: {
            id: String(userDoc._id),
            username: userDoc.username,
            nombre: userDoc.nombre || userDoc.username,
            rol,
          },
        });
      } catch (directErr) {
        console.warn('Fallo conexión directa MongoDB en login; usando backend remoto:', directErr);
      }
    }

    // 2. Respaldo automático hacia el backend publicado en Render (para Vercel sin MONGO_URI local)
    const remoteRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      cache: 'no-store',
    });

    const remoteData = await remoteRes.json().catch(() => ({}));
    if (!remoteRes.ok || !remoteData.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            remoteData.message ||
            remoteData.error ||
            'Usuario o contraseña incorrectos.',
        },
        { status: remoteRes.status || 401 }
      );
    }

    const remoteUser = remoteData.user || {};
    const rol = remoteUser.rol === 'admin' ? 'admin' : 'usuario';
    const { token, expiresAt } = signUploadJwt({
      subject: remoteUser.username || cleanUsername,
      username: remoteUser.username || cleanUsername,
      nombre: remoteUser.nombre || cleanUsername,
      rol,
      scope: rol === 'admin' ? 'books:write' : 'books:read',
    });

    return NextResponse.json({
      success: true,
      message: remoteData.message || `Bienvenido, ${remoteUser.nombre || cleanUsername}.`,
      token: remoteData.token || token,
      expiresAt: remoteData.expiresAt || expiresAt,
      user: {
        id: String(remoteUser.id || remoteUser._id || cleanUsername),
        username: remoteUser.username || cleanUsername,
        nombre: remoteUser.nombre || cleanUsername,
        rol,
      },
    });
  } catch (error) {
    console.error('Error en /api/v1/auth/login:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'No se pudo verificar la cuenta en la base de datos.',
      },
      { status: 500 }
    );
  }
}
