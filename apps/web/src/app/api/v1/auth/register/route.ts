import { NextRequest, NextResponse } from 'next/server';
import { getUsuariosCollection } from '@/lib/mongoDb';
import { hashPassword, signUploadJwt, UserRole } from '@/lib/jwtSecurity';

export const runtime = 'nodejs';

const BACKEND_URL = (
  process.env.LIBROS_API_URL ||
  process.env.API_BASE_URL ||
  'https://backend-libros-wj1t.onrender.com'
).replace(/\/+$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      nombre?: string;
    };

    const cleanUsername = String(body?.username || '').trim();
    const cleanPassword = String(body?.password || '');
    const cleanNombre = String(body?.nombre || cleanUsername).trim();
    const rolAsignado: UserRole = 'usuario';

    if (cleanUsername.length < 3 || cleanUsername.length > 40) {
      return NextResponse.json(
        {
          success: false,
          message: 'El nombre de usuario debe tener entre 3 y 40 caracteres.',
        },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'El usuario solo puede contener letras, números, puntos, guiones y guion bajo.',
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres.',
        },
        { status: 400 }
      );
    }

    // 1. Si MONGO_URI está configurada directamente
    if (process.env.MONGO_URI?.trim()) {
      try {
        const colUsuarios = await getUsuariosCollection();
        const usernameLower = cleanUsername.toLowerCase();

        const existente = await colUsuarios.findOne({ username_lower: usernameLower });
        if (existente) {
          return NextResponse.json(
            {
              success: false,
              message: 'Ese nombre de usuario ya está registrado. Elige otro.',
            },
            { status: 409 }
          );
        }

        const ahora = new Date().toISOString();
        const nuevoUsuario = {
          username: cleanUsername,
          username_lower: usernameLower,
          nombre: cleanNombre || cleanUsername,
          password_hash: hashPassword(cleanPassword),
          rol: rolAsignado,
          fecha_creacion: ahora,
          ultimo_acceso: ahora,
        };

        const resultado = await colUsuarios.insertOne(nuevoUsuario);

        const { token, expiresAt } = signUploadJwt({
          subject: cleanUsername,
          username: cleanUsername,
          nombre: nuevoUsuario.nombre,
          rol: rolAsignado,
          scope: 'books:read',
        });

        return NextResponse.json(
          {
            success: true,
            message: 'Cuenta de usuario creada exitosamente.',
            token,
            expiresAt,
            user: {
              id: String(resultado.insertedId),
              username: cleanUsername,
              nombre: nuevoUsuario.nombre,
              rol: rolAsignado,
            },
          },
          { status: 201 }
        );
      } catch (directErr) {
        console.warn('Fallo conexión directa MongoDB en registro; usando backend remoto:', directErr);
      }
    }

    // 2. Respaldo automático hacia el backend publicado en Render (para Vercel sin MONGO_URI local)
    const remoteRes = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        password: cleanPassword,
        nombre: cleanNombre || cleanUsername,
      }),
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
            'No se pudo registrar la cuenta en la base de datos.',
        },
        { status: remoteRes.status || 400 }
      );
    }

    const remoteUser = remoteData.user || {};
    const { token, expiresAt } = signUploadJwt({
      subject: remoteUser.username || cleanUsername,
      username: remoteUser.username || cleanUsername,
      nombre: remoteUser.nombre || cleanNombre || cleanUsername,
      rol: rolAsignado,
      scope: 'books:read',
    });

    return NextResponse.json(
      {
        success: true,
        message: remoteData.message || 'Cuenta de usuario creada exitosamente.',
        token: remoteData.token || token,
        expiresAt: remoteData.expiresAt || expiresAt,
        user: {
          id: String(remoteUser.id || remoteUser._id || cleanUsername),
          username: remoteUser.username || cleanUsername,
          nombre: remoteUser.nombre || cleanNombre || cleanUsername,
          rol: rolAsignado,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/v1/auth/register:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'No se pudo registrar la cuenta en la base de datos.',
      },
      { status: 500 }
    );
  }
}
