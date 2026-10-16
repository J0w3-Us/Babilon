# 🏛️ BABILON — Project Blueprint

> Documento de referencia arquitectónica completo del monorepo **Babilon**. Describe la estructura, tecnologías, flujos de datos, modelos y convenciones del proyecto para facilitar su comprensión, mantenimiento y migración.

---

## 1. Visión General

**Babilon** es una plataforma integral de biblioteca digital compuesta por tres aplicaciones interconectadas:

| App | Tecnología | Puerto | Descripción |
|-----|-----------|--------|-------------|
| `@babilon/web` | Next.js 14 + React 18 | `3000` | Portal público — catálogo de libros y lector |
| `@babilon/api` | Express 4 + Node.js | `4000` | REST API — acceso a datos y motor OCR |
| `@babilon/admin` | Angular 20 | `4200` | Backoffice editorial — gestión de catálogo |

**Paquete compartido:**

| Paquete | Descripción |
|---------|-------------|
| `@babilon/shared-types` | Tipos TypeScript compartidos entre todas las apps |

---

## 2. Estructura del Monorepo

```
Babilon/
├── apps/
│   ├── web/                        # Portal público (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── globals.css     # Design System (variables CSS, clases utilitarias)
│   │   │   │   ├── layout.tsx      # Root layout + Navbar global
│   │   │   │   └── page.tsx        # Home page (catálogo + búsqueda + modales)
│   │   │   └── services/
│   │   │       └── api.ts          # Cliente HTTP hacia la API Express
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   ├── api/                        # REST API (Express + MongoDB)
│   │   ├── src/
│   │   │   ├── config/             # Configuración de base de datos
│   │   │   ├── data/               # Seeds y datos de ejemplo
│   │   │   ├── middlewares/        # Middlewares Express
│   │   │   ├── models/             # Modelos Mongoose
│   │   │   ├── routes/
│   │   │   │   ├── index.ts        # Router central (/api)
│   │   │   │   ├── v1/             # Rutas v1: books, authors, ocr
│   │   │   │   ├── books.routes.ts
│   │   │   │   └── authors.routes.ts
│   │   │   ├── services/           # Lógica de negocio
│   │   │   └── index.ts            # Punto de entrada del servidor
│   │   ├── eng.traineddata         # Datos OCR inglés (Tesseract)
│   │   ├── spa.traineddata         # Datos OCR español (Tesseract)
│   │   └── package.json
│   │
│   └── admin/                      # Backoffice editorial (Angular 20)
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.ts          # Componente raíz (standalone)
│       │   │   ├── app.html        # Template: sidebar + tabla + modal
│       │   │   ├── app.css         # Estilos del panel admin
│       │   │   ├── app.routes.ts   # Routing Angular
│       │   │   └── app.config.ts   # Configuración de la app
│       │   ├── main.ts
│       │   └── styles.css
│       └── package.json
│
├── packages/
│   └── shared-types/               # Tipos TypeScript compartidos
│       └── src/
│           └── index.ts            # Exportaciones de interfaces y tipos
│
├── package.json                    # Scripts raíz del monorepo (concurrently)
├── pnpm-workspace.yaml             # Definición de workspaces
├── BLUEPRINT.md                    # ← Este archivo
└── DESIGN_SYSTEM.md                # Design System visual
```

---

## 3. Stack Tecnológico

### Frontend — Portal Web (`@babilon/web`)
| Herramienta | Versión | Rol |
|-------------|---------|-----|
| Next.js | ^14.2.3 | Framework React SSR/CSR |
| React | ^18.3.1 | Librería UI |
| TypeScript | ^5.4.0 | Tipado estático |
| Lucide React | ^0.378.0 | Íconos vectoriales |
| CSS Vanilla | — | Design System con CSS custom properties |

### Backend — API (`@babilon/api`)
| Herramienta | Versión | Rol |
|-------------|---------|-----|
| Express | ^4.19.2 | Framework HTTP |
| Mongoose | ^9.11.1 | ODM para MongoDB |
| Tesseract.js | ^7.0.0 | Motor OCR multilenguaje |
| PDF-parse | ^2.4.5 | Extracción de texto de PDFs |
| Multer | ^2.4.0 | Manejo de uploads de archivos |
| dotenv | ^16.4.5 | Variables de entorno |
| tsx | ^4.7.2 | Ejecución TypeScript en desarrollo |

### Frontend — Admin (`@babilon/admin`)
| Herramienta | Versión | Rol |
|-------------|---------|-----|
| Angular | ^20.3.0 | Framework SPA backoffice |
| RxJS | ~7.8.0 | Programación reactiva |
| TypeScript | ~5.9.2 | Tipado estático |

### Infraestructura
| Herramienta | Rol |
|-------------|-----|
| pnpm | Gestor de paquetes + workspaces |
| concurrently | Ejecución simultánea de todas las apps |
| MongoDB | Base de datos documental |

---

## 4. Modelos de Datos (Shared Types)

> Ubicación: `packages/shared-types/src/index.ts`

### `Book`
```typescript
interface Book {
  id: string;
  title: string;
  originalTitle?: string;
  isbn: string;
  author: Author;
  genres: BookGenre[];
  synopsis: string;
  publishedYear: number;
  publisher: string;
  pageCount: number;
  language: string;
  coverUrl: string;
  ratingAverage: number;
  ratingCount: number;
  availableFormats: BookFormat[];
  sampleChapterText?: string;
  stock?: number;
  featured?: boolean;
}
```

### `Author`
```typescript
interface Author {
  id: string;
  name: string;
  biography: string;
  birthDate?: string;
  country?: string;
  avatarUrl?: string;
}
```

### `Review`
```typescript
interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
}
```

### `ApiResponse<T>`
```typescript
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { page?: number; pageSize?: number; total?: number; };
}
```

### Tipos Enumerados
```typescript
type BookFormat    = 'HARDCOVER' | 'PAPERBACK' | 'EBOOK' | 'AUDIOBOOK';
type BookGenre     = 'Ficción' | 'No Ficción' | 'Ciencia Ficción' | 'Fantasía'
                   | 'Filosofía' | 'Historia' | 'Misterio' | 'Terror'
                   | 'Poesía' | 'Clásicos' | 'Desarrollo Personal';
type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED' | 'ABANDONED';
```

### Motor OCR (tipos avanzados)
```typescript
interface ExtractedBookMetadata { title?, author?, isbn?, publisher?, synopsis?, ... }
interface BookExtractionResult  { rawText, confidence, metadata, suggestedBookDraft? }
interface OcrScanOptions        { languages?, mode?, autoDraftBook? }
type BookScanMode = 'cover' | 'copyright' | 'page' | 'auto';
```

---

## 5. API REST — Endpoints

**Base URL:** `http://localhost:4000/api`

### Health Check
```
GET /api/health
→ { service, database: { connected, status } }
```

### Libros (`/api/v1/books`)
```
GET    /api/v1/books         → Lista paginada (filtros: ?query=, ?genre=, ?featured=true)
POST   /api/v1/books         → Crea un libro nuevo en MongoDB
GET    /api/v1/books/:id     → Detalle de un libro
PUT    /api/v1/books/:id     → Actualiza un libro
DELETE /api/v1/books/:id     → Elimina un libro
```

**Headers de respuesta clave:**
- `x-babilon-storage: mongodb | memory-fallback` — indica origen del dato

### Autores (`/api/v1/authors`)
```
GET    /api/v1/authors       → Lista de autores
POST   /api/v1/authors       → Crea un autor
```

### OCR (`/api/v1/ocr`)
```
GET    /api/v1/ocr/status    → Estado del motor OCR
POST   /api/v1/ocr/scan      → Escanea imagen/PDF y extrae metadatos de libro
```

---

## 6. Flujo de Datos

```
┌─────────────────┐      HTTP REST       ┌─────────────────┐
│   @babilon/web  │ ──────────────────→  │   @babilon/api  │
│  (Next.js :3000)│ ←────────────────── │  (Express :4000) │
└─────────────────┘   JSON + headers     └────────┬────────┘
         │                                         │
         │ Enlace externo                    Mongoose ODM
         │                                         │
         ▼                                         ▼
┌─────────────────┐                      ┌─────────────────┐
│  @babilon/admin │                      │    MongoDB      │
│  (Angular :4200)│                      │  (colección:    │
└─────────────────┘                      │   books)        │
                                         └─────────────────┘

         Todos comparten:
         └── @babilon/shared-types
```

### Estrategia de Resiliencia (Web → API)
1. **Intento 1:** Fetch directo a `http://localhost:4000`
2. **Intento 2:** Proxy relativo de Next.js `/api` (rewrite en `next.config.mjs`)
3. **Fallback:** UI vacía con estado `'fallback'`, sin datos hardcodeados

---

## 7. Variables de Entorno

### `apps/api/.env`
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/babilon
NODE_ENV=development
```

### `apps/web` (Next.js)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 8. Scripts del Monorepo

```bash
# Levantar todas las apps simultáneamente
pnpm dev

# Levantar individualmente
pnpm dev:api       # Express API (puerto 4000)
pnpm dev:web       # Next.js portal (puerto 3000)
pnpm dev:admin     # Angular backoffice (puerto 4200)

# Compilar tipos compartidos
pnpm build:types

# Build completo (todas las apps)
pnpm build
```

---

## 9. Navegación de la Aplicación

### Portal Web (Next.js) — Navbar Principal
| Enlace | Ruta/Destino | Ícono |
|--------|-------------|-------|
| BABYLON (logo) | `/` | BookOpen |
| Explorar | `/` | Compass |
| Géneros | `#categorias` | — |
| Autores | `#autores` | — |
| Panel Editorial | `http://localhost:4200` (externo) | ShieldCheck |

### Portal Web — Componentes UI
| Componente | Descripción |
|-----------|-------------|
| Hero Section | Título, subtítulo, barra de búsqueda, botón "Registrar Libro" |
| Genre Filter Bar | Filtros horizontales por género (scroll horizontal) |
| Books Grid | Grid responsive `auto-fill, minmax(280px, 1fr)` |
| Book Card | Portada, título, autor, sinopsis, rating, botón "Leer muestra" |
| Modal: Registrar Libro | Formulario → POST `/api/v1/books` |
| Modal: Visor de Muestra | Fragmento del libro con metadatos |
| Toast Notification | Confirmación de acciones |
| DB Status Badge | Indicador en tiempo real de conexión MongoDB |

### Admin Angular — Sidebar Nav
| Enlace | Estado |
|--------|--------|
| 📊 Catálogo de Libros | Activo |
| ✍️ Autores & Editoriales | Planeado |
| 📈 Métricas de Lectura | Planeado |
| 🛡️ Moderación de Reseñas | Planeado |

---

## 10. Convenciones del Proyecto

### Nombrado de Paquetes
```
@babilon/<nombre>   →  workspaces del monorepo
```

### Estructura de Respuesta API
```json
{
  "success": true,
  "message": "Descripción opcional",
  "data": { ... },
  "meta": { "total": 42 }
}
```

### Idioma
- Código y tipos: **inglés**
- UI/UX, comentarios, documentación: **español**

### TypeScript
- Strict mode habilitado en todas las apps
- Tipos compartidos via `@babilon/shared-types`
- No usar `any` en producción; solo permitido en `catch (err: any)`

---

## 11. Capacidades Especiales

### Motor OCR
La API integra **Tesseract.js** con modelos `spa` (español) y `eng` (inglés) para:
- Escanear portadas de libros (imagen o PDF)
- Extraer automáticamente: título, autor, ISBN, editorial, año
- Generar un borrador de `Book` via `suggestedBookDraft`

### Modo Resiliente
Si MongoDB no está disponible, la API cambia automáticamente a `memory-fallback`, garantizando que la UI nunca quede completamente sin datos. El portal web detecta este estado y lo muestra visualmente.

---

*Generado: Octubre 2026 — Babilon Monorepo v1.0*
