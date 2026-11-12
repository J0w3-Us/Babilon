import dns from 'dns';
import { MongoClient, Db, Collection } from 'mongodb';
import { hashPassword, UserRole } from './jwtSecurity';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignorar si el entorno restringe el cambio de servidores DNS
}

export interface DbUserDocument {
  _id?: unknown;
  username: string;
  username_lower: string;
  nombre: string;
  password_hash: string;
  rol: UserRole;
  fecha_creacion: string;
  ultimo_acceso: string;
}

const MONGO_URI = (process.env.MONGO_URI || '').trim();
const DB_NAME = (process.env.DB_NAME || 'biblioteca_digital').trim();
const USUARIOS_COLLECTION = (process.env.USUARIOS_COLLECTION_NAME || 'usuarios').trim();
const LIBROS_COLLECTION = (process.env.COLLECTION_NAME || 'libros').trim();

declare global {
  // eslint-disable-next-line no-var
  var _babilonMongoClientPromise: Promise<MongoClient> | undefined;
}

async function getMongoClient(): Promise<MongoClient> {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI no está configurada en las variables de entorno.');
  }

  if (!global._babilonMongoClientPromise) {
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
    });
    global._babilonMongoClientPromise = client.connect().catch((err) => {
      global._babilonMongoClientPromise = undefined;
      throw err;
    });
  }

  return global._babilonMongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(DB_NAME);
}

export async function getUsuariosCollection(): Promise<Collection<DbUserDocument>> {
  const db = await getDatabase();
  const collection = db.collection<DbUserDocument>(USUARIOS_COLLECTION);

  try {
    await collection.createIndex({ username_lower: 1 }, { unique: true });
  } catch {
    // El índice ya existe
  }

  const count = await collection.countDocuments();
  if (count === 0) {
    const ahora = new Date().toISOString();
    const adminUser = (process.env.APP_USERNAME || 'luis').trim();
    const adminPass = process.env.APP_PASSWORD || '12345678';

    await collection.insertMany([
      {
        username: adminUser,
        username_lower: adminUser.toLowerCase(),
        nombre: 'Administrador Principal',
        password_hash: hashPassword(adminPass),
        rol: 'admin',
        fecha_creacion: ahora,
        ultimo_acceso: ahora,
      },
      {
        username: 'usuario',
        username_lower: 'usuario',
        nombre: 'Lector Babilon',
        password_hash: hashPassword('12345678'),
        rol: 'usuario',
        fecha_creacion: ahora,
        ultimo_acceso: ahora,
      },
    ]);
  }

  return collection;
}

export async function getLibrosCollection(): Promise<Collection<Record<string, unknown>>> {
  const db = await getDatabase();
  return db.collection<Record<string, unknown>>(LIBROS_COLLECTION);
}

