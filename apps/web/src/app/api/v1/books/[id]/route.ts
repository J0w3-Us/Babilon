import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { normalizeMongoBook } from '@/lib/bookMapper';
import { ObjectId } from 'mongodb';
import { ApiResponse, Book } from '@babilon/shared-types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = await getDb();
    const collection = db.collection('libros');

    // Intentamos buscar por ObjectId si es válido, o por id/isbn
    const queries: any[] = [{ id }, { isbn: id }];
    if (ObjectId.isValid(id)) {
      queries.push({ _id: new ObjectId(id) });
    }

    const doc = await collection.findOne({ $or: queries });

    if (!doc) {
      return NextResponse.json(
        {
          success: false,
          message: 'Libro no encontrado',
          data: null,
        },
        { status: 404 }
      );
    }

    const book: Book = normalizeMongoBook(doc);

    const responsePayload: ApiResponse<Book> = {
      success: true,
      data: book,
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error(`Error al buscar libro ${params.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Error al buscar el libro',
        data: null,
      },
      { status: 500 }
    );
  }
}
