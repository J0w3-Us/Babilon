import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    // Ejecuta ping para verificar estado activo del cluster Atlas
    const pingResult = await db.command({ ping: 1 });
    const collections = await db.listCollections().toArray();

    return NextResponse.json({
      online: true,
      database: {
        connected: pingResult.ok === 1,
        status: pingResult.ok === 1 ? 'Conectado a Atlas' : 'desconectado',
        databaseName: db.databaseName,
        collectionsCount: collections.length,
      },
      service: 'Babilon Web (Conexión Directa MongoDB Atlas)',
    });
  } catch (error: any) {
    console.error('Error al conectar con MongoDB biblioteca_digital:', error);
    return NextResponse.json(
      {
        online: false,
        database: {
          connected: false,
          status: 'error de conexión',
          error: error.message,
        },
        service: 'Babilon Web',
      },
      { status: 500 }
    );
  }
}
