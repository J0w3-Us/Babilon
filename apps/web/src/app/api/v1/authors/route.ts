import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { ApiResponse, Author } from '@babilon/shared-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const db = await getDb();
    const collection = db.collection('autores');

    const filter: Record<string, any> = {};
    if (search && search.trim() !== '') {
      const sRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: sRegex },
        { nombre: sRegex },
        { country: sRegex },
        { pais: sRegex },
      ];
    }

    const docs = await collection.find(filter).toArray();
    const authors: Author[] = docs.map(doc => ({
      id: String(doc._id || doc.id),
      name: doc.name || doc.nombre || 'Autor desconocido',
      biography: doc.biography || doc.biografia || '',
      country: doc.country || doc.pais || 'Internacional',
      birthDate: doc.birthDate || doc.fecha_nacimiento,
      avatarUrl: doc.avatarUrl || doc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    }));

    const responsePayload: ApiResponse<Author[]> = {
      success: true,
      data: authors,
      meta: {
        total: authors.length,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('Error al consultar autores:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al obtener autores',
        data: [],
      },
      { status: 500 }
    );
  }
}
