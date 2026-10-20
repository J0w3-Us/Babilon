# Babilon

Babilon es una biblioteca digital para descubrir, preservar y leer obras literarias. El portal web ofrece catálogo, búsqueda, lectura paginada y carga de obras conectados a la API publicada de libros.

## Estado actual

El repositorio es un monorepo gestionado con pnpm:

- `apps/web`: aplicación Next.js 14 con App Router, Tailwind CSS, lector digital y proxy seguro hacia la API de libros.
- `packages/shared-types`: tipos TypeScript compartidos para libros, autores y respuestas de API.
- `design-system/`: documentación visual y de producto.

## Funcionalidades

- Landing editorial y catálogo de libros.
- Búsqueda por título, autor, sinopsis o ISBN.
- Filtro por género literario.
- Lector paginado con modos pergamino, claro y oscuro.
- Ajuste del tamaño de texto y modo pantalla completa.
- Carga de libros y texto desde la interfaz.
- Selector global de tema claro/oscuro con preferencia persistente.
- Comprobación del estado de la API publicada y su base de datos.

## Requisitos

- Node.js 20 o superior.
- pnpm 9 o superior.
- Acceso a la API publicada de libros y su clave configurada.

## Configuración

Instala las dependencias:

```bash
pnpm install
```

Crea `apps/web/.env.local` a partir de [`apps/web/.env.example`](apps/web/.env.example):

```env
LIBROS_API_URL=https://backend-libros-wj1t.onrender.com
LIBROS_API_KEY=tu_api_key
LIBROS_API_KEY_HEADER=x-api-key
# Para Authorization Bearer:
# LIBROS_API_KEY_HEADER=Authorization
# LIBROS_API_KEY_PREFIX=Bearer%20
```

No guardes credenciales reales en el repositorio. Si una credencial fue expuesta previamente, revócala y genera una nueva antes de desplegar.

El frontend no conecta directamente con MongoDB. Las credenciales permanecen en el servidor y el Route Handler [`apps/web/src/app/api/backend/[...path]/route.ts`](apps/web/src/app/api/backend/[...path]/route.ts) añade la clave al solicitar la API externa.

## Desarrollo

Desde la raíz:

```bash
pnpm dev
```

Abre `http://localhost:3000`.

También puedes ejecutar solo la aplicación web:

```bash
pnpm --filter @babilon/web dev
```

## Compilación y producción

```bash
pnpm build
pnpm start
```

## API de la aplicación

El frontend expone un proxy interno que mantiene la clave fuera del navegador:

| Método | Ruta | Uso |
| ------ | --- | --- |
| `GET` | `/api/backend/api/salud` | Estado de la API publicada |
| `GET` | `/api/backend/api/libros` | Catálogo; admite `query`, `genre` y `featured` |
| `POST` | `/api/backend/api/libros` | Registro de una obra |

La API externa es la única responsable del acceso a datos. Las rutas locales directas de MongoDB ya no forman parte de `apps/web`.

## Estructura

```text
Babilon/
├── apps/
│   └── web/
│       └── src/
│           ├── app/                 # Páginas y proxy de API
│           ├── lib/                 # Mapeadores y utilidades
│           └── services/            # Cliente de la API publicada
├── design-system/                   # Documentación de diseño
├── docs/decisions/                  # Decisiones arquitectónicas
├── packages/
│   └── shared-types/                # Contratos TypeScript
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Tecnologías

- Next.js 14 y React 18.
- TypeScript.
- Tailwind CSS y CSS custom properties.
- Lucide React.
- API REST publicada de libros.
- pnpm workspaces.

## Documentación adicional

- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): principios visuales y tokens.
- [`BLUEPRINT.md`](BLUEPRINT.md): blueprint arquitectónico de referencia.
- [`docs/decisions/ADR-001-use-published-books-api.md`](docs/decisions/ADR-001-use-published-books-api.md): decisión de arquitectura sobre el acceso exclusivo mediante API.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
