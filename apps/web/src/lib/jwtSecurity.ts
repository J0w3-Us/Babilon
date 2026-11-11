import crypto from 'crypto';

export type UserRole = 'admin' | 'usuario';

export interface UploadJwtPayload {
  iss: string;
  sub: string;
  username?: string;
  nombre?: string;
  rol: UserRole;
  scope: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface VerifyJwtResult {
  valid: boolean;
  reason?: string;
  payload?: UploadJwtPayload;
}

function getJwtSecret(): string {
  return (
    process.env.JWT_SECRET ||
    process.env.LIBROS_API_KEY ||
    process.env.APP_PASSWORD ||
    'babilon_jwt_secret_key_2026_hs256_ingesta_segura'
  );
}

function base64UrlEncode(input: Buffer | string): string {
  const buffer = typeof input === 'string' ? Buffer.from(input, 'utf-8') : input;
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = normalized + '='.repeat(padLength);
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function signHmacSha256(data: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(data).digest();
  return base64UrlEncode(hmac);
}

/**
 * Genera hash criptográfico de contraseña con salt aleatorio usando scrypt (compatible con backend).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifica una contraseña en texto plano contra un hash almacenado en formato `salt:hash`.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const derivedBuffer = crypto.scryptSync(String(password), salt, 64);
  const originalBuffer = Buffer.from(originalHash, 'hex');
  if (derivedBuffer.length !== originalBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, originalBuffer);
}

/**
 * Genera un JSON Web Token (JWT) firmado con HS256 (RFC 7519) para sesiones de usuario
 * y autorización de operaciones en Babilon.
 */
export function signUploadJwt(options?: {
  subject?: string;
  username?: string;
  nombre?: string;
  rol?: UserRole;
  scope?: string;
  expiresInSeconds?: number;
}): { token: string; expiresAt: number; payload: UploadJwtPayload } {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresIn = options?.expiresInSeconds ?? 60 * 60 * 24 * 7; // 7 días para sesión
  const rol: UserRole = options?.rol === 'usuario' ? 'usuario' : 'admin';

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const username = options?.username || options?.subject || 'admin';
  const payload: UploadJwtPayload = {
    iss: 'babilon-security-gateway',
    sub: username.toLowerCase(),
    username,
    nombre: options?.nombre || username,
    rol,
    scope: options?.scope || (rol === 'admin' ? 'books:write' : 'books:read'),
    iat: nowSeconds,
    exp: nowSeconds + expiresIn,
    jti: crypto.randomBytes(12).toString('hex'),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHmacSha256(signingInput, getJwtSecret());

  return {
    token: `${signingInput}.${signature}`,
    expiresAt: payload.exp * 1000,
    payload,
  };
}

/**
 * Verifica criptográficamente la firma, estructura, vigencia y permisos (scope/rol)
 * de un token JWT utilizando comparación en tiempo constante.
 */
export function verifyUploadJwt(
  token: string | null | undefined,
  requiredScope?: string
): VerifyJwtResult {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Token JWT no proporcionado en la solicitud.' };
  }

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return { valid: false, reason: 'Estructura de token JWT inválida.' };
  }

  const [encodedHeader, encodedPayload, providedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !providedSignature) {
    return { valid: false, reason: 'Segmentos del token JWT incompletos.' };
  }

  try {
    const headerRaw = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; typ?: string };
    if (headerRaw.alg !== 'HS256') {
      return { valid: false, reason: 'Algoritmo de firma JWT no soportado.' };
    }

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = signHmacSha256(signingInput, getJwtSecret());

    const providedBuffer = Buffer.from(providedSignature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (
      providedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return { valid: false, reason: 'Firma criptográfica del token JWT inválida o alterada.' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as UploadJwtPayload;
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (typeof payload.exp !== 'number' || nowSeconds >= payload.exp) {
      return { valid: false, reason: 'El token JWT de sesión ha expirado. Inicia sesión nuevamente.' };
    }

    if (requiredScope === 'books:write') {
      const isAdmin = payload.rol === 'admin' || payload.scope === 'books:write';
      if (!isAdmin) {
        return {
          valid: false,
          reason: 'Permisos insuficientes: Tu cuenta es de Usuario (solo lectura). Se requiere rol de Administrador.',
        };
      }
    }

    return {
      valid: true,
      payload,
    };
  } catch {
    return { valid: false, reason: 'No se pudo decodificar ni validar el contenido del token JWT.' };
  }
}
