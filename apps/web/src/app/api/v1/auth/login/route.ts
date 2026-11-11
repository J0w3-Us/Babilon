import { NextRequest, NextResponse } from 'next/server';
import { getUsuariosCollection } from '@/lib/mongoDb';
import { signUploadJwt, verifyPassword } from '@/lib/jwtSecurity';

export const runtime = 'nodejs';

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

