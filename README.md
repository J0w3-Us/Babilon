# Babilon
Babilon es una biblioteca digital para descubrir, preservar y leer obras literarias. La aplicación actual ofrece un portal web con catálogo, búsqueda, lectura paginada y carga de obras conectada directamente con MongoDB Atlas.

## Estado actual

El repositorio es un monorepo gestionado con pnpm y actualmente contiene:

- `apps/web`: aplicación Next.js 14 con App Router, Tailwind CSS, lector digital y Route Handlers.
- `packages/shared-types`: tipos TypeScript compartidos para libros, autores y respuestas de API.
- `design-system/`: documentación visual y de producto.

Las aplicaciones API independiente y panel administrativo descritas en algunos documentos de planificación todavía no forman parte del árbol ejecutable actual.

## Funcionalidades

- Landing editorial y catálogo de libros.
- Búsqueda por título, autor, sinopsis o ISBN.
- Filtro por género literario.
- Lector paginado con modos pergamino, claro y oscuro.
- Ajuste del tamaño de texto y modo pantalla completa.
- Carga de libros y texto desde la interfaz.
- Selector global de tema claro/oscuro con preferencia persistente.
- Comprobación del estado de MongoDB Atlas.

## Requisitos

- Node.js 20 o superior.
- pnpm 9 o superior.
- Una base de datos MongoDB accesible desde el entorno de ejecución.

## Configuración

Instala las dependencias:

```bash
pnpm install
```

Crea `apps/web/.env.local` a partir de [`apps/web/.env.example`](apps/web/.env.example):

```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/
MONGODB_DB=biblioteca_digital
```

No guardes credenciales reales en el repositorio. Si una credencial fue expuesta previamente, revócala y genera una nueva antes de desplegar.

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

La compilación genera primero los tipos compartidos y después la aplicación Next.js.

## API local de la aplicación

Los Route Handlers de Next.js están disponibles en:

| Método | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/health` | Comprueba la aplicación y la conexión a MongoDB |
| `GET` | `/api/v1/books` | Lista libros; admite `query`, `genre` y `featured` |
| `POST` | `/api/v1/books` | Crea una obra en la colección `libros` |
| `GET` | `/api/v1/books/:id` | Consulta una obra por identificador |
| `GET` | `/api/v1/authors` | Lista autores |

## Estructura

```text
Babilon/
├── apps/
│   └── web/
│       └── src/
│           ├── app/                 # Páginas y Route Handlers
│           ├── lib/                 # MongoDB y mapeadores
│           └── services/            # Cliente de la API local
├── design-system/                   # Documentación de diseño
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
- MongoDB Node.js Driver y MongoDB Atlas.
- pnpm workspaces.

## Documentación adicional

- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md): principios visuales y tokens.
- [`BLUEPRINT.md`](BLUEPRINT.md): blueprint arquitectónico de referencia.
- [`babilon_architecture_plan.md`](babilon_architecture_plan.md): planificación de evolución del monorepo.
- [`api_v1_endpoints_catalog.md`](api_v1_endpoints_catalog.md): catálogo de endpoints previstos y disponibles.

## Licencia

Este proyecto se distribuye bajo la licencia MIT.
# 📚 Babilon — Plataforma Integral de Libros y Lectura

**Babilon** es una plataforma moderna para el descubrimiento, lectura y gestión de libros estructurada como un **Monorepo** con separación de responsabilidades:

- 🌐 **`apps/web` (Next.js)**: Portal público orientado al lector con diseño de biblioteca universal, catálogo interactivo, filtros y optimización SEO.
- 🛡️ **`apps/admin` (Angular 20)**: Panel editorial empresarial para la administración de obras, control de inventario, formatos e ingresos.
- ⚙️ **`apps/api` (Express.js + TypeScript)**: Backend RESTful central para libros, autores y reseñas.
- 📦 **`packages/shared-types` (TypeScript)**: Contratos de datos unificados compartidos entre los frontends y el backend.

---

## 🚀 Inicio Rápido

### 1. Iniciar todo el entorno a la vez
Ejecuta en la raíz del proyecto:

```bash
npm run dev
# o con pnpm:
pnpm dev
```

Esto iniciará concurrentemente:
- **Express API** en `http://localhost:4000`
- **Portal Web (Next.js)** en `http://localhost:3000`
- **Panel Editorial (Angular)** en `http://localhost:4200`

---

### 2. Iniciar servicios de manera individual

| Módulo | Comando | Puerto | Descripción |
| :--- | :--- | :--- | :--- |
| **Backend API** | `npm run dev:api` | `http://localhost:4000` | Endpoints `/api/v1/books` y `/api/v1/authors` |
| **Portal Web** | `npm run dev:web` | `http://localhost:3000` | Catálogo de lectores con Next.js |
| **Panel Editorial** | `npm run dev:admin` | `http://localhost:4200` | Backoffice administrativo en Angular |
| **Compilar Tipos** | `npm run build:types` | — | Compila `@babilon/shared-types` |
| **Compilar Todo** | `npm run build` | — | Compila todos los proyectos para producción |

---

## 🏛️ Estructura del Proyecto

```
Babilon/
├── apps/
│   ├── web/            # Next.js 14 App Router + Lucide Icons + SSR
│   ├── admin/          # Angular 20 Standalone + Formularios Reactivos
│   └── api/            # Express.js + TS + Rutas REST + Datos Semilla
├── packages/
│   └── shared-types/   # Modelos IBook, IAuthor, IReview, ApiResponse
├── pnpm-workspace.yaml # Definición del monorepo
├── package.json        # Orquestador con scripts concurrentes
└── README.md
```
